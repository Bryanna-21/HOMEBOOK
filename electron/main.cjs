const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
} = require("electron");
const { spawn } = require("node:child_process");
const fsSync = require("node:fs");
const { mkdir, stat, writeFile, rename } = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const http = require("node:http");
const { scanComputer, createMediaId, createMediaUri, VIDEO_TYPES } = require("./media-scanner.cjs");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "homebook-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
  {
    scheme: "homebook-local",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const DEV_URL = "http://127.0.0.1:8083";
const EXPO_CLI = path.join(__dirname, "../node_modules/expo/bin/cli");
const MEDIA_EXTENSIONS = new Set(Object.keys(VIDEO_TYPES));

let expoProcess;
let mainWindow;
let scanController = null;
const trustedMedia = new Map();

function getMediaRegistryPath() {
  return path.join(app.getPath("userData"), "homebook-media-index.json");
}

async function loadMediaRegistry() {
  try {
    const data = JSON.parse(fsSync.readFileSync(getMediaRegistryPath(), "utf8"));

    for (const [id, filePath] of Object.entries(data)) {
      if (
        /^[a-f0-9]{32}$/.test(id) &&
        typeof filePath === "string" &&
        path.isAbsolute(filePath) &&
        createMediaId(filePath) === id
      ) {
        trustedMedia.set(id, path.resolve(filePath));
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      writeCrashLog("MEDIA REGISTRY LOAD FAILED", error);
    }
  }
}

async function saveMediaRegistry() {
  const filePath = getMediaRegistryPath();
  const temporaryPath = `${filePath}.tmp`;

  await writeFile(
    temporaryPath,
    JSON.stringify(Object.fromEntries(trustedMedia), null, 2),
    "utf8"
  );

  await rename(temporaryPath, filePath);
}

async function registerTrustedMedia(filePath) {
  const absolutePath = path.resolve(filePath);
  const extension = path.extname(absolutePath).toLowerCase();

  if (!MEDIA_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported video format.");
  }

  const info = await stat(absolutePath);
  if (!info.isFile()) throw new Error("Selected media is not a file.");

  const id = createMediaId(absolutePath);
  trustedMedia.set(id, absolutePath);

  const fileName = path.basename(absolutePath);

  return {
    id,
    title: fileName.replace(/\.[^.]+$/, "").replace(/[._-]+/g, " ").trim(),
    fileName,
    mimeType: VIDEO_TYPES[extension],
    sizeBytes: info.size,
    modifiedAt: info.mtimeMs,
    uri: createMediaUri(id),
  };
}

function writeCrashLog(label, details) {
  try {
    const logPath = path.join(app.getPath("userData"), "homebook-crash.log");
    const message = `[${new Date().toISOString()}] ${label} ${
      details instanceof Error ? details.stack || details.message : JSON.stringify(details)
    }\\n`;
    fsSync.appendFileSync(logPath, message);
    console.error("[HOMEBOOK]", label, details);
  } catch (error) {
    console.error("[HOMEBOOK] Could not write crash log:", error);
  }
}

process.on("uncaughtException", (error) => {
  writeCrashLog("UNCAUGHT EXCEPTION", error);
});

process.on("unhandledRejection", (reason) => {
  writeCrashLog("UNHANDLED REJECTION", reason);
});

function getMediaDirectory() {
  return path.join(app.getPath("userData"), "media");
}

ipcMain.handle("homebook:media:scan", async () => {
  if (scanController) {
    throw new Error("A media scan is already running.");
  }

  scanController = new AbortController();

  try {
    const result = await scanComputer((progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("homebook:media:scan-progress", progress);
      }
    }, { signal: scanController.signal });

    for (const item of result.media) {
      const sourcePath = path.resolve(item.sourcePath);

      if (createMediaId(sourcePath) !== item.id) {
        throw new Error("Scanner returned an invalid media identifier.");
      }

      trustedMedia.set(item.id, sourcePath);
      delete item.sourcePath;
    }

    await saveMediaRegistry();
    return result;
  } finally {
    scanController = null;
  }
});

ipcMain.handle("homebook:media:scan-cancel", () => {
  if (scanController) scanController.abort();
  return true;
});

function registerTrustedLocalProtocol() {
  protocol.handle("homebook-local", async (request) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.replace(/^\/+/, "");

      if (url.hostname !== "media" || !/^[a-f0-9]{32}$/.test(id)) {
        return new Response("Invalid media identifier", { status: 400 });
      }

      const filePath = trustedMedia.get(id);

      if (!filePath || createMediaId(filePath) !== id) {
        return new Response("Media is not registered", { status: 404 });
      }

      const info = await stat(filePath);
      if (!info.isFile()) {
        return new Response("Media unavailable", { status: 404 });
      }

      return await net.fetch(pathToFileURL(filePath).toString(), {
        headers: request.headers,
      });
    } catch (error) {
      console.error("Trusted local media protocol error:", error);
      return new Response("Media file unavailable", { status: 404 });
    }
  });
}

