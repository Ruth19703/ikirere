#!/usr/bin/env node
import { parseArgs } from "node:util";
import { geocode } from "../src/geocode.js";
import { getForecast } from "../src/forecast.js";

const HELP = `
ikirere - weather in your terminal

Usage:
  ikirere <city> [options]

Options:
  -u, --units <metric|imperial>   Temperature units (default: metric)
  -h, --help                      Show this help

Examples:
  ikirere kigali
  ikirere "New York" --units imperial
`;

function fail(message) {
  console.error(`Error: ${message}`);
  console.error("Run 'ikirere --help' for usage.");
  process.exit(2);
}

let parsed;
try {
  parsed = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      units: { type: "string", short: "u", default: "metric" },
    },
  });
} catch (err) {
  fail(err.message);
}

const { values, positionals } = parsed;

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

if (positionals.length === 0) {
  fail("Please give a city name.");
}

if (!["metric", "imperial"].includes(values.units)) {
  fail(`Units must be "metric" or "imperial", got "${values.units}".`);
}

const city = positionals.join(" ");

const place = await geocode(city);

if (!place) {
  console.error(`Could not find a place called "${city}".`);
  process.exit(1);
}

const weather = await getForecast(place, values.units);

console.log(`\nWeather in ${place.name}, ${place.country}`);
console.log(`  ${weather.condition}`);
console.log(`  Temperature: ${weather.temperature}${weather.tempUnit} (feels like ${weather.feelsLike}${weather.tempUnit})`);
console.log(`  Humidity:    ${weather.humidity}%`);
console.log(`  Wind:        ${weather.windSpeed} ${weather.windUnit}`);