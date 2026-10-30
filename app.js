// Synchronized Core Bootstrapper Engine
async function initApp() {
    // 1. Critical Safeguard: If DOMContentLoaded inside ui.js hasn't fired yet, force template injection now
    if (!document.getElementById('radar-canvas') && typeof injectAppTemplates === "function") {
        injectAppTemplates();
    }
    
    // 2. Initialize UI Action listeners
    if (typeof initAppUIListeners === "function") {
        initAppUIListeners();
    }

    // 3. Mount and connect local transactional persistence database
    await initDB();
    
    // 4. Clean up raw peak coordinates layout filters
    if (window.peaks) {
        window.peaks.forEach(peak => assignPeakFilters(peak));
    }
    
    // 5. Populate developer simulation panel selectors
    const selector = document.getElementById("mock-selector");
    if (selector && selector.options.length === 0 && window.peaks) {
        const selectFragment = document.createDocumentFragment();
        window.peaks.forEach((peak, index) => {
            const opt = document.createElement("option");
            opt.value = peak.id; 
            opt.innerText = `#${index + 1} ${peak.name} (${peak.elev}m)`;
            selectFragment.appendChild(opt);
        });
        selector.appendChild(selectFragment);
    }

    // 6. Draw 160 cards grid instantly
    await renderPeaksGrid();
    
    // 7. Initialize GPS Geolocation Watch Loop
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(pos => updateRadarList(pos.coords.latitude, pos.coords.longitude), null, { enableHighAccuracy: true });
    }
}

// Function triggered by ui.js once DOM templates mount safely
function initAppUIListeners() {
    const regionFilter = document.getElementById("filter-region");
    const levelFilter = document.getElementById("filter-level");
    const statusFilter = document.getElementById("filter-status");
    const btnSimulate = document.getElementById("btn-simulate");
    const btnExport = document.getElementById("btn-export");
    const btnImportTrigger = document.getElementById("btn-import-trigger");
    const btnGeneratePoster = document.getElementById("btn-generate-poster");
    const btnCloseModal = document.getElementById("btn-close-modal");

    if (regionFilter) regionFilter.addEventListener("change", renderPeaksGrid);
    if (levelFilter) levelFilter.addEventListener("change", renderPeaksGrid);
    if (statusFilter) statusFilter.addEventListener("change", renderPeaksGrid);
    
    if (btnSimulate) {
        btnSimulate.addEventListener("click", () => {
            const mockSel = document.getElementById("mock-selector");
            if (!mockSel || !window.peaks) return;
            const target = window.peaks.find(p => p.id === mockSel.value);
            if (target) updateRadarList(target.lat, target.lng);
        });
    }
    
    if (btnExport) btnExport.addEventListener("click", exportBackupJSON);
    if (btnImportTrigger) btnImportTrigger.addEventListener("click", () => document.getElementById('import-file-input').click());
    if (btnGeneratePoster) btnGeneratePoster.addEventListener("click", generateAchievementPoster);
    if (btnCloseModal) btnCloseModal.addEventListener("click", () => document.getElementById("result-modal").style.display = "none");

    const camInput = document.getElementById("camera-input");
    const repInput = document.getElementById("replace-input");
    const impInput = document.getElementById("import-file-input");

    if (camInput) camInput.addEventListener("change", handlePhotoUpload);
    if (repInput) repInput.addEventListener("change", handlePhotoReplace);
    if (impInput) impInput.addEventListener("change", importBackupJSON);
}

function openCameraFor(id) {
    if (!window.peaks) return;
    window.activePeak = window.peaks.find(p => p.id === id); 
    const camInp = document.getElementById("camera-input");
    if (camInp) camInp.click();
}

function triggerReplaceStamp(id) {
    if (!window.peaks) return;
    window.activePeak = window.peaks.find(p => p.id === id); 
    const repInp = document.getElementById("replace-input");
    if (repInp) repInp.click();
}

function handlePhotoUpload(e) {
    const file = e.target.files ? e.target.files[0] : null; 
    if (!file) return;
    document.getElementById("loading").style.display = "flex";
    const reader = new FileReader(); 
    reader.onload = (evt) => { 
        window.currentRawImageSrc = evt.target.result; 
        processImageAndStamp(window.currentRawImageSrc, "classic"); 
    };
    reader.readAsDataURL(file); 
    e.target.value = "";
}

function handlePhotoReplace(e) {
    const file = e.target.files ? e.target.files[0] : null; 
    if (!file) return;
    document.getElementById("loading").style.display = "flex";
    const reader = new FileReader(); 
    reader.onload = (evt) => { 
        window.currentRawImageSrc = evt.target.result; 
        const styleSel = document.getElementById("stamp-style-select");
        processImageAndStamp(window.currentRawImageSrc, styleSel ? styleSel.value : "classic"); 
    };
    reader.readAsDataURL(file); 
    e.target.value = "";
}

async function viewStamp(id) {
    if (!window.peaks) return;
    window.activePeak = window.peaks.find(p => p.id === id);
    const record = await getRawRecordFromDB(id);
    if (record) {
        document.getElementById("modal-title").innerText = `${window.activePeak.name} 登頂足跡`;
        document.getElementById("modal-img").src = record.dataUrl;
        window.currentRawImageSrc = record.rawImg;
        const styleSel = document.getElementById("stamp-style-select");
        if (styleSel) styleSel.value = record.style || "classic";
        document.getElementById("modal-action-bar").innerHTML = `<button class="btn" style="background: #555; margin-bottom: 10px;" onclick="triggerReplaceStamp('${window.activePeak.id}')">重新拍照或更換基底相片 (保持GPS解鎖狀態)</button>`;
        document.getElementById("result-modal").style.display = "flex";
    }
}

// Global scope window binding map mappings
window.openCameraFor = openCameraFor;
window.triggerReplaceStamp = triggerReplaceStamp;
window.viewStamp = viewStamp;
window.initAppUIListeners = initAppUIListeners;
window.onload = initApp;

// Use DOMContentLoaded instead of raw window.onload to ensure full layout availability
document.addEventListener("DOMContentLoaded", initApp);
