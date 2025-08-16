# projex-github-actions

Colección de GitHub Actions personalizadas en TypeScript para automatización avanzada.


## Publicación automática de versiones

Cada vez que hagas push a `main` y cambie el código fuente, el workflow `.github/workflows/publish.yml`:
- Compilará el proyecto
- Creará/actualizará los tags `vX.Y.Z` y `vX` según la versión de `package.json`
- Publicará un release en GitHub

**Importante:**
Asegúrate de tener el secreto `GITHUB_TOKEN` configurado (el que provee GitHub Actions por defecto).

## Uso de una action desde otro repositorio

1. Asegúrate de que tu action tenga un tag (ejemplo: `v1`).
2. En el otro repo, llama la action así:

```yaml
- name: Sincronizar etiquetas del Pull Request
  uses: Maik3345/projex-github-actions/src/pr-label-action@v1
  with:
    pr_number: ${{ github.event.pull_request.number }}
```



on:
jobs:

## Usar la composite action de release

Puedes usar la composite action de release en cualquier workflow así:

```yaml
- name: 🚀 Projex Release
  uses: Maik3345/projex-github-actions/.github/actions/projex-release@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Esto ejecutará el proceso de release usando los pasos estándar de projex. Puedes agregar tus pasos de build antes de llamar a la action.

---
## Versionado

- El tag `v1` siempre apuntará a la última versión mayor estable.
- Para usar una versión específica, usa `@v1.0.0` o el tag correspondiente.

---
¿Dudas? Consulta la composite action o abre un issue.
