# Studio Duo Commissions Bot

Discord bot for Studio Duo that turns commission requests into private ticket
channels. Built with `discord.js` v14, meant to run on Railway.

## Flow

1. On startup, the bot checks the configured commissions channel's pinned
   messages. If it hasn't posted a panel there yet (first run, or someone
   deleted/unpinned it), it posts and pins one automatically — **no command
   needed**.
2. Clicking **Open Commission** shows an ephemeral multi-select dropdown (3D
   Model, Map Build, UI per Frame, Not sure / Other).
3. Selecting service(s) shows a summary + **Confirm & Open Ticket** button —
   the person can change their selection before confirming. Only on confirm
   does the bot create a private channel `commission-<username>` under the
   configured "Commissions" category, visible only to that user and the
   staff role. The bot posts:
   - a summary embed listing the selected services + starting prices, with a
     prompt asking the user to reply with their deadline and a project
     description, plus a **Close Ticket** button
   - a Terms of Service embed (edit `src/data/tos.js`) with an **I Agree**
     button — only the ticket opener can click it
4. A user can't open a second ticket while one is already open — the bot
   checks for an existing `commission-<username>` channel at selection time
   and again right before creating the channel.
5. Staff run `/payment amount:75 label:"50% deposit"` in the ticket channel
   to post a payment-details embed with your links (edit
   `src/data/paymentMethods.js`) and a **Mark as Paid** button. Clicking it
   marks the embed paid and logs the amount for `/revenue`.
6. `/revenue period:week` (or `month` / `all`) gives a running total of
   confirmed payments, plus a 6-month trend chart. `/revenue-reset` wipes
   every logged payment (with a confirm/cancel step first) if you ever want
   to start the ledger over from $0.
7. When the commission is delivered, staff run `/feedback` in the ticket
   channel → posts a prompt with a **Leave a Review** button. The customer
   picks a 1–5 star rating, then writes a short review in a modal — it gets
   posted to the configured reviews/testimonials channel.
8. Staff click **Close Ticket** → bot saves a gzipped transcript to the log
   channel, then deletes the ticket channel a few seconds later.

## Project structure

```
src/
  index.js            entry point, wires up interaction routing, posts panel on boot
  config.js            loads .env into one config object
  deploy-commands.js   registers the /payment slash command
  data/
    services.js          the service options + starting prices
    theme.js              shared embed colors
    tos.js                 Terms of Service text shown in every new ticket
    paymentMethods.js     payment links shown by /payment
  utils/
    sanitize.js          username -> valid channel name
    transcript.js         fetches channel history -> plain text transcript
    paymentLedger.js       reads payment records back out of the log channel
  handlers/
    panel.js             builds panel embed + ensures it's posted/pinned
    openCommission.js    button -> shows the service select menu
    selectService.js     select menu -> shows selection summary + confirm button
    confirmCommission.js  confirm button -> creates ticket, posts summary + ToS
    tosAgree.js            "I Agree" button -> marks ToS agreed in the embed
    paymentCommand.js      /payment slash command -> payment details embed
    markPaid.js             "Mark as Paid" button -> updates embed + logs payment
    revenueCommand.js       /revenue slash command -> totals + chart from the ledger
    revenueReset.js          /revenue-reset command -> confirm/cancel prompt
    confirmRevenueReset.js    confirm button -> deletes all logged payments
    cancelRevenueReset.js      cancel button -> no-op
    requestFeedback.js     /feedback slash command -> posts "Leave a Review" prompt
    leaveReview.js          customer button -> star rating picker
    reviewStars.js          star pick -> review text modal
    submitReview.js          modal submit -> posts testimonial to reviews channel
    closeTicket.js         close button -> transcript + delete
```

To change prices or add/remove a service, edit `src/data/services.js`. To
change the Terms of Service wording, edit `src/data/tos.js`. To change
payment links, edit `src/data/paymentMethods.js`. Every other file reads
from these, nothing else needs to change.

## 1. Create the Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. **Bot** tab → **Reset Token**, copy it → this is `DISCORD_TOKEN`.
3. **Bot** tab → scroll to **Privileged Gateway Intents** → enable **Message
   Content Intent**. Without this, Discord redacts the text of every message
   in transcripts (they'll show up as `[no content]`) even though the bot
   can still read message metadata fine otherwise.
4. **OAuth2 → General** → copy **Client ID** → this is `CLIENT_ID` (needed for `/payment`).
5. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Manage Channels`, `View Channels`, `Send Messages`,
     `Manage Messages`, `Attach Files`, `Read Message History`, `Embed Links`
   - Open the generated URL and invite the bot to your server.

## 2. Set up server-side pieces

In your Discord server, create/note the IDs (enable Developer Mode in
Discord settings → Advanced, then right-click → Copy ID):

- The **commissions channel** the panel should live in → `COMMISSIONS_CHANNEL_ID`
- A role called **Studio Duo Team** (or whatever you like) → `STAFF_ROLE_ID`
- A category called **Commissions** → `COMMISSIONS_CATEGORY_ID`
- A private log channel (staff-only) for transcripts → `LOG_CHANNEL_ID`
- Optionally a separate channel for the payment ledger → `PAYMENT_LOG_CHANNEL_ID`
  (defaults to `LOG_CHANNEL_ID` if left blank — either is fine, it's just
  read back by `/revenue`, nobody needs to read it directly)
- A public channel for testimonials → `REVIEWS_CHANNEL_ID`
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
CLIENT_ID=
GUILD_ID=            # optional, for instant slash command registration during dev
COMMISSIONS_CHANNEL_ID=
STAFF_ROLE_ID=
NOTIFY_ROLE_ID=       # optional
COMMISSIONS_CATEGORY_ID=
LOG_CHANNEL_ID=
PAYMENT_LOG_CHANNEL_ID=  # optional, defaults to LOG_CHANNEL_ID
REVIEWS_CHANNEL_ID=
STAFF_ROLE_NAME=Studio Duo Team
```

## 4. Install and run

```bash
npm install
npm start
```

The `/payment` slash command registers itself automatically the moment the
bot logs in — no separate step needed, on Railway or anywhere else. On
startup you should see both:

```
Logged in as ...
Registered 1 slash command(s) globally.
Posted and pinned a new commission panel.
```

## 5. Deploy to Railway

1. Push this repo to GitHub (e.g. under `Reassetzin`).
2. In Railway: **New Project → Deploy from GitHub repo**, pick this repo.
3. Add the environment variables from step 3 in Railway's **Variables** tab.
4. Railway runs `npm install` then `npm start` automatically (from
   `package.json`). The panel gets posted and `/payment` gets registered
   on that first boot — nothing else to run.

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
