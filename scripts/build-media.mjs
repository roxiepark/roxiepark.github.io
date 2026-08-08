import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, "assets");
const mediaPath = path.join(rootDir, "media.js");
const icloudShare =
  "https://www.icloud.com/iclouddrive/05aKGWogjl-jZ0AaoR2TbEoPQ";

const imageExtensions = new Set(["avif", "gif", "jpeg", "jpg", "png", "webp"]);
const videoExtensions = new Set(["m4v", "mov", "mp4", "ogv", "webm"]);
const collator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base"
});

const candidates = {
  reels: [
    ["영상", "릴스"],
    ["videos", "reels"],
    ["reels"]
  ],
  photoFolders: [["사진"], ["photos"]],
  camcorder: [
    ["영상", "캠코더 영상"],
    ["videos", "camcorder"],
    ["photos", "camcorder"]
  ]
};

function toAssetPath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function extensionFor(filePath) {
  return path.extname(filePath).replace(".", "").toLowerCase();
}

function isImage(filePath) {
  return imageExtensions.has(extensionFor(filePath));
}

function isVideo(filePath) {
  return videoExtensions.has(extensionFor(filePath));
}

function titleFor(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

async function pathExists(dirPath) {
  try {
    await readdir(dirPath);
    return true;
  } catch {
    return false;
  }
}

async function firstExisting(paths) {
  for (const parts of paths) {
    const dirPath = path.join(assetsDir, ...parts);
    if (await pathExists(dirPath)) {
      return dirPath;
    }
  }

  return null;
}

async function walk(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  entries.sort((a, b) => collator.compare(a.name, b.name));

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function collectReels() {
  const reelsDir = await firstExisting(candidates.reels);
  if (!reelsDir) return [];

  const files = (await walk(reelsDir)).filter(isVideo);
  return files.map((filePath, index) => ({
    src: toAssetPath(filePath),
    type: "video",
    title: titleFor(filePath) || `REEL ${index + 1}`
  }));
}

async function collectPhotoMedia() {
  const photosDir = await firstExisting(candidates.photoFolders);
  const camcorderDir = await firstExisting(candidates.camcorder);
  const media = [];

  if (photosDir) {
    const entries = await readdir(photosDir, { withFileTypes: true });
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => collator.compare(a.name, b.name));

    for (const folder of folders) {
      const folderPath = path.join(photosDir, folder.name);
      const files = (await walk(folderPath)).filter(isImage);
      media.push(
        ...files.map((filePath) => ({
          src: toAssetPath(filePath),
          type: "image",
          title: titleFor(filePath)
        }))
      );
    }
  }

  if (camcorderDir) {
    const files = (await walk(camcorderDir)).filter(isVideo);
    media.push(
      ...files.map((filePath) => ({
        src: toAssetPath(filePath),
        type: "video",
        title: titleFor(filePath)
      }))
    );
  }

  return media;
}

function serialize(media) {
  return `window.portfolioMedia = ${JSON.stringify(
    {
      icloudShare,
      reels: media.reels,
      photos: media.photos
    },
    null,
    2
  )};\n`;
}

const media = {
  reels: await collectReels(),
  photos: await collectPhotoMedia()
};

await writeFile(mediaPath, serialize(media));

console.log(
  `Updated media.js with ${media.reels.length} reels and ${media.photos.length} photo-grid items.`
);
