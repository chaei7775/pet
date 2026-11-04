/* 화면 */
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let S = null, V = null, tab = 'pet', pose = 'basic', poseTimer = null, curRoom = null;
let devOpen = false;
const devReset = { armed: false };
let photo = { bg: 'showroom', pose: 'basic', url: null, title: '' };

const Sfx = {
  ctx: null, on: (() => { try { return localStorage.getItem('malang_sfx') !== '0'; } catch (e) { return true; } })(),
  toggle() { this.on = !this.on; try { localStorage.setItem('malang_sfx', this.on ? '1' : '0'); } catch (e) {} },
  play(kind) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); const c = this.ctx;
      const seq = { ok: [[660, 0], [880, .09]], coin: [[988, 0], [1318, .07]], bad: [[240, 0], [190, .1]], pet: [[740, 0], [932, .06], [1109, .12]], pop: [[520, 0], [780, .05], [1040, .1], [1320, .15]] }[kind] || [];
      seq.forEach(([f, d]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, c.currentTime + d); g.gain.exponentialRampToValueAtTime(.12, c.currentTime + d + .01); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + d + .14);
        o.connect(g); g.connect(c.destination); o.start(c.currentTime + d); o.stop(c.currentTime + d + .16); });
    } catch (e) {}
    try { if (navigator.vibrate && kind !== 'bad') navigator.vibrate(12); } catch (e) {}
  }
};
function floatText(text, x, y, cls) {
  const n = document.createElement('i'); n.className = 'float ' + (cls || ''); n.textContent = text;
  n.style.left = x + 'px'; n.style.top = y + 'px'; document.body.appendChild(n); setTimeout(() => n.remove(), 1100);
}
function gainFx(before) { // 코인·하트가 바뀌면 머리 위 칩에서 숫자가 떠오르게
  if (!before || !V) return;
  const chips = document.querySelectorAll('.chips em'); if (chips.length < 2) return;
  const dc = V.coins - before.coins, dh = V.hearts - before.hearts;
  const pos = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - 14, r.bottom + 4]; };
  if (dc) { const [x, y] = pos(chips[0]); floatText((dc > 0 ? '+' : '') + dc + '🪙', x, y, dc > 0 ? 'up' : 'down'); Sfx.play(dc > 0 ? 'coin' : 'ok'); }
  if (dh > 0) { const [x, y] = pos(chips[1]); floatText('+' + dh + '❤', x, y + 20, 'up'); }
}
let pot = [], pick = null;
let duo = { fid: null, a: { x: 32, y: 62, pose: 'basic' }, b: { x: 68, y: 62, pose: 'basic' }, url: null }, dragging = false;
let busy = false;
function refresh() { const v = Backend.view; V = v ? v.me : null; if (V) V.rooms = v.rooms; }
function toast(msg, bad) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = 'toast', 2600);
}
function setPose(p) { pose = p; clearTimeout(poseTimer); poseTimer = setTimeout(() => { pose = 'basic'; render(); }, 2600); }
async function act(type, p, poseTo) {
  if (busy) return; busy = true;
  try {
    const before = V ? { coins: V.coins, hearts: V.hearts } : null;
    const r = await Backend.act(type, p); if (r.msg) toast(r.msg, !r.ok);
    if (!r.ok) Sfx.play('bad'); else if (poseTo) { setPose(poseTo); Sfx.play('pet'); } else Sfx.play('ok');
    render(); if (r.ok) gainFx(before); return r;
  }
  finally { busy = false; }
}

const bar = (label, v, cls) => `<div class="bar"><span>${label}</span><div class="track"><i class="${cls}" style="width:${Math.round(v)}%"></i></div><b>${Math.round(v)}</b></div>`;
const dogOf = (pet, p) => Art.dog({ color: pet.color, equipped: pet.equipped, sick: pet.sick, pose: p || 'basic' });

