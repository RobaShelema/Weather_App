// weather-app.js
// Weather Application using OpenWeatherMap API

// API Configuration
const API_KEY = '509aec2cec356bb82ac9d3b3b5dcdee5'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loadingEl = document.getElementById('loading');
const weatherCard = document.getElementById('weather-card');
const defaultMessage = document.getElementById('default-message');
const weatherData = document.getElementById('weather-data');
const errorMessage = document.getElementById('error-message');

// Weather Data Elements
const cityNameEl = document.getElementById('city-name');
const countryEl = document.getElementById('country');
const dateTimeEl = document.getElementById('date-time');
const temperatureEl = document.getElementById('temperature');
const weatherDescriptionEl = document.getElementById('weather-description');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const weatherIconEl = document.getElementById('weather-icon');

// Weather Icon Mapping
const weatherIcons = {
    '01d': 'fas fa-sun', // clear sky day
    '01n': 'fas fa-moon', // clear sky night
    '02d': 'fas fa-cloud-sun', // few clouds day
    '02n': 'fas fa-cloud-moon', // few clouds night
    '03d': 'fas fa-cloud', // scattered clouds
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud', // broken clouds
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain', // shower rain
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-sun-rain', // rain day
    '10n': 'fas fa-cloud-moon-rain', // rain night
    '11d': 'fas fa-bolt', // thunderstorm
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake', // snow
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog', // mist
    '50n': 'fas fa-smog'
};

// Weather Condition Classes with gradient backgrounds
const weatherConditions = {
    'Clear': { 
        class: 'sunny',
        gradient: 'linear-gradient(135deg, rgba(255, 200, 50, 0.15), rgba(255, 150, 50, 0.15))'
    },
    'Clouds': { 
        class: 'cloudy',
        gradient: 'linear-gradient(135deg, rgba(150, 150, 150, 0.15), rgba(100, 100, 150, 0.15))'
    },
    'Rain': { 
        class: 'rainy',
        gradient: 'linear-gradient(135deg, rgba(50, 100, 200, 0.15), rgba(25, 50, 100, 0.15))'
    },
    'Drizzle': { 
        class: 'rainy',
        gradient: 'linear-gradient(135deg, rgba(80, 120, 200, 0.15), rgba(40, 80, 150, 0.15))'
    },
    'Thunderstorm': { 
        class: 'stormy',
        gradient: 'linear-gradient(135deg, rgba(40, 40, 100, 0.15), rgba(20, 20, 60, 0.15))'
    },
    'Snow': { 
        class: 'snowy',
        gradient: 'linear-gradient(135deg, rgba(200, 220, 255, 0.15), rgba(150, 180, 220, 0.15))'
    },
    'Mist': { 
        class: 'foggy',
        gradient: 'linear-gradient(135deg, rgba(200, 200, 200, 0.15), rgba(150, 150, 150, 0.15))'
    },
    'Smoke': { 
        class: 'foggy',
        gradient: 'linear-gradient(135deg, rgba(150, 150, 150, 0.15), rgba(100, 100, 100, 0.15))'
    },
    'Haze': { 
        class: 'foggy',
        gradient: 'linear-gradient(135deg, rgba(200, 200, 180, 0.15), rgba(150, 150, 130, 0.15))'
    },
    'Fog': { 
        class: 'foggy',
        gradient: 'linear-gradient(135deg, rgba(180, 180, 200, 0.15), rgba(130, 130, 150, 0.15))'
    }
};

// Application state
let currentWeatherData = null;
let lastSearchedCity = '';

// Initialize the application
function initApp() {
    // Add event listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', handleKeyPress);
    cityInput.addEventListener('input', handleInputChange);
    
    // Add click handler for recent searches
    setupRecentSearches();
    
    // Try to get user's location on load
    getLocationWeather();
    
    // Check for saved API key
    checkApiKey();
    
    // Set focus to input field
    cityInput.focus();
}

// Handle search button click
function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        cityInput.focus();
        return;
    }
    
    if (city === lastSearchedCity && currentWeatherData) {
        // Already showing this city's data
        return;
    }
    
    fetchWeatherData(city);
    saveRecentSearch(city);
}

// Handle Enter key press in input field
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
}

// Handle input change for auto-suggest
function handleInputChange() {
    hideError();
}

