// ============================================================
// AERIS — Global State & Dashboard Orchestrator
// ============================================================

window.weatherState = {
  location: {
    name: "Loading...",
    latitude: null,
    longitude: null
  },
  current: {
    temperature: 0,
    feelsLike: 0,
    humidity: 0,
    wind: 0,
    uv: 0,
    weatherCode: 0,
    precipitationProb: 0,
    cloudCover: 0,
    visibility: 0
  },
  hourly: [],
  daily: [],
  astronomy: {
    sunrise: null,
    sunset: null
  }
};

// ── Loading overlay ──────────────────────────────────────────
function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; el.style.opacity = ''; }, 500);
  }
}

window.showLoading = showLoading;
window.hideLoading = hideLoading;

// ── Clock ────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('date-time');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
updateClock();
setInterval(updateClock, 60000);

// ── Weather helpers ──────────────────────────────────────────
function getWeatherDescription(code) {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}
window.getWeatherDescription = getWeatherDescription;

function getWeatherIcon(code, isDay) {
  if (code === 0) return isDay ? 'fa-sun' : 'fa-moon';
  if (code <= 3)  return isDay ? 'fa-cloud-sun' : 'fa-cloud-moon';
  if (code <= 48) return 'fa-smog';
  if (code <= 65) return 'fa-cloud-rain';
  if (code <= 77) return 'fa-snowflake';
  if (code <= 82) return 'fa-cloud-showers-heavy';
  if (code <= 99) return 'fa-bolt';
  return 'fa-cloud';
}

function isDaytime() {
  if (!weatherState.astronomy.sunrise || !weatherState.astronomy.sunset) return true;
  const now = new Date();
  return now >= new Date(weatherState.astronomy.sunrise) &&
         now <= new Date(weatherState.astronomy.sunset);
}

function applyWeatherTheme(code, isDay) {
  document.body.className = '';
  const isThunder = code >= 95;
  const isRain    = code >= 51 && code <= 82 && !isThunder;
  const isSnow    = code >= 71 && code <= 77;
  const isFog     = code >= 45 && code <= 48;
  const isCloudy  = code >= 1 && code <= 3;

  // Detect golden-hour / sunrise / sunset windows
  let isSunrise    = false;
  let isSunset     = false;
  if (weatherState.astronomy.sunrise && weatherState.astronomy.sunset) {
    const now      = new Date();
    const sunrise  = new Date(weatherState.astronomy.sunrise);
    const sunset   = new Date(weatherState.astronomy.sunset);
    const srStart  = new Date(sunrise.getTime() - 20  * 60000);
    const srEnd    = new Date(sunrise.getTime() + 60  * 60000);
    const ssStart  = new Date(sunset.getTime()  - 60  * 60000);
    const ssEnd    = new Date(sunset.getTime()  + 20  * 60000);
    isSunrise      = now >= srStart && now <= srEnd;
    isSunset       = now >= ssStart && now <= ssEnd;
  }

  if (isThunder) {
    document.body.classList.add('storm');
  } else if (isSnow) {
    document.body.classList.add('snow');
  } else if (!isDay && isRain) {
    document.body.classList.add('night-rain');
  } else if (!isDay) {
    document.body.classList.add('night');
  } else if (isFog) {
    document.body.classList.add('fog');
  } else if (isRain) {
    document.body.classList.add('rain');
  } else if (isSunrise) {
    document.body.classList.add('sunrise');
  } else if (isSunset) {
    document.body.classList.add('sunset');
  } else if (isCloudy) {
    document.body.classList.add('cloudy');
  } else {
    document.body.classList.add('clear');
  }
}

// ── UV colour helper ─────────────────────────────────────────
function uvLabel(uv) {
  if (uv <= 2)  return { label: 'Low',     color: '#22c55e' };
  if (uv <= 5)  return { label: 'Moderate', color: '#eab308' };
  if (uv <= 7)  return { label: 'High',    color: '#f97316' };
  if (uv <= 10) return { label: 'V.High',  color: '#ef4444' };
  return            { label: 'Extreme',    color: '#a855f7' };
}

