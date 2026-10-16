const searchButton =
 document.querySelector('.search-button');
const cityInput = 
document.querySelector('.city-input');
const localTime = document.querySelector('.local-time');
 let clockInterval;
 searchButton.addEventListener('click',async () => {
  const city = cityInput.value.trim();
  if (!city) {
  alert('Please enter a city name.');
  return;
}

try {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );


  const data = await response.json();
  if (!data.results || data.results.length === 0) {
  alert('City not found. please try another city.');
  return;
}

  const location = data.results[0];
  console.log(location.name)
   console.log(location.timezone)

const latitude = location.latitude;
const longitude = location.longitude;

const weatherResponse = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`
);

const weatherData = await weatherResponse.json();



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
/*
const time =
weatherData.current.time;

const [date, clockTime] = time.split('T');
const [hours, minutes] = clockTime.split(':').map(Number);

const period = hours >= 12 ? 'PM' : 'AM';
const hour12 = hours % 12 || 12;
const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;

localTime.textContent = `
Local time: ${formattedTime}
`;
*/

console.log(weatherData.current.time);
console.log(weatherData.timezone)
} catch (error) {
  console.error('Something went wrong:', error);
}
 })