// Fetch weather data from API
async function fetchWeatherData(city) {
    try {
        showLoading();
        hideError();
        
        // Clear input after search
        lastSearchedCity = city;
        
        const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the city name and try again.');
            } else if (response.status === 401) {
                throw new Error('Invalid API key. Please check your API configuration.');
            } else if (response.status === 429) {
                throw new Error('Too many requests. Please wait a minute before trying again.');
            } else {
                throw new Error(`Unable to fetch weather data. Status: ${response.status}`);
            }
        }
        
        const data = await response.json();
        currentWeatherData = data;
        displayWeatherData(data);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message);
        // Reset last searched city on error
        lastSearchedCity = '';
    } finally {
        hideLoading();
    }
}

// Get weather by user's geolocation
function getLocationWeather() {
    if (navigator.geolocation) {
        // Show location loading state
        const defaultMsg = document.querySelector('.default-message p');
        if (defaultMsg) {
            defaultMsg.textContent = 'Getting your location...';
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            error => {
                console.log('Geolocation permission denied or not available:', error);
                // Use a default city if geolocation fails
                fetchWeatherData('London');
            },
            {
                timeout: 10000, // 10 seconds timeout
                maximumAge: 600000, // Accept cached position up to 10 minutes old
                enableHighAccuracy: true
            }
        );
    } else {
        console.log('Geolocation not supported by this browser.');
        fetchWeatherData('London');
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading();
        hideError();
        
        const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data for your location');
        }
        
        const data = await response.json();
        currentWeatherData = data;
        displayWeatherData(data);
        
    } catch (error) {
        console.error('Error fetching weather by coordinates:', error);
        // Fallback to London
        fetchWeatherData('London');
    } finally {
        hideLoading();
    }
}

// Display weather data in the UI
function displayWeatherData(data) {
    // Update location information
    cityNameEl.textContent = data.name;
    countryEl.textContent = data.sys.country;
    
    // Update city input with current city
    cityInput.value = data.name;
    
    // Update date and time
    updateDateTime(data.timezone);
    
    // Update temperature and weather description
    const temp = Math.round(data.main.temp);
    temperatureEl.innerHTML = `${temp}<span>°C</span>`;
    
    const feelsLike = Math.round(data.main.feels_like);
    feelsLikeEl.textContent = `${feelsLike}°C`;
    
    const description = data.weather[0].description;
    weatherDescriptionEl.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    
    // Update weather details
    humidityEl.textContent = `${data.main.humidity}%`;
    windSpeedEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
    pressureEl.textContent = `${data.main.pressure} hPa`;
    
    // Convert visibility from meters to kilometers
    const visibilityKm = data.visibility >= 10000 ? '10+' : (data.visibility / 1000).toFixed(1);
    visibilityEl.textContent = `${visibilityKm} km`;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    updateWeatherIcon(iconCode);
    
    // Update weather card styling based on condition
    const weatherCondition = data.weather[0].main;
    updateWeatherCardStyle(weatherCondition, iconCode.includes('d'));
    
    // Show weather data and hide default message
    defaultMessage.style.display = 'none';
    weatherData.style.display = 'block';
    
    // Update page title
    document.title = `${data.name} Weather - WeatherCast`;
    
    // Add animation effect
    animateWeatherDisplay();
}

// Update date and time based on timezone
function updateDateTime(timezoneOffset) {
    const now = new Date();
    
    // Calculate time in the target timezone (offset is in seconds)
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (timezoneOffset * 1000));
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    const dateStr = targetTime.toLocaleDateString('en-US', dateOptions);
    const timeStr = targetTime.toLocaleTimeString('en-US', timeOptions);
    
    dateTimeEl.innerHTML = `${dateStr}<br>${timeStr}`;
    
    // Update time every minute
    setTimeout(() => updateDateTime(timezoneOffset), 60000);
}

// Update weather icon based on icon code
function updateWeatherIcon(iconCode) {
    const iconClass = weatherIcons[iconCode] || 'fas fa-cloud';
    
    // Clear previous icon
    weatherIconEl.innerHTML = '';
    
    // Create new icon element
    const iconElement = document.createElement('i');
    const iconClasses = iconClass.split(' ');
    iconClasses.forEach(cls => iconElement.classList.add(cls));
    
    // Add animation class
    iconElement.classList.add('weather-icon-animate');
    
    weatherIconEl.appendChild(iconElement);
}

