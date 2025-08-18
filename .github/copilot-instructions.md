# Copilot Instructions for projex-github-actions

## Overview
This repository contains custom GitHub Actions written in TypeScript, designed for advanced automation, release management, and PR label synchronization. The project is structured for easy extension and robust CI/CD workflows.

## Key Components
- **src/pr-label-action/**: Action to suggest, create, update, and synchronize PR labels using the projex CLI and GitHub API. Handles label color/description and only removes labels from a PR if no other open PR uses them.
- **.github/actions/projex-release/**: Composite action for automated releases, versioning, and tagging using the projex CLI.
- **.github/workflows/publish.yml**: Main workflow for building, versioning, and releasing. Demonstrates the standard build and release pipeline.

## Developer Workflows
- **Build all actions:**
  ```sh
  pnpm install
  npm run build
  ```
  This compiles each action in `src/*/index.ts` to `dist/<action>/` using ncc.
- **Release:**
  Triggered by pushing to `main` or manually via GitHub Actions. Uses the composite release action.
- **Test PR label action:**
  Use `.github/workflows/test-pr-label-action.yml` to validate label logic in PRs.

## Project Conventions
- **Action Entrypoints:** Each action has its own folder under `src/`, with an `index.ts` and an `action.yml` pointing to the built JS in `dist/`.
- **Label Management:**
  - Labels are always created/updated with the correct color and description before assignment.
  - Labels are only removed from a PR if no other open PR uses them (see `src/pr-label-action/index.ts`).
- **Global CLI:** The projex CLI is installed globally if not present, both in workflows and actions.
- **Versioning:** Tags `vX.Y.Z` and `vX` are managed automatically. The `v1` tag always points to the latest major version.

## Integration Points
- **projex CLI:** Used for release/versioning and for suggesting PR labels.
- **GitHub API:** Used for all label and release management.

## Examples
- **Using the PR label action in another repo:**
  ```yaml
  - name: Sincronizar etiquetas del Pull Request
    uses: Maik3345/projex-github-actions/src/pr-label-action@v1
    with:
      pr_number: ${{ github.event.pull_request.number }}
  ```
- **Using the release composite action:**
  ```yaml
  - name: 🚀 Projex Release
    uses: Maik3345/projex-github-actions/.github/actions/projex-release@v1
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```

## References
- See `README.md` for usage and versioning details.
- See `src/pr-label-action/index.ts` for label logic and removal policy.
- See `.github/workflows/publish.yml` for the release pipeline.

---
For new actions, follow the folder structure and build conventions. For label logic, always check for cross-PR usage before removal.

## 🎯 Sistema de Activación por Palabras Clave

**INSTRUCCIÓN PARA COPILOT:** Cuando detectes cualquiera de estas palabras clave en el prompt del usuario, activa automáticamente las instrucciones correspondientes:

---
### 📋 Conventional Commits

**Palabras clave:** `"commit"` | `"conventional commit"` | `"formato commit"` | `"mensaje commit"`  
**→ ACTIVAR:** [commit.instructions.md](./instructions/commit/commit.instructions.md)  
**Acción:** Aplica las reglas de Conventional Commits 1.0.0 para estructurar mensajes de commit consistentes

### 🧪 Cobertura de Tests

**Palabras clave:** `"coverage"` | `"test-coverage"` | `"cobertura"` | `"sonar quality gate"` | `"cobertura tests"`  
**→ ACTIVAR:** [coverage.instructions.md](./instructions/coverage/coverage.instructions.md)  
**Acción:** Mejora sistemáticamente la cobertura de tests hasta alcanzar el 87% requerido por SonarQube

### 📚 Documentación General

**Palabras clave:** `"doc"` | `"documentación"` | `"generar docs"` | `"crear documentación"`  
**→ ACTIVAR:** [doc.instructions.md](./instructions/doc/doc.instructions.md)  
**Acción:** Genera documentación detallada en la carpeta docs con diagramas Mermaid y actualiza README.md

### 📋 Pull Request y Control de Versiones

**Palabras clave:** `"pr"` | `"pull request"` | `"crear pr"` | `"generar pr"`  
**→ ACTIVAR:** [pr-auto-fill.instructions.md](./instructions/pr/pr-auto-fill.instructions.md)  
**Acción:** Automatiza la generación del contenido de Pull Request basándose en el template y el historial de cambios

---

### 🤖 Para Copilot: Reglas de Activación Automática

1. **Detecta las palabras clave** en el prompt del usuario (sin importar mayúsculas/minúsculas)
2. **Activa automáticamente** las instrucciones del archivo correspondiente
3. **Sigue las instrucciones específicas** del archivo referenciado
4. **No requieras** que el usuario mencione explícitamente las instrucciones
5. **Ejecuta la tarea** según el flujo definido en las instrucciones específicas
