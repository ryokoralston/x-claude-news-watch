import nodemailer from "nodemailer";

const REQUIRED_ENV_VARS = [
  "XAI_API_KEY",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "EVERNOTE_EMAIL",
  "EVERNOTE_NOTEBOOK",
];

function checkRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `[設定エラー] 以下の環境変数が未設定です: ${missing.join(", ")}\n` +
        `.env ファイル (このディレクトリ直下) に値を設定してください。`
    );
    process.exit(1);
  }
}

function buildPrompt() {
  return [
    "X(Twitter)上で、Claude Code(Anthropicのコーディングエージェント)に関する",
    "過去24時間以内の情報を検索してください。",
    "",
    "対象とする情報:",
    "- 新機能・アップデートの告知",
    "- 便利な使い方・Tips・ワークフロー共有",
    "- 注目度の高い議論や評価",
    "",
    "重複した内容や広告的な内容は除外し、最も価値がありそうな5件に絞ってください。",
    "",
    "各項目には以下を含めてください:",
    "- 一行要約(日本語)",
    "- 元投稿へのリンク",
    "- なぜ重要/面白いか一言",
    "",
    "出力はそのままメール本文として使えるプレーンテキスト形式",
    "(見出し+箇条書き)で返してください。Markdown記法(**太字**など)は使わず、",
    "プレーンテキストのみで整形してください。",
  ].join("\n");
}

async function callXaiApi() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180_000);

  try {
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-reasoning",
        input: buildPrompt(),
        tools: [{ type: "x_search" }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "(レスポンス本文の取得に失敗)");
      throw new Error(
        `xAI API がエラーを返しました: HTTP ${res.status} ${res.statusText}\n${body}`
      );
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractText(response) {
  // 1. response.output[].content[].text
  if (Array.isArray(response?.output)) {
    const texts = [];
    for (const item of response.output) {
      if (Array.isArray(item?.content)) {
        for (const contentItem of item.content) {
          if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
            texts.push(contentItem.text);
          }
        }
      }
    }
    if (texts.length > 0) {
      return texts.join("\n");
    }
  }

  // 2. response.output_text
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  // 3. response.text
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text;
  }

  // 4. response.content
  if (typeof response?.content === "string" && response.content.trim()) {
    return response.content;
  }

  throw new Error(
    `xAI APIレスポンスからテキストを抽出できませんでした。レスポンス全体:\n` +
      JSON.stringify(response, null, 2)
  );
}

async function sendEmail(bodyText) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const subject = `Claude Code X情報 ${dateStr} @${process.env.EVERNOTE_NOTEBOOK}`;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.EVERNOTE_EMAIL,
    subject,
    text: bodyText,
  };

  await transporter.sendMail(mailOptions);

  return { subject, to: process.env.EVERNOTE_EMAIL };
}

async function main() {
  checkRequiredEnvVars();

  let responseJson;
  try {
    responseJson = await callXaiApi();
  } catch (err) {
    console.error("[xAI API呼び出しエラー]", err.message ?? err);
    process.exit(1);
  }

  let bodyText;
  try {
    bodyText = extractText(responseJson);
  } catch (err) {
    console.error("[レスポンス解析エラー]", err.message ?? err);
    process.exit(1);
  }

  try {
    const { subject, to } = await sendEmail(bodyText);
    console.log(`[完了] メールを送信しました → 宛先: ${to} / 件名: ${subject}`);
  } catch (err) {
    console.error("[メール送信エラー]", err.message ?? err);
    process.exit(1);
  }
}

main();