// Update weather card styling
function updateWeatherCardStyle(weatherCondition, isDaytime) {
    const condition = weatherConditions[weatherCondition] || weatherConditions['Clouds'];
    
    // Remove all weather condition classes
    Object.values(weatherConditions).forEach(cond => {
        weatherCard.classList.remove(cond.class);
    });
    
    // Add the appropriate class
    weatherCard.classList.add(condition.class);
    
    // Update background gradient
    let gradient = condition.gradient;
    
    // Adjust gradient for day/night
    if (!isDaytime) {
        gradient = gradient.replace('135deg', '315deg')
                          .replace('rgba(255, 200, 50', 'rgba(50, 50, 150')
                          .replace('rgba(255, 150, 50', 'rgba(25, 25, 100');
    }
    
    weatherCard.style.background = gradient;
}

// Show loading state
function showLoading() {
    loadingEl.style.display = 'block';
    weatherCard.style.opacity = '0.5';
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
}

// Hide loading state
function hideLoading() {
    loadingEl.style.display = 'none';
    weatherCard.style.opacity = '1';
    searchBtn.disabled = false;
    searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
}

// Show error message
function showError(message) {
    errorMessage.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Unable to Load Weather Data</h3>
            <p>${message}</p>
            ${API_KEY === 'YOUR_API_KEY_HERE' ? 
                '<p class="api-key-warning"><i class="fas fa-key"></i> Remember to add your OpenWeatherMap API key</p>' : 
                ''}
            <button class="retry-btn" onclick="handleSearch()">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    errorMessage.style.display = 'block';
    
    // Auto-hide after 8 seconds
    setTimeout(hideError, 8000);
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Check if API key is configured
function checkApiKey() {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('API key not configured. Please add your OpenWeatherMap API key.');
        // Show a subtle warning in the footer
        const footer = document.querySelector('.footer');
        if (footer) {
            const warning = document.createElement('p');
            warning.innerHTML = '<i class="fas fa-exclamation-circle"></i> API key not configured';
            warning.style.color = '#ffcc00';
            warning.style.marginTop = '5px';
            warning.style.fontSize = '0.8rem';
            footer.appendChild(warning);
        }
    }
}

// Save recent search to localStorage
function saveRecentSearch(city) {
    try {
        let recentSearches = JSON.parse(localStorage.getItem('weatherRecentSearches')) || [];
        
        // Remove if already exists
        recentSearches = recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
        
        // Add to beginning
        recentSearches.unshift(city);
        
        // Keep only last 5 searches
        recentSearches = recentSearches.slice(0, 5);
        
        localStorage.setItem('weatherRecentSearches', JSON.stringify(recentSearches));
        updateRecentSearchesUI(recentSearches);
    } catch (error) {
        console.error('Error saving recent search:', error);
    }
}

// Setup recent searches UI
function setupRecentSearches() {
    try {
        const recentSearches = JSON.parse(localStorage.getItem('weatherRecentSearches')) || [];
        updateRecentSearchesUI(recentSearches);
    } catch (error) {
        console.error('Error loading recent searches:', error);
    }
}

// Update recent searches UI
function updateRecentSearchesUI(searches) {
    // Create or update recent searches section
    let recentSection = document.querySelector('.recent-searches');
    
    if (!recentSection && searches.length > 0) {
        recentSection = document.createElement('div');
        recentSection.className = 'recent-searches';
        recentSection.innerHTML = '<h4><i class="fas fa-history"></i> Recent Searches</h4><div class="recent-tags"></div>';
        
        const searchContainer = document.querySelector('.search-container');
        searchContainer.parentNode.insertBefore(recentSection, searchContainer.nextSibling);
    }
    
    if (recentSection && searches.length > 0) {
        const tagsContainer = recentSection.querySelector('.recent-tags');
        tagsContainer.innerHTML = '';
        
        searches.forEach(city => {
            const tag = document.createElement('span');
            tag.className = 'recent-tag';
            tag.textContent = city;
            tag.title = `Search for ${city}`;
            tag.addEventListener('click', () => {
                cityInput.value = city;
                fetchWeatherData(city);
            });
            tagsContainer.appendChild(tag);
        });
    } else if (recentSection && searches.length === 0) {
        recentSection.remove();
    }
}

// Animate weather display
function animateWeatherDisplay() {
    const elements = document.querySelectorAll('.weather-data > *');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Format temperature (convert Kelvin to Celsius) - backup function
function kelvinToCelsius(kelvin) {
    return Math.round(kelvin - 273.15);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);