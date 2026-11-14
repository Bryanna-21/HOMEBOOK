const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const VIDEO_TYPES = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".m2ts": "video/mp2t",
  ".mts": "video/mp2t",
  ".3gp": "video/3gpp",
  ".wmv": "video/x-ms-wmv",
  ".flv": "video/x-flv",
};

const SKIP_DIRECTORIES = new Set([
  "$Recycle.Bin",
  "System Volume Information",
  "$WinREAgent",
  "Config.Msi",
  "Recovery",
  "Windows",
  "Program Files",
  "Program Files (x86)",
  "ProgramData",
  "PerfLogs",
]);

function canonicalPath(filePath) {
  return path.resolve(filePath).replace(/[\\/]+$/, "").toLowerCase();
}

function createMediaId(filePath) {
  return crypto
    .createHash("sha256")
    .update(canonicalPath(filePath))
    .digest("hex")
    .slice(0, 32);
}

function createMediaUri(id) {
  return `homebook-local://media/${id}`;
}

function getTitle(fileName) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[._-]+/g, " ")
    .trim();
}

async function discoverDrives() {
  const drives = [];

  for (let letter = 65; letter <= 90; letter += 1) {
    const root = `${String.fromCharCode(letter)}:\\`;

    try {
      const info = await fs.stat(root);
      if (info.isDirectory()) drives.push(root);
    } catch {
      // Missing, disconnected and inaccessible drives are ignored.
    }
  }

  return drives;
}

async function scanComputer(onProgress = () => {}, options = {}) {
  const signal = options.signal;
  const drives = await discoverDrives();
  const pending = [...drives];
  const visited = new Set();
  const media = [];

  let scannedDirectories = 0;
  let skippedDirectories = 0;
  let lastProgressAt = 0;

  function report(currentPath, force = false) {
    const now = Date.now();
    if (!force && now - lastProgressAt < 250) return;
    lastProgressAt = now;

    onProgress({
      drives,
      scannedDirectories,
      skippedDirectories,
      foundVideos: media.length,
      currentPath,
    });
  }

  report("Preparing drive scan", true);

  while (pending.length) {
    if (signal?.aborted) {
      return {
        cancelled: true,
        drives,
        media,
        scannedDirectories,
        skippedDirectories,
      };
    }

    const currentPath = pending.pop();
    if (!currentPath) continue;

    const normalized = canonicalPath(currentPath);
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
      scannedDirectories += 1;
    } catch {
      skippedDirectories += 1;
      report(currentPath);
      continue;
    }

    for (const entry of entries) {
      if (signal?.aborted) break;

      const fullPath = path.join(currentPath, entry.name);

      // Do not follow junctions or symbolic links into loops.
      if (entry.isSymbolicLink()) continue;

      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) {
          skippedDirectories += 1;
          continue;
        }
        pending.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const extension = path.extname(entry.name).toLowerCase();
      const mimeType = VIDEO_TYPES[extension];
      if (!mimeType) continue;

      try {
        const info = await fs.stat(fullPath);
        media.push({
          id: createMediaId(fullPath),
          title: getTitle(entry.name) || entry.name,
          fileName: entry.name,
          mimeType,
          sizeBytes: info.size,
          modifiedAt: info.mtimeMs,
          sourcePath: path.resolve(fullPath),
          uri: createMediaUri(createMediaId(fullPath)),
        });
      } catch {
        skippedDirectories += 1;
      }
    }

    report(currentPath);
  }

  const cancelled = Boolean(signal?.aborted);
  report(cancelled ? "Scan cancelled" : "Scan complete", true);

  return {
    cancelled,
    drives,
    media,
    scannedDirectories,
    skippedDirectories,
  };
}

module.exports = {
  scanComputer,
  discoverDrives,
  createMediaId,
  createMediaUri,
  VIDEO_TYPES,
};
