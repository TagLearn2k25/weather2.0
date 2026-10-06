document.addEventListener('DOMContentLoaded', () => {
  const btnPlan   = document.getElementById('btn-trip-plan');
  const inputDest = document.getElementById('trip-destination');
  const results   = document.getElementById('trip-results');

  async function planTrip() {
    const dest = inputDest.value.trim();
    if (!dest) return;

    results.innerHTML = `
      <div class="trip-loading">
        <i class="fa-solid fa-spinner fa-spin"></i> Planning your trip to <strong>${dest}</strong>...
      </div>`;

    try {
      // Geocode
      const geoRes  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        results.innerHTML = `<p class="trip-error"><i class="fa-solid fa-circle-exclamation"></i> Destination not found. Try a different spelling.</p>`;
        return;
      }

      const city = geoData.results[0];
      const lat  = city.latitude;
      const lon  = city.longitude;
      const name = `${city.name}${city.country ? ', ' + city.country : ''}`;

      // Fetch weather (current + 7-day daily)
      const url   = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=7&timezone=auto`;
      const wxRes  = await fetch(url);
      const wxData = await wxRes.json();

      const temp     = Math.round(wxData.current.temperature_2m);
      const rain     = wxData.current.precipitation_probability || 0;
      const wind     = Math.round(wxData.current.wind_speed_10m);
      const wxCode   = wxData.current.weather_code;
      const desc     = window.getWeatherDescription ? getWeatherDescription(wxCode) : 'Fair';

      // Weekly averages
      const daily  = wxData.daily;
      const avgHi  = Math.round(daily.temperature_2m_max.reduce((a, b) => a + b, 0) / daily.temperature_2m_max.length);
      const avgLo  = Math.round(daily.temperature_2m_min.reduce((a, b) => a + b, 0) / daily.temperature_2m_min.length);
      const maxRain = Math.max(...daily.precipitation_probability_max);

      // Smart packing list
      const packing = [];
      if (temp < 5)        packing.push({ icon: '🧥', text: 'Heavy winter coat' });
      else if (temp < 15)  packing.push({ icon: '🧣', text: 'Warm jacket & scarf' });
      else if (temp < 25)  packing.push({ icon: '🫙', text: 'Light jacket / cardigan' });
      else                 packing.push({ icon: '👕', text: 'Light breathable clothing' });

      if (maxRain > 40)    packing.push({ icon: '☂️', text: 'Umbrella / rain jacket' });
      if (temp > 25)       packing.push({ icon: '🕶️', text: 'Sunglasses & sunscreen' });
      if (wind > 30)       packing.push({ icon: '🌬️', text: 'Windbreaker' });
      packing.push({ icon: '👟', text: 'Comfortable walking shoes' });
      packing.push({ icon: '📸', text: 'Camera' });
      packing.push({ icon: '💊', text: 'Travel medications' });

      // Condition badge color
      let badgeColor = '#22c55e';
      if (rain > 60 || wind > 40) badgeColor = '#ef4444';
      else if (rain > 30 || wind > 25) badgeColor = '#f59e0b';

      // 7-day mini bar
      const weekBars = daily.temperature_2m_max.map((hi, i) => {
        const lo  = daily.temperature_2m_min[i];
        const rn  = daily.precipitation_probability_max[i];
        const d   = new Date(daily.time[i]);
        const lbl = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
        return `
          <div class="trip-day">
            <span class="trip-day-lbl">${lbl}</span>
            <span class="trip-day-temp">${Math.round(hi)}° / ${Math.round(lo)}°</span>
            ${rn > 10 ? `<span class="trip-day-rain">💧${rn}%</span>` : ''}
          </div>`;
      }).join('');

      results.innerHTML = `
        <div class="trip-header">
          <div>
            <div class="trip-city">${name}</div>
            <div class="trip-current">
              <span class="trip-temp">${temp}°C</span>
              <span class="trip-badge" style="background:${badgeColor}20; color:${badgeColor}; border-color:${badgeColor}40;">${desc}</span>
            </div>
            <div class="trip-stats">💨 ${wind} km/h &nbsp;·&nbsp; 💧 ${rain}% rain &nbsp;·&nbsp; Weekly: ${avgHi}°↑ / ${avgLo}°↓</div>
          </div>
        </div>

        <div class="trip-week">${weekBars}</div>

        <div class="trip-packing-title">🎒 Recommended Packing</div>
        <ul class="trip-packing-list">
          ${packing.map(p => `<li><span>${p.icon}</span> ${p.text}</li>`).join('')}
        </ul>`;

    } catch (e) {
      console.error(e);
      results.innerHTML = `<p class="trip-error"><i class="fa-solid fa-triangle-exclamation"></i> Error fetching trip data. Please try again.</p>`;
    }
  }

  if (btnPlan) btnPlan.addEventListener('click', planTrip);

  if (inputDest) {
    inputDest.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') planTrip();
    });
  }
});

