
// preload.cjs
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  chooseDir: () => ipcRenderer.invoke('choose-dir'),
  runStripper: (args) => ipcRenderer.invoke('run-stripper', args),
  cancel: () => ipcRenderer.invoke('cancel'),
  onLog: (cb) => ipcRenderer.on('log', (_, msg) => cb(msg))
});
