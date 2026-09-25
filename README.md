# Prep Master Admin Build

Includes PrepMasterApp.js, globals.css, admin panel, MongoDB-backed settings/batch overrides, and API proxy routes.

Set these environment variables on Render:
MONGODB_URI=
MONGODB_DB=prep-master
ADMIN_PASSWORD=your-private-password
ADMIN_API_KEY=long-random-secret
STUDYBEE_KEY=
STUDYBEE_DEVICE_ID=
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/prepmaster0
NEXT_PUBLIC_OWNER_CONTACT=https://t.me/Subhanali011

Never commit real secrets to GitHub.

The admin panel edits your MongoDB overrides/settings. It does not bypass or modify locked content on the external source.
