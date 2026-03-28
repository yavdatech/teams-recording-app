# Teams App Package

This folder contains the Teams app package template and icons for the Meeting Recorder calling bot.

Build the final installable package with:

```bash
npm run render:teams-package
```

That script reads values from `.env`, renders `manifest.json` into `build/teams-app-package/`, copies the icons, and writes `build/meeting-recorder-teams-app.zip`.

Notes:

- This package is for the calling bot identity only.
- The backend service still hosts the bot control APIs and Graph callback endpoints.
- Meeting participants can remove the bot from the roster inside Teams, and operators can also call the backend leave API.
