# Hyeyoung Park Portfolio

Static portfolio page for reels, photos, and camcorder videos.

## Media Setup

The current media source is this Google Drive folder:

```text
https://drive.google.com/drive/folders/1h74MX5g8dZEFbJpAqnZ5cTIkcaQA5VF9
```

Download and encode the Drive videos for inline autoplay:

```sh
node scripts/download-drive-videos.mjs
```

Then regenerate `media.js` from the public Google Drive folder:

```sh
node scripts/import-drive-media.mjs
```

The importer adds videos from `영상/릴스` to the left reel column, adds images
from the numbered subfolders inside `사진` to the right grid, ignores files
directly inside `사진`, and adds videos from `영상/캠코더 영상` to the right grid.
When matching files exist in `assets/drive-videos`, the importer uses those
local MP4 files so videos autoplay and can be paused/played in place.

## Local Media Option

You can also download the media and place the files under `assets` with this
structure:

```text
assets/
  영상/
    릴스/
    캠코더 영상/
  사진/
    1 히로시마/
    2 도넛/
    3 태국/
    ...
    8 기타/
```

Then regenerate `media.js`:

```sh
node scripts/build-media.mjs
```

The script adds videos from `영상/릴스` to the left reel column, adds images
from the subfolders inside `사진` to the right grid, ignores images directly
inside `사진`, and adds videos from `영상/캠코더 영상` to the right grid.

Open `index.html` in a browser to view the site.
