/* Slick Velvet — site-wide sound. One synthesised loop, shared by every page.
   Remembered in localStorage: sv-sound = '1' (on, default) | '0' (off). */
(function () {
  let ac = null, master = null, on = false;
  const pref = () => { try { return localStorage.getItem('sv-sound') !== '0'; } catch { return true; } };
  const save = v => { try { localStorage.setItem('sv-sound', v ? '1' : '0'); } catch {} };
  function build() {
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25; master.connect(comp); comp.connect(ac.destination);
    const BPM = 92, beat = 60 / BPM, bar = beat * 4;
    const duck = ac.createGain(); duck.gain.value = 1; duck.connect(master);
    const padF = ac.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 520; padF.Q.value = 0.8; padF.connect(duck);
    const padG = ac.createGain(); padG.gain.value = 0.06; padG.connect(padF);
    for (const [f, d] of [[110, -6], [110, 7], [164.82, 4]]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; o.connect(padG); o.start(); }
    const lfo = ac.createOscillator(); lfo.frequency.value = 1 / (bar * 4); const lg = ac.createGain(); lg.gain.value = 320; lfo.connect(lg); lg.connect(padF.frequency); lfo.start();
    const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const bassNotes = [36.71, 36.71, 36.71, 43.65, 36.71, 36.71, 32.70, 32.70];
    let next = ac.currentTime + 0.1, step = 0;
    function kick(t) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.42); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.45);
      duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(0.35, t); duck.gain.linearRampToValueAtTime(1, t + beat * 0.8); }
    function bass(t, f, len) { const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); o.type = 'square'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(700, t); fl.frequency.exponentialRampToValueAtTime(180, t + len); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(fl); fl.connect(g); g.connect(duck); o.start(t); o.stop(t + len + 0.02); }
    function hat(t, open) { const n = ac.createBufferSource(); n.buffer = nb; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000; const g = ac.createGain(); g.gain.setValueAtTime(open ? 0.05 : 0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.18 : 0.05)); n.connect(hp); hp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.2); }
    function sched() { while (next < ac.currentTime + 0.4) { const t = next, s16 = step % 16; if (s16 % 4 === 0) kick(t); if (s16 % 2 === 0) bass(t, bassNotes[(step >> 1) % 8], beat * 0.45); if (s16 % 4 === 2) hat(t, s16 === 14); next += beat / 4; step++; } }
    setInterval(sched, 100);
  }
  function apply() { if (!ac) build(); if (ac.state === 'suspended') ac.resume(); master.gain.setTargetAtTime(on ? 0.5 : 0, ac.currentTime, 0.6); document.querySelectorAll('[data-sound]').forEach(b => { b.classList.toggle('on', on); const s = b.querySelector('span'); if (s) s.textContent = on ? 'Sound on' : 'Sound off'; }); }
  const SV = {
    get on() { return on; },
    start() { on = pref(); try { apply(); } catch {} },               // after a gesture
    set(v) { on = !!v; save(on); try { apply(); } catch {} },
    toggle() { SV.set(!on); },
    resume() { if (ac && ac.state === 'suspended' && on) ac.resume(); }
  };
  // other pages: start on load (allowed once the visitor has interacted with the site), else on first touch
  SV.auto = function () { if (!pref()) { on = false; document.querySelectorAll('[data-sound]').forEach(b => { b.classList.remove('on'); const s = b.querySelector('span'); if (s) s.textContent = 'Sound off'; }); return; }
    const go = () => { SV.start(); if (ac && ac.state === 'running') { window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); window.removeEventListener('touchstart', go); } };
    go(); window.addEventListener('pointerdown', go, { passive: true }); window.addEventListener('keydown', go); window.addEventListener('touchstart', go, { passive: true }); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) SV.resume(); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-sound]'); if (b) { e.preventDefault(); e.stopPropagation(); SV.toggle(); } }, true);
  window.SVSound = SV;
})();
