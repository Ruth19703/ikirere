import { readFile, writeFile, mkdir } from "node:fs/promises";
import { IkirereError, EXIT } from "./errors.js";
import { config } from "./config.js";

const DATA_DIR = config.dataDir;
const DATA_FILE = config.dataFile;

const MAX_HISTORY = 10;

function emptyData() {
  return { favourites: [], history: [] };
}

export async function loadData() {
  let text;
  try {
    text = await readFile(DATA_FILE, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return emptyData(); // first run: no file yet
    throw new IkirereError(`Could not read ${DATA_FILE}: ${err.message}`, EXIT.UNEXPECTED);
  }

  try {
    return { ...emptyData(), ...JSON.parse(text) };
  } catch {
    throw new IkirereError(
      `Your data file is damaged: ${DATA_FILE}. Fix it or delete it to start fresh.`,
      EXIT.UNEXPECTED
    );
  }
}

export async function saveData(data) {
  try {
    await mkdir(DATA_DIR, { recursive: true }); // creates the folder if missing
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch (err) {
    throw new IkirereError(`Could not save to ${DATA_FILE}: ${err.message}`, EXIT.UNEXPECTED);
  }
}

// These helpers change the data object in memory; call saveData() afterwards.

export function addFavourite(data, place) {
  const exists = data.favourites.some(
    (f) => f.name.toLowerCase() === place.name.toLowerCase() && f.country === place.country
  );
  if (exists) return false;
  data.favourites.push(place);
  return true;
}

export function removeFavourite(data, name) {
  const before = data.favourites.length;
  data.favourites = data.favourites.filter(
    (f) => f.name.toLowerCase() !== name.toLowerCase()
  );
  return data.favourites.length < before;
}

export function addHistory(data, place) {
  data.history.unshift({
    place: `${place.name}, ${place.country}`,
    at: new Date().toISOString(),
  });
  data.history = data.history.slice(0, MAX_HISTORY);
}