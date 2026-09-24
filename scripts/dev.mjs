import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const pythonCandidates = [
  process.env.PYTHON_BIN,
  path.join(projectRoot, "back_end", ".venv", "bin", "python"),
  path.join(projectRoot, ".venv", "bin", "python"),
  path.join(projectRoot, "work", "backend-venv", "bin", "python"),
  path.join(projectRoot, "back_end", ".venv", "Scripts", "python.exe"),
  path.join(projectRoot, ".venv", "Scripts", "python.exe"),
  "python3",
  "python",
].filter(Boolean);

function hasBackendDependencies(candidate) {
  if (candidate.includes(path.sep) && !existsSync(candidate)) return false;

  const result = spawnSync(
    candidate,
    ["-c", "import fastapi, sqlalchemy, uvicorn"],
    { stdio: "ignore" },
  );

  return result.status === 0;
}

const pythonCommand = pythonCandidates.find(hasBackendDependencies);

if (!pythonCommand) {
  console.error(
    "Backend dependencies were not found. Create a virtual environment and install requirements.txt, or set PYTHON_BIN to its Python executable.",
  );
  process.exit(1);
}

const children = [
  spawn(
    pythonCommand,
    [
      "-m",
      "uvicorn",
      "main:app",
      "--reload",
      "--host",
      "127.0.0.1",
      "--port",
      "8000",
    ],
    {
      cwd: path.join(projectRoot, "back_end"),
      stdio: "inherit",
      env: process.env,
    },
  ),
  spawn(npmCommand, ["run", "dev", "--", "--host", "127.0.0.1"], {
    cwd: path.join(projectRoot, "front_end"),
    stdio: "inherit",
    env: process.env,
  }),
];

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(exitCode), 250);
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!stopping && code !== 0 && signal !== "SIGTERM") stop(code || 1);
  });
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

console.log("ANATOME frontend: http://127.0.0.1:5173");
console.log("ANATOME API:      http://127.0.0.1:8000/api/health");
