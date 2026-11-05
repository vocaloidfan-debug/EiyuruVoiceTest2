const ctx = new (window.AudioContext || window.webkitAudioContext)();
let vb = {}, instB = null, instS = null, notes = [], playing = false;
const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], scale = [];

for (let o = 5; o >= 3; o--) {
    for (let i = 11; i >= 0; i--) {
        const name = names[i] + o;
        scale.push({ name, f: 440 * Math.pow(2, ((o - 4) * 12 + i - 9) / 12), b: name.includes('#') });
    }
}

const g = document.getElementById('g'); 
g.style.height = (scale.length * 30) + 'px'; 
g.style.width = '2000px';

scale.forEach((n) => {
    const el = document.createElement('div'); el.className = `key ${n.b ? 'b' : ''}`; el.innerHTML = `<span>${n.name}</span>`;
    el.onclick = () => syn(n.f, "a", 0.4); document.getElementById('pno').appendChild(el);
});

const map = { 'a':'あ','i':'い','u':'う','e':'え','o':'お','ka':'か','ki':'き','ku':'く','ke':'け','ko':'こ','sa':'さ','shi':'し','su':'す','se':'せ','so':'そ','ta':'た','chi':'ち','tsu':'つ','te':'て','to':'と','na':'な','ni':'に','nu':'ぬ','ne':'ね','no':'の','ha':'は','hi':'ひ','fu':'ふ','he':'へ','ho':'ほ','ma':'ま','mi':'み','mu':'む','me':'め','mo':'も','ra':'ら','ri':'り','ru':'る','re':'れ','ro':'ろ','wa':'わ','n':'ん' };
const rev = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
function tr(t) { return map[t.toLowerCase()] || rev[t] || t; }

function add(e) {
    if (e.target !== g) return;
    const r = g.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / 40) * 40, y = Math.floor((e.clientY - r.top) / 30) * 30, i = y / 30;
    if (i >= 0 && i < scale.length) {
        const id = 'n_' + Date.now(), el = document.createElement('div');
        el.className = 'note'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = '80px';
        const inp = document.createElement('input'); inp.value = 'a'; inp.onchange = (e) => e.target.value = tr(e.target.value);
        const del = document.createElement('span'); del.innerHTML = '✕'; del.onclick = (ev) => { ev.stopPropagation(); el.remove(); notes = notes.filter(n => n.id !== id); };
        el.appendChild(inp); el.appendChild(del); g.appendChild(el);
        notes.push({ id, inp, f: scale[i].f, x, w: 80 }); syn(scale[i].f, "a", 0.3);
    }
}

function syn(f, lyr, d) {
    const o = ctx.createOscillator(), gain = ctx.createGain(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * Math.pow(2, parseFloat(document.getElementById('pit').value) / 1200), ctx.currentTime);
    const v = parseFloat(document.getElementById('vib').value);
    if (v > 0) {
        const vO = ctx.createOscillator(), vG = ctx.createGain(); vO.frequency.value = 6; vG.gain.value = v * 0.1;
        vO.connect(vG); vG.connect(o.frequency); vO.start(); vO.stop(ctx.currentTime + d);
    }
    const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = (lyr === 'e' || lyr === 'え') ? 500 : 700; fl.Q.value = 5;
    o.connect(fl); fl.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + d);
    o.start(); o.stop(ctx.currentTime + d);
}

function play() {
    if (playing) { playing = false; document.getElementById('pBtn').innerText = "▶ Play"; if(instS) try{instS.stop()}catch(e){} return; }
    playing = true; document.getElementById('pBtn').innerText = "■ Stop";
    const bD = 60 / parseInt(document.getElementById('bpm').value);
    if (instB) { instS = ctx.createBufferSource(); instS.buffer = instB; instS.connect(ctx.destination); instS.start(0); }
    notes.forEach(n => {
        const s = (n.x / 40) * (bD / 2), d = (n.w / 40) * (bD / 2);
        setTimeout(() => {
            if (!playing) return; const l = n.inp.value.trim().toLowerCase();
            if(vb[l]) {
                const src = ctx.createBufferSource(); src.buffer = vb[l]; src.playbackRate.value = n.f / 261.63; src.connect(ctx.destination); src.start(0); src.stop(ctx.currentTime + d);
            } else { syn(n.f, l, d); }
        }, s * 1000);
    });
}

function ldInst() { const f = document.getElementById('inst').files, r = new FileReader(); r.onload = (e) => ctx.decodeAudioData(e.target.result, b => instB = b); r.readAsArrayBuffer(f[0]); }
// Dosya yükleme düzeltildi (f[0])
function ldVb() {
    JSZip.loadAsync(document.getElementById('vb').files[0]).then(zip => {
        zip.forEach((p, entry) => { if (entry.name.endsWith('.wav')) { const l = entry.name.split('/').pop().replace('.wav', '').toLowerCase(); entry.async("arraybuffer").then(d => ctx.decodeAudioData(d, b => vb[l] = b)); } });
        alert("VB Loaded");
    });
}
function cvPh() { const i = document.getElementById('ph'); i.value = tr(i.value); }
// Temizleme fonksiyonu
function clr() { document.getElementById('g').innerHTML = ''; notes = []; }
