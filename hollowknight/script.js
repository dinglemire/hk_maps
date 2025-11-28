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
        if (coords.y < 0) return ""; 
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

// --- 3. MARKER LOGIC (FIXED ANCHOR) ---
function createMarker(lat, lng, catId, iconId, title) {
    // Calculate center anchor
    const anchorPos = currentIconSize / 2;

    const hkIcon = L.icon({
        iconUrl: `icons/${iconId}.png`,
        iconSize: [currentIconSize, currentIconSize],
        
        // CRITICAL FIX: This centers the icon on the click coordinates
        iconAnchor: [anchorPos, anchorPos], 
        
        popupAnchor: [0, -anchorPos],
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

window.toggleLayer = function(id, show) {
    if(show) map.addLayer(layers[id]);
    else map.removeLayer(layers[id]);
    filterSearch(); 
}

window.toggleAll = function(show) {
    const checkboxes = document.querySelectorAll('.cat-item input');
    checkboxes.forEach(cb => {
        cb.checked = show;
        const catName = cb.parentElement.querySelector('.cat-name').innerText;
        const catId = categories.find(c => c.name === catName).id;
        toggleLayer(catId, show);
    });
}

// Slider: Updates size AND Anchor
const slider = document.getElementById('icon-slider');
slider.oninput = function() {
    currentIconSize = parseInt(this.value);
    const anchorPos = currentIconSize / 2;
    document.getElementById('size-val').innerText = currentIconSize + 'px';
    
    allMarkers.forEach(item => {
        const icon = item.marker.options.icon;
        
        // Update size
        icon.options.iconSize = [currentIconSize, currentIconSize];
        
        // Update anchor to keep it centered
        icon.options.iconAnchor = [anchorPos, anchorPos];
        icon.options.popupAnchor = [0, -anchorPos];
        
        item.marker.setIcon(icon);
    });
};

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

// --- 5. DEV MODE LOGIC (FIXED OUTPUT) ---
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

    const iconId = prompt("Enter Icon Number:", "1");
    if(!iconId) return;

    createMarker(lat, lng, catId, iconId, title);

    // New Line for Data.js
    const jsonLine = `{ "lat": ${lat}, "lng": ${lng}, "cat": "${catId}", "icon": "${iconId}", "title": "${title}" },\n`;
    
    // Output to Text Area
    const outputBox = document.getElementById('json-output');
    if(outputBox) {
        outputBox.value += jsonLine;
        outputBox.scrollTop = outputBox.scrollHeight; // Auto scroll to bottom
    } else {
        console.error("Could not find textarea!");
        console.log(jsonLine);
    }
});

// Launch
init();