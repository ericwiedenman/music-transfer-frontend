// ========= CONFIG =========
// When you deploy the backend, set this to your API origin.
// Example: 'https://api.playlisttransfer.com' or your Render/Railway URL.
const BACKEND_BASE_URL = 'https://music-transfer-backend.onrender.com'; // <- set me
// ==========================

const qs = (sel) => document.querySelector(sel);
const statusEl = qs('#status');
const logEl = qs('#log');
const progressEl = qs('#progress');

const p = location.pathname;
if (p.endsWith('/connected/spotify') || p.includes('/connected/spotify')) {
  setStatus('Spotify connected ✅');
}
if (p.endsWith('/connected/tidal') || p.includes('/connected/tidal')) {
  setStatus('TIDAL connected ✅');
}

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent += `[${ts}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}
function setStatus(s) { statusEl.textContent = s; }

function openAuth(path) {
  if (!BACKEND_BASE_URL || BACKEND_BASE_URL.includes('YOUR-BACKEND-ORIGIN')) {
    alert('Set BACKEND_BASE_URL in app.js to your deployed API URL.');
    return;
  }
  // For OAuth flows, a full-page redirect is the simplest & most reliable on mobile
  window.location.href = `${BACKEND_BASE_URL}${path}`;
}

qs('#btnSpotify').addEventListener('click', () => openAuth('/auth/spotify/start'));
qs('#btnTidal').addEventListener('click', () => openAuth('/auth/tidal/start'));

qs('#btnStart').addEventListener('click', async () => {
  if (!BACKEND_BASE_URL || BACKEND_BASE_URL.includes('YOUR-BACKEND-ORIGIN')) {
    alert('Set BACKEND_BASE_URL in app.js to your deployed API URL.');
    return;
  }
  const includeLiked = qs('#includeLiked').checked;
  const selectAll = qs('#selectAll').checked;

  try {
    setStatus('Starting transfer…');
    progressEl.classList.remove('hidden');
    progressEl.value = 0;

    const res = await fetch(`${BACKEND_BASE_URL}/transfer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send/receive session cookie
      body: JSON.stringify({ includeLiked, selectAll }),
    });

    if (!res.ok) {
      const t = await res.text();
      setStatus('Error starting transfer');
      log(`Start error: ${t}`);
      return;
    }
    const { jobId } = await res.json();
    log(`Transfer started. Job ID: ${jobId}`);
    poll(jobId);
  } catch (e) {
    setStatus('Start failed');
    log(`Exception: ${e}`);
  }
});

async function poll(jobId) {
  let done = false;
  while (!done) {
    await new Promise(r => setTimeout(r, 1500));
    try {
      const r = await fetch(`${BACKEND_BASE_URL}/transfer/status/${jobId}`, { credentials: 'include' });
      const j = await r.json();

      // Expected shape: { status, meta: { progress, message } }
      const p = j?.meta?.progress ?? 0;
      const m = j?.meta?.message ?? j?.status ?? '';
      progressEl.value = Math.max(0, Math.min(100, p));
      setStatus(m);
      if (m) log(m);

      done = ['finished', 'failed'].includes(String(j.status).toLowerCase());
      if (done) {
        if (String(j.status).toLowerCase() === 'finished') {
          setStatus('Done! 🎉');
          progressEl.value = 100;
          log('Transfer complete.');
        } else {
          setStatus('Failed ❌');
          log('Transfer failed. Check server logs.');
        }
      }
    } catch (e) {
      log(`Poll error: ${e}`);
    }
  }
}
