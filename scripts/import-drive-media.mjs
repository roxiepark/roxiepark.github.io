import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const rootFolderId = process.argv[2] || "1h74MX5g8dZEFbJpAqnZ5cTIkcaQA5VF9";
const rootDir = process.cwd();
const mediaPath = path.join(rootDir, "media.js");
const folderMimeType = "application/vnd.google-apps.folder";
const driveShare = `https://drive.google.com/drive/folders/${rootFolderId}`;
const visited = new Set();
const imageExtensions = new Set(["avif", "gif", "jpeg", "jpg", "png", "webp"]);
const videoExtensions = new Set(["avi", "m4v", "mov", "mp4", "ogv", "webm"]);
const collator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base"
});

function folderUrl(id) {
  return `https://drive.google.com/drive/folders/${id}?usp=drive_link`;
}

function fileUrl(id) {
  return `https://drive.google.com/file/d/${id}/view?usp=drivesdk`;
}

function downloadUrl(id) {
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

function thumbnailUrl(id, size = "w2000") {
  return `https://drive.google.com/thumbnail?id=${id}&sz=${size}`;
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
          mimeType: value[3],
          href:
            value.find(
              (entry) =>
                typeof entry === "string" &&
                entry.startsWith("https://drive.google.com/")
            ) || fileUrl(id)
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

function isImage(item) {
  return (
    item.mimeType.startsWith("image/") || imageExtensions.has(extensionFor(item.name))
  );
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

function localVideoPath(item, group) {
  const relativePath = `assets/drive-videos/${group}/${slugFor(item.name)}.mp4`;
  const absolutePath = path.join(rootDir, relativePath);
  return existsSync(absolutePath) ? relativePath : "";
}

function videoSourceFor(item, group) {
  const localPath = localVideoPath(item, group);

  if (localPath) {
    return {
      src: localPath,
      provider: "local"
    };
  }

  return {
    src: downloadUrl(item.id),
    provider: "drive"
  };
}

function pathSegments(item) {
  return item.path.split("/").map(normalizeText);
}

function isNumberedPhotoFolder(segment) {
  return /^[1-8](?:\s|$)/.test(segment);
}

function sortByPath(a, b) {
  return collator.compare(a.path, b.path);
}

function buildMedia(items) {
  const sortedItems = [...items].sort(sortByPath);
  const reels = [];
  const photos = [];

  for (const item of sortedItems) {
    const segments = pathSegments(item);

    if (
      segments[0] === "영상" &&
      segments[1] === "릴스" &&
      item.mimeType !== folderMimeType &&
      isVideo(item)
    ) {
      const source = videoSourceFor(item, "reels");
      reels.push({
        src: source.src,
        poster: thumbnailUrl(item.id, "w1200"),
        href: item.href,
        provider: source.provider,
        type: "video",
        title: titleFor(item.name)
      });
      continue;
    }

    if (
      segments[0] === "사진" &&
      isNumberedPhotoFolder(segments[1] || "") &&
      segments.length >= 3 &&
      item.mimeType !== folderMimeType &&
      isImage(item)
    ) {
      photos.push({
        src: thumbnailUrl(item.id),
        href: item.href,
        type: "image",
        title: titleFor(item.name)
      });
      continue;
    }

    if (
      segments[0] === "영상" &&
      segments[1] === "캠코더 영상" &&
      item.mimeType !== folderMimeType &&
      isVideo(item)
    ) {
      const source = videoSourceFor(item, "camcorder");
      photos.push({
        src: source.src,
        poster: thumbnailUrl(item.id, "w1200"),
        href: item.href,
        provider: source.provider,
        type: "video",
        title: titleFor(item.name)
      });
    }
  }

  return { reels, photos };
}

function serialize(media) {
  return `window.portfolioMedia = ${JSON.stringify(
    {
      driveShare,
      reels: media.reels,
      photos: media.photos
    },
    null,
    2
  )};\n`;
}

const items = await listFolder(rootFolderId);
const media = buildMedia(items);

await writeFile(mediaPath, serialize(media));

console.log(
  `Updated media.js from Google Drive with ${media.reels.length} reels and ${media.photos.length} photo-grid items.`
);