/* ───────── 시작 화면 ───────── */
const joinCode = () => Game.normCode(new URLSearchParams(location.search).get('join') || '');
function clearJoin() { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
async function autoJoin() { // 초대 링크로 들어왔으면 시작 직후 그 방에 들어감 (한 번만)
  const code = joinCode(); if (!code || !Backend.view) return; clearJoin();
  const r = await Backend.act('joinRoom', { code }); toast(r.ok ? '친구방에 들어왔어' : r.msg, !r.ok); if (r.ok) tab = 'room';
}
function renderStart() {
  const join = joinCode();
  $('#app').innerHTML = `<div class="start">
    <div class="logo">${Art.dog({ color: 'maltese', pose: 'playing' })}</div>
    <h1>말랑 친구방 펫</h1><p class="sub">내 강아지를 키우고, 꾸미고, 친구에게 자랑해요</p>
    ${join ? `<p class="note">친구가 초대했어요! 시작하면 친구방에 바로 들어가요.</p>` : ''}
    <label>내 닉네임<input id="nick" maxlength="8" placeholder="예: 채이"></label>
    <label>강아지 이름<input id="pname" maxlength="8" placeholder="예: 몽이"></label>
    <div class="age"><span>나이 구분</span><label><input type="radio" name="age" value="kid">만 14세 미만</label><label><input type="radio" name="age" value="teen">만 14세 이상</label></div>
    <div class="colors">${DATA.breeds.map((c, i) => `<label class="cpick"><input type="radio" name="color" value="${c.id}" ${i ? '' : 'checked'}><span>${Art.dog({ color: c.id })}</span>${c.name}</label>`).join('')}</div>
    <button class="big" data-act="start">시작하기</button>
    ${Backend.mode === 'remote' ? `<details class="recover"><summary>다른 기기에서 하던 게임 불러오기</summary><div class="cook"><input id="recCode" maxlength="14" placeholder="복구 코드"><button data-act="recover">불러오기</button></div></details>` : '<p class="muted">서버에 연결되기 전이라 이 기기에서만 연습할 수 있어요</p>'}</div>`;
}

/* ───────── 공통 틀 ───────── */
function render() {
  refresh();
  if (!V) return renderStart();
  const tabs = [['pet', '🐶', '내 펫'], ['kitchen', '🍪', '부엌·알바'], ['closet', '👗', '꾸미기'], ['photo', '📸', '사진'], ['room', '🏠', '친구방']];
  const views = { pet: viewPet, kitchen: viewKitchen, closet: viewCloset, photo: viewPhoto, room: viewRoom };
  $('#app').innerHTML = `<header><b>${esc(V.pet.name)}</b><span class="chips"><button class="snd" data-act="sfx">${Sfx.on ? '🔊' : '🔇'}</button><em>🪙 ${V.coins}</em><em>❤ ${V.hearts}</em></span></header>
    <main>${views[tab]()}</main>
    <nav>${tabs.map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-act="tab" data-p='"${t[0]}"'><span>${t[1]}</span>${t[2]}</button>`).join('')}</nav>`;
}

/* ───────── 내 펫 ───────── */
function viewPet() {
  const now = Backend.now(), st = Game.stats(V.pet, now), d = V.daily, c = d.care, cfg = DATA.cfg;
  const g = (ic, v, cls) => `<div class="gauge"><span>${ic}</span><div class="track"><i class="${cls}" style="width:${Math.round(v)}%"></i></div><b>${Math.round(v)}</b></div>`;
  const bubbles = [st.sick ? '🤒' : '', st.hunger < 50 ? '🍗' : '', st.toilet >= 50 ? '💩' : '', st.mood < 50 ? '🥺' : ''].filter(Boolean).slice(0, 3);
  const poop = st.toilet >= 75 ? 3 : st.toilet >= 50 ? 2 : st.toilet >= 25 ? 1 : 0;
  const snacks = Object.entries(V.inventory.snacks).filter(([, n]) => n > 0);
  const tool = (icon, label, spec) => `<div class="tool" data-tool='${JSON.stringify(spec)}' data-icon="${icon}"><span>${icon}</span><small>${label}</small></div>`;
  const dock = [tool('🍚', `밥 −${cfg.foodCost}🪙`, { act: 'feed', pose: 'eating' }),
    tool('🎾', `공 ${d.plays}/${cfg.playMax}`, { act: 'play', pose: 'playing' }),
    ...snacks.slice(0, 3).map(([k, n]) => tool('🍪', `${esc(Game.snackName(k).replace(' 간식', ''))} ×${n}`, { act: 'giveSnack', p: { key: k }, pose: 'eating' })),
    ...(st.sick ? [tool('💊', `약 −${cfg.medMineCost}🪙`, { act: 'medicine' }), tool('🏥', `병원 −${cfg.hospitalCost}🪙`, { act: 'hospital' })] : [])].join('');
  const ck = (ok, t) => `<span class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${t}</span>`;
  return `${d.loginClaimed ? '' : `<button class="gift" data-act="claimLogin">🎁 오늘의 접속 선물 받기 (+${cfg.loginGift}🪙)</button>`}
  <div class="room" style="background-image:url('${svgUrl(Art.bgSVG('showroom'))}')">
    <div class="hud">${g('🍗', st.hunger, 'hg')}${g('🧻', st.toilet, 'tl')}${g('💗', st.mood, 'md')}</div>
    <div class="pad ${poop ? 'dirty' : ''}" data-act="clean"><div class="padmat"></div><div class="poops">${'💩'.repeat(poop)}</div><small>${poop ? '눌러서 치우기' : '배변판'}</small></div>
    <div class="dogwrap ${pose !== 'basic' || st.sick ? 'still' : ''}"><div id="dog" class="dog" data-act="petDog">${bubbles.length ? `<div class="bubbles">${bubbles.map(b => `<i>${b}</i>`).join('')}</div>` : ''}${dogOf(V.pet, pose)}</div></div>
    <div class="dock">${dock}</div>
  </div>
  ${st.sick ? `<div class="sick">🤒 ${esc(V.pet.name)}가 아파요. 💊 약을 끌어다 주거나 🏥 병원에 데려가요.</div>` : ''}
  <div class="care"><b>오늘의 돌봄 +${cfg.careBonus}🪙(하루 1회)</b>${ck(c.fed, '밥')}${ck(c.cleaned, '배변판')}${ck(c.played, '놀이')}${d.careBonusClaimed ? '<span class="ok">🎉 받음</span>' : ''}</div>
  <p class="muted">밥그릇·공·간식을 강아지에게 끌어다 놓거나 눌러요. 강아지를 쓰다듬어 보세요.</p>`;
}

function petFx(el, e) {
  const sc = $('.room'); if (!sc) return; const r = sc.getBoundingClientRect();
  ['💗', '✨', '💖'].forEach((h, i) => { const n = document.createElement('i'); n.className = 'fx'; n.textContent = h;
    n.style.left = (e.clientX - r.left + (i - 1) * 20) + 'px'; n.style.top = (e.clientY - r.top - 10) + 'px'; sc.appendChild(n); setTimeout(() => n.remove(), 900); });
  el.classList.add('wiggle'); setTimeout(() => el.classList.remove('wiggle'), 500);
}
const hit = (ev, el) => { const r = el.getBoundingClientRect(); return ev.clientX > r.left - 24 && ev.clientX < r.right + 24 && ev.clientY > r.top - 24 && ev.clientY < r.bottom + 24; };
const potSVG = '<svg viewBox="0 0 200 120" class="potsvg"><ellipse cx="100" cy="100" rx="70" ry="12" fill="#00000018"/><path d="M40 50 h120 v26 a50 30 0 0 1 -50 30 h-20 a50 30 0 0 1 -50 -30 z" fill="#f4a9a8" stroke="#7a5a44" stroke-width="4" stroke-linejoin="round"/><ellipse cx="100" cy="50" rx="60" ry="14" fill="#ffd3d2" stroke="#7a5a44" stroke-width="4"/><path d="M34 62 q-16 4 -6 16 M166 62 q16 4 6 16" fill="none" stroke="#7a5a44" stroke-width="5" stroke-linecap="round"/></svg>';
const fns = {
  noop() { toast('눌러서 먼저 사줘', true); },
  async addPot(id) {
    const n = V.inventory.ingredients[id] || 0, used = pot.filter(x => x === id).length;
    if (n - used <= 0) { Sfx.play('bad'); return toast('재료가 없어. 눌러서 사줘', true); }
    pot.push(id); Sfx.play('ok');
    if (pot.length < 2) return render();
    const [x, y] = pot; await act('cook', { a: x, b: y }); pot = []; Sfx.play('pop'); render();
  }
};
const runSpec = s => s.fn ? fns[s.fn](s.p) : act(s.act, s.p, s.pose);
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-tool]'); if (!el) return; e.preventDefault();
  const spec = JSON.parse(el.dataset.tool), tapSpec = spec.tap || spec, dropSpec = spec.drop || spec, sel = spec.target || '#dog';
  const sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
  const mv = ev => {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
      moved = true; ghost = document.createElement('div'); ghost.className = 'ghost';
      if (el.dataset.icon) ghost.textContent = el.dataset.icon; else { const sv = el.querySelector('svg'); if (sv) ghost.innerHTML = sv.outerHTML; }
      document.body.appendChild(ghost);
    }
    if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; const tg = $(sel); if (tg) tg.classList.toggle('hot', hit(ev, tg)); }
  };
  const up = ev => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (ghost) ghost.remove(); const tg = $(sel); if (tg) tg.classList.remove('hot');
    if (!moved) runSpec(tapSpec); else if (tg && hit(ev, tg)) runSpec(dropSpec);
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
});

/* ───────── 부엌·알바 ───────── */
function viewKitchen() {
  const inv = V.inventory, cfg = DATA.cfg, tl = ['😒', '🙂', '😍'];
  const shelf = DATA.ingredients.map(i => { const n = inv.ingredients[i.id] || 0;
    const spec = { tap: { act: 'buyIngredient', p: { id: i.id } }, drop: { fn: 'addPot', p: i.id }, target: '#pot' };
    return `<div class="tool ing" data-tool='${JSON.stringify(spec)}' data-icon="${i.icon}"><span>${i.icon}</span><b class="cnt">${n}</b><small>${i.price}🪙 ${tl[V.pet.taste[i.id]]}</small></div>`; }).join('');
  const snacks = Object.entries(inv.snacks).filter(([, n]) => n > 0);
  return `<div class="kitchen">
    <button class="sign" data-act="startJob">🦴<small>알바 ${V.daily.jobs}/${cfg.jobMaxDaily}</small></button>
    <div class="shelf">${shelf}</div>
    <div id="pot" class="pot ${pot.length ? 'cooking' : ''}"><div class="potin">${pot.map(id => `<i>${DATA.ingredients.find(x => x.id === id).icon}</i>`).join('') || '<small>재료를 끌어다 넣어요</small>'}</div>${potSVG}</div>
    <div class="tray">${snacks.length ? snacks.map(([k, n]) => `<div class="snack" data-act="tab" data-p='"pet"'><span>🍪</span><small>${esc(Game.snackName(k).replace(' 간식', ''))} ×${n}</small></div>`).join('') : '<small class="muted">만든 간식이 여기에 나와요</small>'}</div>
  </div>
  <p class="muted">재료를 누르면 사고, 냄비로 끌어다 2개 넣으면 간식이 만들어져요. 😍🙂😒는 ${esc(V.pet.name)}의 취향이에요. 간식은 쟁반을 눌러 내 펫 화면에서 줘요.</p>`;
}

/* ───────── 꾸미기 ───────── */
function viewCloset() {
  const shelf = DATA.clothes.map(c => {
    const own = V.inventory.clothes.includes(c.id), on = V.pet.equipped[c.slot] === c.id;
    const spec = own ? { tap: { act: 'equip', p: { id: c.id } }, drop: { act: 'equip', p: { id: c.id } }, target: '#dog' } : { tap: { act: 'buyCloth', p: { id: c.id } }, drop: { fn: 'noop' }, target: '#dog' };
    return `<div class="tool cloth ${on ? 'on' : ''} ${own ? '' : 'locked'}" data-tool='${JSON.stringify(spec)}'>${Art.clothIcon(c.id)}<small>${c.name}</small><b class="price">${own ? (on ? '입는 중' : '있음') : c.price + '🪙'}</b></div>`; }).join('');
  return `<div class="stage"><div id="dog" class="dog solo" data-act="petDog">${dogOf(V.pet, pose)}</div></div>
  <div class="rack">${shelf}</div>
  <p class="muted">옷을 끌어다 강아지에게 입히거나, 눌러서 입혀요. 🪙이 붙은 옷은 눌러서 사요.</p>`;
}

/* ───────── 사진 ───────── */
function viewPhoto() {
  const bgs = DATA.backgrounds.map(b => `<button class="${photo.bg === b.id ? 'on' : ''}" data-act="photoBg" data-p='"${b.id}"'>${b.name}</button>`).join('');
  const poses = [['basic', '기본'], ['playing', '노는 중'], ['walking', '산책']].map(p => `<button class="${photo.pose === p[0] ? 'on' : ''}" data-act="photoPose" data-p='"${p[0]}"'>${p[1]}</button>`).join('');
  const roomPhotos = V.rooms.flatMap(r => r.photos.map(p => ({ r, p })));
  return `<p class="muted">사진은 저장·공유 모두 내가 원할 때만 해요. 안 해도 괜찮아요.</p>
  <h3>내 펫 사진</h3><div class="seg">${bgs}</div><div class="seg">${poses}</div>
  <button class="big" data-act="makePhoto">📸 사진 만들기</button>
  ${photo.url ? `<img class="result" src="${photo.url}"><div class="grid2"><button data-act="savePhoto">💾 저장</button><button data-act="sharePhoto">📤 공유</button></div>` : ''}
  ${duoHTML()}
  <h3>방 기념사진</h3>${roomPhotos.length ? roomPhotos.map(({ r, p }) => `<div class="row"><span>${esc(r.name)} · ${new Date(p.t).toLocaleDateString()}</span><button data-act="makeRoomPhoto" data-p='{"code":"${r.code}","id":"${p.id}"}'>만들기</button></div>`).join('') : '<p class="muted">친구방에서 촬영 참여가 모이면 여기에 생겨요</p>'}`;
}

function friendsList() {
  const seen = new Set(), out = [];
  V.rooms.forEach(r => r.members.forEach(m => { if (!m.me && m.pet && !seen.has(m.id)) { seen.add(m.id); out.push({ id: m.id, nick: m.nick, pet: m.pet, room: r.name }); } }));
  return out;
}
function duoHTML() {
  const fr = friendsList(), f = fr.find(x => x.id === duo.fid);
  const pickers = fr.length ? fr.map(x => `<button class="${duo.fid === x.id ? 'on' : ''}" data-act="duoPick" data-p='${JSON.stringify(x.id)}'>${esc(x.pet.name)}</button>`).join('') : '<small class="muted">친구방에 친구가 들어오면 같이 찍을 수 있어요</small>';
  let stage = '';
  if (f) {
    const dd = (k, pet) => `<div class="dd" data-dd="${k}" style="left:${duo[k].x}%;top:${duo[k].y}%">${dogOf(pet, duo[k].pose)}<small>${esc(pet.name)}</small></div>`;
    stage = `<div id="duoStage" class="duostage" style="background-image:url('${svgUrl(Art.bgSVG(photo.bg))}')">${dd('a', V.pet)}${dd('b', f.pet)}</div>
    <p class="muted">강아지를 끌어서 자리를 잡고, 눌러서 포즈를 바꿔요. 배경은 위에서 골라요.</p>
    <button class="big" data-act="makeDuo">📸 둘이 사진 찍기</button>
    ${duo.url ? `<img class="result" src="${duo.url}"><div class="grid2"><button data-act="saveDuo">💾 저장</button><button data-act="shareDuo">📤 공유</button></div>` : ''}`;
  }
  return `<h3>친구랑 사진</h3><div class="seg">${pickers}</div>${stage}`;
}
function entries(room, ids) {
  return ids.map(id => { const m = room.members.find(x => x.id === id); if (!m) return null;
    return m.me ? { ...V.pet, nick: V.player.nickname } : { ...m.pet, nick: m.nick }; }).filter(Boolean);
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const svgUrl = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
async function compose(list, bg, title, ps) {
  const W = 720, Hh = 960, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  await Art.ready(); const g = cv.getContext('2d'); g.drawImage(await loadImg(svgUrl(Art.bgSVG(bg, W, Hh))), 0, 0, W, Hh);
  const n = list.length, cols = n <= 2 ? n : n <= 6 ? 3 : 4, rows = Math.ceil(n / cols);
  const cw = W / cols, ch = Math.min(cw, 620 / rows), top = 150 + (620 - ch * rows) / 2;
  for (let i = 0; i < n; i++) {
    const p = list[i], x = (i % cols) * cw + (cols * cw - W) / 2 + (W - cols * cw) / 2, y = top + Math.floor(i / cols) * ch;
    const sz = Math.min(cw, ch - 36) * 0.95;
    g.drawImage(await loadImg(svgUrl(Art.dog({ color: p.color, equipped: p.equipped, sick: false, pose: n === 1 ? ps : 'basic', still: true, inline: true }))), x + (cw - sz) / 2, y + (ch - 36 - sz) / 2, sz, sz);
    g.fillStyle = '#6b4a3a'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(p.name, x + cw / 2, y + ch - 8);
  }
  g.fillStyle = '#6b4a3a'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText(title, W / 2, 90);
  g.font = '24px sans-serif'; g.fillText('말랑 친구방 펫 (임시 그림)', W / 2, Hh - 36);
  return cv.toDataURL('image/png');
}
async function composeDuo(items, bg, title) {
  const W = 720, Hh = 960, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  await Art.ready(); const g = cv.getContext('2d'); g.drawImage(await loadImg(svgUrl(Art.bgSVG(bg, W, Hh))), 0, 0, W, Hh);
  const sz = 330;
  for (const it of items.slice().sort((p, q) => p.y - q.y)) {
    const cx = it.x / 100 * W, cy = it.y / 100 * Hh;
    g.drawImage(await loadImg(svgUrl(Art.dog({ color: it.pet.color, equipped: it.pet.equipped, sick: false, pose: it.pose, still: true, inline: true }))), cx - sz / 2, cy - sz / 2, sz, sz);
    g.fillStyle = '#6b4a3a'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(it.pet.name, cx, cy + sz / 2 + 4);
  }
  g.fillStyle = '#6b4a3a'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText(title, W / 2, 90);
  g.font = '24px sans-serif'; g.fillText('말랑 친구방 펫 (임시 그림)', W / 2, Hh - 36);
  return cv.toDataURL('image/png');
}
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-dd]'); if (!el) return; e.preventDefault();
  const stage = el.parentElement, k = el.dataset.dd, sx = e.clientX, sy = e.clientY; let moved = false; dragging = true;
  const mv = ev => {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moved = true;
    if (!moved) return; const r = stage.getBoundingClientRect();
    duo[k].x = Math.max(12, Math.min(88, (ev.clientX - r.left) / r.width * 100)); duo[k].y = Math.max(22, Math.min(80, (ev.clientY - r.top) / r.height * 100));
    el.style.left = duo[k].x + '%'; el.style.top = duo[k].y + '%'; duo.url = null;
  };
  const up = () => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); dragging = false;
    if (!moved) { const o = ['basic', 'playing', 'walking']; duo[k].pose = o[(o.indexOf(duo[k].pose) + 1) % 3]; duo.url = null; Sfx.play('pet'); render(); }
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
});
async function share(url, name) {
  const blob = await (await fetch(url)).blob(), file = new File([blob], name + '.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: '말랑 친구방 펫' }); return; } catch (e) { return; } }
  toast('이 브라우저는 바로 공유를 지원하지 않아요. 저장을 눌러 갤러리에 받아주세요', true);
}
function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name + '.png'; a.click(); }

/* ───────── 친구방 ───────── */
function renameHTML() {
  const left = DATA.cfg.renameMaxDaily - (V.daily.renames || 0);
  return `<details class="recover"><summary>✏️ 이름 바꾸기 (오늘 ${Math.max(0, left)}번 남음)</summary>
  <p class="muted">닉네임은 다른 사람과 겹치면 안 돼요. 강아지 이름은 겹쳐도 되고, 같은 방에서는 ②③ 번호가 붙어요.</p>
  <div class="cook"><input id="rnNick" maxlength="${DATA.cfg.nameMax}" value="${esc(V.player.nickname)}" placeholder="닉네임"><input id="rnPet" maxlength="${DATA.cfg.nameMax}" value="${esc(V.pet.name)}" placeholder="강아지 이름"><button data-act="rename">바꾸기</button></div></details>`;
}
const CIRC = ['', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
function petLabels(r) { // 같은 방에서 강아지 이름이 겹치면 들어온 순서대로 ②③…을 붙임
  const seen = {}, out = {};
  r.members.forEach(m => { const nm = (m.me ? V.pet : m.pet) ? (m.me ? V.pet.name : m.pet.name) : ''; if (!nm) return;
    const k = Game.nameKey(nm); const n = seen[k] = (seen[k] || 0) + 1; out[m.id] = nm + (CIRC[n - 1] || ''); });
  return out;
}
function roomSceneHTML(r, snacks) {
  const me = V.player.id, now = Backend.now(), mem = r.members.filter(m => m.pet), n = mem.length;
  const perRow = n <= 2 ? n : n <= 6 ? 3 : 4, rows = Math.ceil(n / perRow), w = perRow <= 1 ? 42 : perRow === 2 ? 34 : perRow === 3 ? 28 : 23;
  const labels = petLabels(r);
  const dogs = mem.map((m, i) => {
    const row = Math.floor(i / perRow), cnt = Math.min(perRow, n - row * perRow), col = i % perRow;
    const x = (col + .5) / cnt * 100, y = 14 + (rows - 1 - row) * 19;
    const pet = m.me ? { ...V.pet, sick: Game.stats(V.pet, now).sick } : m.pet;
    const lbl = labels[m.id] || pet.name;
    const last = r.chat.slice().reverse().find(c => c.from === m.id && now - c.t < 90000);
    return `<div class="rdog ${pick === m.id ? 'sel' : ''} ${m.me ? 'me' : ''}" style="left:${x}%;bottom:${y}%;width:${w}%;--d:${(i * 0.7) % 3}s" data-act="pick" data-p='${JSON.stringify(m.id)}'>${last ? `<div class="say">${esc(last.text.slice(0, 18))}</div>` : ''}${pet.sick ? '<i class="ico">🤒</i>' : ''}${dogOf(pet, 'basic')}<div class="nm">${m.me ? '⭐ ' : ''}${esc(lbl)}</div></div>`;
  }).join('');
  const sel = mem.find(m => m.id === pick && !m.me), pr = k => `data-p='{"code":"${r.code}","target":"${sel.id}"}'`;
  const bar = sel ? `<div class="actbar"><b>${esc(labels[sel.id] || sel.pet.name)}</b><button data-act="walk" ${pr()}>🦮 산책</button>${snacks.length ? `<button data-act="gift" ${pr()}>🎁 선물</button>` : ''}${sel.pet.sick ? `<button data-act="sendMedicine" ${pr()}>💊 약</button>` : ''}</div>` : '<p class="muted">친구 강아지를 눌러 보세요</p>';
  return `<div class="rroom" style="background-image:url('${svgUrl(Art.bgSVG('showroom'))}')">${dogs}</div>${bar}`;
}
function viewRoom() {
  const cfg = DATA.cfg, inviteText = '말랑 친구방 펫 같이 키워요!';
  if (!V.rooms.length) return `<p class="muted">친구방은 ${cfg.roomMin}~${cfg.roomMax}명이 모여요. 친구가 없어도 혼자 펫을 키울 수 있어요.</p>
    <h3>방 만들기</h3><div class="cook"><input id="roomName" maxlength="12" placeholder="방 이름"><button data-act="createRoom">만들기</button></div>
    <h3>방 코드로 들어가기</h3><div class="cook"><input id="roomCode" maxlength="8" placeholder="방 코드"><button data-act="joinRoom">들어가기</button></div>${renameHTML()}`;
  const r = V.rooms.find(x => x.code === curRoom) || V.rooms[0]; curRoom = r.code;
  const me = V.player.id, q = r.photoReq, snacks = Object.entries(V.inventory.snacks).filter(([, n]) => n > 0);
  const d = V.daily;
  const members = roomSceneHTML(r, snacks);
  return `<div class="row"><b>${esc(r.name)}</b><span>${r.members.length}/${cfg.roomMax}명</span></div>
  <p class="muted">대신 산책 ${d.walksGiven}/${cfg.walkGiveMax} · 선물 ${d.gifts}/${cfg.giftMax} · 응원 하트 ${d.hearts}/${cfg.heartMax}</p>
  ${snacks.length ? `<label class="inl">선물할 간식 <select id="giftKey">${snacks.map(([k, n]) => `<option value="${k}">${esc(Game.snackName(k))} ×${n}</option>`).join('')}</select></label>` : ''}
  ${members}
  <h3>방 채팅 ${r.chatOff ? '<small>꺼짐</small>' : ''}</h3>
  <div class="chat" id="chatBox">${r.chat.slice(-30).map(m => `<div class="msg ${m.from === me ? 'mine' : ''}"><small>${esc(m.nick)}</small><span>${esc(m.text)}</span>${m.from === me ? '' : `<button class="rp" data-act="reportChat" data-p='{"code":"${r.code}","id":"${m.id}"}' title="신고">⚑</button>`}</div>`).join('') || '<p class="muted">아직 대화가 없어요</p>'}</div>
  ${r.chatOff ? '' : V.player.ageGroup === 'kid'
      ? `<div class="presets">${DATA.chat.presets.map((t, i) => `<button data-act="chat" data-p='{"code":"${r.code}","preset":${i}}'>${esc(t)}</button>`).join('')}</div><p class="muted">14세 미만은 정해진 말만 보낼 수 있어요</p>`
      : `<div class="cook"><input id="chatText" maxlength="${DATA.chat.maxLen}" placeholder="메시지 (${DATA.chat.maxLen}자)"><button data-act="chatSend" data-p='{"code":"${r.code}"}'>보내기</button></div>`}
  ${r.hostId === me ? `<button class="small" data-act="toggleChat" data-p='{"code":"${r.code}"}'>${r.chatOff ? '채팅 켜기' : '채팅 끄기 (방장)'}</button>` : ''}
  <h3>방 기념사진 <small>친구 ${cfg.roomPhotoNeed}명 이상이 각자 참여 승인 · 접속 시간이 달라도 ${cfg.roomPhotoWindowH}시간 안에 모이면 완성</small></h3>
  ${q ? `<div class="row"><span>참여 승인 ${q.approvals.length}/${cfg.roomPhotoNeed}</span>${q.approvals.includes(me) ? '<span class="muted">내 승인 완료</span>' : `<button data-act="approvePhoto" data-p='{"code":"${r.code}"}'>나도 참여</button>`}</div>`
        : `<button data-act="requestPhoto" data-p='{"code":"${r.code}"}'>📸 촬영 제안하기</button>`}
  <h3>방 소식 <small>${cfg.feedHours}시간</small></h3>
  ${r.feed.slice().reverse().map(f => `<div class="feed"><span>${esc(f.text)}</span><button data-act="heartFeed" data-p='{"code":"${r.code}","id":"${f.id}"}'>❤ ${f.hearts || ''}</button></div>`).join('')}
  <h3>친구 부르기 <small>선택</small></h3>
  <p class="muted">링크는 시작 화면까지만 연결돼요. 방 코드는 따로 알려주세요.</p>
  <div class="row"><span>방 코드 <b class="code">${r.code}</b></span><button data-act="copyCode" data-p='"${r.code}"'>복사</button></div>
  <button data-act="shareInvite" data-p='"${r.code}"'>📤 초대 링크 공유</button>
  ${renameHTML()}
  <details class="recover"><summary>🔑 내 정보 · 복구 코드</summary><p class="muted">다른 기기에서 이어 하려면 이 코드가 필요해요. 남에게 알려주지 마세요.</p><div class="row"><b class="code">${esc(V.player.recovery)}</b><button data-act="copyCode" data-p='${JSON.stringify(V.player.recovery)}'>복사</button></div></details>
  ${Backend.mode !== 'local' ? '' : `<details class="dev" ${devOpen ? 'open' : ''}><summary>🛠 개발용 (테스트 전용)</summary>
    <p class="muted">서버 연결 전이라 다른 사람이 없어요. 아래로 테스트 친구를 만들어 기능을 확인해요.</p>
    <div class="grid2"><button data-act="devAddFriend" data-p='{"code":"${r.code}"}'>테스트 친구 추가</button>
    <button data-act="devChat" data-p='{"code":"${r.code}"}'>친구가 말하기</button>
    <button data-act="devSick" data-p='{"code":"${r.code}"}'>마지막 친구 아프게</button>
    <button data-act="devApprove" data-p='{"code":"${r.code}"}'>친구 촬영 승인</button>
    <button data-act="devSkip" data-p='3600000'>시간 +1시간</button>
    <button data-act="devSkip" data-p='86400000'>시간 +1일</button>
    <button data-act="devReset">처음부터 다시</button></div></details>`}`;
}

/* ───────── 알바 미니게임 (임시) ───────── */
function startJob() {
  let score = 0, left = 15;
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="jobhud"><b>🦴 임시 알바</b> 뼈다귀를 눌러요! <span id="jt">15</span>초 · <span id="js">0</span>개</div><div id="field"></div>`;
  document.body.appendChild(ov);
  const field = ov.querySelector('#field');
  const spawn = () => { const b = document.createElement('button'); b.textContent = '🦴'; b.className = 'bone';
    b.style.left = (Math.random() * 78 + 4) + '%'; b.style.top = (Math.random() * 70 + 12) + '%';
    b.onclick = () => { score++; ov.querySelector('#js').textContent = score; b.remove(); }; field.appendChild(b); setTimeout(() => b.remove(), 1400); };
  const sp = setInterval(spawn, 650);
  const tm = setInterval(() => { left--; ov.querySelector('#jt').textContent = left; if (left <= 0) { clearInterval(sp); clearInterval(tm); ov.remove();
    act('job', { coins: DATA.cfg.jobMin + Math.min(DATA.cfg.jobMax - DATA.cfg.jobMin, score * 3) }, 'playing'); } }, 1000);
}

