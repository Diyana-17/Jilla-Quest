let map, districts = [], geojsonLayer, targetDistrictId = null, targetDistrictName = '', guessHistory = [], lastFeedback = null;
let districtLayerMap = {};
let gameOver = false;
let guessedDistrictColors = {};

async function fetchDistricts() {
    const res = await fetch('/api/districts');
    const data = await res.json();
    districts = data.districts;
}

async function fetchMapData() {
    const res = await fetch('/api/map-data');
    const data = await res.json();
    return data.geojson;
}

async function startNewGame() {
    const res = await fetch('/api/new-game');
    const data = await res.json();
    targetDistrictId = data.target_district_id;
    targetDistrictName = data.target_district_name;
    guessHistory = [];
    guessedDistrictColors = {};
    document.getElementById('guess-history').innerHTML = '';
    document.getElementById('reveal-btn').disabled = false;
    document.getElementById('reveal-btn').textContent = 'Reveal Answer';
    document.getElementById('last-feedback').innerHTML = '';
    gameOver = false;
    colorAllGuessedDistricts();
    updateGameStats();
}

function setupAutocomplete() {
    const input = document.getElementById('district-input');
    const list = document.getElementById('autocomplete-list');
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        list.innerHTML = '';
        if (!val) return;
        const matches = districts.filter(d => d.name.toLowerCase().includes(val));
        matches.slice(0, 8).forEach(d => {
            const item = document.createElement('div');
            item.textContent = d.name;
            item.onclick = () => {
                input.value = d.name;
                list.innerHTML = '';
            };
            list.appendChild(item);
        });
    });
    document.addEventListener('click', (e) => {
        if (e.target !== input) list.innerHTML = '';
    });
}

function colorAllGuessedDistricts() {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties && layer.feature.properties.DISTRICT) {
            const dname = layer.feature.properties.DISTRICT.toLowerCase();
            if (guessedDistrictColors[dname]) {
                let fillColor = '#787c7e';
                if (guessedDistrictColors[dname] === 'green') fillColor = '#6aaa64';
                else if (guessedDistrictColors[dname] === 'yellow') fillColor = '#c9b458';
                layer.setStyle({ fillColor: fillColor, fillOpacity: 0.7, color: '#333', weight: 2 });
            } else {
                layer.setStyle({ fillColor: '#1976d2', fillOpacity: 0.2, color: '#1976d2', weight: 1 });
            }
        }
    });
}

function zoomToDistrict(districtName) {
    if (!geojsonLayer || !map) return;
    const zoomEnabled = document.getElementById('zoom-toggle')?.checked;
    if (!zoomEnabled) return;
    geojsonLayer.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties && layer.feature.properties.DISTRICT && layer.feature.properties.DISTRICT.toLowerCase() === districtName.toLowerCase()) {
            const bounds = layer.getBounds();
            map.flyToBounds(bounds, { duration: 1.2, padding: [30, 30] });
        }
    });
}

async function handleGuess() {
    if (gameOver) return;
    const input = document.getElementById('district-input');
    const guessName = input.value.trim();
    if (!guessName) return;
    const district = districts.find(d => d.name.toLowerCase() === guessName.toLowerCase());
    if (!district) {
        alert('District not found!');
        return;
    }
    const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: district.name })
    });
    const data = await res.json();
    displayFeedback(district, data.feedback);
    guessHistory.push({ name: district.name, feedback: data.feedback });
    lastFeedback = data.feedback;
    guessedDistrictColors[district.name.toLowerCase()] = data.feedback.feedback_color;
    updateGuessHistory();
    updateGameStats();
    updateLastFeedback();
    colorAllGuessedDistricts();
    zoomToDistrict(district.name);
    if (data.feedback && data.feedback.is_correct) {
        highlightCorrectDistrictOnMap(district.name);
        showResultMessage(true, district.name);
        setTimeout(() => zoomToDistrict(district.name), 500);
        gameOver = true;
    }
    input.value = '';
}

function displayFeedback(district, feedback) {
    // This function is now handled in updateGuessHistory for color
}

function updateGuessHistory() {
    const container = document.getElementById('guess-history');
    container.innerHTML = '';
    guessHistory.forEach((g, idx) => {
        const div = document.createElement('div');
        let colorClass = 'feedback-different';
        if (g.feedback.feedback_color === 'green') colorClass = 'feedback-correct';
        else if (g.feedback.feedback_color === 'yellow') colorClass = 'feedback-same-province';
        div.className = 'guess-feedback ' + colorClass;
        div.title = `Click for details`;
        div.textContent = g.name;
        div.style.cursor = 'pointer';
        div.onclick = () => showGuessModal(idx);
        container.appendChild(div);
    });
}

