async function loadWeather(lat, lon, locationName = null) {
  if (window.showLoading) showLoading();
  try {
    if (!locationName) {
      locationName = await reverseGeocode(lat, lon);
    }
    
    weatherState.location.latitude = lat;
    weatherState.location.longitude = lon;
    weatherState.location.name = locationName;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,visibility&hourly=temperature_2m,precipitation_probability,weather_code,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&forecast_days=7&timezone=auto`;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await response.json();
    
    // Parse current
    weatherState.current = {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      precipitationProb: data.current.precipitation_probability || 0,
      weatherCode: data.current.weather_code,
      cloudCover: data.current.cloud_cover,
      visibility: data.current.visibility,
      uv: 0
    };
    
    // Parse astronomy
    if (data.daily && data.daily.sunrise && data.daily.sunset) {
      weatherState.astronomy.sunrise = data.daily.sunrise[0];
      weatherState.astronomy.sunset = data.daily.sunset[0];
    }
    
    // Parse hourly (next 24 hours)
    weatherState.hourly = [];
    const hCount = Math.min(24, data.hourly.time.length);
    for(let i=0; i<hCount; i++) {
      weatherState.hourly.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        precipProb: data.hourly.precipitation_probability[i],
        visibility: data.hourly.visibility[i],
        weatherCode: data.hourly.weather_code ? data.hourly.weather_code[i] : 0,
        uv: data.hourly.uv_index ? data.hourly.uv_index[i] : 0
      });
    }
    
    // Get current UV from hourly array
    const currentHourIdx = new Date().getHours();
    if(weatherState.hourly[currentHourIdx]) {
      weatherState.current.uv = weatherState.hourly[currentHourIdx].uv;
    }

    // Parse daily
    weatherState.daily = [];
    const dCount = Math.min(7, data.daily.time.length);
    for(let i=0; i<dCount; i++) {
      weatherState.daily.push({
        date: data.daily.time[i],
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        precipProb: data.daily.precipitation_probability_max[i],
        weatherCode: data.daily.weather_code[i]
      });
    }
    
    if (window.updateDashboard) {
      updateDashboard();
    }
    
  } catch (error) {
    console.error("Error fetching weather:", error);
    const descEl = document.getElementById('current-desc');
    if (descEl) descEl.textContent = "Failed to load data";
    if (window.hideLoading) hideLoading();
  }
}

async function searchCity(query) {
  if (window.showLoading) showLoading();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      const city = data.results[0];
      const name = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}`;
      await loadWeather(city.latitude, city.longitude, name);
    } else {
      if (window.hideLoading) hideLoading();
      alert("City not found");
    }
  } catch (error) {
    console.error("Error searching city:", error);
    if (window.hideLoading) hideLoading();
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (data && data.address) {
      return data.address.city || data.address.town || data.address.village || data.address.county || "Your Location";
    }
    return "Your Location";
  } catch (error) {
    return "Your Location";
  }
}
