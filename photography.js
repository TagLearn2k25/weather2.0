// ============================================================
// AERIS — Photography Module
// Golden hour, blue hour, twilight windows + shoot score
// ============================================================

window.updatePhotography = function () {
  const container = document.getElementById('photography-data');
  if (!container) return;

  const current = weatherState.current;
  const astro   = weatherState.astronomy;

  if (!astro.sunrise || !astro.sunset) {
    container.innerHTML = `
      <p style="opacity:0.6; font-style:italic;">
        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
        Astronomy data not available yet.
      </p>`;
    return;
  }

  const sunrise = new Date(astro.sunrise);
  const sunset  = new Date(astro.sunset);

  // ── Time windows ────────────────────────────────────────────
  const goldenMornStart = new Date(sunrise.getTime() - 20  * 60000); // 20 min before
  const goldenMornEnd   = new Date(sunrise.getTime() + 60  * 60000); // 1h after
  const blueMornStart   = new Date(sunrise.getTime() - 40  * 60000); // civil twilight
  const blueMornEnd     = new Date(sunrise.getTime() - 10  * 60000);

  const goldenEveStart  = new Date(sunset.getTime()  - 60  * 60000);
  const goldenEveEnd    = new Date(sunset.getTime()  + 20  * 60000);
  const blueEveStart    = new Date(sunset.getTime()  + 20  * 60000);
  const blueEveEnd      = new Date(sunset.getTime()  + 50  * 60000);

  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const now = new Date();

  // ── Determine current window status ─────────────────────────
  function windowStatus(start, end) {
    if (now >= start && now <= end) return { label: 'NOW', color: '#22c55e' };
    if (now < start) {
      const diffMin = Math.round((start - now) / 60000);
      if (diffMin < 60) return { label: `in ${diffMin}m`, color: '#f59e0b' };
    }
    return null;
  }

  const gMornStatus = windowStatus(goldenMornStart, goldenMornEnd);
  const bMornStatus = windowStatus(blueMornStart,   blueMornEnd);
  const gEveStatus  = windowStatus(goldenEveStart,  goldenEveEnd);
  const bEveStatus  = windowStatus(blueEveStart,    blueEveEnd);

  // ── Photography score ─────────────────────────────────────
  let score = 100;

  // Cloud cover: ideal 25–65%
  const cc = current.cloudCover;
  if (cc < 25) score -= (25 - cc) * 0.8;
  if (cc > 65) score -= (cc - 65) * 0.9;

  // Visibility
  if (current.visibility < 5000)  score -= 35;
  else if (current.visibility < 10000) score -= 12;

  // Rain probability
  if (current.precipitationProb > 60) score -= 40;
  else if (current.precipitationProb > 30) score -= 18;

  // Wind (shake)
  if (current.wind > 40) score -= 20;
  else if (current.wind > 25) score -= 8;

  // Bonus: golden / blue hour window
  const inGoldenHour = now >= goldenMornStart && now <= goldenMornEnd ||
                       now >= goldenEveStart  && now <= goldenEveEnd;
  const inBlueHour   = now >= blueMornStart   && now <= blueMornEnd   ||
                       now >= blueEveStart    && now <= blueEveEnd;
  if (inGoldenHour) score += 20;
  if (inBlueHour)   score += 12;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let suitability, badgeColor;
  if (score >= 80) { suitability = 'EXCELLENT'; badgeColor = '#22c55e'; }
  else if (score >= 60) { suitability = 'GOOD';      badgeColor = '#84cc16'; }
  else if (score >= 40) { suitability = 'MODERATE';  badgeColor = '#f59e0b'; }
  else                  { suitability = 'POOR';      badgeColor = '#ef4444'; }

  // ── Photography tip ──────────────────────────────────────
  const tip = photoTip(current, inGoldenHour, inBlueHour);

  // ── Render ────────────────────────────────────────────────
  function timeSlot(icon, iconColor, label, start, end, status) {
    const statusHtml = status
      ? `<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; background:${status.color}22; color:${status.color}; border:1px solid ${status.color}55;">${status.label}</span>`
      : '';
    return `
      <div class="photo-slot">
        <div class="photo-slot-icon" style="color:${iconColor}">${icon}</div>
        <div class="photo-slot-label">${label}</div>
        <div class="photo-slot-value">${fmt(start)}<br><span style="opacity:0.6;font-size:0.78rem;">to ${fmt(end)}</span></div>
        ${statusHtml}
      </div>`;
  }

  container.innerHTML = `
    <!-- Score ring -->
    <div class="photo-score-ring">
      <div class="photo-score-label">Shoot Score</div>
      <div class="photo-score-value" style="color:${badgeColor}">${score}</div>
      <div class="photo-score-badge" style="background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}44;">${suitability}</div>
    </div>

    <!-- Time windows grid -->
    <div class="photo-grid">
      ${timeSlot('🌅', '#f59e0b', 'Morning Golden Hour', goldenMornStart, goldenMornEnd, gMornStatus)}
      ${timeSlot('🔵', '#6366f1', 'Morning Blue Hour',   blueMornStart,   blueMornEnd,   bMornStatus)}
      ${timeSlot('🌇', '#f97316', 'Evening Golden Hour', goldenEveStart,  goldenEveEnd,  gEveStatus)}
      ${timeSlot('🌌', '#8b5cf6', 'Evening Blue Hour',   blueEveStart,    blueEveEnd,    bEveStatus)}
    </div>

    <!-- Conditions detail -->
    <div class="photo-details">
      <div class="photo-detail-row">
        <span><i class="fa-solid fa-sun" style="color:#f59e0b; margin-right:6px;"></i>Sunrise</span>
        <strong>${fmt(sunrise)}</strong>
      </div>
      <div class="photo-detail-row">
        <span><i class="fa-solid fa-moon" style="color:#6366f1; margin-right:6px;"></i>Sunset</span>
        <strong>${fmt(sunset)}</strong>
      </div>
      <div class="photo-detail-row">
        <span><i class="fa-solid fa-cloud" style="margin-right:6px;"></i>Cloud Cover</span>
        <strong>${cc}%</strong>
      </div>
      <div class="photo-detail-row">
        <span><i class="fa-solid fa-eye" style="margin-right:6px;"></i>Visibility</span>
        <strong>${current.visibility >= 1000
          ? (current.visibility / 1000).toFixed(1) + ' km'
          : current.visibility + ' m'}</strong>
      </div>
      <div class="photo-detail-row">
        <span><i class="fa-solid fa-droplet" style="color:#38bdf8; margin-right:6px;"></i>Rain Chance</span>
        <strong>${current.precipitationProb}%</strong>
      </div>
    </div>

    <!-- Pro tip -->
    <div class="photo-tip">
      <i class="fa-solid fa-lightbulb" style="color:#f59e0b; margin-right:6px;"></i>${tip}
    </div>
  `;
};

