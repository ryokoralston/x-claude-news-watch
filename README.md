# x-claude-news-watch

An automation script that, every morning at 6:00, researches 5 pieces of the latest Claude Code-related news on X (Twitter) and saves them as a note via Evernote's email import feature.

## Sample Output

Actual note content from a real run (2026-09-10), delivered via email to the Evernote notebook
specified in `EVERNOTE_NOTEBOOK`:

```
Subject: Claude Code X情報 2026-09-10 @YourNotebook

Claude Code (Anthropicのコーディングエージェント) 過去24時間 X情報まとめ

- CLAUDE.mdファイルでClaude Codeの動作を改善する実践的なルール共有
  リンク: https://x.com/HeyAnjula/status/2098039144438272266
  重要性: 思考プロセスを明文化して効率を高めるワークフロー共有として価値が高い

- Anthropic公式の/claude-apiコマンドでコスト最適化やプロンプト監査が可能に
  リンク: https://x.com/code_hiyouga/status/2097952797115515300
  重要性: 新機能的なコマンド紹介で実務コスト削減に直結する注目情報

- CursorのProjects機能とClaude Codeの類似ワークフローを比較した議論
  リンク: https://x.com/jaimesolis/status/2098215164298383370
  重要性: 複数エージェントの常駐管理という先進的な意見交換で業界トレンドを示す

- Claude CodeでSaaSの空状態イラストをSVGとして生成するスキル共有
  リンク: https://x.com/GoSailGlobal/status/2098215014922661905
  重要性: デザイナー不要の具体的なTipsとして実用性が高く興味深い

- Boris ChernyのClaude Code活用トークから得たセットアップとTipsまとめ
  リンク: https://x.com/grok/status/2097979356211532191
  重要性: 初心者向け実践アドバイスが凝縮されワークフロー改善に役立つ
```

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
