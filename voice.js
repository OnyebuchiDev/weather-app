const voiceButton = document.querySelector('.voice-button');
const voiceStatus = document.querySelector('.voice-status');
const voiceCityInput = document.querySelector('.city-input');
const voiceSearchButton = document.querySelector('.search-button');
const voiceErrorMessage = document.querySelector('.error-message');

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let recognition;
let isListening = false;
let waitingForWeather = false;
let weatherChangeTimer;
let requestedCity = '';

const normalise = (text) =>
  text.toLowerCase().replace(/[.,!?]/g, '').trim();

// Choose a clear, natural English voice available on this device.
function chooseVoice() {
  const voices = window.speechSynthesis.getVoices();

  const englishVoices = voices.filter((voice) =>
    /^en(-|$)/i.test(voice.lang)
  );

  if (!englishVoices.length) {
    return null;
  }

  const preferred = englishVoices.find((voice) =>
    /natural|samantha|aria|jenny|zira|susan|female/i.test(
      voice.name
    )
  );

  const NigerianVoice = englishVoices.find((voice) =>
    /en-ng/i.test(voice.lang)
  );

  const BritishVoice = englishVoices.find((voice) =>
    /en-gb/i.test(voice.lang)
  );

  return preferred || NigerianVoice || BritishVoice || englishVoices[0];
}

// Speak directly, without repeating the user's question.
function speak(text) {
  if (!('speechSynthesis' in window)) {
    voiceStatus.textContent =
      'Speech output is not supported in this browser.';
    return;
  }

  window.speechSynthesis.cancel();

  const message = new SpeechSynthesisUtterance(text);
  const voice = chooseVoice();

  if (voice) {
    message.voice = voice;
  }

  message.lang = voice?.lang || 'en-NG';
  message.rate = 0.98;
  message.pitch = 1.05;
  message.volume = 1;

  message.onstart = () => {
    voiceStatus.textContent = 'Speaking... 🔊';
  };

  message.onend = () => {
    voiceStatus.textContent = 'Ready. Tap to speak again.';
  };

  message.onerror = () => {
    voiceStatus.textContent =
      'Could not play the voice. Check your device sound.';
  };

  window.speechSynthesis.speak(message);
}

// Turn a spoken command into a city name.
function extractCity(text) {
  const phrase = text.trim();

  const patterns = [
    /\b(?:weather|forecast|temperature)\s+(?:in|for|at)\s+(.+)/i,
    /\b(?:check|show|get)\s+(.+?)\s+(?:weather|forecast|temperature)\b/i,
    /\b(?:in|for|at)\s+(.+)/i
  ];

  let city = '';

  for (const pattern of patterns) {
    const match = phrase.match(pattern);

    if (match) {
      city = match[1];
      break;
    }
  }

  // Also allow simply saying a city name, such as "Abuja".
  if (!city && !/\b(weather|forecast|temperature|what|how|tell|check|show|get)\b/i.test(phrase)) {
    city = phrase;
  }

  city = city
    .replace(/\b(?:weather|forecast|temperature|today|tomorrow|right now|now|please|for me)\b.*$/i, '')
    .replace(/[?.!,]+$/, '')
    .trim();

  return city;
}

function sayWeatherReport() {
  const city = document.querySelector('.city-name')?.textContent.trim();
  const temperature = document.querySelector('.temperature')?.textContent.trim();
  const description = document.querySelector('.weather-description')?.textContent.trim();
  const feelsLike = document.querySelector('.feels-like')?.textContent.trim();
  const humidity = document.querySelector('.humidity')?.textContent.trim();
  const wind = document.querySelector('.wind-speed')?.textContent.trim();

  if (!city || !temperature || !description) {
    return false;
  }

  // Make weather units easier for the voice to pronounce.
  const sayUnits = (value) => value
    .replace(/°C/g, ' degrees Celsius')
    .replace(/°F/g, ' degrees Fahrenheit')
    .replace(/km\/h/gi, ' kilometres per hour')
    .replace(/mph/gi, ' miles per hour')
    .replace(/%/g, ' percent');

  const report =
    `${city}. ${description}. ` +
    `Temperature: ${sayUnits(temperature)}. ` +
    `Feels like: ${sayUnits(feelsLike)}. ` +
    `Humidity: ${sayUnits(humidity)}. ` +
    `Wind speed: ${sayUnits(wind)}.`;

  waitingForWeather = false;
  requestedCity = '';
  speak(report);

  return true;
}

