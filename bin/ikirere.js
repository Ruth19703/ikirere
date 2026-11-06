#!/usr/bin/env node
import { parseArgs } from "node:util";
import { geocode } from "../src/geocode.js";
import { getForecast } from "../src/forecast.js";
import { IkirereError, EXIT } from "../src/errors.js";
import {
  loadData,
  saveData,
  addFavourite,
  removeFavourite,
  addHistory,
  DATA_FILE,
} from "../src/storage.js";

const HELP = `
ikirere - weather in your terminal

Usage:
  ikirere <city> [options]

Options:
  -u, --units <metric|imperial>   Temperature units (default: metric)
  -s, --save                      Save this city to your favourites
  -f, --favourites                List your favourite cities
  -r, --remove <city>             Remove a city from your favourites
      --history                   Show your recent lookups
  -h, --help                      Show this help

Examples:
  ikirere kigali
  ikirere "New York" --units imperial
  ikirere nairobi --save
  ikirere --favourites
`;

function fail(message) {
  console.error(`Error: ${message}`);
  console.error("Run 'ikirere --help' for usage.");
  process.exit(EXIT.USAGE);
}

let parsed;
try {
  parsed = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      units: { type: "string", short: "u", default: "metric" },
      save: { type: "boolean", short: "s" },
      favourites: { type: "boolean", short: "f" },
      remove: { type: "string", short: "r" },
      history: { type: "boolean" },
    },
  });
} catch (err) {
  fail(err.message);
}

const { values, positionals } = parsed;

if (values.help) {
  console.log(HELP);
  process.exit(EXIT.OK);
}

if (!["metric", "imperial"].includes(values.units)) {
  fail(`Units must be "metric" or "imperial", got "${values.units}".`);
}

const city = positionals.join(" ");
const isLookup = city !== "";
const isManagement = values.favourites || values.history || values.remove !== undefined;

if (!isLookup && !isManagement) {
  fail("Please give a city name.");
}

if (values.save && !isLookup) {
  fail("--save needs a city, for example: ikirere nairobi --save");
}

async function showFavourites() {
  const data = await loadData();
  if (data.favourites.length === 0) {
    console.log("No favourites yet. Add one with: ikirere <city> --save");
    return;
  }
  console.log("Favourites:");
  data.favourites.forEach((f) => console.log(`  - ${f.name}, ${f.country}`));
}

async function showHistory() {
  const data = await loadData();
  if (data.history.length === 0) {
    console.log("No history yet. Look up a city first: ikirere kigali");
    return;
  }
  console.log("Recent lookups:");
  data.history.forEach((h) =>
    console.log(`  - ${h.place}  (${new Date(h.at).toLocaleString()})`)
  );
}

async function removeCity(name) {
  const data = await loadData();
  if (!removeFavourite(data, name)) {
    throw new IkirereError(`"${name}" is not in your favourites.`, EXIT.NOT_FOUND);
  }
  await saveData(data);
  console.log(`Removed ${name} from favourites.`);
}

async function lookup() {
  const place = await geocode(city);

  if (!place) {
    throw new IkirereError(`Could not find a place called "${city}".`, EXIT.NOT_FOUND);
  }

  const weather = await getForecast(place, values.units);

  console.log(`\nWeather in ${place.name}, ${place.country}`);
  console.log(`  ${weather.condition}`);
  console.log(`  Temperature: ${weather.temperature}${weather.tempUnit} (feels like ${weather.feelsLike}${weather.tempUnit})`);
  console.log(`  Humidity:    ${weather.humidity}%`);
  console.log(`  Wind:        ${weather.windSpeed} ${weather.windUnit}`);

  // History and favourites are extras: if saving fails, warn but don't fail the lookup.
  try {
    const data = await loadData();
    addHistory(data, place);
    if (values.save) {
      const added = addFavourite(data, place);
      console.log(added ? `\nSaved ${place.name} to favourites.` : `\n${place.name} is already a favourite.`);
    }
    await saveData(data);
  } catch (err) {
    console.error(`\nWarning: ${err.message}`);
  }
}

async function main() {
  if (values.favourites) return showFavourites();
  if (values.history) return showHistory();
  if (values.remove !== undefined) return removeCity(values.remove);
  return lookup();
}

try {
  await main();
} catch (err) {
  if (err instanceof IkirereError) {
    console.error(`Error: ${err.message}`);
    process.exit(err.exitCode);
  }
  console.error(`Unexpected error: ${err.message}`);
  process.exit(EXIT.UNEXPECTED);
}