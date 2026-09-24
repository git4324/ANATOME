# ANATOME

ANATOME is a React/Vite pain-intake interface backed by FastAPI. The frontend
uses an interactive 3D anatomy model, and the API can turn submitted intake
data into a structured, non-diagnostic report through OpenRouter.

## Run locally

Prerequisites:

- Node.js 22 or newer
- Python 3.12 or newer
- An OpenRouter API key for report generation

Install the frontend:

```bash
npm --prefix front_end ci
```

Create a Python environment and install the backend:

```bash
python3 -m venv back_end/.venv
source back_end/.venv/bin/activate
python -m pip install -r requirements.txt
cp back_end/.env.example back_end/.env
```

On Windows, activate the environment with:

```powershell
back_end\.venv\Scripts\Activate.ps1
```

Add `OPENROUTER_API_KEY` to `back_end/.env`, then start both services from the
project root:

```bash
npm run dev
```

Open <http://127.0.0.1:5173>. The Vite development server forwards `/api/*`
requests to FastAPI at <http://127.0.0.1:8000>.

Useful checks:

```bash
curl http://127.0.0.1:8000/api/health
npm run build
```

If Python is installed in a nonstandard location, set `PYTHON_BIN` before
running `npm run dev`.

## Deploy to Vercel

The repository includes `vercel.json`, `api/index.py`, and a root
`requirements.txt`. Vercel builds the Vite application as static assets and
runs FastAPI as a Python Function.

1. Push this directory to a Git provider, then import the repository in
   Vercel, or run `npx vercel` from the project root.
2. Keep the Vercel project's Root Directory set to the repository root.
3. Add `OPENROUTER_API_KEY` in Vercel Project Settings > Environment Variables.
4. Optionally add `OPENAI_REPORT_MODEL`; the default is `openai/gpt-5-mini`.
5. Add `DATABASE_URL` with a managed Postgres connection string for persistent
   reports. Without it, Vercel uses temporary SQLite storage and saved reports
   may disappear whenever a Function instance is recycled.

After deployment, check `https://YOUR-DOMAIN.vercel.app/api/health`.

## 3D model files

The interactive viewer includes the browser-ready BodyParts3D 4.0 anatomy data
in `front_end/public/models/bodyparts3d/`. It contains 296 skeletal structures,
402 muscles, and 40 connective-tissue structures. The combined muscle and bone
view opens by default; each structure can be selected to record pain. The
compressed model is approximately 33 MB and is included in this repository, so
no separate model download is needed to run the app.

The original upstream `.glb` files remain in `front_end/public/models/` as Git
LFS pointers because their LFS objects are unavailable. The current viewer does
not depend on those files. BodyParts3D attribution and license details are in
`front_end/public/models/bodyparts3d/ATTRIBUTION.md`.

## Privacy note

This application collects a patient name and health-related intake data and
sends report inputs to a third-party AI API. Do not enter real protected health
information in a public demo. A production healthcare deployment needs an
appropriate privacy, security, retention, access-control, and vendor-compliance
review.
