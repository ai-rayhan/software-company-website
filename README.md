# ShopSync Technologies — website + backend

Static multi-page site served by an Express API with a SQLite database (`server/data/shopsync.db`, created automatically).

## Run
```bash
npm run install:server
copy server\.env.example server\.env   # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm start                              # http://localhost:3000
```
Admin dashboard: `/admin` (inquiries, status workflow, subscribers, CSV export).

## API
- `POST /api/contact` · `POST /api/newsletter` · `POST /api/quote` (rate-limited, validated, honeypot)
- `POST /api/admin/login|logout`, `GET /api/admin/{me,summary,inquiries,subscribers,export.csv}`, `PATCH|DELETE /api/admin/inquiries/:id`
- Optional email alerts: fill `SMTP_*` in `server/.env`.
