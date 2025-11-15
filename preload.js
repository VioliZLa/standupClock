const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('reminderAPI', {
  getCurrentTime: () => new Date().toLocaleTimeString(),
  closeApp: () => ipcRenderer.send('close-app'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  showApp: () => ipcRenderer.send('show-app'),
  setAlwaysOnTop: (enabled) => ipcRenderer.send('set-always-on-top', !!enabled),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top')
});
