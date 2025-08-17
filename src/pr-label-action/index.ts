import * as core from "@actions/core";
import * as github from "@actions/github";
import { execSync } from "child_process";

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
        core.setFailed(
          "No se pudo instalar projex CLI. Asegúrate de que npm esté disponible."
        );
        return;
      }
    }

    // Sugerir etiquetas usando el CLI de projex
    let labels = "";
    try {
      labels = execSync(
        "projex pull-request labels suggest --colors  --format csv",
        {
          encoding: "utf-8",
        }
      ).trim();
    } catch (e) {
      core.warning("No se pudieron sugerir etiquetas automáticamente.");
    }
    if (!labels || labels.includes("not found")) {
      core.info("No hay etiquetas sugeridas.");
      return;
    }
    // El formato es: name[:desc][:color], ejemplo: type:feat:#cccccc
    // Queremos conservar name o name:desc, ignorando el color, pero loguear el color para depuración
    const labelColorPairs: { label: string; color?: string }[] = labels
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const parts = l.split(":");
        if (parts.length === 1) {
          return { label: parts[0] };
        } else if (parts.length === 2) {
          if (parts[1].startsWith("#")) {
            return { label: parts[0], color: parts[1] };
          } else {
            return { label: `${parts[0]}:${parts[1]}` };
          }
        } else if (parts.length === 3) {
          // name:desc:color
          return { label: `${parts[0]}:${parts[1]}`, color: parts[2] };
        }
        return undefined;
      })
      .filter((l): l is { label: string; color?: string } => !!l && !!l.label);

    // Imprimir los labels y colores detectados
    for (const pair of labelColorPairs) {
      if (pair.color) {
        core.info(
          `Etiqueta sugerida: '${pair.label}' con color: ${pair.color}`
        );
      } else {
        core.info(`Etiqueta sugerida: '${pair.label}' sin color`);
      }
    }

    const newLabels = labelColorPairs.map((pair) => pair.label);

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
        // Buscar el color correspondiente
        const color = labelColorPairs.find(
          (pair) => pair.label === label
        )?.color;
        // Primero intenta crear el label (si ya existe, lo actualiza)
        try {
          await octokit.rest.issues.createLabel({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: label as string,
            ...(color ? { color: color.replace("#", "") } : {}),
            description: "Auto-created by workflow",
          });
          core.info(`Label '${label}' creado con color: ${color ?? "default"}`);
        } catch (err: any) {
          core.info(`No se pudo crear el label '${label}': ${err}`);
          // Si ya existe, actualizar color y descripción
          if (err.status === 422) {
            try {
              await octokit.rest.issues.updateLabel({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                name: label as string,
                ...(color ? { color: color.replace("#", "") } : {}),
                description: "Auto-created by workflow",
              });
              core.info(
                `Label '${label}' actualizado con color: ${color ?? "default"}`
              );
            } catch (e) {
              core.warning(`No se pudo actualizar el label '${label}': ${e}`);
            }
          } else {
            core.warning(
              `No se pudo crear/actualizar el label '${label}': ${err}`
            );
          }
        }
        // Finalmente, asignar el label al PR
        try {
          await octokit.rest.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: Number(prNumber),
            labels: [label as string],
          });
        } catch (e) {
          core.warning(`No se pudo asignar el label '${label}' al PR: ${e}`);
        }
      }
    }
    core.info(
      `Etiquetas sincronizadas en el repositorio: ${newLabels.join(", ")}`
    );
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
