"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const child_process_1 = require("child_process");
function randomColor() {
    // Genera un color hexadecimal aleatorio
    return `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`;
}
async function run() {
    try {
        const prNumber = core.getInput("pr_number", { required: true });
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            throw new Error("GITHUB_TOKEN environment variable is required. Make sure to pass secrets.GITHUB_TOKEN in your workflow.");
        }
        const octokit = github.getOctokit(githubToken);
        // Sugerir etiquetas usando el CLI de projex
        let labels = "";
        try {
            labels = (0, child_process_1.execSync)("projex pull-request labels suggest --format csv", {
                encoding: "utf-8",
            }).trim();
        }
        catch (e) {
            core.warning("No se pudieron sugerir etiquetas automáticamente.");
        }
        if (!labels || labels.includes("not found")) {
            core.info("No hay etiquetas sugeridas.");
            return;
        }
        const newLabels = labels
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);
        if (newLabels.length === 0) {
            core.info("No hay etiquetas sugeridas.");
            return;
        }
        // Obtener etiquetas actuales del PR
        const { data: pr } = await octokit.rest.pulls.get({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: Number(prNumber),
        });
        const currentLabels = pr.labels.map((l) => l.name);
        // Sincronizar etiquetas: remover las que no están y agregar las nuevas
        for (const label of currentLabels) {
            if (!newLabels.includes(label)) {
                try {
                    await octokit.rest.issues.removeLabel({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: Number(prNumber),
                        name: label,
                    });
                }
                catch { }
            }
        }
        for (const label of newLabels) {
            if (!currentLabels.includes(label)) {
                try {
                    await octokit.rest.issues.addLabels({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: Number(prNumber),
                        labels: [label],
                    });
                }
                catch (err) {
                    // Si el label no existe, créalo y vuelve a intentar
                    if (err.status === 404) {
                        core.info(`Label '${label}' no existe, creándolo...`);
                        try {
                            await octokit.rest.issues.createLabel({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                name: label,
                                color: randomColor().replace("#", ""),
                                description: "Auto-created by workflow",
                            });
                            await octokit.rest.issues.addLabels({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                issue_number: Number(prNumber),
                                labels: [label],
                            });
                        }
                        catch (e) {
                            core.warning(`No se pudo crear o asignar el label '${label}': ${e}`);
                        }
                    }
                    else {
                        core.warning(`No se pudo asignar el label '${label}': ${err}`);
                    }
                }
            }
        }
        core.info(`Etiquetas sincronizadas: ${newLabels.join(", ")}`);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
