
import { parseArgs } from "node:util";

import { getWeather } from "./weather.js";

import {
  addFavourite,
  getFavourites,
  removeFavourite,
  addHistory,
  getHistory,
} from "./storage.js";

// Display application instructions
function showHelp() {
  console.log(`
🌦️  IKIRERE - RWANDA WEATHER CLI

Usage:
  ikirere <city>              Check city weather
  ikirere <city> --save       Check weather and save favourite
  ikirere --favourites        Display favourite cities
  ikirere --history           Display search history
  ikirere --remove <city>     Remove a favourite city
  ikirere --help              Display help
  ikirere --version           Display version

Examples:
  ikirere Kigali
  ikirere Nairobi --save
  ikirere --favourites
  ikirere --history
  ikirere --remove Nairobi
  `);
}

// Display weather information
function displayWeather(weather) {
  console.log(`
🌦️  IKIRERE WEATHER REPORT
------------------------------
City:        ${weather.city}
Country:     ${weather.country}
Temperature: ${weather.temperature}°C
Wind Speed:  ${weather.windSpeed} km/h
Weather:     ${weather.description}
------------------------------
`);
}

// Main CLI function
export async function main() {
  try {
    // Read terminal arguments
    const { values, positionals } = parseArgs({
      options: {
        help: {
          type: "boolean",
          short: "h",
        },
        version: {
          type: "boolean",
          short: "v",
        },
        save: {
          type: "boolean",
        },
        favourites: {
          type: "boolean",
          short: "f",
        },
        favorites: {
          type: "boolean",
        },
        history: {
          type: "boolean",
        },
        remove: {
          type: "string",
        },
      },
      allowPositionals: true,
      strict: true,
    });

    // Help command
    if (values.help) {
      showHelp();
      return;
    }

    // Version command
    if (values.version) {
      console.log("Ikirere version 0.1.0");
      return;
    }

    // Favourites command
    if (values.favourites || values.favorites) {
      const favourites = await getFavourites();

      if (favourites.length === 0) {
        console.log("You have no saved favourite cities.");
        return;
      }

      console.log("\n❤️  YOUR FAVOURITE CITIES");

      favourites.forEach((city, index) => {
        console.log(`${index + 1}. ${city}`);
      });

      return;
    }

    // History command
    if (values.history) {
      const history = await getHistory();

      if (history.length === 0) {
        console.log("You have no search history yet.");
        return;
      }

      console.log("\n📚 WEATHER SEARCH HISTORY");

      history.forEach((weather, index) => {
        console.log(
          `${index + 1}. ${weather.city} - ${weather.temperature}°C - ${weather.description}`
        );

        console.log(
          `   Searched: ${new Date(weather.searchedAt).toLocaleString()}`
        );
      });

      return;
    }

    // Remove favourite command
    if (values.remove !== undefined) {
      if (positionals.length > 0) {
        throw new Error("Please provide the city using --remove <city>.");
      }

      const city = values.remove.trim();

      if (!city) {
        throw new Error("Please provide a city to remove.");
      }

      const removed = await removeFavourite(city);

      if (removed) {
        console.log(`✅ ${city} was removed from your favourites.`);
      } else {
        console.log(`ℹ️ ${city} is not in your favourites.`);
      }

      return;
    }

    // Get city name
    const city = positionals[0];

    if (!city) {
      if (values.save) {
        throw new Error("Please provide a city to save.");
      }

      showHelp();
      process.exitCode = 1;
      return;
    }

    if (positionals.length > 1) {
      throw new Error('Please enter one city name in quotation marks if it has spaces.');
    }

    console.log(`\nChecking weather for ${city}...\n`);

    // Get weather information
    const weather = await getWeather(city);

    // Display results
    displayWeather(weather);

    // Save search history
    await addHistory(weather);

    // Save favourite if --save is provided
    if (values.save) {
      const saved = await addFavourite(weather.city);

      if (saved) {
        console.log(`❤️ ${weather.city} added to your favourites.`);
      } else {
        console.log(`ℹ️ ${weather.city} is already in your favourites.`);
      }
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);

    if (error.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
      console.error("Use ikirere --help to see available commands.");
    }

    process.exitCode = 1;
  }
}