/* ───────── 클릭 처리 ───────── */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, p = el.dataset.p ? JSON.parse(el.dataset.p) : undefined, pz = el.dataset.pose;
  const val = id => ($(id) || {}).value;
  switch (a) {
    case 'start': {
      const nick = val('#nick').trim(), pn = val('#pname').trim(), col = (document.querySelector('input[name=color]:checked') || {}).value;
      const age = (document.querySelector('input[name=age]:checked') || {}).value;
      if (!nick || !pn) return toast('닉네임과 강아지 이름을 써줘', true);
      if (!age) return toast('나이 구분을 골라줘', true);
      if (busy) return; busy = true;
      try { const r = await Backend.create(nick, pn, col, age); if (!r.ok) toast(r.msg, true); else await autoJoin(); } finally { busy = false; }
      return render(); }
    case 'recover': { if (busy) return; busy = true;
      try { const r = await Backend.recover(val('#recCode')); if (!r.ok) toast(r.msg, true); } finally { busy = false; }
      return render(); }
    case 'rename': return act('rename', { nickname: val('#rnNick'), petName: val('#rnPet') });
    case 'sfx': Sfx.toggle(); return render();
    case 'pick': pick = pick === p ? null : p; return render();
    case 'petDog': Sfx.play('pet'); return petFx(el, e);
    case 'chatSend': { const r = await act('chat', { ...p, text: val('#chatText') }); const bx = $('#chatBox'); if (bx) bx.scrollTop = bx.scrollHeight; return r; }
    case 'tab': tab = p; return render();
    case 'startJob': return startJob();
    case 'cook': return act('cook', { a: val('#cookA'), b: val('#cookB') });
    case 'createRoom': return act('createRoom', { name: val('#roomName') });
    case 'joinRoom': return act('joinRoom', { code: val('#roomCode') });
    case 'gift': return act('giftSnack', { ...p, key: val('#giftKey') });
    case 'photoBg': photo.bg = p; photo.url = null; duo.url = null; return render();
    case 'duoPick': duo.fid = p; duo.url = null; return render();
    case 'makeDuo': { const f = friendsList().find(x => x.id === duo.fid); if (!f) return;
      duo.url = await composeDuo([{ pet: V.pet, x: duo.a.x, y: duo.a.y, pose: duo.a.pose }, { pet: f.pet, x: duo.b.x, y: duo.b.y, pose: duo.b.pose }], photo.bg, V.pet.name + ' & ' + f.pet.name); return render(); }
    case 'saveDuo': return download(duo.url, 'malang-duo');
    case 'shareDuo': return share(duo.url, 'malang-duo');
    case 'photoPose': photo.pose = p; photo.url = null; return render();
    case 'makePhoto': photo.url = await compose([{ ...V.pet, nick: V.player.nickname }], photo.bg, V.pet.name, photo.pose); return render();
    case 'makeRoomPhoto': { const r = V.rooms.find(x => x.code === p.code), ph = r.photos.find(x => x.id === p.id);
      photo.url = await compose(entries(r, ph.members), photo.bg, r.name, 'basic'); return render(); }
    case 'savePhoto': return download(photo.url, 'malang-pet');
    case 'sharePhoto': return share(photo.url, 'malang-pet');
    case 'copyCode': try { await navigator.clipboard.writeText(p); toast('방 코드를 복사했어'); } catch (err) { toast('방 코드: ' + p); } return;
    case 'shareInvite': { const url = location.origin + location.pathname + '?join=' + encodeURIComponent(p); // 링크에 방 코드가 들어 있어: 받은 사람은 시작하면 바로 그 방에 들어옴
      if (navigator.share) { try { await navigator.share({ title: '말랑 친구방 펫', text: '내 방에 놀러 와! 같이 키워요', url }); } catch (err) {} }
      else { try { await navigator.clipboard.writeText(url); toast('링크를 복사했어'); } catch (err) { toast(url); } } return; }
    case 'walk': return act('walk', p);
    case 'devSkip': Backend.devSkip(p); await Backend.sync(); toast('시간을 건너뛰었어'); return render();
    case 'devReset': if (!devReset.armed) { devReset.armed = true; toast('한 번 더 누르면 모두 지워져', true); setTimeout(() => devReset.armed = false, 3000); return; } Backend.reset(); tab = 'pet'; devReset.armed = false; await Backend.sync(); return render();
    default: return act(a, p, pz);
  }
});

document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'chatText') { e.preventDefault(); document.querySelector('[data-act=chatSend]').click(); } });
document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('details.dev')) devOpen = e.target.open; }, true);
(async function init() {
  render(); // 먼저 빈 화면 방지
  if (Backend.hasPlayer()) { await Backend.sync(); if (!Backend.view) toast('계정을 불러오지 못했어. 새로 시작하거나 복구 코드를 써줘', true); else await autoJoin(); }
  render();
  let tick = 0;
  setInterval(async () => {
    if (document.hidden || dragging || document.querySelector('.overlay') || busy || !Backend.hasPlayer()) return;
    tick++; const every = tab === 'room' ? 1 : 4; // 친구방을 보고 있을 때만 자주 가져옴 (8초), 아니면 32초
    if (tick % every) return;
    if (document.activeElement && document.activeElement.matches('input,select')) return;
    await Backend.sync(); render();
  }, 8000);
})();
