/* 말랑 친구방 펫 — 게임 규칙
 * 이 파일은 화면(DOM)을 전혀 모르는 순수 규칙이야.
 * 같은 파일을 브라우저(로컬 연습 모드)와 서버(Supabase 함수)가 함께 써.
 * act(나, 행동, 값, 지금시각, 월드)  월드 = { rooms:{코드:방}, players:{아이디:플레이어} }
 * 서버는 필요한 방·플레이어만 읽어서 월드로 넘기고, 결과로 바뀐 것만 저장해.
 * 숫자는 전부 DATA 표에 있어서 여기만 고치면 돼. */

const DATA = {
  cfg: {
    startCoins: 100,            // [내가 정함] 기획서에 없음 — 첫 사료 몇 번 + 재료 조금
    hungerStart: 100, hungerPerH: -4, foodGain: 40, foodCost: 20, snackHunger: 20,
    toiletPerH: 5, toiletCap: 80,
    moodStart: 100, moodPerH: -3, sickMoodPerH: -6, playGain: 30, playMax: 5,
    floorHunger: 20, floorMood: 20,
    sickChancePerDay: 0.15, sickNaturalH: 24,
    medMineCost: 300, medMineH: 12, hospitalCost: 500, medFriendCost: 150, medFriendHearts: 2,
    jobMin: 20, jobMax: 40, jobMaxDaily: 5,
    walkGiveMax: 3, walkRecvMax: 2, walkCoin: 20, walkHearts: 1, walkMood: 30,
    giftMax: 5, heartMax: 10,
    loginGift: 90, careBonus: 30, nameMax: 8, renameMaxDaily: 2, // 이름은 1~8자, 하루 2번까지 바꿀 수 있어 [내가 정함]
    // 목욕·양치: 며칠에 한 번 하는 긴 주기 돌봄. 돌봄 완료(30🪙) 조건에는 안 들어가고, 안 해도 불이익 없음 [내가 정함 — 숫자는 여기서만 바꾸면 돼]
    bathEveryH: 72, bathMood: 15, brushEveryH: 48, brushMood: 10, shineH: 24,
    // 집 어지르기: 강아지가 4~8시간마다 한 번 어질러, 방에 최대 3개까지. 치우면 기분만 오르고 코인은 없어. 친구가 대신 치우면 코인·하트 [내가 정함]
    messMinH: 4, messMaxH: 8, messMax: 3, messMood: 3,
    cleanGiveMax: 3, cleanGiveCoin: 10, cleanGiveHearts: 1,
    messKinds: ['plate', 'tissue', 'toys', 'water'],   // 접시 깨짐 / 풀린 휴지 / 흩어진 장난감 / 엎은 물
   
    feedHours: 24, feedMax: 50,
    roomPhotoNeed: 3, roomPhotoWindowH: 24, roomMin: 3, roomMax: 10, maxRooms: 5, // maxRooms: [내가 정함] 한 사람이 들어갈 수 있는 방 수
    snackBaseMood: 5, likeMood: { 2: 10, 1: 5, 0: 0 } // 좋아함10 보통5 별로0 → 간식 기분 5~25
  },
  chat: {
    maxLen: 40, rateSec: 3, keep: 100,
    // 14세 미만 계정이 보낼 수 있는 말 (번호로만 선택)
    presets: ['안녕! 👋', '고마워! 💗', '같이 놀자!', '귀여워! 😍', '산책 고마워 🦮', '간식 고마워 🍪', '아파요, 도와줘요 🤒', '사진 찍자! 📸', '잘 자 🌙', '최고야! ⭐'],
    // [임시] 금칙어 — 실제 서비스 전에 욕설·성적·괴롭힘 목록을 제대로 만들어야 함
    banned: ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '지랄', '좆', '꺼져', '죽어', '죽여', '섹스', '야동', '개새끼', '미친놈', '년', '새끼']
  },
  ingredients: [
    { id: 'sweetpotato', name: '고구마', price: 15, icon: '🍠' },
    { id: 'pumpkin', name: '호박', price: 15, icon: '🎃' },
    { id: 'chicken', name: '닭가슴살', price: 25, icon: '🍗' },
    { id: 'carrot', name: '당근', price: 15, icon: '🥕' },
    { id: 'apple', name: '사과', price: 20, icon: '🍎' },
    { id: 'blueberry', name: '블루베리', price: 20, icon: '🫐' }
  ],
  // [내가 정함] 8벌 이름은 그림 프롬프트(C1, C2) 기준, 가격은 150~400 안에서 임시로 배정
  clothes: [
    { id: 'bow', name: '리본', slot: 'head', price: 150 },
    { id: 'beret', name: '베레모', slot: 'head', price: 200 },
    { id: 'strawberryhat', name: '딸기 모자', slot: 'head', price: 250 },
    { id: 'lacedress', name: '레이스 원피스', slot: 'body', price: 400 },
    { id: 'hoodie', name: '후드티', slot: 'body', price: 350 },
    { id: 'raincoat', name: '우비', slot: 'body', price: 300 },
    { id: 'scarf', name: '목도리', slot: 'neck', price: 200 },
    { id: 'bell', name: '방울 목걸이', slot: 'neck', price: 150 }
  ],
  breeds: [ // 견종 (펫의 color 칸에 이 id가 들어가. 예전 색 이름 cream/choco/apricot은 그림 쪽에서 알아서 바꿔 읽어)
    { id: 'maltese', name: '말티즈' }, { id: 'bichon', name: '비숑' },
    { id: 'pomeranian', name: '포메라니안' }, { id: 'poodle', name: '푸들' }
  ],
  backgrounds: [
    { id: 'showroom', name: '쇼룸' }, { id: 'meadow', name: '꽃밭' },
    { id: 'party', name: '파티' }, { id: 'picnic', name: '소풍' }
  ]
};

