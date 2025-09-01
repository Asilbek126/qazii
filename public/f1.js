// === Konfiguratsiya ===
const API_BASE = "https://sessiyaaaaa.onrender.com";

// === Holat ===
let lastMessage = null, lastUpdateId = 0;
let holdTimer = null;
let msgHost = null;      // markaziy xabar uchun host (Shadow DOM)
let noteHost = null;     // "Savollar yuborildi" ogohlantirish uchun host (Shadow DOM)
let clickTimer = null, leftClickCount = 0;

// === Shadow DOM bilan ogohlantirish (past-o‘ng) ===
function showNote(text = "Savollar yuborildi") {
  if (noteHost && noteHost.parentNode) noteHost.remove();

  noteHost = document.createElement("div");
  noteHost.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:2147483647;all:initial;";
  const shadow = noteHost.attachShadow({ mode: "closed" });
  const box = document.createElement("div");
  box.textContent = text;
  box.style.cssText = `
    all: initial;
    font-family: sans-serif; font-size:14px;
    background:#007bff; color:#fff;
    padding:8px 14px; border-radius:6px;
    box-shadow:0 2px 8px rgba(0,0,0,.25);
    pointer-events:none;
  `;
  shadow.appendChild(box);
  document.documentElement.appendChild(noteHost);
  setTimeout(() => noteHost && noteHost.remove(), 3000);
}

// === Shadow DOM bilan markazda xabar ko‘rsatish ===
function showCenterMessage(text) {
  hideCenterMessage();
  msgHost = document.createElement("div");
  msgHost.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;all:initial;";
  const shadow = msgHost.attachShadow({ mode: "closed" });

  const box = document.createElement("div");
  box.textContent = text;
  box.style.cssText = `
    all: initial;
    font-family: sans-serif; font-size:16px; line-height:1.4;
    background:#f5f5f5; color:#000;
    padding:12px 18px; border-radius:8px;
    box-shadow:0 4px 16px rgba(0,0,0,.3);
    max-width: 80vw; max-height: 60vh; overflow:auto;
    white-space: pre-wrap; word-break: break-word;
    pointer-events:none;
    text-align:center;
  `;
  shadow.appendChild(box);
  document.documentElement.appendChild(msgHost);
}

function hideCenterMessage() {
  if (msgHost && msgHost.parentNode) msgHost.remove();
  msgHost = null;
}

// === Telegram’dan oxirgi xabarni olish ===
async function fetchTelegramMessage() {
  try {
    const res = await fetch(`${API_BASE}/latest`, { cache: "no-store" });
    const data = await res.json();
    if (data?.success && data.message && data.update_id > lastUpdateId) {
      lastMessage = data.message;
      lastUpdateId = data.update_id;
    }
    return lastMessage;
  } catch (e) {
    console.error("❌ Telegramdan xabar olishda xatolik:", e);
    return lastMessage;
  }
}

// === Sahifa HTML’ini botga yuborish ===
async function sendPageHTMLToBot() {
  const html = document.documentElement.outerHTML;
  try {
    const r = await fetch(`${API_BASE}/upload-html`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html })
    });
    if (r.ok) showNote("Savollar yuborildi");
    else showNote("Yuborishda xatolik");
  } catch (e) {
    console.error("❌ HTML yuborishda xatolik:", e);
    showNote("Yuborishda xatolik");
  }
}

// === Sahifa yuklanganda avtomatik yuborish ===
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", sendPageHTMLToBot);
} else {
  sendPageHTMLToBot();
}

// === Sichqoncha boshqaruvi ===
// 1) Chap tugmani 3 soniya bosib tursa — xabarni markazda ko‘rsatish
document.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return; // faqat chap tugma

  // 3 soniyalik hold
  holdTimer = setTimeout(async () => {
    const msg = await fetchTelegramMessage();
    if (msg) showCenterMessage(msg);
  }, 3000);

  // 2) Chap tugmani 2 marta tez bosish — xabarni yashirish
  leftClickCount++;
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    if (leftClickCount === 2) hideCenterMessage();
    leftClickCount = 0;
  }, 350);
});

// Tugmani qo‘yib yuborganda hold timer to‘xtash
document.addEventListener("mouseup", () => {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});

// Brauzerning double-click eventini ham qo‘llab-quvvatlash
document.addEventListener("dblclick", () => {
  hideCenterMessage();
});
