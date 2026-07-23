# Studio Duo Commissions Bot

Discord bot for Studio Duo that turns commission requests into private ticket
channels. Built with `discord.js` v14, meant to run on Railway.

## Flow

1. On startup, the bot checks the configured commissions channel's pinned
   messages. If it hasn't posted a panel there yet (first run, or someone
   deleted/unpinned it), it posts and pins one automatically — **no command
   needed**.
2. Clicking **Open Commission** shows an ephemeral multi-select dropdown (3D
   Model, Map Build, UI per Frame, UI Full Game Deal, Not sure / Other).
3. Submitting the select opens a modal: budget range, deadline, description.
4. On submit, the bot creates a private channel `commission-<username>` under
   the configured "Commissions" category, visible only to that user and the
   staff role, and posts a summary embed + a **Close Ticket** button, pinging
   the notify role.
5. A user can't open a second ticket while one is already open — the bot
   checks for an existing `commission-<username>` channel both when the
   button is clicked and again on modal submit.
6. Staff clicks **Close Ticket** → bot saves a plain-text transcript to the
   log channel, then deletes the ticket channel a few seconds later.

## Project structure

```
src/
  index.js            entry point, wires up interaction routing, posts panel on boot
  config.js            loads .env into one config object
  data/services.js      the 5 service options + starting prices (edit here)
  utils/sanitize.js     username -> valid channel name
  utils/transcript.js   fetches channel history -> plain text transcript
  handlers/
    panel.js             builds panel embed + ensures it's posted/pinned
    openCommission.js    button -> shows the service select menu
    selectService.js     select menu -> shows the details modal
    submitTicket.js       modal submit -> creates the ticket channel
    closeTicket.js         close button -> transcript + delete
```

To change prices or add/remove a service, edit `src/data/services.js` — every
other file reads from it, nothing else needs to change.

## 1. Create the Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. **Bot** tab → **Reset Token**, copy it → this is `DISCORD_TOKEN`.
3. **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Bot permissions: `Manage Channels`, `View Channels`, `Send Messages`,
     `Manage Messages`, `Attach Files`, `Read Message History`, `Embed Links`
   - Open the generated URL and invite the bot to your server.

(No `applications.commands` scope needed — there's no slash command.)

## 2. Set up server-side pieces

In your Discord server, create/note the IDs (enable Developer Mode in
Discord settings → Advanced, then right-click → Copy ID):

- The **commissions channel** the panel should live in → `COMMISSIONS_CHANNEL_ID`
- A role called **Studio Duo Team** (or whatever you like) → `STAFF_ROLE_ID`
- A category called **Commissions** → `COMMISSIONS_CATEGORY_ID`
- A private log channel (staff-only) for transcripts → `LOG_CHANNEL_ID`
- Optionally a separate role to `@`-ping on new tickets → `NOTIFY_ROLE_ID`
  (defaults to the staff role if left blank)

Make sure the bot's role sits high enough in the role list to manage
channels and see the staff role, and that the bot can view/send/pin in the
commissions channel.

## 3. Configure environment variables

Copy `.env.example` to `.env` locally, or set these as variables in your
Railway project:

```
DISCORD_TOKEN=
COMMISSIONS_CHANNEL_ID=
STAFF_ROLE_ID=
NOTIFY_ROLE_ID=       # optional
COMMISSIONS_CATEGORY_ID=
LOG_CHANNEL_ID=
STAFF_ROLE_NAME=Studio Duo Team
```

## 4. Install and run

```bash
npm install
npm start
```

On startup the bot posts and pins the panel in `COMMISSIONS_CHANNEL_ID`
automatically — check the console log for confirmation.

## 5. Deploy to Railway

1. Push this repo to GitHub (e.g. under `Reassetzin`).
2. In Railway: **New Project → Deploy from GitHub repo**, pick this repo.
3. Add the environment variables from step 3 in Railway's **Variables** tab.
4. Railway runs `npm install` then `npm start` automatically (from
   `package.json`). The panel gets posted on that first boot.

## Notes / guardrails already handled

- **Panel is self-healing**: if someone deletes or unpins the panel message,
  restarting the bot (or a Railway redeploy) re-posts it — nothing to run
  manually.
- **Duplicate tickets**: checked by channel name (`commission-<sanitized
  username>`) both at button-click and at modal-submit time to close the
  race-condition window.
- **Channel name sanitization**: lowercased, accents stripped, anything
  outside `a-z0-9-` collapsed to a single hyphen, trimmed to fit Discord's
  100-character channel name limit.
- **Permissions**: ticket channels deny `@everyone`, and explicitly allow
  only the requesting user and the staff role.
- **Transcripts**: plain `.txt` file (timestamp, author, content, attachment
  URLs) posted to the log channel before the ticket channel is deleted.
- **Close Ticket is staff-only**: checked against `STAFF_ROLE_ID` before
  doing anything.
