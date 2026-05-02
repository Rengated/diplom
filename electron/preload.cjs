// Preload runs in an isolated context. Keep it minimal — no Node access exposed.
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('app', {
  platform: process.platform,
  isElectron: true,
})