if (!SpeechRecognition) {
  voiceStatus.textContent =
    'Voice recognition is not supported in this browser. Try a supported browser.';
  voiceButton.disabled = true;
} else {
  recognition = new SpeechRecognition();

  recognition.lang = 'en-NG';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  voiceButton.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }

    // Stop any previous spoken reply before listening again.
    window.speechSynthesis?.cancel();

    try {
      voiceStatus.textContent = 'Listening... 🎙️';
      isListening = true;
      recognition.start();
    } catch (error) {
      isListening = false;
      voiceStatus.textContent =
        'Could not start the microphone. Tap again.';
    }
  });

  recognition.onresult = (event) => {
    const alternatives = Array.from(event.results[0]);
    const spokenText = alternatives[0].transcript.trim();

    voiceStatus.textContent = `Heard: "${spokenText}"`;

    let city = '';

    // Try the browser's alternative transcriptions too.
    for (const alternative of alternatives) {
      city = extractCity(alternative.transcript);

      if (city) break;
    }

    if (!city) {
      speak('Please say a city name, such as Lagos or London.');
      return;
    }

    voiceCityInput.value = city;
    requestedCity = normalise(city);
    waitingForWeather = true;

    voiceStatus.textContent = `Checking ${city} weather... 🌍`;

    // Detect when the existing weather app updates its results.
    clearTimeout(weatherChangeTimer);
    voiceSearchButton.click();
  };

  recognition.onerror = (event) => {
    isListening = false;

    if (event.error === 'not-allowed') {
      voiceStatus.textContent =
        'Please allow microphone access in your browser settings.';
    } else if (event.error === 'no-speech') {
      voiceStatus.textContent =
        'No speech detected. Try speaking closer to your microphone.';
    } else if (event.error === 'audio-capture') {
      voiceStatus.textContent =
        'No working microphone was found.';
    } else {
      voiceStatus.textContent =
        `Microphone error: ${event.error}. Try again.`;
    }
  };

  recognition.onend = () => {
    isListening = false;
  };
}

// Watch the existing weather display for new results.
const weatherSection = document.querySelector('.current-weather');

if (weatherSection) {
  const weatherObserver = new MutationObserver(() => {
    if (!waitingForWeather) return;

    clearTimeout(weatherChangeTimer);

    // Let the weather app finish updating all its fields first.
    weatherChangeTimer = setTimeout(() => {
      if (!waitingForWeather) return;

      const city = document.querySelector('.city-name')?.textContent.trim();

      if (!city) return;

      // Wait until the displayed city matches the requested city.
      const displayedCityName = normalise(city.split(',')[0]);
      const cityMatches =
        displayedCityName === requestedCity;
      if (cityMatches) {
        sayWeatherReport();
      }
    }, 500);
  });

  weatherObserver.observe(weatherSection, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// If the weather search fails, do not read the old weather as the answer.
if (voiceErrorMessage) {
  const errorObserver = new MutationObserver(() => {
    if (waitingForWeather && voiceErrorMessage.textContent.trim()) {
      waitingForWeather = false;
      voiceStatus.textContent = voiceErrorMessage.textContent.trim();
      speak(voiceErrorMessage.textContent.trim());
    }
  });

  errorObserver.observe(voiceErrorMessage, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Refresh the available voices when the browser loads them.
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = chooseVoice;
}