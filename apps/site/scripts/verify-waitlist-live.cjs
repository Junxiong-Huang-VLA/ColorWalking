/* eslint-disable no-console */
const DEFAULT_SITE = "https://www.colorful-lamb-rolls.cloud";

function requireOk(response, json, action) {
  if (!response.ok) {
    throw new Error(`[${action}] HTTP ${response.status}: ${JSON.stringify(json)}`);
  }
  if (!json || json.ok !== true) {
    throw new Error(`[${action}] payload not ok: ${JSON.stringify(json)}`);
  }
}

async function requestJson(url, init, action) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`[${action}] non-json response: ${text.slice(0, 400)}`);
  }
  requireOk(response, json, action);
  return json;
}

async function main() {
  const site = String(process.env.WAITLIST_VERIFY_SITE_URL || DEFAULT_SITE).replace(/\/+$/, "");
  const seed = Date.now();
  const name = process.env.WAITLIST_VERIFY_NAME || "Live Verify";
  const email = process.env.WAITLIST_VERIFY_EMAIL || `live+${seed}@example.com`;
  const intent = process.env.WAITLIST_VERIFY_INTENT || "想第一时间收到实体版内测通知";
  const source = process.env.WAITLIST_VERIFY_SOURCE || "future";

  const createUrl = `${site}/api/waitlist`;
  const created = await requestJson(
    createUrl,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        intent,
        source,
        clientAt: new Date().toISOString(),
        website: ""
      })
    },
    "create_waitlist"
  );

  const waitlist = created.waitlist;
  if (!waitlist || !waitlist.id) {
    throw new Error(`[create_waitlist] missing waitlist id: ${JSON.stringify(created)}`);
  }
  const id = waitlist.id;

  const update = async (status) =>
    requestJson(
      `${site}/api/waitlist/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status })
      },
      `set_status_${status}`
    );

  await update("queued");
  await update("uploading");
  await update("success");

  const fetched = await requestJson(`${site}/api/waitlist/${encodeURIComponent(id)}`, { method: "GET" }, "fetch_waitlist");
  const finalStatus = fetched.waitlist?.status;
  if (finalStatus !== "success") {
    throw new Error(`[fetch_waitlist] expected success, got ${finalStatus}`);
  }

  console.log(`waitlist live verify passed`);
  console.log(`site=${site}`);
  console.log(`id=${id}`);
  console.log(`status=${finalStatus}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
