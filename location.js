// Show loading immediately
if (window.showLoading) showLoading();

document.addEventListener('DOMContentLoaded', () => {
  const btnLocation = document.getElementById('btn-location');
  const btnSearch   = document.getElementById('btn-search');
  const searchInput = document.getElementById('search-input');

  if (btnLocation) btnLocation.addEventListener('click', requestLocation);

  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      const q = searchInput.value.trim();
      if (q && window.searchCity) searchCity(q);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q && window.searchCity) searchCity(q);
      }
    });
  }

  // Try geolocation; fall back to London
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (window.loadWeather) {
          loadWeather(pos.coords.latitude, pos.coords.longitude);
        }
      },
      () => {
        // Permission denied or error — load default city (London)
        if (window.searchCity) searchCity('London');
      },
      { timeout: 4000, maximumAge: 300000, enableHighAccuracy: false }
    );
  } else {
    if (window.searchCity) searchCity('London');
  }
});

function requestLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.');
    return;
  }
  document.getElementById('location-name').textContent = 'Locating...';
  if (window.showLoading) showLoading();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (window.loadWeather) {
        loadWeather(position.coords.latitude, position.coords.longitude);
      }
    },
    (error) => {
      console.error('Location error:', error);
      if (window.hideLoading) hideLoading();
      alert('Unable to access your location. Please check your browser permissions.');
      document.getElementById('location-name').textContent =
        weatherState.location.name || 'Unknown';
    },
    { timeout: 6000, maximumAge: 60000, enableHighAccuracy: false }
  );
}

