document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-chat-send');
  const chatHistory = document.getElementById('chat-history');

  function addMessage(text, isBot = true) {
    const div = document.createElement('div');
    div.className = `chat-msg ${isBot ? 'bot-msg' : 'user-msg'}`;
    div.innerHTML = text;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  async function processQuery(query) {
    if (!window.weatherState || window.weatherState.location.latitude === null) {
      return "Please wait for weather data to load or search for a location first.";
    }

    const q = query.toLowerCase();
    const current = window.weatherState.current;
    const location = window.weatherState.location.name;
    
    // Greeting
    if (/^(hi|hello|hey|greetings|morning|afternoon|evening)/.test(q)) {
        return `Hello! I'm AERIS. Ask me about the weather in ${location}, or type "summary" for a live weather breakdown!`;
    }

    // Weather in another city
    if (q.includes('weather in ') || q.includes('weather for ') || q.includes('weather at ')) {
        let city = q.split(/weather in |weather for |weather at /)[1];
        if (city) {
            city = city.replace(/[^\w\s]/g, '').trim();
            if (city) {
                try {
                    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
                    const data = await res.json();
                    if (data.results && data.results.length > 0) {
                        const loc = data.results[0];
                        const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code&timezone=auto`);
                        const wxData = await wxRes.json();
                        const desc = window.getWeatherDescription ? window.getWeatherDescription(wxData.current.weather_code) : "fair";
                        return `Currently in <strong>${loc.name}</strong>, it's <strong>${Math.round(wxData.current.temperature_2m)}°C</strong> and ${desc.toLowerCase()}.`;
                    }
                } catch (e) {
                    console.error(e);
                }
                return `Sorry, I couldn't find the weather for ${city}.`;
            }
        }
    }

    // Live Summary
    if (q.includes('summarize') || q.includes('summary') || q.includes('live weather') || q.includes('report')) {
        const desc = window.getWeatherDescription ? window.getWeatherDescription(current.weatherCode) : "fair";
        return `<strong>Live Summary for ${location}:</strong><br>It's currently ${Math.round(current.temperature)}°C (feels like ${Math.round(current.feelsLike)}°C) with ${desc.toLowerCase()}. The wind is blowing at ${current.wind} km/h and humidity is ${current.humidity}%. ${current.precipitationProb > 0 ? 'There is a ' + current.precipitationProb + '% chance of rain.' : 'No rain expected.'}`;
    }

    // Suggestions
    if (q.includes('suggest') || q.includes('other location') || q.includes('cities') || q.includes('options')) {
        return `Here are a few suggestions you can ask me about or search for:<br><strong>Tokyo, London, New York, Paris, Sydney, Dubai</strong>.<br>Try asking: <em>"weather in Tokyo"</em>!`;
    }

    // Weather / summary (basic)
    if (q.includes('weather') || q.includes('forecast') || q.includes('how is it')) {
        const desc = window.getWeatherDescription ? window.getWeatherDescription(current.weatherCode) : "fair";
        return `Currently in ${location}, it's ${Math.round(current.temperature)}°C and ${desc.toLowerCase()}.`;
    }

    // Intent detection based on keywords
    if (q.includes('rain') || q.includes('raining') || q.includes('umbrella') || q.includes('wet')) {
      if (current.precipitationProb > 50) return `Yes, there is a ${current.precipitationProb}% chance of rain. You should definitely carry an umbrella.`;
      if (current.precipitationProb > 10) return `There is a slight ${current.precipitationProb}% chance of rain, but it might stay dry.`;
      return "No rain is expected right now.";
    }
    
    if (q.includes('wear') || q.includes('clothes') || q.includes('outfit') || q.includes('jacket')) {
      if (current.temperature > 25) return "It's quite warm. Light, breathable clothing like a t-shirt and shorts is recommended.";
      if (current.temperature < 15) return "It's chilly. You should wear a jacket or sweater.";
      return "The temperature is moderate. A light layer like a full-sleeve shirt or light cardigan would be perfect.";
    }
    
    if (q.includes('cycle') || q.includes('cycling') || q.includes('bike') || q.includes('run') || q.includes('jog')) {
      if (current.wind > 25) return `The wind is quite strong at ${current.wind} km/h. Outdoor activities might be difficult.`;
      if (current.precipitationProb > 40) return "It looks like it might rain. Not the best time for outdoor activities.";
      if (current.temperature > 32) return "It's very hot out there! Make sure to stay hydrated if you go out.";
      return "Conditions are looking great for a run or a bike ride!";
    }
    
    if (q.includes('photo') || q.includes('camera') || q.includes('golden hour') || q.includes('sunset') || q.includes('sunrise')) {
        const astro = window.weatherState.astronomy;
        if(astro && astro.sunrise && astro.sunset) {
            const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `Sunrise is at <strong>${formatTime(astro.sunrise)}</strong> and Sunset is at <strong>${formatTime(astro.sunset)}</strong>. Check the Photography section for golden hour details!`;
        }
        return "Check the Photography section! It will give you the exact Golden Hour times based on today's sunrise and sunset.";
    }
    
    if (q.includes('temperature') || q.includes('hot') || q.includes('cold') || q.includes('warm') || q.includes('temp')) {
      return `It is currently <strong>${Math.round(current.temperature)}°C</strong>, and it feels like <strong>${Math.round(current.feelsLike)}°C</strong>.`;
    }

    if (q.includes('wind') || q.includes('breeze')) {
        return `The wind speed is currently <strong>${current.wind} km/h</strong>.`;
    }

    if (q.includes('humidity') || q.includes('humid')) {
        return `The humidity is at <strong>${current.humidity}%</strong>.`;
    }
    
    return `I'm your local AERIS assistant! You can ask me about rain, what to wear, cycling conditions, sunset times, wind, or the temperature in ${location}.`;
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    addMessage(text, false);
    chatInput.value = '';
    
    // Simple delay for "thinking" effect
    setTimeout(async () => {
      const response = await processQuery(text);
      addMessage(response, true);
    }, 500);
  }

  if (btnSend) {
    btnSend.addEventListener('click', handleSend);
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }
});