// ── Populate sidebar metrics ─────────────────────────────────
function updateMetrics() {
  const c = weatherState.current;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('m-humidity',   c.humidity   + '%');
  set('m-wind',       Math.round(c.wind) + ' km/h');
  set('m-visibility', c.visibility >= 1000
    ? (c.visibility / 1000).toFixed(1) + ' km'
    : c.visibility + ' m');
  set('m-cloud',      c.cloudCover + '%');

  const uv = uvLabel(c.uv);
  const uvEl = document.getElementById('m-uv');
  if (uvEl) {
    uvEl.textContent = c.uv + ' – ' + uv.label;
    uvEl.style.color = uv.color;
  }

  set('m-rain', c.precipitationProb + '%');
}

// ── Hourly forecast strip ────────────────────────────────────
const WX_ICON = { 0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️', 45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧', 61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️', 77: '🌨', 80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈' };

function emojiForCode(code) {
  if (WX_ICON[code]) return WX_ICON[code];
  if (code <= 3)  return '🌤';
  if (code <= 48) return '🌫';
  if (code <= 65) return '🌧';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦';
  return '⛈';
}

function updateHourly() {
  const container = document.getElementById('hourly-scroll');
  if (!container) return;
  const slice = weatherState.hourly.slice(0, 24);
  container.innerHTML = slice.map(h => {
    const d = new Date(h.time);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const emoji = emojiForCode(h.weatherCode || 0);
    const rain = h.precipProb > 0 ? `<span class="hourly-rain">${h.precipProb}%</span>` : '';
    return `
      <div class="hourly-item">
        <span class="hourly-time">${timeStr}</span>
        <span class="hourly-emoji">${emoji}</span>
        <span class="hourly-temp">${Math.round(h.temperature)}°</span>
        ${rain}
      </div>`;
  }).join('');
}

// ── Daily forecast list ──────────────────────────────────────
function updateDaily() {
  const container = document.getElementById('daily-list');
  if (!container) return;
  container.innerHTML = weatherState.daily.map((d, i) => {
    const date = new Date(d.date);
    const dayName = i === 0 ? 'Today'
      : i === 1 ? 'Tomorrow'
      : date.toLocaleDateString('en-US', { weekday: 'short' });
    const emoji = emojiForCode(d.weatherCode || 0);
    const rainBar = d.precipProb > 0
      ? `<div class="daily-rain-bar"><div class="daily-rain-fill" style="width:${d.precipProb}%"></div></div>`
      : '';
    return `
      <div class="daily-item">
        <span class="daily-day">${dayName}</span>
        <span class="daily-emoji">${emoji}</span>
        <span class="daily-temps">
          <span class="daily-high">${Math.round(d.maxTemp)}°</span>
          <span class="daily-low">${Math.round(d.minTemp)}°</span>
        </span>
        ${rainBar}
      </div>`;
  }).join('');
}

// ── Main dashboard update ────────────────────────────────────
function updateDashboard() {
  document.getElementById('location-name').textContent = weatherState.location.name;

  document.getElementById('current-temp').textContent    = Math.round(weatherState.current.temperature);
  document.getElementById('current-feels-like').textContent = `Feels like ${Math.round(weatherState.current.feelsLike)}°C`;
  document.getElementById('current-desc').textContent    = getWeatherDescription(weatherState.current.weatherCode);

  const isDay = isDaytime();
  applyWeatherTheme(weatherState.current.weatherCode, isDay);

  const iconHtml = `<i class="fa-solid ${getWeatherIcon(weatherState.current.weatherCode, isDay)} fa-4x"></i>`;
  document.getElementById('current-icon').innerHTML = iconHtml;

  updateMetrics();
  updateHourly();
  updateDaily();
  hideLoading();

  // Trigger module updates
  if (window.updateOutfit)           window.updateOutfit();
  if (window.updateActivities)       window.updateActivities();
  if (window.updateRecommendations)  window.updateRecommendations();
  if (window.updatePhotography)      window.updatePhotography();
}

window.updateDashboard = updateDashboard;


