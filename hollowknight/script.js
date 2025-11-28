// --- CONFIGURATION ---
const TILE_SIZE = 256;
const MAX_ZOOM = 9;

const categoryGroups = [
    {
        id: 'loc_group',
        groupName: "Locations",
        items: [
            { id: 'bench',      name: 'Bench',          icon: '23.png' },
            { id: 'stag',       name: 'Stag Station',   icon: '19.png' },
            { id: 'tram',       name: 'Tram Station',   icon: '18.png' }
        ]
    },
    {
        id: 'col_group',
        groupName: "Collectibles",
        items: [
            { id: 'idol',       name: "King's Idol",    icon: '46.png' },
            { id: 'grub',       name: 'Captive Grub',   icon: '27.png' },
            { id: 'mask',       name: 'Mask Shard',     icon: '83.png' }
        ]
    },
    {
        id: 'eq_group',
        groupName: "Equipment",
        items: [
            { id: 'ability',    name: 'Ability',        icon: '29.png' }, 
            { id: 'nailart',    name: 'Nail Art',       icon: '29.png' }, 
            { id: 'spell',      name: 'Spell',          icon: '29.png' }, 
            { id: 'charm',      name: 'Charm',          icon: '44.png' }
        ]
    },
    {
        id: 'oth_group',
        groupName: "Other",
        items: [
            { id: 'boss',       name: 'Boss',           icon: '35.png' },
            { id: 'root',       name: 'Whispering Root', icon: '14.png' }
        ]
    }
];

// --- STATE ---
const layers = {};
const allMarkers = []; 
let currentIconSize = 32;
let isDevMode = false;
let isSidebarOpen = true;

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

// --- 2. INITIALIZATION ---
function init() {
    const listContainer = document.getElementById('category-list');
    const devSelect = document.getElementById('dev-cat-select');

    categoryGroups.forEach(group => {
        // Create Container for the whole group
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group-container';
        
        // 1. GROUP HEADER (Toggle All + Expand)
        const header = document.createElement('div');
        header.className = 'group-header';
        
        // Checkbox for Group (Select All)
        const groupCheckbox = document.createElement('input');
        groupCheckbox.type = 'checkbox';
        groupCheckbox.checked = true;
        groupCheckbox.onclick = (e) => {
             e.stopPropagation(); // Don't collapse when checking
             toggleGroup(group.id, groupCheckbox.checked);
        };

        // Title and Arrow (Click to Expand)
        const title = document.createElement('span');
        title.className = 'group-title';
        title.innerText = group.groupName;

        const arrow = document.createElement('span');
        arrow.className = 'group-arrow';
        arrow.innerText = '▼';

        header.appendChild(groupCheckbox);
        header.appendChild(title);
        header.appendChild(arrow);
        
        // Click header to toggle accordion
        header.onclick = () => {
            itemsDiv.classList.toggle('open');
            groupDiv.classList.toggle('active');
        };

        groupDiv.appendChild(header);

        // 2. GROUP ITEMS CONTAINER (Hidden by default via CSS)
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'group-items';
        itemsDiv.id = `group-${group.id}`;

        // 3. INDIVIDUAL ITEMS
        group.items.forEach(cat => {
            // Leaflet Layer
            layers[cat.id] = L.layerGroup().addTo(map);

            // Sidebar Item
            const item = document.createElement('div');
            item.className = 'cat-item';
            item.innerHTML = `
                <input type="checkbox" checked onchange="toggleLayer('${cat.id}', this.checked)" class="item-check">
                <img src="icons/${cat.icon}" class="cat-icon">
                <span class="cat-name">${cat.name}</span>
            `;
            itemsDiv.appendChild(item);

            // Dev Dropdown
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.innerText = `${group.groupName} - ${cat.name}`;
            devSelect.appendChild(opt);
        });

        groupDiv.appendChild(itemsDiv);
        listContainer.appendChild(groupDiv);
    });

    // Load Data
    if (typeof savedPins !== 'undefined') {
        savedPins.forEach(p => createMarker(p.lat, p.lng, p.cat, p.icon, p.title));
    }
}

// --- 3. UI LOGIC ---

// Sidebar Slide
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const btn = document.querySelector('.sidebar-toggle-btn');
    sidebar.classList.toggle('closed');
    
    if (sidebar.classList.contains('closed')) {
        btn.innerText = "❯"; // Arrow pointing right
    } else {
        btn.innerText = "❮"; // Arrow pointing left
    }
}

