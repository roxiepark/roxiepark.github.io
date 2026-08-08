import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const rootFolderId = process.argv[2] || "1h74MX5g8dZEFbJpAqnZ5cTIkcaQA5VF9";
const rootDir = process.cwd();
const folderMimeType = "application/vnd.google-apps.folder";
const visited = new Set();
const videoExtensions = new Set(["avi", "m4v", "mov", "mp4", "ogv", "webm"]);
const collator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base"
});

function folderUrl(id) {
  return `https://drive.google.com/drive/folders/${id}?usp=drive_link`;
}

function downloadUrl(id) {
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

function decodeDriveString(html) {
  const match = html.match(
    /window\['_DRIVE_ivd'\]\s*=\s*'((?:\\.|[^'])*)'/s
  );

  if (!match) {
    return null;
  }

  return Function(`return '${match[1]}'`)();
}

function normalizeText(value) {
  return value.normalize("NFC");
}

function collectItems(data) {
  const items = [];
  const seen = new Set();

  function visit(value) {
    if (!Array.isArray(value)) {
      return;
    }

    if (
      typeof value[0] === "string" &&
      Array.isArray(value[1]) &&
      typeof value[2] === "string" &&
      typeof value[3] === "string"
    ) {
      const id = value[0];

      if (!seen.has(id)) {
        seen.add(id);
        items.push({
          id,
          parents: value[1],
          name: normalizeText(value[2]),
          mimeType: value[3]
        });
      }
    }

    value.forEach(visit);
  }

  visit(data);
  return items;
}

async function listFolder(folderId, parentPath = "") {
  if (visited.has(folderId)) {
    return [];
  }

  visited.add(folderId);

  const response = await fetch(folderUrl(folderId));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${folderId}: ${response.status}`);
  }

  const html = await response.text();
  const driveString = decodeDriveString(html);

  if (!driveString) {
    throw new Error(`Could not find Drive folder data for ${folderId}`);
  }

  const data = JSON.parse(driveString);
  const items = collectItems(data).map((item) => ({
    ...item,
    path: parentPath ? `${parentPath}/${item.name}` : item.name
  }));
  const nested = [];

  for (const item of items) {
    if (item.mimeType === folderMimeType) {
      nested.push(...(await listFolder(item.id, item.path)));
    }
  }

  return [...items, ...nested];
}

function extensionFor(name) {
  return path.extname(name).replace(".", "").toLowerCase();
}

function isVideo(item) {
  return (
    item.mimeType.startsWith("video/") || videoExtensions.has(extensionFor(item.name))
  );
}

function titleFor(name) {
  return path.basename(name, path.extname(name));
}

function slugFor(name) {
  return titleFor(name)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pathSegments(item) {
  return item.path.split("/").map(normalizeText);
}

function mediaGroupFor(item) {
  const segments = pathSegments(item);

  if (segments[0] === "영상" && segments[1] === "릴스") {
    return "reels";
  }

  if (segments[0] === "영상" && segments[1] === "캠코더 영상") {
    return "camcorder";
  }

  return "";
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code}\n${stderr}`));
      }
    });
  });
}

async function downloadFile(item, destination) {
  const response = await fetch(downloadUrl(item.id));

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${item.path}: ${response.status}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
}

async function transcodeToMp4(inputPath, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath
  ]);
}

async function downloadVideo(item, group, index) {
  const outputPath = path.join(
    rootDir,
    "assets",
    "drive-videos",
    group,
    `${slugFor(item.name)}.mp4`
  );
  const tempPath = path.join(
    rootDir,
    "assets",
    "drive-videos",
    ".tmp",
    `${group}-${index}-${item.id}.${extensionFor(item.name) || "video"}`
  );

  console.log(`Downloading ${item.path}`);
  await downloadFile(item, tempPath);

  console.log(`Encoding ${item.path}`);
  await transcodeToMp4(tempPath, outputPath);
  await rm(tempPath, { force: true });

  return outputPath;
}

const items = (await listFolder(rootFolderId))
  .filter((item) => item.mimeType !== folderMimeType && isVideo(item))
  .map((item) => ({
    ...item,
    group: mediaGroupFor(item)
  }))
  .filter((item) => item.group)
  .sort((a, b) => collator.compare(a.path, b.path));

let completed = 0;

for (const item of items) {
  await downloadVideo(item, item.group, completed + 1);
  completed += 1;
  console.log(`Completed ${completed}/${items.length}`);
}

await rm(path.join(rootDir, "assets", "drive-videos", ".tmp"), {
  recursive: true,
  force: true
});

console.log(`Downloaded and encoded ${completed} videos.`);
