import path from "node:path";
import os from "node:os";

function readTimeoutSeconds() {
  const raw = process.env.IKIRERE_TIMEOUT;
  if (raw === undefined || raw === "") return 8;
  const seconds = Number(raw);
  // Ignore nonsense like "abc" or "-5" and fall back to the default
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 8;
}

const dataDir = process.env.IKIRERE_DATA_DIR || path.join(os.homedir(), ".ikirere");

export const config = {
  defaultUnits: process.env.IKIRERE_UNITS || "metric",
  timeoutMs: readTimeoutSeconds() * 1000,
  dataDir,
  dataFile: path.join(dataDir, "data.json"),
};