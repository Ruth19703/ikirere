
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
} from "../src/storage.js";

import { config } from "../src/config.js";

// Application instructions
const HELP = `
🌦️ IKIRERE - RWANDA WEATHER CLI

Usage:
  ikirere <city>                  Check weather for any city
  ikirere <city> --save           Check weather and save favourite
  ikirere --favourites            Display favourite cities
  ikirere --remove <city>         Remove a favourite city
  ikirere --history               Display recent searches
  ikirere --config                Display settings
  ikirere --units imperial        Use Fahrenheit
  ikirere --help                  Display help



Environment variables:
  IKIRERE_UNITS
  IKIRERE_TIMEOUT
  IKIRERE_DATA_DIR
`;

// Display an error
function fail(message) {
  console.error(`Error: ${message}`);
  console.error("Run 'ikirere --help' for usage.");
  process.exit(EXIT.USAGE);
}

// Display weather for one city
function displayWeather(place, weather) {
  console.log(`
🌦️ WEATHER REPORT
------------------------------
City:        ${place.name}
Country:     ${place.country}
Temperature: ${weather.temperature}${weather.tempUnit}
Feels like:  ${weather.feelsLike}${weather.tempUnit}
Humidity:    ${weather.humidity}%
Wind:        ${weather.windSpeed} ${weather.windUnit}
Condition:   ${weather.condition}
------------------------------
`);
}

// Display favourite cities
async function showFavourites() {
  const data = await loadData();

  if (data.favourites.length === 0) {
    console.log("No favourites yet. Add one using --save.");
    return;
  }

  console.log("\n❤️ YOUR FAVOURITE CITIES");

  data.favourites.forEach((city, index) => {
    console.log(`${index + 1}. ${city.name}, ${city.country}`);
  });
}

// Display search history
async function showHistory() {
  const data = await loadData();

  if (data.history.length === 0) {
    console.log("No search history yet.");
    return;
  }

  console.log("\n📚 RECENT WEATHER SEARCHES");

  data.history.forEach((item, index) => {
    console.log(
      `${index + 1}. ${item.place} (${new Date(item.at).toLocaleString()})`
    );
  });
}

// Remove a favourite city
async function removeCity(name) {
  const data = await loadData();

  const removed = removeFavourite(data, name);

  if (!removed) {
    throw new IkirereError(
      `${name} is not in your favourites.`,
      EXIT.NOT_FOUND
    );
  }

  await saveData(data);

  console.log(`✅ ${name} removed from favourites.`);
}

// Display configuration
function showConfig(units) {
  console.log("\n⚙️ IKIRERE CONFIGURATION");
  console.log("------------------------------");
  console.log(`Units:       ${units}`);
  console.log(`Timeout:     ${config.timeoutMs / 1000} seconds`);
  console.log(`Data folder: ${config.dataDir}`);
  console.log("------------------------------");
}

// Check weather for any city entered by the user
async function lookup(city, units, shouldSave) {
  console.log(`\nSearching for ${city}...\n`);

  // Find the city using the geocoding API
  const place = await geocode(city);

  if (!place) {
    throw new IkirereError(
      `Could not find a place called "${city}".`,
      EXIT.NOT_FOUND
    );
  }

  // Get weather using the coordinates returned by the API
  const weather = await getForecast(place, units);

  // Display weather information
  displayWeather(place, weather);

  // Save search history and favourites
  try {
    const data = await loadData();

    addHistory(data, place);

    if (shouldSave) {
      const added = addFavourite(data, place);

      console.log(
        added
          ? `❤️ ${place.name} saved to favourites.`
          : `${place.name} is already a favourite.`
      );
    }

    await saveData(data);
  } catch (error) {
    console.error(`Warning: ${error.message}`);
  }
}

// Main application
async function main() {
  let parsed;

  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          type: "boolean",
          short: "h",
        },
        units: {
          type: "string",
          short: "u",
          default: config.defaultUnits,
        },
        save: {
          type: "boolean",
          short: "s",
        },
        favourites: {
          type: "boolean",
          short: "f",
        },
        remove: {
          type: "string",
          short: "r",
        },
        history: {
          type: "boolean",
        },
        config: {
          type: "boolean",
        },
      },
    });
  } catch (error) {
    fail(error.message);
  }

  const { values, positionals } = parsed;

  // Help
  if (values.help) {
    console.log(HELP);
    return;
  }

  // Validate units
  if (!["metric", "imperial"].includes(values.units)) {
    fail(`Units must be metric or imperial, got "${values.units}".`);
  }

  // Join city names containing spaces
  const city = positionals.join(" ").trim();

  const isManagement =
    values.favourites ||
    values.history ||
    values.config ||
    values.remove !== undefined;

  if (!city && !isManagement) {
    fail("Please provide a city name or choose a command.");
  }

  if (values.save && !city) {
    fail("--save requires a city name.");
  }

  try {
    // Configuration
    if (values.config) {
      showConfig(values.units);
      return;
    }

    // Favourites
    if (values.favourites) {
      await showFavourites();
      return;
    }

    // History
    if (values.history) {
      await showHistory();
      return;
    }

    // Remove favourite
    if (values.remove !== undefined) {
      if (city) {
        fail("Use --remove <city> without another city argument.");
      }

      await removeCity(values.remove);
      return;
    }

    // Check weather for any city
    await lookup(city, values.units, values.save);

  } catch (error) {
    if (error instanceof IkirereError) {
      console.error(`Error: ${error.message}`);
      process.exit(error.exitCode);
    }

    console.error(`Unexpected error: ${error.message}`);
    process.exit(EXIT.UNEXPECTED);
  }
}

// Start application
await main();
