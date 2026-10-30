// ==========================================
// 1. GLOBAL STATE INITIALIZATION & HOISTING
// ==========================================
// Pointers must be declared here globally to prevent cross-module reference thread exceptions
window.activePeak = null;
window.lastUserLat = null;
window.lastUserLng = null;
window.db = null;
window.radarSweepAngle = 0;
window.nearestFiveCache = [];
window.currentRawImageSrc = null;

// ==========================================
// 2. INDEXEDDB PERSISTENT STORAGE ENGINE
// ==========================================
function initDB() {
    return new Promise((resolve, reject) => {
        // Core client database container
        const request = indexedDB.open("PeakStampDB", 1);
        
        request.onupgradeneeded = function(e) {
            const database = e.target.result;
            // Generate standard object store container if missing
            if (!database.objectStoreNames.contains("stamps")) {
                database.createObjectStore("stamps", { keyPath: "id" });
            }
        };
        
        request.onsuccess = function(e) { 
            window.db = e.target.result; 
            resolve(); 
        };
        
        request.onerror = function() { 
            reject(); 
        };
    });
}

function getRawRecordFromDB(id) {
    return new Promise((resolve) => {
        if (!window.db) return resolve(null);
        const transaction = window.db.transaction(["stamps"], "readonly");
        const store = transaction.objectStore("stamps");
        const request = store.get(id);
        
        request.onsuccess = function(e) { 
            resolve(e.target.result ? e.target.result : null); 
        };
        request.onerror = function() { 
            resolve(null); 
        };
    });
}

function saveRecordToDB(id, dataUrl, rawImg, currentStyle) {
    return new Promise((resolve, reject) => {
        if (!window.db) return reject();
        const transaction = window.db.transaction(["stamps"], "readwrite");
        const store = transaction.objectStore("stamps");
        
        // Write standard lightweight key-value mapping parameters
        const request = store.put({ 
            id: id, 
            dataUrl: dataUrl, 
            rawImg: rawImg, 
            style: currentStyle, 
            timestamp: Date.now() 
        });
        
        request.onsuccess = function() { 
            resolve(); 
        };
        request.onerror = function(e) { 
            reject(e); 
        };
    });
}

function getAllUnlockedIds() {
    return new Promise((resolve) => {
        if (!window.db) return resolve([]);
        const transaction = window.db.transaction(["stamps"], "readonly");
        const store = transaction.objectStore("stamps");
        const request = store.getAllKeys();
        
        request.onsuccess = function(e) { 
            resolve(e.target.result); 
        };
        request.onerror = function() { 
            resolve([]); 
        };
    });
}

function getAllStampsData() {
    return new Promise((resolve) => {
        if (!window.db) return resolve([]);
        const transaction = window.db.transaction(["stamps"], "readonly");
        const store = transaction.objectStore("stamps");
        const request = store.getAll();
        
        request.onsuccess = function(e) { 
            resolve(e.target.result); 
        };
        request.onerror = function() { 
            resolve([]); 
        };
    });
}
﻿
