const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const DEV_URL = "http://127.0.0.1:8083";
const EXPO_CLI = path.join(__dirname, "../node_modules/expo/bin/cli");

let expoProcess;
let mainWindow;

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
      const request = http.get(DEV_URL, (response) => {
        response.resume();

        if (response.statusCode && response.statusCode < 500) {
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
    backgroundColor: "#F4F8FA",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(DEV_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow).catch((error) => {
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
