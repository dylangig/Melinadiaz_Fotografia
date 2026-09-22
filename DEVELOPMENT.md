# Guía de Desarrollo Local — Melina Diaz Fotografía

## Arquitectura actual

| Capa | Tecnología | Deploy |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | Cloudflare Pages (auto-deploy desde `main`) |
| API | Cloudflare Worker (`worker/`) | `npx wrangler deploy` |
| Datos | Cloudflare D1 (`melina-db`) | migraciones en `worker/migrations/` |
| Imágenes | Cloudflare R2 (`fotosmelinaapp`) | subidas desde el panel `/admin` |
| Chatbot | Widget `@n8n/chat` → workflow de n8n | n8n cloud |

No hay backend Python: Flask fue reemplazado totalmente por el Worker.

## Inicio rápido (2 terminales)

### Terminal 1 — Worker (API local en http://localhost:8787)

```bash
cd worker
npx wrangler dev
```

- Los secretos locales van en `worker/.dev.vars` (está en `.gitignore`):
  ```
  ADMIN_PASSWORD=...
  JWT_SECRET=...
  ```
- La D1 local se crea sola. Para aplicar una migración local:
  ```bash
  npx wrangler d1 execute melina-db --local --file=./migrations/<archivo>.sql
  ```

### Terminal 2 — Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

`vite.config.ts` proxyfica `/api` → `http://localhost:8787`, así que
`VITE_API_URL` puede quedar vacío en `frontend/.env.local`.

## Build y verificación

```bash
cd frontend
npm run build   # tsc + vite build (correr siempre antes de commitear)
```

## Deploy

- **Frontend**: push a `main` → Cloudflare Pages deploya solo.
- **Worker**:
  ```bash
  cd worker
  npx wrangler d1 execute melina-db --remote --file=./migrations/<archivo>.sql  # si hay migración nueva
  npx wrangler deploy
  ```
- La preview de Cloudflare no muestra datos de la API (CORS con allowlist
  exacta): verificar siempre en producción.

## Rollback

Historial en `main`; para deshacer un cambio: `git revert <commit>`.
Tags de respaldo: `respaldo-antes-paso5` y el commit `2f3b8c9`.
