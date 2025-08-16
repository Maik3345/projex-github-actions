# projex-github-actions

Colección de GitHub Actions personalizadas en TypeScript para automatización avanzada.

## Publicación automática de versiones

Cada vez que hagas push a `main` y cambie el código fuente, el workflow `.github/workflows/release.yml`:
- Compilará el proyecto
- Creará/actualizará los tags `vX.Y.Z` y `vX` según la versión de `package.json`
- Publicará un release en GitHub

**Importante:**
Debes crear el secreto `TOKEN_GITHUB` en la configuración de tu repositorio con un token de acceso personal (PAT) con permisos de `repo`.

## Uso de una action desde otro repositorio

1. Asegúrate de que tu action tenga un tag (ejemplo: `v1`).
2. En el otro repo, llama la action así:

```yaml
- name: Sincronizar etiquetas del Pull Request
  uses: Maik3345/projex-github-actions/src/pr-label-action@v1
  with:
    pr_number: ${{ github.event.pull_request.number }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Versionado

- El tag `v1` siempre apuntará a la última versión mayor estable.
- Para usar una versión específica, usa `@v1.0.0` o el tag correspondiente.

---
¿Dudas? Consulta el workflow de release o abre un issue.
