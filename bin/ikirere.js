
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

import { fetchJson } from "../src/http.js";

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


// Retrieve all countries and their capitals
async function getAllCapitals(units = "metric") {
  console.log("\n🌍 IKIRERE — WORLD CAPITALS WEATHER REPORT\n");
  console.log("Retrieving countries and capitals...\n");

  const countries = await fetchJson(
    "https://restcountries.com/v3.1/all?fields=name,capital,cca2"
  );

  const countryCapitals = countries.flatMap((country) => {
    if (!country.capital || !country.cca2) return [];

    return country.capital.map((capital) => ({
      capital,
      country: country.name.common,
      countryCode: country.cca2,
    }));
  });

  console.log(`Found ${countryCapitals.length} listed capitals.`);
  console.log("Finding capital coordinates...\n");

  const places = [];

  // Retrieve coordinates in batches to avoid too many requests at once
  for (let i = 0; i < countryCapitals.length; i += 5) {
    const batch = countryCapitals.slice(i, i + 5);

    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const place = await geocode(item.capital, item.countryCode);

          if (!place) return null;

          return {
            ...place,
            country: item.country,
          };
        } catch (error) {
          console.log(
            `Could not locate ${item.capital}, ${item.country}: ${error.message}`
          );
          return null;
        }
      })
    );

    places.push(...results.filter(Boolean));
    console.log(`Located ${places.length} of ${countryCapitals.length} capitals...`);
  }

  // Remove duplicate locations
  const uniquePlaces = [
    ...new Map(
      places.map((place) => [
        `${place.latitude},${place.longitude}`,
        place,
      ])
    ).values(),
  ];

  console.log(`\nFetching weather for ${uniquePlaces.length} capitals...\n`);

  const weatherResults = [];

  // Fetch weather in batches
  for (let i = 0; i < uniquePlaces.length; i += 8) {
    const batch = uniquePlaces.slice(i, i + 8);

    const results = await Promise.all(
      batch.map(async (place) => {
        try {
          const weather = await getForecast(place, units);

          return {
            Capital: place.name,
            Country: place.country,
            Temperature: `${weather.temperature}${weather.tempUnit}`,
            Condition: weather.condition,
            Humidity: `${weather.humidity}%`,
            Wind: `${weather.windSpeed} ${weather.windUnit}`,
          };
        } catch (error) {
          return {
            Capital: place.name,
            Country: place.country,
            Status: error.message,
          };
        }
      })
    );

    weatherResults.push(...results);

    console.log(
      `Weather reports completed: ${weatherResults.length} of ${uniquePlaces.length}`
    );
  }

  console.log("\n🌍 WORLD CAPITALS WEATHER RESULTS\n");
  console.table(weatherResults);

  const successful = weatherResults.filter(
    (item) => item.Temperature !== undefined
  ).length;

  console.log(`\nCapitals found: ${countryCapitals.length}`);
  console.log(`Capitals located: ${uniquePlaces.length}`);
  console.log(`Successful weather reports: ${successful}`);
  console.log(
    `Failed weather reports: ${weatherResults.length - successful}`
  );
  console.log("\n✅ World capitals report completed.\n");
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
        random: {
          type: "string",
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