const Game = (() => {
  const C = DATA.cfg, H = 3600e3, D = 86400e3;
  const clone = o => JSON.parse(JSON.stringify(o));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dayKey = now => Math.floor((now + 9 * H) / D);          // 한국 시간 기준 하루
  const dayStart = k => k * D - 9 * H;
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  const rid = () => Math.random().toString(36).slice(2, 10);
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 글자(0,O,1,I) 제외
  const genCode = () => { let s = ''; for (let i = 0; i < 8; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; return s; };
  const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const ing = id => DATA.ingredients.find(i => i.id === id);
  const cloth = id => DATA.clothes.find(c => c.id === id);
  const snackName = key => key.split('+').map(i => ing(i).name).join('+') + ' 간식';
  const snackKey = (a, b) => [a, b].sort().join('+');

  function makeTaste(seed) { // 재료 6개: 좋아함 2, 보통 2, 별로 2 (고정 시드)
    const ids = DATA.ingredients.map(i => i.id).sort((a, b) => hash(seed + a) - hash(seed + b));
    const t = {}; ids.forEach((id, i) => t[id] = i < 2 ? 2 : i < 4 ? 1 : 0); return t;
  }
  function newPet(name, color, seed, now) {
    return { id: seed, name, color, species: 'dog', taste: makeTaste(seed),
      base: { t: now, hunger: C.hungerStart, toilet: 0, mood: C.moodStart },
      sick: null, lastRollDay: dayKey(now), equipped: { head: null, neck: null, body: null },
      lastBath: null, lastBrush: null, shineUntil: 0, messes: [], messSeq: 0, messNext: now + messGap(seed, 0) };
  }
  // 다음 어지르기까지 걸리는 시간 (펫 아이디와 번호로 정해지는 값이라 서버·브라우저가 똑같이 계산해)
  function messGap(id, k) { return (C.messMinH + hash(id + ':mi' + k) * (C.messMaxH - C.messMinH)) * H; }
  function newDaily(now) {
    return { day: dayKey(now), plays: 0, jobs: 0, walksGiven: 0, walksReceived: 0, cleansGiven: 0, gifts: 0, hearts: 0,
      loginClaimed: false, renames: 0, careBonusClaimed: false, care: { fed: false, cleaned: false, played: false } };
  }
  function newState(now, nickname, petName, color, ageGroup, id) {
    id = id || 'p_' + rid() + rid();
    return { v: 2, player: { id, nickname, recovery: (rid() + rid()).toUpperCase().slice(0, 12), ageGroup: ageGroup === 'teen' ? 'teen' : 'kid' }, // kid=14세 미만(스스로 선택)
      coins: C.startCoins, hearts: 0, pet: newPet(petName, color, id, now),
      inventory: { ingredients: {}, snacks: {}, clothes: [] }, daily: newDaily(now),
      showroom: [null, null, null, null, null], // 쇼룸 소품 5칸 (화면은 다음 단계)
      roomCodes: [] };
  }

  // 지금 수치 계산 (마지막 저장 시각부터 흐른 시간으로)
  function stats(pet, now) {
    const b = pet.base, h = Math.max(0, (now - b.t) / H);
    let sickH = 0;
    if (pet.sick) sickH = Math.max(0, (Math.min(now, pet.sick.until) - Math.max(b.t, pet.sick.since)) / H);
    return {
      hunger: clamp(Math.max(C.floorHunger, b.hunger + C.hungerPerH * h), 0, 100),
      toilet: clamp(Math.min(C.toiletCap, b.toilet + C.toiletPerH * h), 0, 100),
      mood: clamp(Math.max(C.floorMood, b.mood + C.moodPerH * (h - sickH) + C.sickMoodPerH * sickH), 0, 100),
      sick: !!pet.sick
    };
  }
  // 목욕·양치: 주기가 지났는지(ready), 남은 시간(leftH), 할 때가 됐다는 표시(due: 한 번 한 뒤 주기가 지난 경우), 반짝 중인지(shine)
  function careStatus(pet, now) {
    const one = (last, every) => { const left = last == null ? 0 : Math.max(0, (last + every * H - now) / H); return { ready: left <= 0, leftH: left, due: last != null && left <= 0 }; };
    return { bath: one(pet.lastBath, C.bathEveryH), brush: one(pet.lastBrush, C.brushEveryH), shine: (pet.shineUntil || 0) > now };
  }
  const waitText = h => h >= 24 ? `${Math.ceil(h / 24)}일` : `${Math.max(1, Math.ceil(h))}시간`;
  function commit(pet, now) { const s = stats(pet, now); pet.base = { t: now, hunger: s.hunger, toilet: s.toilet, mood: s.mood }; }

  // 시간이 흘러서 생기는 일(하루 바뀜, 아픔 굴리기, 회복)을 반영
  function settle(s, now) {
    const pet = s.pet, today = dayKey(now);
    commit(pet, now);
    if (pet.sick && now >= pet.sick.until) pet.sick = null;
    for (let d = Math.max(pet.lastRollDay + 1, today - 6); d <= today; d++) {
      if (!pet.sick && hash(pet.id + ':' + d) < C.sickChancePerDay) {
        const since = Math.min(now, dayStart(d) + Math.floor(hash(pet.id + 't' + d) * 20) * H);
        pet.sick = { since, until: since + C.sickNaturalH * H };
        if (pet.sick.until <= now) pet.sick = null; // 이미 지나간 병은 건너뜀
      }
    }
    pet.lastRollDay = today;
    spawnMess(pet, now);
    if (s.daily.day !== today) s.daily = newDaily(now);
    return s;
  }
  // 시간이 지나서 생긴 어지름을 방에 반영 (방이 꽉 차면 멈추고, 치우면 그때부터 다시 시간이 흘러)
  function spawnMess(pet, now) {
    if (!pet.messes) { pet.messes = []; pet.messSeq = 0; pet.messNext = now + messGap(pet.id, 0); }
    for (let g = 0; g < 30 && pet.messNext <= now && pet.messes.length < C.messMax; g++) {
      const k = pet.messSeq, id = pet.id;
      pet.messes.push({ id: 'm' + k, kind: C.messKinds[Math.floor(hash(id + ':mk' + k) * C.messKinds.length)],
        x: Math.round((0.12 + hash(id + ':mx' + k) * 0.76) * 100) / 100, y: Math.round((0.2 + hash(id + ':my' + k) * 0.66) * 100) / 100, t: pet.messNext });
      pet.messSeq = k + 1; pet.messNext += messGap(id, k + 1);
    }
  }
  function takeMess(pet, mid, now) { // 어지른 것 하나를 치움. 없으면 null
    const i = (pet.messes || []).findIndex(m => m.id === mid); if (i < 0) return null;
    const m = pet.messes.splice(i, 1)[0];
    if (pet.messNext <= now) pet.messNext = now + messGap(pet.id, pet.messSeq);
    pet.base.mood = clamp(pet.base.mood + C.messMood, 0, 100); return m;
  }
  function settleRoom(r, now) {
    r.feed = r.feed.filter(f => now - f.t < C.feedHours * H).slice(-C.feedMax);
    if (r.photoReq && now - r.photoReq.t >= C.roomPhotoWindowH * H) r.photoReq = null; // 24시간 안에 못 모이면 취소
    return r;
  }
  const settled = (state, now) => settle(clone(state), now);

  function careCheck(s) { // 밥·배변판·놀아주기 한 번씩 → 하루 1회 보너스
    const c = s.daily.care;
    if (c.fed && c.cleaned && c.played && !s.daily.careBonusClaimed) {
      s.daily.careBonusClaimed = true; s.coins += C.careBonus; return ` · 돌봄 완료 보너스 +${C.careBonus}🪙`;
    } return '';
  }
  function addFeed(room, now, text, who) { room.feed.push({ id: rid(), t: now, text, who, hearts: 0 }); }
  function snackMoodFor(taste, key) { return C.snackBaseMood + key.split('+').reduce((a, id) => a + C.likeMood[taste[id]], 0); }

  const nameKey = x => String(x || '').toLowerCase().replace(/\s/g, '');
  const fail = msg => ({ ok: false, msg });
  const done = (s, msg) => ({ ok: true, msg, state: s });
  // 내가 들어가 있는 방인지 확인하고 방을 돌려줌
  function myRoom(s, w, code) {
    code = normCode(code); const r = w.rooms[code];
    if (!r || !s.roomCodes.includes(code)) return null; return r;
  }
  function target(s, r, w, id) { // 같은 방의 다른 친구
    if (!id || id === s.player.id || !r.members.some(m => m.id === id) || !w.players[id]) return null; return w.players[id];
  }
  function finishPhoto(r, now) {
    r.photos.push({ id: rid(), t: now, day: dayKey(now), members: r.photoReq.approvals.slice() });
    r.photoDay = dayKey(now); r.photoReq = null; addFeed(r, now, '방 기념사진이 완성됐어 📸', null);
    return '방 기념사진 완성! 사진 탭에서 저장·공유할 수 있어';
  }

  const A = {
    claimLogin(s) {
      if (s.daily.loginClaimed) return fail('오늘 선물은 이미 받았어');
      s.daily.loginClaimed = true; s.coins += C.loginGift; return done(s, `오늘의 접속 선물 +${C.loginGift}🪙`);
    },
    feed(s) {
      if (s.coins < C.foodCost) return fail('코인이 모자라');
      s.coins -= C.foodCost; s.pet.base.hunger = clamp(s.pet.base.hunger + C.foodGain, 0, 100);
      s.daily.care.fed = true; return done(s, '냠냠! 배고픔 +' + C.foodGain + careCheck(s));
    },
    clean(s) {
      if (s.pet.base.toilet <= 0) return fail('배변판은 이미 깨끗해');
      s.pet.base.toilet = 0; s.daily.care.cleaned = true; return done(s, '배변판이 깨끗해졌어' + careCheck(s));
    },
    cleanMess(s, p, now) {
      if (!takeMess(s.pet, String(p.id), now)) return fail('이미 치웠어');
      return done(s, `치웠어! 기분 +${C.messMood}`);
    },
    cleanFriendMess(s, p, now, w) {
      const r = myRoom(s, w, p.code), t = r && target(s, r, w, p.target); if (!t) return fail('대상을 골라줘');
      if ((s.daily.cleansGiven || 0) >= C.cleanGiveMax) return fail(`대신 치우기는 하루 ${C.cleanGiveMax}번까지야`);
      if (!takeMess(t.pet, String(p.id), now)) return fail('이미 누가 치웠어');
      s.daily.cleansGiven = (s.daily.cleansGiven || 0) + 1; s.coins += C.cleanGiveCoin; s.hearts += C.cleanGiveHearts;
      addFeed(r, now, `${s.player.nickname}가 ${t.pet.name}네 집을 치워줬어`, s.player.id);
      return done(s, `${t.pet.name}네 집을 치웠어! +${C.cleanGiveCoin}🪙 ❤${C.cleanGiveHearts}`);
    },
    play(s) {
      if (s.daily.plays >= C.playMax) return fail(`놀아주기는 하루 ${C.playMax}번까지야`);
      s.daily.plays++; s.pet.base.mood = clamp(s.pet.base.mood + C.playGain, 0, 100);
      s.daily.care.played = true; return done(s, `신나게 놀았어! 기분 +${C.playGain} (${s.daily.plays}/${C.playMax})` + careCheck(s));
    },
    bath(s, p, now) {
      const c = careStatus(s.pet, now).bath; if (!c.ready) return fail(`목욕은 ${C.bathEveryH / 24}일에 한 번이야. ${waitText(c.leftH)} 뒤에 또 할 수 있어`);
      s.pet.lastBath = now; s.pet.shineUntil = now + C.shineH * H; s.pet.base.mood = clamp(s.pet.base.mood + C.bathMood, 0, 100);
      return done(s, `뽀득뽀득! 반짝반짝해졌어 ✨ 기분 +${C.bathMood}`);
    },
    brush(s, p, now) {
      const c = careStatus(s.pet, now).brush; if (!c.ready) return fail(`양치는 ${C.brushEveryH / 24}일에 한 번이야. ${waitText(c.leftH)} 뒤에 또 할 수 있어`);
      s.pet.lastBrush = now; s.pet.shineUntil = now + C.shineH * H; s.pet.base.mood = clamp(s.pet.base.mood + C.brushMood, 0, 100);
      return done(s, `치카치카! 이가 반짝반짝 ✨ 기분 +${C.brushMood}`);
    },
    buyIngredient(s, p) {
      const i = ing(p.id); if (!i) return fail('없는 재료야');
      if (s.coins < i.price) return fail('코인이 모자라');
      s.coins -= i.price; s.inventory.ingredients[i.id] = (s.inventory.ingredients[i.id] || 0) + 1;
      return done(s, `${i.name} 구매`);
    },
    cook(s, p) {
      const a = p.a, b = p.b, inv = s.inventory.ingredients;
      if (!ing(a) || !ing(b)) return fail('재료를 골라줘');
      const need = {}; need[a] = (need[a] || 0) + 1; need[b] = (need[b] || 0) + 1;
      for (const k in need) if ((inv[k] || 0) < need[k]) return fail('재료가 모자라');
      for (const k in need) inv[k] -= need[k];
      const key = snackKey(a, b); s.inventory.snacks[key] = (s.inventory.snacks[key] || 0) + 1;
      return done(s, `${snackName(key)} 완성!`);
    },
    giveSnack(s, p) {
      const key = p.key; if (!(s.inventory.snacks[key] > 0)) return fail('그 간식이 없어');
      s.inventory.snacks[key]--; const m = snackMoodFor(s.pet.taste, key);
      s.pet.base.hunger = clamp(s.pet.base.hunger + C.snackHunger, 0, 100);
      s.pet.base.mood = clamp(s.pet.base.mood + m, 0, 100);
      const lv = m >= 20 ? '엄청 좋아해!' : m >= 10 ? '좋아해' : '그냥 그래…';
      return done(s, `${snackName(key)}: ${lv} (기분 +${m}, 배고픔 +${C.snackHunger})`);
    },
    job(s, p) {
      if (s.daily.jobs >= C.jobMaxDaily) return fail(`알바는 하루 ${C.jobMaxDaily}판까지야`);
      const coins = clamp(Math.round(p.coins || C.jobMin), C.jobMin, C.jobMax); // 서버가 보상 범위를 강제
      s.daily.jobs++; s.coins += coins; return done(s, `알바 끝! +${coins}🪙 (${s.daily.jobs}/${C.jobMaxDaily})`);
    },
    medicine(s, p, now) {
      if (!s.pet.sick) return fail('아프지 않아'); if (s.coins < C.medMineCost) return fail('코인이 모자라');
      s.coins -= C.medMineCost; s.pet.sick.until = Math.min(s.pet.sick.until, now + C.medMineH * H);
      return done(s, `약을 먹였어. ${C.medMineH}시간 뒤에 나아져`);
    },
    hospital(s) {
      if (!s.pet.sick) return fail('아프지 않아'); if (s.coins < C.hospitalCost) return fail('코인이 모자라');
      s.coins -= C.hospitalCost; s.pet.sick = null; return done(s, '병원에서 바로 다 나았어!');
    },
    buyCloth(s, p) {
      const c = cloth(p.id); if (!c) return fail('없는 옷이야');
      if (s.inventory.clothes.includes(c.id)) return fail('이미 있어'); if (s.coins < c.price) return fail('코인이 모자라');
      s.coins -= c.price; s.inventory.clothes.push(c.id); return done(s, `${c.name} 구매!`);
    },
    equip(s, p) {
      const c = cloth(p.id); if (!c || !s.inventory.clothes.includes(c.id)) return fail('아직 없는 옷이야');
      const cur = s.pet.equipped; cur[c.slot] = cur[c.slot] === c.id ? null : c.id;
      return done(s, cur[c.slot] ? `${c.name} 입혔어` : `${c.name} 벗겼어`);
    },
    // ───── 친구방 ─────
    createRoom(s, p, now, w) {
      const name = String(p.name || '').trim().slice(0, 12); if (!name) return fail('방 이름을 써줘');
      if (DATA.chat.banned.some(b => name.toLowerCase().replace(/\s/g, '').includes(b))) return fail('방 이름에 쓸 수 없는 말이 있어');
      if (s.roomCodes.length >= C.maxRooms) return fail(`방은 ${C.maxRooms}개까지 들어갈 수 있어`);
      const code = genCode();
      const room = { code, name, hostId: s.player.id, t: now, members: [{ id: s.player.id, nick: s.player.nickname }],
        feed: [], chat: [], chatOff: false, photoReq: null, photoDay: null, photos: [], reports: [] };
      w.rooms[code] = room; s.roomCodes.push(code);
      addFeed(room, now, `${s.player.nickname}의 ${s.pet.name}가 방에 들어왔어`, s.player.id);
      return { ...done(s, `방 "${name}" 만들었어. 방 코드: ${code}`), newRoom: code };
    },
    rename(s, p, now, w) {
      const nick = String(p.nickname == null ? s.player.nickname : p.nickname).trim(), pn = String(p.petName == null ? s.pet.name : p.petName).trim();
      if (!nick || !pn) return fail('이름을 비워둘 수 없어');
      if (nick.length > C.nameMax || pn.length > C.nameMax) return fail(`이름은 ${C.nameMax}자까지야`);
      if (nick === s.player.nickname && pn === s.pet.name) return fail('바뀐 이름이 없어');
      if (DATA.chat.banned.some(b => nameKey(nick + pn).includes(b))) return fail('쓸 수 없는 말이 들어 있어');
      if ((s.daily.renames || 0) >= C.renameMaxDaily) return fail(`이름은 하루 ${C.renameMaxDaily}번까지 바꿀 수 있어`);
      s.daily.renames = (s.daily.renames || 0) + 1; s.player.nickname = nick; s.pet.name = pn;
      for (const code of s.roomCodes) { const r = w.rooms[code]; if (!r) continue; const m = r.members.find(x => x.id === s.player.id); if (m) m.nick = nick; }
      return done(s, '이름을 바꿨어');
    },
    joinRoom(s, p, now, w) {
      const code = normCode(p.code), r = w.rooms[code];
      if (!r) return fail('그 코드의 방이 없어');
      if (s.roomCodes.includes(code)) return fail('이미 들어가 있는 방이야');
      if (s.roomCodes.length >= C.maxRooms) return fail(`방은 ${C.maxRooms}개까지 들어갈 수 있어`);
      if (r.members.length >= C.roomMax) return fail('방이 가득 찼어');
      r.members.push({ id: s.player.id, nick: s.player.nickname }); s.roomCodes.push(code);
      addFeed(r, now, `${s.player.nickname}의 ${s.pet.name}가 방에 들어왔어`, s.player.id);
      return done(s, `"${r.name}" 방에 들어왔어!`);
    },
    walk(s, p, now, w) {
      const r = myRoom(s, w, p.code), t = r && target(s, r, w, p.target); if (!t) return fail('대상을 골라줘');
      if (s.daily.walksGiven >= C.walkGiveMax) return fail(`대신 산책은 하루 ${C.walkGiveMax}번까지야`);
      if (t.daily.walksReceived >= C.walkRecvMax) return fail(`${t.pet.name}는 오늘 산책을 이미 ${C.walkRecvMax}번 받았어`);
      s.daily.walksGiven++; t.daily.walksReceived++; t.pet.base.mood = clamp(t.pet.base.mood + C.walkMood, 0, 100);
      s.coins += C.walkCoin; s.hearts += C.walkHearts;
      addFeed(r, now, `${s.player.nickname}가 ${t.pet.name}와 산책했어`, s.player.id);
      return done(s, `${t.pet.name}와 산책! +${C.walkCoin}🪙 ❤${C.walkHearts}`);
    },
    giftSnack(s, p, now, w) {
      const r = myRoom(s, w, p.code), t = r && target(s, r, w, p.target); if (!t) return fail('대상을 골라줘');
      if (s.daily.gifts >= C.giftMax) return fail(`선물은 하루 ${C.giftMax}개까지야`);
      if (!(s.inventory.snacks[p.key] > 0)) return fail('그 간식이 없어');
      s.inventory.snacks[p.key]--; s.daily.gifts++;
      const mood = snackMoodFor(t.pet.taste, p.key); t.pet.base.mood = clamp(t.pet.base.mood + mood, 0, 100);
      s.hearts += 1; t.hearts += 1; // 둘 다 하트 1
      addFeed(r, now, `${s.player.nickname}가 ${t.pet.name}에게 ${snackName(p.key)}을 선물했어`, s.player.id);
      return done(s, `${t.pet.name}에게 선물! 기분 +${mood}, ❤1`);
    },
    sendMedicine(s, p, now, w) {
      const r = myRoom(s, w, p.code), t = r && target(s, r, w, p.target); if (!t) return fail('대상을 골라줘');
      if (!t.pet.sick) return fail(`${t.pet.name}는 아프지 않아`);
      t.pet.sick = null; s.hearts += C.medFriendHearts;
      // 약값 150은 환급되어 보낸 사람 손해 0, 받은 펫이 답례 간식 1개 자동 전달
      const k = snackKey(DATA.ingredients[0].id, DATA.ingredients[4].id);
      s.inventory.snacks[k] = (s.inventory.snacks[k] || 0) + 1;
      addFeed(r, now, `${s.player.nickname}가 아픈 ${t.pet.name}에게 약을 보냈어`, s.player.id);
      return done(s, `${t.pet.name}가 나았어! 약값 ${C.medFriendCost}🪙은 환급, ❤${C.medFriendHearts}, 답례 간식 1개`);
    },
    heartFeed(s, p, now, w) {
      const r = myRoom(s, w, p.code), f = r && r.feed.find(x => x.id === p.id); if (!f) return fail('이미 사라진 소식이야');
      if (s.daily.hearts >= C.heartMax) return fail(`응원 하트는 하루 ${C.heartMax}개까지야`);
      s.daily.hearts++; f.hearts++; return done(s, '응원 하트를 보냈어');
    },
    requestPhoto(s, p, now, w) {
      const r = myRoom(s, w, p.code); if (!r) return fail('방이 없어');
      if (r.members.length < C.roomPhotoNeed) return fail(`친구가 ${C.roomPhotoNeed}명 이상이어야 해`);
      if (r.photoDay === dayKey(now)) return fail('오늘 방 기념사진은 이미 찍었어 (방당 하루 1장)');
      if (r.photoReq) return fail('이미 촬영 참여를 모으는 중이야');
      r.photoReq = { t: now, by: s.player.id, approvals: [s.player.id] };
      addFeed(r, now, `${s.player.nickname}가 방 기념사진 촬영을 제안했어`, s.player.id);
      return done(s, `촬영 참여 모으는 중 (1/${C.roomPhotoNeed}) · ${C.roomPhotoWindowH}시간 안에 모이면 완성`);
    },
    approvePhoto(s, p, now, w) {
      const r = myRoom(s, w, p.code), q = r && r.photoReq; if (!q) return fail('진행 중인 촬영이 없어');
      if (q.approvals.includes(s.player.id)) return fail('이미 승인했어');
      q.approvals.push(s.player.id);
      if (q.approvals.length >= C.roomPhotoNeed) return done(s, finishPhoto(r, now));
      return done(s, `촬영 참여 승인 (${q.approvals.length}/${C.roomPhotoNeed})`);
    },
    chat(s, p, now, w) {
      const r = myRoom(s, w, p.code); if (!r) return fail('방이 없어');
      if (r.chatOff) return fail('방장이 채팅을 꺼두었어');
      const last = r.chat.filter(m => m.from === s.player.id).pop();
      if (last && now - last.t < DATA.chat.rateSec * 1000) return fail('조금만 천천히 보내줘');
      let text, preset = false;
      if (s.player.ageGroup === 'kid') {
        text = DATA.chat.presets[p.preset]; preset = true; if (!text) return fail('보낼 말을 골라줘');
      } else {
        text = String(p.text || '').trim().replace(/\s+/g, ' ');
        if (!text) return fail('내용을 써줘');
        if (text.length > DATA.chat.maxLen) return fail(`${DATA.chat.maxLen}자까지 쓸 수 있어`);
        const flat = text.toLowerCase().replace(/[\s.\-_*~!]/g, '');
        if (DATA.chat.banned.some(b => flat.includes(b))) return fail('쓸 수 없는 말이 들어 있어');
        if (/\d[\d\s\-]{5,}\d/.test(text) || /\d{4,}/.test(text)) return fail('숫자(전화번호 등)는 보낼 수 없어');
        if (/https?:|www\.|\.(com|kr|net|me|io)\b|@/i.test(text)) return fail('링크와 @는 보낼 수 없어');
      }
      r.chat.push({ id: rid(), t: now, from: s.player.id, nick: s.player.nickname, text, preset });
      if (r.chat.length > DATA.chat.keep) r.chat = r.chat.slice(-DATA.chat.keep);
      return done(s, '');
    },
    reportChat(s, p, now, w) {
      const r = myRoom(s, w, p.code), m = r && r.chat.find(x => x.id === p.id); if (!m) return fail('이미 사라진 메시지야');
      if (r.reports.some(x => x.msgId === m.id && x.by === s.player.id)) return fail('이미 신고했어');
      r.reports.push({ t: now, msgId: m.id, from: m.from, text: m.text, by: s.player.id });
      return done(s, '신고했어. 확인할게');
    },
    toggleChat(s, p, now, w) {
      const r = myRoom(s, w, p.code); if (!r) return fail('방이 없어');
      if (r.hostId !== s.player.id) return fail('방장만 할 수 있어');
      r.chatOff = !r.chatOff; return done(s, r.chatOff ? '채팅을 껐어' : '채팅을 켰어');
    },
    // ───── 개발용 (이 기기에서 혼자 연습하는 모드 전용. 서버는 dev로 시작하는 행동을 거절함) ─────
    devAddFriend(s, p, now, w) {
      const r = myRoom(s, w, p.code); if (!r) return fail('방이 없어');
      if (r.members.length >= C.roomMax) return fail('방이 가득 찼어');
      const names = ['보리', '콩이', '밤톨', '모찌', '두부', '라떼', '구름', '솜이', '탄이'];
      const n = names[r.members.length % names.length], id = 'demo_' + rid();
      const f = newState(now, n + ' 주인', n, DATA.breeds[r.members.length % DATA.breeds.length].id, 'teen', id); f.demo = true;
      f.pet.base.mood = 60; w.players[id] = f; r.members.push({ id, nick: f.player.nickname });
      return done(s, `테스트 친구 ${n} 추가`);
    },
    devSick(s, p, now, w) {
      const r = myRoom(s, w, p.code), f = r && r.members.filter(m => w.players[m.id] && w.players[m.id].demo).map(m => w.players[m.id]).pop();
      if (!f) return fail('테스트 친구가 없어'); f.pet.sick = { since: now, until: now + C.sickNaturalH * H }; return done(s, `${f.pet.name}가 아파졌어(테스트)`);
    },
    devChat(s, p, now, w) {
      const r = myRoom(s, w, p.code), m = r && r.members.filter(x => w.players[x.id] && w.players[x.id].demo).pop(); if (!m) return fail('테스트 친구가 없어');
      const lines = ['안녕~ 오늘 산책 같이 갈래?', '몽이 옷 너무 귀엽다!', '간식 고마워 😊', '나 알바하고 왔어ㅋㅋ'];
      r.chat.push({ id: rid(), t: now, from: m.id, nick: m.nick, text: lines[r.chat.length % lines.length], preset: false });
      return done(s, '');
    },
    devApprove(s, p, now, w) {
      const r = myRoom(s, w, p.code), q = r && r.photoReq; if (!q) return fail('먼저 촬영을 제안해줘');
      const f = r.members.find(m => w.players[m.id] && w.players[m.id].demo && !q.approvals.includes(m.id)); if (!f) return fail('승인할 테스트 친구가 없어');
      q.approvals.push(f.id);
      return done(s, q.approvals.length >= C.roomPhotoNeed ? finishPhoto(r, now) : `촬영 참여 승인 (${q.approvals.length}/${C.roomPhotoNeed})`);
    }
  };

  // 행동 하나 실행. 결과: { ok, msg, state(나), rooms(바뀐 방들), players(바뀐 다른 플레이어들) }
  function act(state, type, p, now, world) {
    if (!A[type]) return fail('알 수 없는 행동');
    const s = settle(clone(state), now), w = { rooms: clone((world && world.rooms) || {}), players: clone((world && world.players) || {}) };
    for (const id in w.players) { if (id === s.player.id) delete w.players[id]; else settle(w.players[id], now); }
    for (const c in w.rooms) settleRoom(w.rooms[c], now);
    const res = A[type](s, p || {}, now, w);
    if (res.ok) { res.state = s; res.rooms = w.rooms; res.players = w.players; }
    return res;
  }

  // 화면에 보낼 모습: 나(시간 반영) + 내가 들어간 방들(멤버 펫 모습 포함, 신고 내용은 제외)
  function view(state, world, now) {
    const me = settled(state, now), players = {}; players[me.player.id] = me;
    for (const id in (world.players || {})) if (id !== me.player.id) players[id] = settled(world.players[id], now);
    const rooms = me.roomCodes.map(c => world.rooms[c]).filter(Boolean).map(r0 => {
      const r = settleRoom(clone(r0), now); delete r.reports;
      r.members = r.members.map(m => { const P = players[m.id];
        if (!P) return { id: m.id, nick: m.nick, me: m.id === me.player.id, pet: null };
        const st = stats(P.pet, now);
        return { id: m.id, nick: m.nick, me: m.id === me.player.id, pet: { name: P.pet.name, color: P.pet.color, equipped: P.pet.equipped, sick: st.sick, mood: st.mood, shine: careStatus(P.pet, now).shine, messes: P.pet.messes || [] } }; });
      return r; });
    return { me, rooms };
  }

  return { act, view, settled, settleRoom, stats, careStatus, newState, dayKey, snackName, snackKey, snackMoodFor, ing, cloth, normCode, nameKey };
})();
