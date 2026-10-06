window.updateRecommendations = function() {
  const current = weatherState.current;
  const list = document.getElementById('smart-recommendations');
  if (!list) return;
  
  list.innerHTML = '';
  const recs = [];
  
  if (current.precipitationProb > 60) {
    recs.push({ icon: 'fa-umbrella', text: "High rain probability. Carry an umbrella." });
  } else if (current.precipitationProb > 20) {
    recs.push({ icon: 'fa-cloud-rain', text: "Slight chance of rain. Stay alert." });
  }
  
  if (current.uv >= 7) {
    recs.push({ icon: 'fa-sun', text: "High UV Index. Seek shade and use sun protection." });
  }
  
  if (current.temperature >= 30 && current.humidity > 60) {
    recs.push({ icon: 'fa-droplet', text: "High heat and humidity. Stay hydrated." });
  }
  
  if (current.wind > 30) {
    recs.push({ icon: 'fa-wind', text: "Strong winds. Outdoor cycling may be uncomfortable." });
  }
  
  // Find a good window today if possible
  const goodHour = weatherState.hourly.find(h => h.precipProb < 20 && h.temperature > 15 && h.temperature < 30);
  if (goodHour) {
    const d = new Date(goodHour.time);
    const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    recs.push({ icon: 'fa-clock', text: `Optimal outdoor time around ${timeStr}.` });
  }
  
  if (recs.length === 0) {
    recs.push({ icon: 'fa-thumbs-up', text: "Conditions are generally comfortable." });
  }
  
  recs.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<span><i class="fa-solid ${r.icon}" style="margin-right:8px; opacity:0.8;"></i> ${r.text}</span>`;
    list.appendChild(li);
  });
};
