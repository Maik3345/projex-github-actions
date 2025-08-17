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
          // Buscar otros PRs abiertos con este label
          const prsWithLabel = await octokit.rest.issues.listForRepo({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            state: "open",
            labels: label,
            per_page: 2, // Solo necesitamos saber si hay más de uno
          });
          const count = prsWithLabel.data.filter(
            (issue) => issue.pull_request && issue.number !== Number(prNumber)
          ).length;
          if (count === 0) {
            await octokit.rest.issues.removeLabel({
              owner: github.context.repo.owner,
              repo: github.context.repo.repo,
              issue_number: Number(prNumber),
              name: label,
            });
            core.info(`Label '${label}' removido del PR #${prNumber}`);
          } else {
            core.info(`Label '${label}' no se remueve porque está en otros PRs abiertos.`);
          }
        } catch (e) {
          core.warning(`No se pudo remover el label '${label}': ${e}`);
        }
      }
    }
    for (const label of newLabels) {
      // Buscar el color correspondiente
      const color = labelColorPairs.find((pair) => pair.label === label)?.color;
      // Consultar si el label existe
      let labelExists = false;
      try {
        await octokit.rest.issues.getLabel({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          name: label as string,
        });
        labelExists = true;
      } catch (err: any) {
        if (err.status !== 404) {
          core.warning(`Error consultando el label '${label}': ${err}`);
        }
      }
      // Si existe, actualizar color y descripción; si no, crearlo
      try {
        if (labelExists) {
          await octokit.rest.issues.updateLabel({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: label as string,
            ...(color ? { color: color.replace("#", "") } : {}),
            description: "Auto-created by workflow",
          });
          core.info(`Label '${label}' actualizado con color: ${color ?? 'default'}`);
        } else {
          await octokit.rest.issues.createLabel({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: label as string,
            ...(color ? { color: color.replace("#", "") } : {}),
            description: "Auto-created by workflow",
          });
          core.info(`Label '${label}' creado con color: ${color ?? 'default'}`);
        }
      } catch (e) {
        core.warning(`No se pudo crear/actualizar el label '${label}': ${e}`);
      }
      // Asignar el label al PR solo si no está ya asignado
      if (!currentLabels.includes(label)) {
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