function showGuessModal(idx) {
    const guess = guessHistory[idx];
    const hintEnabled = document.getElementById('hint-toggle')?.checked;
    let html = `<b>District:</b> ${guess.name}<br>`;
    html += `<b>Distance:</b> ${guess.feedback.distance_km !== null && guess.feedback.distance_km !== undefined ? guess.feedback.distance_km.toFixed(1) + ' km' : '?'}<br>`;
    if (hintEnabled) {
        html += `<b>Direction:</b> ${guess.feedback.direction || '?'}<br>`;
    }
    html += `<b>Province:</b> ${guess.feedback.same_province ? 'Same' : 'Different'}<br>`;
    html += `<b>Color:</b> ${guess.feedback.feedback_color}`;
    document.getElementById('guess-modal-body').innerHTML = html;
    document.getElementById('guess-modal').classList.remove('hidden');
}

document.getElementById('close-guess-modal').onclick = () => {
    document.getElementById('guess-modal').classList.add('hidden');
};

function updateLastFeedback() {
    const el = document.getElementById('last-feedback');
    if (!lastFeedback) {
        el.textContent = '';
        return;
    }
    const hintEnabled = document.getElementById('hint-toggle')?.checked;
    el.innerHTML = `<b>Last Guess:</b> ${lastFeedback.guessed_district_name || ''} <br>
        <b>Distance:</b> ${lastFeedback.distance_km !== null && lastFeedback.distance_km !== undefined ? lastFeedback.distance_km.toFixed(1) + ' km' : '?'}<br>
        ${hintEnabled ? `<b>Direction:</b> ${lastFeedback.direction || '?'}` : ''}
        <br><b>Province:</b> ${lastFeedback.same_province ? 'Same' : 'Different'}`;
}

document.getElementById('hint-toggle').onchange = () => {
    updateLastFeedback();
};

function colorDistrictOnMap(districtName, color) {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties && layer.feature.properties.DISTRICT && layer.feature.properties.DISTRICT.toLowerCase() === districtName.toLowerCase()) {
            let fillColor = '#787c7e'; // default gray
            if (color === 'green') fillColor = '#6aaa64';
            else if (color === 'yellow') fillColor = '#c9b458';
            layer.setStyle({ fillColor: fillColor, fillOpacity: 0.7, color: '#333', weight: 2 });
            districtLayerMap[districtName.toLowerCase()] = layer;
        }
    });
}

function highlightCorrectDistrictOnMap(districtName) {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties && layer.feature.properties.DISTRICT && layer.feature.properties.DISTRICT.toLowerCase() === districtName.toLowerCase()) {
            layer.setStyle({ fillColor: '#6aaa64', fillOpacity: 0.8, color: '#388e3c', weight: 3 });
            layer.bringToFront();
            let count = 0;
            const anim = setInterval(() => {
                layer.setStyle({ fillOpacity: count % 2 === 0 ? 0.8 : 0.4 });
                count++;
                if (count > 6) {
                    clearInterval(anim);
                    layer.setStyle({ fillOpacity: 0.8 });
                }
            }, 150);
        }
    });
}

function showResultMessage(isWin, districtName) {
    const el = document.getElementById('last-feedback');
    el.innerHTML = `<div class="result-message ${isWin ? 'win' : 'lose'}">🎉 Correct! The answer was <b>${districtName}</b>.</div>`;
}

async function updateGameStats() {
    const res = await fetch('/api/game-stats');
    const data = await res.json();
    document.getElementById('game-stats').textContent = `Attempts: ${data.stats.attempts}`;
}

async function initializeMap() {
    map = L.map('map').setView([28.3949, 84.124], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    const geojson = await fetchMapData();
    geojsonLayer = L.geoJSON(geojson, {
        style: { color: '#1976d2', weight: 1, fillOpacity: 0.2 },
        onEachFeature: function (feature, layer) {
            const name = feature.properties.DISTRICT;
            districtLayerMap[name.toLowerCase()] = layer;
            layer.on('mouseover', function () {
                this.setStyle({ fillOpacity: 0.5 });
            });
            layer.on('mouseout', function () {
                this.setStyle({ fillOpacity: 0.2 });
            });
            // Removed click-to-guess logic to prevent triggering guesses or alerts when clicking the map
        }
    }).addTo(map);
}

document.getElementById('guess-btn').onclick = handleGuess;
document.getElementById('show-instructions').onclick = () => {
    document.getElementById('modal').classList.remove('hidden');
};
document.getElementById('close-modal').onclick = () => {
    document.getElementById('modal').classList.add('hidden');
};
document.getElementById('reveal-btn').onclick = () => {
    document.getElementById('reveal-btn').textContent = `Answer: ${targetDistrictName}`;
    document.getElementById('reveal-btn').disabled = true;
};
document.getElementById('reload-btn').onclick = startNewGame;
document.getElementById('zoom-toggle').onchange = function() {
    if (!this.checked && window.map) {
        // Reset to default Nepal view
        map.setView([28.3949, 84.124], 7, {animate: true});
    }
};

window.onload = async () => {
    await fetchDistricts();
    setupAutocomplete();
    await initializeMap();
    await startNewGame();
};