function registerMediaProtocol() {
  protocol.handle("homebook-media", async (request) => {
    try {
      const url = new URL(request.url);
      const fileName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

      if (!fileName || path.basename(fileName) !== fileName) {
        return new Response("Invalid media path", { status: 400 });
      }

      const mediaDirectory = getMediaDirectory();
      const filePath = path.resolve(mediaDirectory, fileName);

      if (!filePath.startsWith(mediaDirectory + path.sep)) {
        return new Response("Forbidden", { status: 403 });
      }

      return await net.fetch(pathToFileURL(filePath).toString(), {
        headers: request.headers,
      });
    } catch (error) {
      console.error("Media protocol error:", error);
      return new Response("Media file unavailable", { status: 404 });
    }
  });
}

ipcMain.handle("homebook:media:import", async () => {
  writeCrashLog("IMPORT START", "Opening video picker.");

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Add video to HOMEBOOK",
      properties: ["openFile"],
      filters: [{
        name: "Video files",
        extensions: [...MEDIA_EXTENSIONS].map((extension) => extension.slice(1)),
      }],
    });

    if (result.canceled || !result.filePaths.length) {
      writeCrashLog("IMPORT CANCELLED", "No file selected.");
      return null;
    }

    const imported = await registerTrustedMedia(result.filePaths[0]);
    await saveMediaRegistry();

    writeCrashLog("IMPORT COMPLETE", {
      fileName: imported.fileName,
      sizeBytes: imported.sizeBytes,
      indexedInPlace: true,
    });

    return imported;
  } catch (error) {
    writeCrashLog("IMPORT FAILED", error);
    throw error;
  }
});

function startExpo() {
  expoProcess = spawn(
    "node",
    [EXPO_CLI, "start", "--web", "--port", "8083"],
    {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, CI: "1", BROWSER: "none" },
      stdio: "inherit",
    }
  );

  expoProcess.on("error", (error) => {
    console.error("Failed to start Expo:", error);
  });
}

function waitForExpo(timeout = 120000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    function check() {
      const request = http.get(`${DEV_URL}/status`, (response) => {
        response.resume();

        if (response.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });

      request.on("error", retry);
      request.setTimeout(2000, () => request.destroy());

      function retry() {
        if (expoProcess && expoProcess.exitCode !== null) {
          reject(new Error("Expo server exited before becoming ready."));
          return;
        }

        if (Date.now() - started > timeout) {
          reject(new Error("Expo server startup timed out."));
          return;
        }

        setTimeout(check, 1000);
      }
    }

    check();
  });
}

async function createWindow() {
  startExpo();
  await waitForExpo();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "HOMEBOOK",
    backgroundColor: "#050B14",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[HOMEBOOK] Renderer finished loading:", mainWindow?.webContents.getURL());
  });

  mainWindow.webContents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    console.error("[HOMEBOOK] Renderer failed to load:", {
      code, description, url, isMainFrame,
    });
  });

  mainWindow.webContents.on("console-message", (event) => {
    console.log(
      "[RENDERER]",
      event.level,
      event.message,
      event.sourceId,
      event.lineNumber
    );
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    writeCrashLog("RENDERER PROCESS GONE", details);
  });

  mainWindow.on("closed", () => {
    writeCrashLog("WINDOW CLOSED", "Electron window closed.");
    mainWindow = null;
  });

  mainWindow.webContents.openDevTools({ mode: "detach" });

  await mainWindow.loadURL(DEV_URL);

}

app.whenReady()
  .then(async () => {
    await mkdir(getMediaDirectory(), { recursive: true });
    await loadMediaRegistry();
    registerMediaProtocol();
    registerTrustedLocalProtocol();
    await createWindow();
  })
  .catch((error) => {
    console.error(error);
    app.quit();
  });

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  if (expoProcess && !expoProcess.killed) {
    expoProcess.kill();
  }
});
