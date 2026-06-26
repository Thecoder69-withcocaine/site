const grid = document.getElementById('grid');

function card(title, rows) {
  const el = document.createElement('div');
  el.className = 'card';

  const heading = document.createElement('div');
  heading.className = 'card-title';
  heading.textContent = title;
  el.appendChild(heading);

  const rowsEl = document.createElement('div');
  rowsEl.className = 'rows';

  for (const [key, val] of rows) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span class="row-key">${key}</span><span class="row-val">${val}</span>`;
    rowsEl.appendChild(row);
  }

  el.appendChild(rowsEl);
  return el;
}

function pill(text, color) {
  return `<span class="pill pill-${color}">${text}</span>`;
}

function browserCard() {
  const ua = navigator.userAgent;
  const lang = navigator.language || 'unknown';
  const langs = navigator.languages ? navigator.languages.join(', ') : lang;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  const cookiesEnabled = navigator.cookieEnabled;
  const dnt = navigator.doNotTrack;
  const dntVal = dnt === '1' ? pill('enabled', 'green') : dnt === '0' ? pill('disabled', 'red') : pill('unset', 'muted');

  let adblock = false;
  try {
    const bait = document.createElement('div');
    bait.className = 'ad-banner ads advertisement';
    bait.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px';
    document.body.appendChild(bait);
    adblock = bait.offsetParent === null || bait.offsetHeight === 0;
    document.body.removeChild(bait);
  } catch {}

  return card('Browser', [
    ['User Agent', `<span style="word-break:break-word;font-size:11px">${ua}</span>`],
    ['Language', langs],
    ['Timezone', tz],
    ['Cookies', cookiesEnabled ? pill('enabled', 'green') : pill('disabled', 'red')],
    ['Do Not Track', dntVal],
    ['Adblock', adblock ? pill('detected', 'amber') : pill('not detected', 'muted')],
  ]);
}

function screenCard() {
  const w = screen.width, h = screen.height;
  const iw = window.innerWidth, ih = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const depth = screen.colorDepth || screen.pixelDepth || 'unknown';
  const orient = screen.orientation?.type || 'unknown';

  return card('Display', [
    ['Screen', `${w} × ${h}`],
    ['Viewport', `${iw} × ${ih}`],
    ['Pixel Ratio', dpr.toFixed(2) + 'x'],
    ['Color Depth', `${depth}-bit`],
    ['Orientation', orient],
    ['Touch Points', `${navigator.maxTouchPoints}`],
  ]);
}

function hardwareCard() {
  const cores = navigator.hardwareConcurrency || 'unknown';
  const mem = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'unknown';

  let gpu = 'unknown', vendor = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
      }
    }
  } catch {}

  const arch = (() => {
    const canvas = document.createElement('canvas');
    try {
      const ctx = canvas.getContext('2d');
      ctx.fillText('a', 0, 10);
      return navigator.userAgent.includes('x86_64') || navigator.userAgent.includes('WOW64') ? 'x86 64-bit'
           : navigator.userAgent.includes('arm') ? 'ARM'
           : 'unknown';
    } catch { return 'unknown'; }
  })();

  const pointer = (() => {
    if (window.matchMedia('(pointer: coarse)').matches) return 'Touch';
    if (window.matchMedia('(pointer: fine)').matches) return 'Mouse';
    return 'unknown';
  })();

  return card('Hardware', [
    ['CPU Cores', cores + ' logical'],
    ['CPU Arch', arch],
    ['Browser Mem', mem],
    ['GPU', `<span style="word-break:break-word;font-size:11px">${gpu}</span>`],
    ['GPU Vendor', vendor],
    ['Pointer', pointer],
  ]);
}

function canvasFingerprintCard() {
  let hash = 'unavailable';
  let gradient = '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, 280, 60);

    const grd = ctx.createLinearGradient(0, 0, 280, 0);
    grd.addColorStop(0, '#7c6af7');
    grd.addColorStop(0.5, '#4ade80');
    grd.addColorStop(1, '#fbbf24');
    ctx.fillStyle = grd;
    ctx.font = '14px monospace';
    ctx.fillText('Cwm fjordbank glyphs vext quiz', 4, 22);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(250, 40, 18, 0, Math.PI * 2);
    ctx.fill();

    const data = canvas.toDataURL();
    let h = 0;
    for (let i = 0; i < data.length; i++) {
      h = (Math.imul(31, h) + data.charCodeAt(i)) | 0;
    }
    hash = Math.abs(h).toString(16).padStart(8, '0');
    gradient = data;
  } catch {}

  const hashEl = `<span class="ip-badge">${hash}</span>`;
  const preview = gradient
    ? `<div class="canvas-fingerprint"><img src="${gradient}" style="width:100%;height:100%;object-fit:cover;border-radius:3px" alt="canvas"></div>`
    : '';

  return card('Canvas Fingerprint', [
    ['Hash', hashEl],
    ['Method', 'text + arc + gradient'],
    ['Stable across visits', pill('yes', 'amber')],
    ['Preview', preview],
  ]);
}

async function batteryCard() {
  const el = card('Battery', [['Status', '<span class="loading-row"></span>']]);
  grid.appendChild(el);
  try {
    const bat = await navigator.getBattery();
    const level = Math.round(bat.level * 100);
    const charging = bat.charging;
    const levelColor = level > 50 ? 'green' : level > 20 ? 'amber' : 'red';

    const rows = [
      ['Level', pill(level + '%', levelColor)],
      ['Charging', charging ? pill('yes', 'green') : pill('no', 'muted')],
    ];
    if (!charging && bat.dischargingTime !== Infinity) {
      const mins = Math.round(bat.dischargingTime / 60);
      rows.push(['Time left', `${Math.floor(mins / 60)}h ${mins % 60}m`]);
    }

    el.innerHTML = '';
    const newCard = card('Battery', rows);
    el.appendChild(newCard.querySelector('.card-title'));
    el.appendChild(newCard.querySelector('.rows'));
  } catch {
    el.innerHTML = '';
    const newCard = card('Battery', [['Status', pill('API unavailable', 'muted')]]);
    el.appendChild(newCard.querySelector('.card-title'));
    el.appendChild(newCard.querySelector('.rows'));
  }
  return null;
}

function audioCard() {
  let hash = 'unavailable';
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
    const osc = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();
    const scriptNode = ctx.createScriptProcessor(4096, 1, 1);

    gain.gain.value = 0;
    osc.type = 'triangle';
    osc.connect(analyser);
    analyser.connect(scriptNode);
    scriptNode.connect(gain);
    gain.connect(ctx.destination);

    osc.start(0);

    const buf = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(buf);

    let h = 0;
    for (let i = 0; i < buf.length; i++) {
      h = (Math.imul(31, h) + Math.round(buf[i] * 1000)) | 0;
    }
    hash = Math.abs(h).toString(16).padStart(8, '0');
    osc.stop();
    ctx.close();
  } catch {}

  return card('Audio Fingerprint', [
    ['Hash', `<span class="ip-badge">${hash}</span>`],
    ['Method', 'OscillatorNode → AnalyserNode'],
    ['Stable across visits', pill('yes', 'amber')],
  ]);
}

function mediaCard() {
  const types = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'video/ogg': 'video/ogg',
  };

  const video = document.createElement('video');
  const rows = [];

  for (const [mime, label] of Object.entries(types)) {
    const support = video.canPlayType(mime);
    const p = support === 'probably' ? pill('yes', 'green')
            : support === 'maybe'    ? pill('maybe', 'amber')
                                     : pill('no', 'muted');
    rows.push([label, p]);
  }

  return card('Media Support', rows);
}

function networkInfoCard() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return null;

  const rows = [];
  if (conn.effectiveType) rows.push(['Effective Type', pill(conn.effectiveType, 'accent')]);
  if (conn.downlink)      rows.push(['Downlink', conn.downlink + ' Mbps']);
  if (conn.rtt !== undefined) rows.push(['RTT', conn.rtt + ' ms']);
  if (conn.saveData !== undefined) rows.push(['Data Saver', conn.saveData ? pill('on', 'amber') : pill('off', 'muted')]);

  if (rows.length === 0) return null;
  return card('Network Hints', rows);
}

async function ipCard() {
  const el = card('Network (IP)', [['IP', '<span class="loading-row"></span>']]);
  grid.insertBefore(el, grid.firstChild);

  try {
    const r = await fetch('https://ipapi.co/json/');
    const d = await r.json();

    const rows = [
      ['IP Address', `<span class="ip-badge">${d.ip}</span>`],
      ['ISP', d.org || 'unknown'],
      ['ASN', d.asn || 'unknown'],
      ['City', d.city || 'unknown'],
      ['Region', d.region || 'unknown'],
      ['Country', d.country_name || 'unknown'],
      ['Coords', d.latitude && d.longitude ? `${d.latitude}, ${d.longitude}` : 'unknown'],
      ['Timezone', d.timezone || 'unknown'],
    ];

    el.innerHTML = '';
    const newCard = card('Network (IP)', rows);
    el.appendChild(newCard.querySelector('.card-title'));
    el.appendChild(newCard.querySelector('.rows'));
  } catch {
    el.innerHTML = '';
    const newCard = card('Network (IP)', [['Status', pill('fetch failed', 'red')]]);
    el.appendChild(newCard.querySelector('.card-title'));
    el.appendChild(newCard.querySelector('.rows'));
  }
}

function render() {
  grid.appendChild(browserCard());
  grid.appendChild(screenCard());
  grid.appendChild(hardwareCard());
  grid.appendChild(canvasFingerprintCard());
  grid.appendChild(audioCard());
  grid.appendChild(mediaCard());

  const net = networkInfoCard();
  if (net) grid.appendChild(net);

  batteryCard();
  ipCard();
}

render();
