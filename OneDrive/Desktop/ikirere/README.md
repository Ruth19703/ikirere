# 🌦️ Ikirere – Weather CLI

## About the Project

**Ikirere** is a command-line weather application built with Node.js. It allows users to check the current weather of different cities around the world directly from their terminal.

The name *Ikirere* comes from Kinyarwanda and means *weather*.

The application uses online weather APIs to find city locations and retrieve current weather information.

## Features

- **Search Weather:** Check the current weather of any supported city.
- **Worldwide City Search:** Find cities using an online geocoding API without manually declaring a list of cities.
- **Temperature Information:** View temperature and feels-like temperature.
- **Weather Conditions:** See conditions such as clear sky, rain, clouds, and thunderstorms.
- **Humidity:** Check the current humidity percentage.
- **Wind Speed:** View the current wind speed.
- **Unit Selection:** Choose between Celsius and Fahrenheit.
- **Favourites:** Save your favourite cities for quick access.
- **Search History:** View your recently searched cities.
- **Data Storage:** Save favourites and search history locally in a JSON file.

## Technologies Used

- **Node.js** – Runs the application.
- **JavaScript** – Handles the application logic.
- **Open-Meteo Geocoding API** – Finds city locations and coordinates.
- **Open-Meteo Weather API** – Retrieves current weather information.
- **Axios** – Handles HTTP requests.
- **JSON** – Stores favourites and search history.

## Installation

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Open the Project Folder

```bash
cd ikirere
```

### 3. Install Dependencies

```bash
npm install
```

## How to Run the Project

Start the application using:

```bash
npm start
```

Search for a city:

```bash
npm start -- kigali
```

Check weather using Fahrenheit:

```bash
npm start -- kigali --units imperial
```

Check weather using Celsius:

```bash
npm start -- kigali --units metric
```

## Other Commands

The application also supports these commands:

| Command | Description |
|---|---|
| `npm start -- --help` | Display available commands |
| `npm start -- --favourites` | View saved favourite cities |
| `npm start -- --history` | View recent searches |
| `npm start -- --config` | View application settings |
| `npm start -- --save kigali` | Save a city as a favourite |
| `npm start -- --remove kigali` | Remove a favourite city |

*Note: These commands assume the corresponding options are implemented in the current CLI version.*

## Project Structure


ikirere/
│
├── bin/
│   └── ikirere.js
│
├── src/
│   ├── config.js
│   ├── errors.js
│   ├── forecast.js
│   ├── geocode.js
│   ├── http.js
│   └── storage.js
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md


## APIs Used

**Open-Meteo**

- Geocoding API: https://geocoding-api.open-meteo.com/
- Weather API: https://open-meteo.com/

These APIs provide location and weather information.

## Future Improvements

- Display weather for multiple randomly selected cities.
- Provide weather forecasts for upcoming days.
- Improve the display of weather reports.
- Add more weather information and statistics.

## Author

Developed as a Node.js command-line project to practise JavaScript, API integration, asynchronous programming, error handling, and local data storage.



