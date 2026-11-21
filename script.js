
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");

// Get weather information for a city
async function getWeather(city) {
    try {
        message.textContent = "Loading weather information...";

        // Step 1: Find the city's latitude and longitude
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoURL);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another city.");
        }

        const location = geoData.results[0];

        const latitude = location.latitude;
        const longitude = location.longitude;

        // Step 2: Get current weather and 7-day forecast
        
const weatherURL =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&forecast_days=7&timezone=auto`;


        const weatherResponse = await fetch(weatherURL);
        const weatherData = await weatherResponse.json();

        // Step 3: Display current weather
        displayCurrentWeather(location, weatherData.current);

        // Step 4: Display 7-day forecast
        displayForecast(weatherData.daily);
        displayHourlyForecast(weatherData.hourly);
        message.textContent = "";

    } catch (error) {
        message.textContent = error.message;
    }
}

// Convert weather codes into descriptions and icons
function getWeatherInfo(code) {
    const weatherTypes = {
        0: ["Clear Sky", "☀️"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Rime Fog", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Drizzle", "🌦️"],
        55: ["Heavy Drizzle", "🌧️"],
        61: ["Light Rain", "🌧️"],
        63: ["Moderate Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        71: ["Light Snow", "🌨️"],
        73: ["Snow", "🌨️"],
        75: ["Heavy Snow", "❄️"],
        77: ["Snow Grains", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Moderate Showers", "🌧️"],
        82: ["Heavy Showers", "⛈️"],
        85: ["Snow Showers", "🌨️"],
        86: ["Heavy Snow Showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm", "⛈️"]
    };

    return weatherTypes[code] || ["Unknown", "🌡️"];
}

// Display current weather
function displayCurrentWeather(location, current) {
    document.getElementById("cityName").textContent =
        `${location.name}, ${location.country}`;

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("windSpeed").textContent =
        `${current.wind_speed_10m} km/h`;

    document.getElementById("feelsLike").textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    const weather = getWeatherInfo(current.weather_code);

    document.getElementById("description").textContent = weather[0];
    document.getElementById("weatherIcon").textContent = weather[1];
}

// Display the 7-day forecast
function displayForecast(daily) {
    const forecastContainer = document.getElementById("forecast");

    forecastContainer.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {

        const date = new Date(daily.time[i] + "T12:00:00");

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const weather = getWeatherInfo(daily.weather_code[i]);

        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);

        const forecastCard = document.createElement("div");

        forecastCard.className = "forecast-card";

        forecastCard.innerHTML = `
            <h3>${i === 0 ? "Today" : dayName}</h3>

            <div class="forecast-icon">${weather[1]}</div>

            <p class="forecast-description">${weather[0]}</p>

            <div class="forecast-temperatures">
                <strong>${maxTemp}°</strong>
                <span>${minTemp}°</span>
            </div>
        `;

        forecastContainer.appendChild(forecastCard);
    }
}

// Search button
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();

    if (city !== "") {
        getWeather(city);
    } else {
        message.textContent = "Please enter a city name.";
    }
});

// Search when Enter is pressed
cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchBtn.click();
    }
});

// Display the next 24 hours of weather
function displayHourlyForecast(hourly) {

    const hourlyContainer = document.getElementById("hourlyForecast");

    hourlyContainer.innerHTML = "";

    // Find the current hour in the API data
    const currentHour = new Date();

    const startIndex = hourly.time.findIndex(time => {
        return new Date(time).getHours() === currentHour.getHours() &&
               new Date(time).getDate() === currentHour.getDate();
    });

    const firstHour = startIndex === -1 ? 0 : startIndex;

    // Display the next 24 hours
    for (let i = firstHour; i < Math.min(firstHour + 24, hourly.time.length); i++) {

        const time = new Date(hourly.time[i]);

        const hourLabel = time.toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true
        });

        const temperature = Math.round(hourly.temperature_2m[i]);

        const rain = hourly.precipitation_probability[i];

        const weather = getWeatherInfo(hourly.weather_code[i]);

        const card = document.createElement("div");

        card.className = "hourly-card";

        card.innerHTML = `
            <h3>${i === firstHour ? "Now" : hourLabel}</h3>

            <div class="hourly-icon">${weather[1]}</div>

            <div class="hourly-temp">${temperature}°C</div>

            <p class="hourly-rain">💧 ${rain ?? 0}% rain</p>
        `;

        hourlyContainer.appendChild(card);
    }
}