// ── Photography tips by condition ─────────────────────────────
function photoTip(current, inGolden, inBlue) {
  if (inGolden && current.precipitationProb < 30)
    return "Perfect golden hour conditions — grab your camera now! Long shadows and warm tones make for stunning shots.";
  if (inBlue)
    return "Blue hour magic! Use a tripod and long exposure for silky water, glowing city lights, or deep moody skies.";
  if (current.cloudCover >= 25 && current.cloudCover <= 65)
    return "Partly cloudy skies act as a natural softbox — ideal for portraits and landscapes without harsh shadows.";
  if (current.cloudCover > 65 && current.precipitationProb < 30)
    return "Heavy overcast creates beautifully diffused light — great for macro photography and avoiding blown highlights.";
  if (current.precipitationProb > 60)
    return "Rain can create dramatic reflections and moody atmospheres. Keep your gear dry with a weather seal or bag.";
  if (current.cloudCover < 15)
    return "Clear skies mean harsh midday shadows. Shoot during golden hour (±1h of sunrise/sunset) for the best light.";
  if (current.wind > 30)
    return "Strong winds — use a fast shutter speed (1/500s+) to freeze movement, or capture silky blur deliberately.";
  if (current.visibility < 5000)
    return "Low visibility creates atmospheric fog and haze — perfect for moody, ethereal landscape photography.";
  return "Decent conditions for photography. Head out during golden hour windows for the most dramatic natural light.";
}
