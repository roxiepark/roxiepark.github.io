const rootFolderId = process.argv[2];

if (!rootFolderId) {
  console.error("Usage: node scripts/inspect-drive-folder.mjs <folder-id>");
  process.exit(1);
}

const folderUrl = (id) => `https://drive.google.com/drive/folders/${id}?usp=drive_link`;
const folderMimeType = "application/vnd.google-apps.folder";
const visited = new Set();

function decodeDriveString(html) {
  const match = html.match(
    /window\['_DRIVE_ivd'\]\s*=\s*'((?:\\.|[^'])*)'/s
  );

  if (!match) {
    return null;
  }

  return Function(`return '${match[1]}'`)();
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
          name: value[2],
          mimeType: value[3],
          url:
            value.find(
              (entry) =>
                typeof entry === "string" &&
                entry.startsWith("https://drive.google.com/")
            ) || ""
        });
      }
    }

    value.forEach(visit);
  }

  visit(data);
  return items;
}

async function listFolder(folderId, depth = 0, path = "") {
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
    depth,
    path: path ? `${path}/${item.name}` : item.name
  }));
  const nested = [];

  for (const item of items) {
    if (item.mimeType === folderMimeType) {
      nested.push(...(await listFolder(item.id, depth + 1, item.path)));
    }
  }

  return [...items, ...nested];
}

const items = await listFolder(rootFolderId);

console.log(JSON.stringify(items, null, 2));
