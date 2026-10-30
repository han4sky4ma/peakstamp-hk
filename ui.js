// Globalized Template Component Builder Interface
function injectAppTemplates() {
    const radarComp = document.getElementById('radar-component');
    const progressComp = document.getElementById('progress-component');
    const backupComp = document.getElementById('backup-component');
    const filterComp = document.getElementById('filter-component');
    const modalComp = document.getElementById('modal-component');

    // Only append if target container is empty to avoid double-rendering artifacts
    if (radarComp && !radarComp.children.length && document.getElementById('template-radar')) {
        radarComp.appendChild(document.getElementById('template-radar').content.cloneNode(true));
    }
    if (progressComp && !progressComp.children.length && document.getElementById('template-progress')) {
        progressComp.appendChild(document.getElementById('template-progress').content.cloneNode(true));
    }
    if (backupComp && !backupComp.children.length && document.getElementById('template-backup')) {
        backupComp.appendChild(document.getElementById('template-backup').content.cloneNode(true));
    }
    if (filterComp && !filterComp.children.length && document.getElementById('template-filters')) {
        filterComp.appendChild(document.getElementById('template-filters').content.cloneNode(true));
    }
    if (modalComp && !modalComp.children.length && document.getElementById('template-modals')) {
        modalComp.appendChild(document.getElementById('template-modals').content.cloneNode(true));
    }
}

// Bind standalone helper to global layer maps scope
window.injectAppTemplates = injectAppTemplates;

// Fail-safe initialization listener hook
document.addEventListener("DOMContentLoaded", injectAppTemplates);

// High-Performance Batch Rendering Grid Engine
async function renderPeaksGrid() {
    const grid = document.getElementById("peaks-grid");
    if (!grid) return;
    
    // Get filter states safely
    const regionEl = document.getElementById("filter-region");
    const levelEl = document.getElementById("filter-level");
    const statusEl = document.getElementById("filter-status");
    
    const regionFilter = regionEl ? regionEl.value : "all";
    const levelFilter = levelEl ? levelEl.value : "all";
    const statusFilter = statusEl ? statusEl.value : "all";
    
    // Fetch unlocked database keys
    const unlockedIds = await getAllUnlockedIds();
    const totalUnlockedCount = unlockedIds.length;
    let renderedCount = 0;

    // Build structural content inside an off-screen virtual memory chunk
    const fragment = document.createDocumentFragment();
    const peakLength = window.peaks ? window.peaks.length : 0;

    for (let i = 0; i < peakLength; i++) {
        const peak = window.peaks[i];
        const isUnlocked = unlockedIds.includes(peak.id);
        
        // Evaluate filter matrices instantly
        const matchRegion = (regionFilter === "all" || peak.regionTag === regionFilter);
        const matchLevel = (levelFilter === "all" || peak.levelTag === levelFilter);
        const matchStatus = (statusFilter === "all" || (statusFilter === "unlocked" && isUnlocked) || (statusFilter === "locked" && !isUnlocked));

        if (matchRegion && matchLevel && matchStatus) {
            renderedCount++;
            
            const card = document.createElement("div");
            card.className = isUnlocked ? "card unlocked" : "card locked";
            card.innerHTML = `
                <div class="badge-icon">⛰️</div>
                <strong style="font-size: 13px; display: block; min-height: 36px;">#${i + 1} ${peak.name}</strong>
                <div style="font-size: 11px; color: #666; margin: 4px 0;">海拔高度: ${peak.elev}米</div>
                ${isUnlocked ? `<button class="btn" style="background: #2E5A44; padding: 6px;" onclick="viewStamp('${peak.id}')">檢視印章</button>` : `<div style="font-size: 11px; color: #999; margin-top: 10px;">尚未攀登解鎖</div>`}
            `;
            fragment.appendChild(card);
        }
    }

    // Wipe old layout contents out completely and append memory cache block
    grid.textContent = ""; 
    grid.appendChild(fragment);

    // Synchronize administrative stat metrics labels safely
    const progTextEl = document.getElementById("progress-text");
    const progFillEl = document.getElementById("progress-fill");
    const gridCountEl = document.getElementById("grid-count-text");

    if (progTextEl) progTextEl.textContent = `${totalUnlockedCount} / ${peakLength} 已解鎖`;
    if (progFillEl) progFillEl.style.width = `${(totalUnlockedCount / (peakLength || 1)) * 100}%`;
    if (gridCountEl) gridCountEl.textContent = `當前篩選符合項目: ${renderedCount} 座山峰`;
}

// Optimized Radar List Text Generation Interface
function updateRadarList(userLat, userLng) {
    window.lastUserLat = userLat; 
    window.lastUserLng = userLng;
    
    if (!window.peaks) return;

    getAllUnlockedIds().then(unlockedIds => {
        const peakLength = window.peaks.length;
        const peaksWithDistance = new Array(peakLength);
        
        for (let i = 0; i < peakLength; i++) {
            const peak = window.peaks[i];
            peaksWithDistance[i] = { 
                ...peak, 
                distance: calculateHaversineDistance(userLat, userLng, peak.lat, peak.lng), 
                bearing: calculateBearing(userLat, userLng, peak.lat, peak.lng) 
            };
        }
        
        peaksWithDistance.sort((a, b) => a.distance - b.distance);
        window.nearestFiveCache = peaksWithDistance.slice(0, 5);

        const radarListDiv = document.getElementById("radar-list");
        if (!radarListDiv) return;
        
        const listFragment = document.createDocumentFragment();

        window.nearestFiveCache.forEach(peak => {
            const item = document.createElement("div");
            item.className = "radar-item";
            const isUnlocked = unlockedIds.includes(peak.id);
            const kmDist = peak.distance >= 1000 ? `${(peak.distance / 1000).toFixed(2)}公里` : `${Math.round(peak.distance)}米`;
            
            let actionContent = `<span class="distance-tag">距離 ${kmDist}</span>`;
            if (peak.distance <= 40 && !isUnlocked) {
                actionContent = `<button class="btn-stamp-now" onclick="openCameraFor('${peak.id}')">📸 抵達山頂！即刻解鎖集章</button>`;
            } else if (isUnlocked) {
                actionContent = `<span class="distance-tag" style="background: #2E5A44">✓ 已打卡</span>`;
            }

            item.innerHTML = `<div><strong>${peak.name}</strong><br><span style="font-size: 11px; color: #777;">標高: ${peak.elev}米 | 方位角: ${Math.round(peak.bearing)}°</span></div><div>${actionContent}</div>`;
            listFragment.appendChild(item);
        });

        radarListDiv.textContent = "";
        radarListDiv.appendChild(listFragment);
    });
}

