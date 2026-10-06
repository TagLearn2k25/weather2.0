// ============================================================
// AERIS — Activity Scoring Module
// ============================================================

const activityProfiles = [
  { key: 'running',    label: 'Running',        icon: 'fa-person-running',    maxTemp: 32, minTemp: 0,   maxWind: 28, maxRain: 20 },
  { key: 'cycling',    label: 'Cycling',         icon: 'fa-bicycle',           maxTemp: 35, minTemp: 5,   maxWind: 22, maxRain: 10 },
  { key: 'hiking',     label: 'Hiking',          icon: 'fa-mountain',          maxTemp: 30, minTemp: -2,  maxWind: 35, maxRain: 30 },
  { key: 'swimming',   label: 'Open-Air Swim',   icon: 'fa-person-swimming',   maxTemp: 50, minTemp: 18,  maxWind: 20, maxRain: 15 },
  { key: 'picnic',     label: 'Picnic',          icon: 'fa-leaf',              maxTemp: 32, minTemp: 15,  maxWind: 18, maxRain: 10 },
  { key: 'cricket',    label: 'Cricket',         icon: 'fa-baseball',          maxTemp: 38, minTemp: 15,  maxWind: 20, maxRain: 5  },
  { key: 'photography',label: 'Photography',     icon: 'fa-camera',            maxTemp: 40, minTemp: -5,  maxWind: 25, maxRain: 30 },
  { key: 'laundry',    label: 'Dry Laundry',     icon: 'fa-shirt',             maxTemp: 50, minTemp: -10, maxWind: 40, maxRain: 5  },
];

window.updateActivities = function () {
  const current = weatherState.current;
  const list = document.getElementById('activity-list');
  if (!list || !current) return;

  list.innerHTML = '';

  activityProfiles.forEach(profile => {
    let score = 100;

    // Temperature penalty
    if (current.temperature > profile.maxTemp) score -= (current.temperature - profile.maxTemp) * 5;
    if (current.temperature < profile.minTemp) score -= (profile.minTemp - current.temperature) * 5;

    // Wind penalty
    if (current.wind > profile.maxWind) score -= (current.wind - profile.maxWind) * 3;

    // Rain penalty
    if (current.precipitationProb > profile.maxRain) {
      score -= (current.precipitationProb - profile.maxRain) * 1.5;
    }

    // UV penalty for prolonged outdoor activities
    if (['running','cycling','hiking','swimming','picnic','cricket'].includes(profile.key)) {
      if (current.uv > 8) score -= 15;
      else if (current.uv > 6) score -= 7;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let rating, color;
    if (score >= 88)     { rating = 'EXCELLENT'; color = '#22c55e'; }
    else if (score >= 70){ rating = 'GOOD';      color = '#84cc16'; }
    else if (score >= 45){ rating = 'MODERATE';  color = '#f59e0b'; }
    else if (score >= 20){ rating = 'POOR';      color = '#f97316'; }
    else                 { rating = 'AVOID';     color = '#ef4444'; }

    const li = document.createElement('li');
    li.innerHTML = `
      <span style="display:flex; align-items:center; gap:9px;">
        <i class="fa-solid ${profile.icon}" style="color:${color}; width:16px; text-align:center;"></i>
        <span style="text-transform:capitalize;">${profile.label}</span>
      </span>
      <span style="display:flex; flex-direction:column; align-items:flex-end; gap:3px;">
        <span style="font-weight:700; color:${color}; font-size:0.85rem;">${score}% · ${rating}</span>
        <div class="activity-score-bar">
          <div class="activity-score-fill" style="width:${score}%; background:${color};"></div>
        </div>
      </span>
    `;
    list.appendChild(li);
  });
};
