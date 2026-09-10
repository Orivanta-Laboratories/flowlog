# @flowlog/extension

Chrome (Manifest V3) extension that adds browser-tab context — domain and
tab title — to your Flowlog timesheet, so time spent in a browser (research,
Figma, email, a client's web app) shows up alongside desktop-app activity.

It reuses the same device-token ingestion API as the desktop agent
(`GET /device/v1/config`, `POST /device/v1/events`); pair it from
**Settings → Devices** in the web app the same way you'd pair a desktop
device, then paste the token into the extension's options page.

## Develop

```bash
pnpm --filter @flowlog/extension dev
```

Load `apps/extension/dist` as an unpacked extension at
`chrome://extensions` (enable Developer mode first).

## Build

```bash
pnpm --filter @flowlog/extension build
```

## How it decides what to send

- Listens to tab activation, tab title/URL updates, window focus changes,
  and `chrome.idle` state — plus a once-a-minute heartbeat alarm (Chrome's
  minimum alarm granularity), since a background service worker can be
  killed and woken up rather than running a persistent timer.
- Only `http(s)` tab domains are ever considered; internal `chrome://` pages
  and extensions are ignored outright.
- A domain on your account's excluded-domains list (synced from the server
  every 10 minutes) is never queued — not stored, not sent, not redacted
  after the fact.
- Tab titles are sent as-is (same as the desktop agent) since they're your
  own browser's window titles, not page content.
