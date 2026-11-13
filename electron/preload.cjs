const { contextBridge } = require("electron");

// HOMEBOOK desktop APIs will be exposed here deliberately,
// through a restricted bridge, when required.
contextBridge.exposeInMainWorld("homebookDesktop", {
  platform: "desktop",
});