// Master Toggle for a Group
window.toggleGroup = function(groupId, isChecked) {
    // Find the specific container for this group
    const groupItemsDiv = document.getElementById(`group-${groupId}`);
    const checkboxes = groupItemsDiv.querySelectorAll('.item-check');
    
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        // Trigger the onchange event logic manually
        // 1. Get Cat ID from the toggleLayer call we wrote in HTML, 
        //    or we can look it up. Easier to just dispatch event or call fn.
        //    We'll find the category ID by finding the category object based on name relative to checkbox
        const catName = cb.parentElement.querySelector('.cat-name').innerText;
        
        // Find ID
        let catId = null;
        categoryGroups.forEach(g => {
            const item = g.items.find(i => i.name === catName);
            if(item) catId = item.id;
        });

        if(catId) toggleLayer(catId, isChecked);
    });
}

window.toggleLayer = function(id, show) {
    if(show) map.addLayer(layers[id]);
    else map.removeLayer(layers[id]);
    filterSearch(); 
}

window.toggleAll = function(show) {
    const allGroupChecks = document.querySelectorAll('.group-header input');
    allGroupChecks.forEach(cb => {
        cb.checked = show;
        // toggleGroup works by finding the group ID relative to the loop in init()
        // But here we are external.
        // Easiest way: Just click all items.
    });

    const allItemChecks = document.querySelectorAll('.item-check');
    allItemChecks.forEach(cb => {
        cb.checked = show;
        // Trigger logic
        const catName = cb.parentElement.querySelector('.cat-name').innerText;
        let catId = null;
        categoryGroups.forEach(g => {
            const item = g.items.find(i => i.name === catName);
            if(item) catId = item.id;
        });
        if(catId) toggleLayer(catId, show);
    });
}

// --- 4. CORE MAP FUNCTIONS --- (Same as before)

function createMarker(lat, lng, catId, iconId, title) {
    const anchorPos = currentIconSize / 2;
    const hkIcon = L.icon({
        iconUrl: `icons/${iconId}.png`,
        iconSize: [currentIconSize, currentIconSize],
        iconAnchor: [anchorPos, anchorPos],
        popupAnchor: [0, -anchorPos],
        className: 'hk-marker'
    });

    const marker = L.marker([lat, lng], {icon: hkIcon, title: title});
    
    let catName = catId;
    categoryGroups.forEach(g => {
        const found = g.items.find(i => i.id === catId);
        if(found) catName = found.name;
    });

    marker.bindPopup(`<b>${title}</b><br><small>${catName}</small>`);
    
    if(layers[catId]) layers[catId].addLayer(marker);
    allMarkers.push({ marker: marker, catId: catId });
}

const slider = document.getElementById('icon-slider');
slider.oninput = function() {
    currentIconSize = parseInt(this.value);
    const anchorPos = currentIconSize / 2;
    document.getElementById('size-val').innerText = currentIconSize + 'px';
    allMarkers.forEach(item => {
        const icon = item.marker.options.icon;
        icon.options.iconSize = [currentIconSize, currentIconSize];
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

window.toggleDevMode = function() {
    isDevMode = !isDevMode;
    const btn = document.getElementById('dev-btn');
    const panel = document.getElementById('dev-panel');
    const outputBox = document.getElementById('json-output');
    
    if(isDevMode) {
        btn.classList.add('on');
        btn.innerText = "Dev Mode: ACTIVE";
        panel.classList.add('active');
        if(outputBox) outputBox.style.display = "block"; 
        map.getContainer().style.cursor = "crosshair";
    } else {
        btn.classList.remove('on');
        btn.innerText = "Enable Dev Mode";
        panel.classList.remove('active');
        if(outputBox) outputBox.style.display = "none";
        map.getContainer().style.cursor = "";
    }
}

map.on('click', function(e) {
    if (!isDevMode) return;
    const catId = document.getElementById('dev-cat-select').value;
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    const title = prompt("Enter Pin Title:");
    if(!title) return;
    const iconId = prompt("Enter Icon Number:", "1");
    if(!iconId) return;

    createMarker(lat, lng, catId, iconId, title);

    const jsonLine = `{ "lat": ${lat}, "lng": ${lng}, "cat": "${catId}", "icon": "${iconId}", "title": "${title}" },\n`;
    const outputBox = document.getElementById('json-output');
    if(outputBox) {
        outputBox.value += jsonLine;
        outputBox.scrollTop = outputBox.scrollHeight;
    }
});

init();