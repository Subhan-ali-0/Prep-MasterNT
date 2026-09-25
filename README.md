# Prep Master

Prep Master is a Next.js App Router learning interface with batch browsing, enrollment, nested course-content navigation and server-side playback proxying.

## User flow

1. **Home / Batches** → loads batches from `https://nt.studybeepro.site/batches.json` through `/api/batches`.
2. **Search** → filters the loaded batch list locally.
3. **Enroll** → stores the selected batch in browser localStorage (`pm_enrolled`) and makes it visible in **My Batches**.
4. **Study** → opens the selected batch's learning view using that batch's own ID/course ID; no folder IDs are hard-coded.
5. **Batch content** → calls the overview/content service through the server route `/api/content`.
6. **Folder navigation** → `folder=0` opens the course root; selecting a folder requests the selected folder ID and supports nested folders.
7. **Lesson/content** → if an item already contains a media/PDF URL it opens it; otherwise the app calls `/api/playback` with the selected `content_id` and `course_id`.
8. **Playback** → `/api/playback` adds `STUDYBEE_KEY` and `STUDYBEE_DEVICE_ID` on the server only, then the UI uses an HLS/MP4/PDF URL returned by the service when available.
9. **Bottom navigation** → Community and AI Doubts currently show “coming soon”; My Batches and Batches are functional.
10. **3-dot menu** → Batches, My Batches, Join Telegram, Contact Owner.

## API links / integration map

### Batch list
`https://nt.studybeepro.site/batches.json`

### Course overview/content
Overview pattern:
`https://nt.studybeepro.site/api/nig?overview={BATCH_OR_COURSE_ID}`

Root/nested content pattern:
`https://nt.studybeepro.site/api/nig?content={BATCH_OR_COURSE_ID}&folder={FOLDER_ID}`

Examples supplied during setup:
- `https://nt.studybeepro.site/api/nig?overview=101`
- `https://nt.studybeepro.site/api/nig?content=101&folder=0`
- `https://nt.studybeepro.site/api/nig?content=101&folder=6667`
- `https://nt.studybeepro.site/api/nig?content=101&folder=19322`
- `https://nt.studybeepro.site/api/nig?content=101&folder=19323`

### Playback
`https://nt.studybeepro.site/api/foy?content_id={CONTENT_ID}&course_id={COURSE_ID}&key={SERVER_KEY}&device_id={SERVER_DEVICE_ID}`

The actual browser app calls `/api/playback`; the secret values are inserted only by the server route.

### Class endpoints supplied for reference
- `https://nt.studybeepro.site/api/play?action=classes&type=1&course_id={COURSE_ID}&key={SERVER_KEY}&device_id={SERVER_DEVICE_ID}`
- `https://nt.studybeepro.site/api/play?action=classes&type=0&course_id={COURSE_ID}&key={SERVER_KEY}&device_id={SERVER_DEVICE_ID}`

These are documented here but are not hard-coded into the UI because the content route is designed to follow the selected batch dynamically.

### Media examples supplied during setup
- HLS example: `https://dbil3go8szhu6.cloudfront.net/file_library/videos/channelvod_non_drm_hls/...m3u8`
- PDF example: `https://dyind2lqy6eys.cloudfront.net/1770981347/admin_v2/content/pdf/...pdf`
- Plyr asset: `https://cdn.plyr.io/3.7.8/plyr.svg`

Examples are reference URLs only; the app does not hard-code a specific lecture's media URL.

## Environment variables

Set these in Netlify/Render/Vercel, not in GitHub:

```env
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/prepmaster0
NEXT_PUBLIC_OWNER_CONTACT=https://t.me/Subhanali011
STUDYBEE_KEY=YOUR_SERVER_KEY
STUDYBEE_DEVICE_ID=YOUR_SERVER_DEVICE_ID
```

Do not commit `.env.local` or real server credentials. Next.js supports environment variables and server-side route handlers; keeping the playback credentials in `/api/playback` prevents them from being bundled into the browser client.

## Project structure

```text
app/
  api/
    batches/route.js
    content/route.js
    playback/route.js
  globals.css
  layout.js
  page.js
public/
  prep-master-icon.png
  prep-master-logo.png
PrepMasterApp.js
.env.example
.gitignore
next.config.mjs
package.json
README.md
```

## Build

```bash
npm install
npm run build
npm start
```
