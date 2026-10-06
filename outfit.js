// ============================================================
// AERIS — Outfit Recommendation Module
// ============================================================

window.updateOutfit = function () {
  const current = weatherState.current;
  const container = document.getElementById('outfit-recommendation');
  if (!container || !current) return;

  const temp = current.feelsLike || current.temperature;
  const rain = current.precipitationProb;
  const uv   = current.uv;
  const wind = current.wind;

  const items = [];

  // ── Core clothing ────────────────────────────────────────
  if (temp >= 34) {
    items.push({ icon: '👕', text: 'Light breathable top' });
    items.push({ icon: '🩳', text: 'Shorts' });
  } else if (temp >= 28) {
    items.push({ icon: '👕', text: 'T-shirt' });
    items.push({ icon: '👖', text: 'Light pants' });
  } else if (temp >= 20) {
    items.push({ icon: '👔', text: 'Full-sleeve shirt' });
    items.push({ icon: '👖', text: 'Pants' });
  } else if (temp >= 12) {
    items.push({ icon: '🧥', text: 'Light jacket' });
    items.push({ icon: '👖', text: 'Warm pants' });
  } else if (temp >= 4) {
    items.push({ icon: '🧥', text: 'Heavy coat' });
    items.push({ icon: '🧣', text: 'Scarf' });
  } else {
    items.push({ icon: '🧥', text: 'Winter coat + layers' });
    items.push({ icon: '🧤', text: 'Gloves & scarf' });
    items.push({ icon: '🎿', text: 'Thermal underwear' });
  }

  // ── Footwear ─────────────────────────────────────────────
  if (rain >= 50) {
    items.push({ icon: '👢', text: 'Waterproof boots' });
  } else if (temp >= 24) {
    items.push({ icon: '👟', text: 'Sneakers / sandals' });
  } else {
    items.push({ icon: '👟', text: 'Closed shoes' });
  }

  // ── Rain accessories ─────────────────────────────────────
  if (rain >= 60) {
    items.push({ icon: '☂️', text: 'Umbrella (must)' });
    items.push({ icon: '🧴', text: 'Waterproof jacket' });
  } else if (rain >= 25) {
    items.push({ icon: '🌂', text: 'Light rain jacket' });
  }

  // ── UV accessories ───────────────────────────────────────
  if (uv >= 7) {
    items.push({ icon: '🕶️', text: 'Sunglasses' });
    items.push({ icon: '🧴', text: 'SPF 50+ sunscreen' });
    items.push({ icon: '🧢', text: 'Cap / hat' });
  } else if (uv >= 3) {
    items.push({ icon: '🕶️', text: 'Sunglasses' });
    items.push({ icon: '🧴', text: 'Sunscreen' });
  }

  // ── Wind accessories ─────────────────────────────────────
  if (wind >= 35) {
    items.push({ icon: '🌬️', text: 'Windbreaker' });
  }

  // ── Render pills ─────────────────────────────────────────
  container.innerHTML = items.map(item =>
    `<span class="outfit-tag">${item.icon} ${item.text}</span>`
  ).join('');
};
