const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Settings
    getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
    setBackendUrl: (url) => ipcRenderer.invoke('set-backend-url', url),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // App Info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),

    // Events
    onBackendUrl: (callback) => {
        const handler = (event, url) => callback(url);
        ipcRenderer.on('backend-url', handler);
        return () => ipcRenderer.removeListener('backend-url', handler);
    },
    onOpenSettings: (callback) => {
        const handler = () => callback();
        ipcRenderer.on('open-settings', handler);
        return () => ipcRenderer.removeListener('open-settings', handler);
    },
    onShowAbout: (callback) => {
        const handler = () => callback();
        ipcRenderer.on('show-about', handler);
        return () => ipcRenderer.removeListener('show-about', handler);
    },

    // Platform info
    platform: process.platform,
    version: process.env.npm_package_version || '1.0.0',

    // Utility
    isElectron: true,
});

// Also expose a simpler check for Electron environment
contextBridge.exposeInMainWorld('isElectron', true);
