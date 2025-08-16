import * as core from "@actions/core";
import * as github from "@actions/github";
import { execSync } from "child_process";

function randomColor(): string {
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
      throw new Error(
        "GITHUB_TOKEN environment variable is required. Make sure to pass secrets.GITHUB_TOKEN in your workflow."
      );
    }
    const octokit = github.getOctokit(githubToken);

    // Instalar projex CLI si no está presente
    try {
      execSync("projex --version", { stdio: "ignore" });
    } catch {
      core.info("Instalando projex CLI globalmente...");
      try {
        execSync("npm install -g projex", { stdio: "inherit" });
      } catch (e) {
        core.setFailed("No se pudo instalar projex CLI. Asegúrate de que npm esté disponible.");
        return;
      }
    }

    // Sugerir etiquetas usando el CLI de projex
    let labels = "";
    try {
      labels = execSync("projex pull-request labels suggest --format csv", {
        encoding: "utf-8",
      }).trim();
    } catch (e) {
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
    const currentLabels = pr.labels.map((l: any) => l.name);

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
        } catch {}
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
        } catch (err: any) {
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
            } catch (e) {
              core.warning(
                `No se pudo crear o asignar el label '${label}': ${e}`
              );
            }
          } else {
            core.warning(`No se pudo asignar el label '${label}': ${err}`);
          }
        }
      }
    }
    core.info(`Etiquetas sincronizadas: ${newLabels.join(", ")}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
