// --- CONFIGURATION ---
const TILE_SIZE = 256;
const MAX_ZOOM = 9;

// Define Categories & Icons
const categories = [
    { id: 'bench', name: 'Bench & Transport', icon: '23.png' },
    { id: 'shortcuts', name: 'Shortcuts', icon: '50.png' },
    { id: 'upgrades', name: 'Upgrades', icon: '29.png' },
    { id: 'charms', name: 'Charms', icon: '44.png' },
    { id: 'bosses', name: 'Bosses', icon: '35.png' },
    { id: 'npcs', name: 'Npcs', icon: '10.png' },
    { id: 'grubs', name: 'Grubs', icon: '27.png' },
    { id: 'misc', name: 'Map Misc.', icon: '14.png' },
    { id: 'items', name: 'Items', icon: '45.png' },
    { id: 'geo', name: 'Geo & Soul Totems', icon: '4.png' }
];

// --- STATE MANAGEMENT ---
const layers = {};
const allMarkers = []; 
let currentIconSize = 32;
let isDevMode = false;

// --- 1. MAP SETUP ---
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: 0,
    maxZoom: MAX_ZOOM,
    zoomControl: false,
    attributionControl: false
});

const HollowKnightLayer = L.TileLayer.extend({
    getTileUrl: function(coords) {
        // Prevent scrolling up into negative Y
        if (coords.y < 0) return ""; 
        // Standard Z/Y/X as established
        return `my_tiles/${coords.z}/${coords.y}/${coords.x}.png`;
    }
});

new HollowKnightLayer('', {
    tileSize: TILE_SIZE,
    noWrap: true,
    bounds: [[-100000, -100000], [100000, 100000]],
    errorTileUrl: ''
}).addTo(map);

map.setView([-100, 100], 4);
L.control.zoom({ position: 'topright' }).addTo(map);

// --- 2. APP INITIALIZATION ---
function init() {
    const listContainer = document.getElementById('category-list');
    const devSelect = document.getElementById('dev-cat-select');

    categories.forEach(cat => {
        // Create Layer Group
        layers[cat.id] = L.layerGroup().addTo(map);

        // Build Sidebar Item
        const item = document.createElement('div');
        item.className = 'cat-item';
        item.innerHTML = `
            <input type="checkbox" checked onchange="toggleLayer('${cat.id}', this.checked)">
            <img src="icons/${cat.icon}" class="cat-icon">
            <span class="cat-name">${cat.name}</span>
        `;
        listContainer.appendChild(item);

        // Build Dev Dropdown
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.innerText = cat.name;
        devSelect.appendChild(opt);
    });

    // Load Pins from data.js
    if (typeof savedPins !== 'undefined') {
        savedPins.forEach(p => createMarker(p.lat, p.lng, p.cat, p.icon, p.title));
    }
}

// --- 3. MARKER LOGIC ---
function createMarker(lat, lng, catId, iconId, title) {
    const hkIcon = L.icon({
        iconUrl: `icons/${iconId}.png`,
        iconSize: [currentIconSize, currentIconSize],
        popupAnchor: [0, -currentIconSize/2],
        className: 'hk-marker'
    });

    const marker = L.marker([lat, lng], {icon: hkIcon, title: title});
    marker.bindPopup(`<b>${title}</b><br><small>${categories.find(c=>c.id===catId).name}</small>`);
    
    if(layers[catId]) {
        layers[catId].addLayer(marker);
    }

    allMarkers.push({ marker: marker, catId: catId });
}

// --- 4. UI ACTIONS ---

// Toggle Categories
window.toggleLayer = function(id, show) {
    if(show) map.addLayer(layers[id]);
    else map.removeLayer(layers[id]);
    filterSearch(); 
}

// Toggle All
window.toggleAll = function(show) {
    const checkboxes = document.querySelectorAll('.cat-item input');
    checkboxes.forEach(cb => {
        cb.checked = show;
        // Find category ID based on the name span next to image
        const catName = cb.parentElement.querySelector('.cat-name').innerText;
        const catId = categories.find(c => c.name === catName).id;
        toggleLayer(catId, show);
    });
}

// Icon Size Slider
const slider = document.getElementById('icon-slider');
slider.oninput = function() {
    currentIconSize = parseInt(this.value);
    document.getElementById('size-val').innerText = currentIconSize + 'px';
    
    allMarkers.forEach(item => {
        const icon = item.marker.options.icon;
        icon.options.iconSize = [currentIconSize, currentIconSize];
        icon.options.popupAnchor = [0, -currentIconSize/2];
        item.marker.setIcon(icon);
    });
};

// Search
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', filterSearch);

function filterSearch() {
    const text = searchInput.value.toLowerCase();
    
    allMarkers.forEach(item => {
        const layerGroup = layers[item.catId];
        const matchesSearch = item.marker.options.title.toLowerCase().includes(text);
        
        if (map.hasLayer(layerGroup)) {
            if (matchesSearch) {
                if (!layerGroup.hasLayer(item.marker)) layerGroup.addLayer(item.marker);
            } else {
                layerGroup.removeLayer(item.marker);
            }
        }
    });
}

// --- 5. DEV MODE ---
window.toggleDevMode = function() {
    isDevMode = !isDevMode;
    const btn = document.getElementById('dev-btn');
    const panel = document.getElementById('dev-panel');
    
    if(isDevMode) {
        btn.classList.add('on');
        btn.innerText = "Dev Mode: ACTIVE";
        panel.classList.add('active');
        map.getContainer().style.cursor = "crosshair";
    } else {
        btn.classList.remove('on');
        btn.innerText = "Enable Dev Mode";
        panel.classList.remove('active');
        map.getContainer().style.cursor = "";
    }
}

map.on('click', function(e) {
    if (!isDevMode) return;

    const catId = document.getElementById('dev-cat-select').value;
    const lat = e.latlng.lat.toFixed(0);
    const lng = e.latlng.lng.toFixed(0);

    const title = prompt("Enter Pin Title:");
    if(!title) return;

    const iconId = prompt("Enter Icon Number (file name without .png):", "1");
    if(!iconId) return;

    createMarker(lat, lng, catId, iconId, title);

    const json = `{ "lat": ${lat}, "lng": ${lng}, "cat": "${catId}", "icon": "${iconId}", "title": "${title}" },`;
    console.log(json);
});

// Launch
init();