# Deployment

## 1. Protect secrets

These files must not be pushed:

- `.env.local`
- `.env.local1.txt`
- `env.local.origine`
- `backup_quizhub_now.sql`

The repo `.gitignore` is configured for that.

## 2. Push code to Git

From `C:\Users\bruno\quizhub`:

```powershell
git status
git add app components lib database data public Test.json Basic.json Premium.json "Test 2.json" scripts package.json .gitignore DEPLOYMENT.md
git commit -m "Integrate JSON-driven IQ flows and shared IQ content sync"
git push origin main
```

## 3. Update the database

The safest method is to run the repo sync script after deploy.

It synchronizes:

- test sequences:
  - `Test.json`
  - `Test 2.json`
  - `Basic.json`
  - `Premium.json`
- `long_memory` question bank
- `audio_memory` question bank
- required DB columns / audio table

Run:

```powershell
npm run sync:iq-content
```

Use the same environment variables as the app:

- `QUIZHUB_DB_HOST`
- `QUIZHUB_DB_PORT`
- `QUIZHUB_DB_USER`
- `QUIZHUB_DB_PASSWORD`
- `QUIZHUB_DB_NAME`

## 4. Update OVH server

On the server:

```bash
git pull
npm install
npm run sync:iq-content
npm run build
pm2 restart quizhub
```

If you do not use `pm2`, restart the Node/Next process with your usual method.

## 5. Recommended order

1. Backup the production DB.
2. Push code to Git.
3. Pull on OVH.
4. Run `npm run sync:iq-content`.
5. Build and restart.

## 6. Important note

If the code changes but the DB sync is skipped, some IQ test phases can fail.

Code deploy and DB sync should always be done together.
