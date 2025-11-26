// data.js

// 1. DEFINITIONS: The categories, icons, and groups
const mapConfig = {
    groups: {
        exploration: { title: "Exploration", expanded: true },
        combat: { title: "Combat", expanded: true },
        quests: { title: "Quests & Collectibles", expanded: true }
    },
    types: {
        // Exploration
        bench:      { group: "exploration", label: "Bench", icon: "🪑", color: "#32cd32" },
        bellway:    { group: "exploration", label: "Bellway", icon: "🔔", color: "#ffffff" },
        ventrica:   { group: "exploration", label: "Ventrica", icon: "🚀", color: "#00ccff" },
        vendor:     { group: "exploration", label: "Vendor", icon: "💰", color: "#ffd700" },
        map:        { group: "exploration", label: "Map Tool", icon: "🗺️", color: "#aaaaaa" },
        boss:       { group: "exploration", label: "Boss", icon: "👹", color: "#ff4d4d" },
        key:        { group: "exploration", label: "Key/Gate", icon: "🔑", color: "#ff9900" },

        // Combat
        ability:    { group: "combat", label: "Ability", icon: "⚡", color: "#ffff00" },
        mask:       { group: "combat", label: "Mask Shard", icon: "🛡️", color: "#eeeeee" },
        silkheart:  { group: "combat", label: "Silk Heart", icon: "⚪", color: "#ffffff" },
        spool:      { group: "combat", label: "Spool Fragment", icon: "🧵", color: "#cccccc" },
        memory:     { group: "combat", label: "Memory Locket", icon: "💾", color: "#555555" },
        crest:      { group: "combat", label: "Crest", icon: "🧿", color: "#ff00ff" },
        tool:       { group: "combat", label: "Tool", icon: "🗡️", color: "#aaaaaa" },
        skill:      { group: "combat", label: "Skill", icon: "⚔️", color: "#ff0000" },

        // Quests
        wish:       { group: "quests", label: "Wish", icon: "📜", color: "#deb887" },
        flea:       { group: "quests", label: "Lost Flea", icon: "🐛", color: "#aaffaa" },
        craftmetal: { group: "quests", label: "Craftmetal", icon: "🧱", color: "#888888" },
        mossberry:  { group: "quests", label: "Mossberry", icon: "🫐", color: "#44aa44" },
        pollip:     { group: "quests", label: "Pollip Flower", icon: "🌺", color: "#ff69b4" },
        flint:      { group: "quests", label: "Flintbeetle", icon: "🪲", color: "#8b4513" },
        delicacy:   { group: "quests", label: "Delicacy", icon: "🍖", color: "#cd5c5c" },
        cogheart:   { group: "quests", label: "Cogheart", icon: "⚙️", color: "#a9a9a9" },
        plasmium:   { group: "quests", label: "Plasmium", icon: "🧪", color: "#00ffff" }
    }
};

// 2. THE DATA: This is where your pins live.
// You will paste the output from "Dev Mode" here.
const mapData = [
    // Example Marker
    { type: "bench", x: 2200, y: 3100, title: "Moss Grotto Bench", desc: "Cost: 150 Rosaries" }
];
