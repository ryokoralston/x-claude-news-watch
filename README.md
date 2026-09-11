# x-claude-news-watch

An automation script that, every morning at 6:00, researches 5 pieces of the latest Claude Code-related news on X (Twitter) and saves them as a note via Evernote's email import feature.

## Setup

### 1. Install dependencies and prepare the env file

```bash
npm install
cp .env.example .env
```

### 2. Get a Gmail app password

Prerequisite: 2-step verification must be enabled for the Gmail address you specify in `GMAIL_USER` in `.env`.

1. Go to https://myaccount.google.com/apppasswords
2. Generate a new app password
3. Paste the generated 16-character string into `GMAIL_APP_PASSWORD` in `.env`
   (it usually works whether or not you remove the spaces, so you can paste it as-is)

### 3. Configure the xAI API key and Evernote settings

- Paste your xAI API key into `XAI_API_KEY` in `.env`
- Paste your Evernote email import address (`xxxxx@m.evernote.com`, which you can find in Evernote's settings screen) into `EVERNOTE_EMAIL` in `.env`
- Specify the destination notebook name (create it in Evernote beforehand) in `EVERNOTE_NOTEBOOK` in `.env`

### 4. Manual test

Run the following in this directory and confirm that a note arrives in the specified Evernote notebook.

```bash
node --env-file=.env research.mjs
```

### 5. Enable the launchd job (macOS only)

Use `launchd/com.example.xclaudenews.plist` as a template — rewrite `/absolute/path/to/x-claude-news-watch` to your actual path before installing it.

```bash
cp launchd/com.example.xclaudenews.plist ~/Library/LaunchAgents/com.example.xclaudenews.plist
# Rewrite /absolute/path/to/x-claude-news-watch in the file to your actual path
launchctl load -w ~/Library/LaunchAgents/com.example.xclaudenews.plist
```

This makes it run automatically every morning at 6:00 (the time can be changed via the plist's `StartCalendarInterval`).

### 6. Disable the launchd job

```bash
launchctl unload ~/Library/LaunchAgents/com.example.xclaudenews.plist
```

### 7. Log locations

- stdout: `logs/stdout.log`
- stderr: `logs/stderr.log`

### 8. Troubleshooting

If notes aren't being filed into the expected notebook, check that the notebook name registered in Evernote exactly matches `EVERNOTE_NOTEBOOK` in `.env`.
