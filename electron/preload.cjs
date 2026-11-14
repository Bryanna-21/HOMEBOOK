const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("homebookDesktop", {
  platform: "desktop",

  importMedia: () => ipcRenderer.invoke("homebook:media:import"),

  scanMedia: (onProgress) => {
    const listener = (_event, progress) => {
      if (typeof onProgress === "function") onProgress(progress);
    };

    ipcRenderer.on("homebook:media:scan-progress", listener);

    return ipcRenderer.invoke("homebook:media:scan").finally(() => {
      ipcRenderer.removeListener("homebook:media:scan-progress", listener);
    });
  },

  cancelMediaScan: () => ipcRenderer.invoke("homebook:media:scan-cancel"),
});
