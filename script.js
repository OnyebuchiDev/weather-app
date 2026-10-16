const searchButton =
 document.querySelector('.search-button');
const cityInput = 
document.querySelector('.city-input');
const localTime = document.querySelector('.local-time');
const cityName = document.querySelector('.city-name');
const temperature = document.querySelector('.temperature');
const weatherDescription = document.querySelector('.weather-description');
const feelsLike = document.querySelector('.feels-like');
const humidity = document.querySelector('.humidity');
const windSpeed = document.querySelector('.wind-speed');
const forecastList = document.querySelector('.forecast-list');
const errorMessage =document.querySelector('.error-message');
const unitToggle = document.querySelector('.unit-toggle');
const currentWeatherIcon = document.querySelector('.current-weather-icon');
const locationButton = document.querySelector('.location-button');

 let clockInterval;
 let temperatureUnit = 'C';
 let currentTemperatureCelsius = null;
 let feelsLikeCelsius = null;

 function celsiusToFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
 }

 unitToggle.addEventListener('click', () => {
  if (currentTemperatureCelsius === null) {
    return;
  }

  if (temperatureUnit === 'C') {
    temperatureUnit = 'F';
  } else {
    temperatureUnit = 'C';
  }

  // Update the button label
  unitToggle.textContent =
    temperatureUnit === 'C'
      ? 'Switch to °F'
      : 'Switch to °C';

  // Update current temperature
  const currentTemp =
    temperatureUnit === 'C'
      ? currentTemperatureCelsius
      : celsiusToFahrenheit(currentTemperatureCelsius);

  temperature.textContent =
    `${Number(currentTemp).toFixed(1)}°${temperatureUnit}`;

  // Update feels-like temperature
  const feelsTemp =
    temperatureUnit === 'C'
      ? feelsLikeCelsius
      : celsiusToFahrenheit(feelsLikeCelsius);

  feelsLike.textContent =
    `${Number(feelsTemp).toFixed(1)}°${temperatureUnit}`;

  // Update every forecast card
  const forecastCards =
    document.querySelectorAll('.forecast-card');

  forecastCards.forEach(card => {
    const highC = Number(card.dataset.highCelsius);
    const lowC = Number(card.dataset.lowCelsius);

    const high =
      temperatureUnit === 'C'
        ? highC
        : celsiusToFahrenheit(highC);

    const low =
      temperatureUnit === 'C'
        ? lowC
        : celsiusToFahrenheit(lowC);

    const forecastTemp =
      card.querySelector('.forecast-temperature');

    forecastTemp.textContent =
      `${Math.round(high)}°${temperatureUnit} / ` +
      `${Math.round(low)}°${temperatureUnit}`;
  });
});

 searchButton.addEventListener('click',async () => {
 
  const city = cityInput.value.trim();
  if (!city) {
  errorMessage.textContent =
  'please enter a city name.';
  return;
}
errorMessage.textContent = '';
searchButton.textContent = '';
searchButton.disabled = true;
searchButton.textContent = 'Searching...';

try {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  if (!response.ok) {
  throw new Error('unable to search for the city. Please try again later.');
}


  const data = await response.json();
  if (!data.results || data.results.length === 0) {
   errorMessage.textContent =
    'City not found. please try another city.';
  return;
}

  const location = data.results[0];
  cityInput.value = '';
  console.log(location.name)
   console.log(location.timezone)

const latitude = location.latitude;
const longitude = location.longitude;

const weatherResponse = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto`
);

if (!weatherResponse.ok) {
  throw new Error('unable to fetch weather data. Please try again later.');
}

const weatherData = await weatherResponse.json();
const current = weatherData.current;

if (current.is_day === 0) {
  document.body.classList.add('weather-night');
} else {
  document.body.classList.remove('weather-night');
}

const code = current.weather_code;

document.body.classList.remove(
  'weather-clear',
  'weather-cloudy',
  'weather-rainy',
  'weather-stormy',
  'weather-snowy',
  'weather-foggy'
);

if (code === 0 || code === 1) {
  document.body.classList.add('weather-clear');
} else if (code === 2 || code === 3) {
  document.body.classList.add('weather-cloudy');
} else if (code === 45 || code === 48) {
  document.body.classList.add('weather-foggy');
} else if (code >= 51 && code <= 67 ||
           code >= 80 && code <= 82) {
  document.body.classList.add('weather-rainy');
} else if (code >= 71 && code <= 77) {
  document.body.classList.add('weather-snowy');
} else if (code >= 95) {
  document.body.classList.add('weather-stormy');
}

currentTemperatureCelsius =
current.temperature_2m;
feelsLikeCelsius =
current.apparent_temperature;

temperatureUnit = 'C';
unitToggle.textContent = 'Switch to ℉';

// Update the city name
cityName.textContent =
  `${location.name}, ${location.country_code}`;

// Display temperature
temperature.textContent =
  `${current.temperature_2m}°C`;

// Display feels-like temperature
feelsLike.textContent =
  `${current.apparent_temperature}°C`;

// Display humidity
humidity.textContent =
  `${current.relative_humidity_2m}%`;

// Display wind speed
windSpeed.textContent =
  `${current.wind_speed_10m} km/h`;

// Convert weather code into a description
const weatherCodes = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail'
};

weatherDescription.textContent =
  weatherCodes[current.weather_code] ??
  'Weather condition unavailable';

const daily = weatherData.daily;

const getWeatherIcon = (code) => {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';

  return '🌡️';
};
currentWeatherIcon.textContent =
getWeatherIcon(current.weather_code)

forecastList.innerHTML = '';

daily.time.forEach((date, index) => {
  const dateParts = date.split('-').map(Number);
  const forecastDate = new Date(
    dateParts[0],
    dateParts[1] - 1,
    dateParts[2]
  );

  const day = forecastDate.toLocaleDateString(
    'en-US',
    { weekday: 'short' }
  );

  const icon = getWeatherIcon(
    daily.weather_code[index]
  );

  const high = daily.temperature_2m_max[index];
  const low = daily.temperature_2m_min[index];
  const rain =
    daily.precipitation_probability_max[index];

  const card = document.createElement('div');
  card.className = 'forecast-card';

  card.dataset.highCelsius = high;
  card.dataset.lowCelsius = low;

  card.innerHTML = `
    <h3>${day}</h3>
    <p class="forecast-icon">${icon}</p>
    <p>${weatherCodes[daily.weather_code[index]]
      ?? 'Unknown conditions'}</p>
    <p class="forecast-temperature">
      ${Math.round(high)}°C / ${Math.round(low)}°C
    </p>
    <p>🌧️ ${rain ?? 'N/A'}% chance of rain</p>
  `;

  forecastList.appendChild(card);
});



const timezone = weatherData.timezone;

const updateLocalTime = () => {
  const now = new Date();

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(now);

  localTime.textContent = `Local time: ${formattedTime}`;

  console.log('Device time:', new Date().toString());
  console.log('timeZone:', timezone);
  console.log('Formatted time:', formattedTime)
};

updateLocalTime();
clearInterval(clockInterval);
clockInterval =
setInterval(updateLocalTime, 1000);



} catch (error) {
  console.error('Something went wrong:', error);
   alert('unable to load weather.please try again later.');
} finally {
  searchButton.disabled = false;
  searchButton.textContent = 'Search';
}
 });


 locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    errorMessage.textContent =
      'Geolocation is not supported by your browser.';
    return;
  }

  errorMessage.textContent = 'Getting your location...';
  locationButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
      async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
          throw new Error('Could not identify your location.');
        }

        const data = await response.json();
        const address = data.address || {};

        const city =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.suburb ||
          address.county;

        if (!city) {
          throw new Error('Could not identify your city.');
        }

        // Put the detected city into the search input
        cityInput.value = city;

        // Let your existing search code load the weather
        errorMessage.textContent = '';
        locationButton.disabled = false;
        searchButton.click();

      } catch (error) {
        console.error('Location error:', error);

        errorMessage.textContent =
          'Could not identify your location. Please search for your city instead.';

        locationButton.disabled = false;
      }
    
    },

    (error) => {
      if (error.code === 1) {
        errorMessage.textContent =
          'Location permission was denied.';
      } else if (error.code === 2) {
        errorMessage.textContent =
          'Your location could not be determined.';
      } else {
        errorMessage.textContent =
          'Location request timed out. Try again.';
      }

      locationButton.disabled = false;
    },

    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000
    }
  );
});