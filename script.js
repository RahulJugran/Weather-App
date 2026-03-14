const apiKey = "YOUR_OPENWEATHER_API_KEY";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

let currentUnit = "metric";
let lastQuery = null;
let controller = null;

// DOM
const searchBtn = document.querySelector("#searchBtn");
const locationBtn = document.querySelector("#locationBtn");
const cityInput = document.querySelector("#cityInput");

const cityEl = document.querySelector("#city");
const tempEl = document.querySelector("#temp");
const conditionEl = document.querySelector("#condition");
const iconEl = document.querySelector("#icon");
const errorEl = document.querySelector("#error");
const loader = document.querySelector("#loader");
const feelsLikeEl = document.querySelector("#feelsLike");
const humidityEl = document.querySelector("#humidity");
const windEl = document.querySelector("#wind");
const updatedAtEl = document.querySelector("#updatedAt");
const unitToggle = document.querySelector("#unitToggle");

searchBtn.disabled = true;

// ---------------- UI HELPERS ----------------

function setLoading(isLoading) {
  loader.classList.toggle("hidden", !isLoading);
  locationBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "Searching..." : "Search";
  document.body.style.cursor = isLoading ? "wait" : "default";
}

function resetUI() {
  cityEl.textContent = "City";
  cityEl.classList.remove("error-text");
  const symbol = currentUnit === "metric" ? "°C" : "°F";
  tempEl.textContent = `--${symbol}`;
  conditionEl.textContent = "Condition";
  iconEl.src = "";

  feelsLikeEl.textContent = "";
  humidityEl.textContent = "";
  windEl.textContent = "";
  updatedAtEl.textContent = "";
}

function showError(message) {
  cityEl.textContent = message;
  cityEl.classList.add("error-text");
}

function updateWeatherUI(data) {
  cityEl.textContent = `${data.name}, ${data.sys.country}`;
  cityEl.classList.remove("error-text");

  const symbol = currentUnit === "metric" ? "°C" : "°F";

  tempEl.textContent = `Temperature: ${data.main.temp}${symbol}`;
  feelsLikeEl.textContent = `Feels like: ${data.main.feels_like}${symbol}`;
  conditionEl.textContent = `Weather: ${data.weather[0].main}`;
  humidityEl.textContent = `Humidity: ${data.main.humidity}%`;
  windEl.textContent = `Wind: ${data.wind.speed} m/s`;

  const date = new Date();
  updatedAtEl.textContent = `Updated: ${date.toLocaleString()}`;

  iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  setBackground(data.weather[0].main);
}

function setBackground(condition) {
  const map = {
    Clear: "linear-gradient(to right, #f7971e, #ffd200)",
    Rain: "linear-gradient(to right, #4e54c8, #8f94fb)",
    Clouds: "linear-gradient(to right, #757f9a, #d7dde8)",
    Snow: "linear-gradient(to right, #83a4d4, #b6fbff)",
    Thunderstorm: "linear-gradient(to right, #141e30, #243b55)",
  };

  document.body.style.background =
    map[condition] || "linear-gradient(to right, #74ebd5, #9face6)";
}

// ---------------- SEARCH ----------------

function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) return;

  lastQuery = `q=${city}`;

  fetchWeather(lastQuery);

  cityInput.value = "";

  localStorage.setItem("lastCity", city);
}

// ---------------- API LOGIC ----------------

async function fetchWeather(queryParams) {
  resetUI();
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
  setLoading(true);

  // cancel previous request
  if (controller) {
    controller.abort();
  }

  controller = new AbortController();

  try {
    const url = `${BASE_URL}?${queryParams}&appid=${apiKey}&units=${currentUnit}`;

    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Network response failed");
    }

    const data = await response.json();

    if (Number(data.cod) !== 200) {
      const errorMap = {
        401: "Invalid API Key",
        404: "City not found",
      };

      showError(errorMap[Number(data.cod)] || "Something went wrong");
      return;
    }

    updateWeatherUI(data);
  } catch (err) {
    if (err.name === "AbortError") return;

    errorEl.classList.remove("hidden");
    errorEl.textContent = "Unable to fetch weather data";
  } finally {
    setLoading(false);
  }
}

// ---------------- EVENT HANDLERS ----------------

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

cityInput.addEventListener("input", () => {
  searchBtn.disabled = !cityInput.value.trim();
});

// 📍 Location Weather
locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      lastQuery = `lat=${latitude}&lon=${longitude}`;

      fetchWeather(lastQuery);
    },
    (error) => {
      const geoErrors = {
        1: "Permission denied for location",
        2: "Location unavailable",
        3: "Location request timed out",
      };

      errorEl.classList.remove("hidden");
      errorEl.textContent = geoErrors[error.code] || "Location access failed";
    },
  );
});

// 🌍 Load Last City
window.addEventListener("DOMContentLoaded", () => {
  const lastCity = localStorage.getItem("lastCity");

  if (lastCity) {
    lastQuery = `q=${lastCity}`;
    fetchWeather(lastQuery);
  }
});

// 🌡 Unit Toggle
unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";

  unitToggle.textContent =
    currentUnit === "metric" ? "Switch to °F" : "Switch to °C";

  if (lastQuery) {
    fetchWeather(lastQuery);
  }
});
