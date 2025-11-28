
// main.mjs - hardened; calls crawler in-process with cancellation and log file
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { runStripper, cancelAll } from './src/runner.mjs';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('choose-dir', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled || !res.filePaths || !res.filePaths[0]) return null;
  return res.filePaths[0];
});

ipcMain.handle('run-stripper', async (event, args) => {
  const send = (msg) => event.sender.send('log', msg);
  try {
    const code = await runStripper(args, send);
    return { code };
  } catch (e) {
    send(String(e && e.stack ? e.stack : e));
    return { code: 1 };
  }
});

ipcMain.handle('cancel', async () => {
  cancelAll();
  return true;
});
