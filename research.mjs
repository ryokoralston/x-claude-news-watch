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
      `[Configuration error] The following environment variables are not set: ${missing.join(", ")}\n` +
        `Please set their values in the .env file (directly under this directory).`
    );
    process.exit(1);
  }
}

function buildPrompt() {
  return [
    "Search X (Twitter) for information from the past 24 hours related to",
    "Claude Code (Anthropic's coding agent).",
    "",
    "Look for:",
    "- Announcements of new features or updates",
    "- Useful tips, tricks, or workflow shares",
    "- Highly notable discussions or opinions",
    "",
    "Exclude duplicate or advertisement-like content, and narrow the results down to",
    "the 5 most valuable items.",
    "",
    "For each item, include:",
    "- A one-line summary written in Japanese",
    "- A link to the original post",
    "- A brief note (in Japanese) on why it's important or interesting",
    "",
    "Write all output text in Japanese.",
    "",
    "Return the output as plain text formatted so it can be used directly as an",
    "email body (a headline plus bullet points). Do not use Markdown formatting",
    "(such as **bold**) — format it as plain text only.",
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
      const body = await res.text().catch(() => "(failed to read response body)");
      throw new Error(
        `xAI API returned an error: HTTP ${res.status} ${res.statusText}\n${body}`
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
    `Could not extract text from the xAI API response. Full response:\n` +
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
    console.error("[xAI API call error]", err.message ?? err);
    process.exit(1);
  }

  let bodyText;
  try {
    bodyText = extractText(responseJson);
  } catch (err) {
    console.error("[Response parsing error]", err.message ?? err);
    process.exit(1);
  }

  console.log("[Digest body]\n" + bodyText);

  try {
    const { subject, to } = await sendEmail(bodyText);
    console.log(`[Done] Email sent → to: ${to} / subject: ${subject}`);
  } catch (err) {
    console.error("[Email send error]", err.message ?? err);
    process.exit(1);
  }
}

main();
