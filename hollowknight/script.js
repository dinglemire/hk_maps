// --- CONFIGURATION ---
const TILE_SIZE = 256;
const MIN_ZOOM = 0;
const MAX_ZOOM = 9;

// 1. DEFINE THE MAP
// L.CRS.Simple means 1 unit = 1 pixel at Zoom 0.
// Since your map at Zoom 0 is likely 1 tile (256x256), the whole world is [0,0] to [-256, 256].
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    zoomControl: false
});

// 2. THE TILE LAYER
// We use a standard tile layer. 
// Your file structure is standard (z/x/y), so we don't need complex scripts unless Y is inverted.
L.tileLayer('my_tiles/{z}/{x}/{y}.png', {
    tileSize: TILE_SIZE,
    noWrap: true,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    errorTileUrl: '', // Keep clean
    attribution: 'Hollow Knight'
}).addTo(map);

// 3. SET THE VIEW CORRECTLY
// At Zoom 0, your map is roughly 256 units wide/high.
// In CRS.Simple, Y goes negative (down).
// Center roughly at [ -Height/2, Width/2 ]
// We start at Zoom 2 to give you a good overview.
map.setView([-100, 100], 2);

// 4. CONTROLS
L.control.zoom({ position: 'topright' }).addTo(map);

// 5. DEBUG HELPER (Yellow Box)
// If the map is still black, move your mouse. 
// The yellow box will tell you what Tile the browser is looking for.
// Compare that number to your folders.
const infoBox = L.control({position: 'bottomleft'});

infoBox.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'tile-label');
    this._div.style.background = "rgba(0,0,0,0.5)";
    this._div.style.padding = "10px";
    this._div.style.color = "#fff";
    this.update("Move mouse...");
    return this._div;
};

infoBox.update = function (props) {
    this._div.innerHTML = props;
};

infoBox.addTo(map);

map.on('mousemove', function(e) {
    const z = map.getZoom();
    
    // Calculate the TILE coordinate based on mouse position and zoom
    // Formula: Pixel / 256
    const point = map.project(e.latlng, z);
    const tileX = Math.floor(point.x / TILE_SIZE);
    const tileY = Math.floor(point.y / TILE_SIZE);
    
    infoBox.update(`
        <strong>Zoom: ${z}</strong><br>
        Looking for file: <strong>${z}/${tileX}/${tileY}.png</strong><br>
        <br>
        Map Coords: ${e.latlng.lat.toFixed(1)}, ${e.latlng.lng.toFixed(1)}
    `);
});
