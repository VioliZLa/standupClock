const { app, BrowserWindow, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 420,
    minWidth: 260,
    minHeight: 320,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'tray.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Stand-Up Reminder');
  tray.on('click', () => {
    if (!mainWindow) {
      createWindow();
    } else if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

ipcMain.on('close-app', () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  if (mainWindow) {
    mainWindow.close();
  }
  app.quit();
});

ipcMain.on('minimize-app', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('show-app', () => {
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

ipcMain.on('set-always-on-top', (_event, enabled) => {
  if (mainWindow) {
    const flag = !!enabled;
    mainWindow.setAlwaysOnTop(flag);
    if (flag) {
      mainWindow.show();
      mainWindow.focus();
    }
  }
});

ipcMain.handle('get-always-on-top', () => {
  if (!mainWindow) return false;
  return mainWindow.isAlwaysOnTop();
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
