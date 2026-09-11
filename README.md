# x-claude-news-watch

毎朝6:00に、X(Twitter)上のClaude Code関連の最新情報を5件調査し、Evernoteのメール取り込み機能経由でノートとして保存する自動化スクリプト。

## セットアップ手順

### 1. 依存パッケージのインストール・envファイルの用意

```bash
npm install
cp .env.example .env
```

### 2. Gmailアプリパスワードの取得

前提: `.env` の `GMAIL_USER` に指定した自分のGmailアドレスで2段階認証が有効になっていること。

1. https://myaccount.google.com/apppasswords にアクセス
2. アプリパスワードを新規生成する
3. 生成された16桁の文字列を `.env` の `GMAIL_APP_PASSWORD` に貼り付ける
   (スペースを詰めても詰めなくてもどちらでも動くことが多いので、そのまま貼ってよい)

### 3. xAI APIキー・Evernote情報の設定

- `.env` の `XAI_API_KEY` に、xAIのAPIキーを貼り付ける
- `.env` の `EVERNOTE_EMAIL` に、自分のEvernoteメール取り込みアドレス(`xxxxx@m.evernote.com`、Evernote設定画面で確認できる)を貼り付ける
- `.env` の `EVERNOTE_NOTEBOOK` に、保存先のノートブック名(事前にEvernote側で作成しておく)を指定する

### 4. 手動テスト

このディレクトリで以下を実行し、Evernoteの指定したノートブックにノートが届くか確認する。

```bash
node --env-file=.env research.mjs
```

### 5. launchdジョブの有効化(macOSのみ)

`launchd/com.example.xclaudenews.plist` をテンプレートとして使い、
`/absolute/path/to/x-claude-news-watch` を自分の実際のパスに書き換えてから配置する。

```bash
cp launchd/com.example.xclaudenews.plist ~/Library/LaunchAgents/com.example.xclaudenews.plist
# ファイル内の /absolute/path/to/x-claude-news-watch を実際のパスに書き換える
launchctl load -w ~/Library/LaunchAgents/com.example.xclaudenews.plist
```

これで毎朝6:00に自動実行されるようになる(時刻は plist の `StartCalendarInterval` で変更可能)。

### 6. launchdジョブの無効化

```bash
launchctl unload ~/Library/LaunchAgents/com.example.xclaudenews.plist
```

### 7. ログの確認場所

- 標準出力: `logs/stdout.log`
- 標準エラー: `logs/stderr.log`

### 8. トラブルシューティング

ノートが `X_Claude_News` ノートブックに正しく振り分けられない場合は、Evernote側に登録されている
ノートブック名の綴りが、`.env` の `EVERNOTE_NOTEBOOK` と完全一致しているか確認する。
