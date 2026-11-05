/* 그림 모음
 * - 강아지: GPT(코덱스)로 뽑은 진짜 그림 (assets/dogs/*.webp). 견종 4종, 모두 같은 캔버스·같은 눈 위치.
 * - 옷·배경·밥그릇/공/목줄/얼음주머니: 아직 임시 코드 그림(PLACEHOLDER). 진짜 그림이 오면 이 파일만 바꾸면 돼. */
const Art = (() => {
  /* 견종 표: n = 놀기 프레임 수, sick = 아픈 그림이 있는지,
   * dy = 옷이 앉는 높이 보정(머리/목/몸), ice = 아픈 그림이 없는 견종의 얼음주머니 자리 */
  const BREEDS = {
    maltese:    { n: 6, sick: true, walk: 4, dy: { head: -10, neck: 0, body: 0 } },
    bichon:     { n: 6, walk: 4, dy: { head: -10, neck: 0, body: 0 }, ice: [97.75, 34] },
    pomeranian: { n: 6, dy: { head: -10, neck: 2, body: 4 }, ice: [97.75, 43] },
    poodle:     { n: 5, dy: { head: -22, neck: 0, body: 2, hs: 0.72 }, ice: [97.75, 17] }
  };
  const LEGACY = { cream: 'maltese', choco: 'poodle', apricot: 'pomeranian' }; // 예전 색 이름으로 저장된 펫 호환
  const breedOf = id => BREEDS[id] ? id : (LEGACY[id] || 'maltese');
  const PLAY_MS = 180, WALK_MS = 210;                                 // 놀기 그림 한 장이 보이는 시간
  const url = (b, k) => `assets/dogs/${b}_${k}.webp`;
  const cache = {};                                    // 캔버스(사진 저장)용: 주소 → data URI
  async function ready() {
    const urls = []; for (const b in BREEDS) { for (let i = 1; i <= BREEDS[b].n; i++) urls.push(url(b, i)); }
    urls.push(url('maltese', 'sick'));
    for (const b in BREEDS) for (let i = 1; i <= (BREEDS[b].walk || 0); i++) urls.push(url(b, 'walk_' + i));
    await Promise.all(urls.filter(u => !cache[u]).map(async u => {
      try { const blob = await (await fetch(u)).blob();
        cache[u] = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
      } catch (e) {}
    }));
  }
  const OL = '#7a5a44';
  const st = `stroke="${OL}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

  const clothes = {
    bow: () => `<g ${st}><path d="M100 50 L74 38 L74 62 Z" fill="#ff8fb1"/><path d="M100 50 L126 38 L126 62 Z" fill="#ff8fb1"/><circle cx="100" cy="50" r="8" fill="#ff6f9c"/></g>`,
    beret: () => `<g ${st}><ellipse cx="104" cy="52" rx="38" ry="15" fill="#c46a7a"/><circle cx="104" cy="36" r="5" fill="#c46a7a"/></g>`,
    strawberryhat: () => `<g ${st}><path d="M70 62 Q100 8 130 62 Z" fill="#ff6b6b"/><path d="M88 30 L100 20 L112 30 Z" fill="#7cc576"/></g><g fill="#fff3a8"><circle cx="92" cy="46" r="2.5"/><circle cx="108" cy="42" r="2.5"/><circle cx="100" cy="56" r="2.5"/></g>`,
    lacedress: () => `<g ${st}><path d="M70 128 L130 128 L148 182 L52 182 Z" fill="#fff4f7"/><path d="M52 182 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0" fill="#fff4f7" stroke="#e7a6b8"/></g>`,
    hoodie: () => `<g ${st}><path d="M68 128 L132 128 L148 180 L52 180 Z" fill="#f3c969"/><path d="M78 160 h44 l4 16 h-52 z" fill="#e7b650"/></g>`,
    raincoat: () => `<g ${st}><path d="M66 126 L134 126 L150 184 L50 184 Z" fill="#7fb7e6"/><circle cx="100" cy="146" r="4" fill="#fff"/><circle cx="100" cy="164" r="4" fill="#fff"/></g>`,
    scarf: () => `<g ${st}><ellipse cx="100" cy="138" rx="40" ry="10" fill="#e86a6a"/><rect x="108" y="140" width="16" height="30" rx="6" fill="#e86a6a"/></g>`,
    bell: () => `<g ${st}><path d="M66 136 Q100 154 134 136" fill="none" stroke="#c9553d"/><circle cx="100" cy="150" r="8" fill="#ffd54a"/></g>`
  };

  /* 강아지 SVG 문자열 (viewBox 200x200).
   * color: 견종 이름(maltese/bichon/pomeranian/poodle) — 예전 색 이름(cream 등)도 받아줘.
   * pose: basic | eating | playing | sick | walking
   * still: true면 움직이는 그림 대신 한 장만 (사진·캔버스용)   inline: true면 이미지를 data URI로 넣음 (캔버스용) */
  function dog({ color = 'maltese', pose = 'basic', equipped = {}, sick = false, still = false, inline = false, shine = false } = {}) {
    const b = breedOf(color), B = BREEDS[b];
    if (sick) pose = 'sick';
    const src = u => (inline && cache[u]) || u;
    const img = (u, extra = '') => `<image href="${src(u)}" x="0" y="0" width="200" height="200" ${extra}/>`;
    let art, extra = '';
    if (pose === 'playing' && !still) {                // 놀기: 프레임을 번갈아 보여줌(CSS 애니메이션)
      art = Array.from({ length: B.n }, (_, i) => img(url(b, i + 1), `class="pf pa" style="animation-name:pf${B.n};animation-duration:${B.n * PLAY_MS}ms;animation-delay:${i * PLAY_MS}ms"`)).join('');
    } else if (pose === 'walking' && B.walk) {          // 걷기: 서서 총총 걷는 그림 (말티즈·비숑 연결됨)
      art = still ? img(url(b, 'walk_1')) : Array.from({ length: B.walk }, (_, i) => img(url(b, 'walk_' + (i + 1)), `class="pf pa" style="animation-name:pf${B.walk};animation-duration:${B.walk * WALK_MS}ms;animation-delay:${i * WALK_MS}ms"`)).join('');
    } else if (pose === 'sick' && B.sick) {
      art = img(url(b, 'sick'));
    } else {
      const k = pose === 'eating' ? 2 : pose === 'playing' ? 3 : 1;   // 먹기=눈 감은 얼굴, 놀기(정지)=손 흔들기
      art = img(url(b, k));
    }
    if (pose === 'eating') extra = `<ellipse cx="100" cy="188" rx="30" ry="9" fill="#d9c3a5" ${st}/>`;
    else if (pose === 'playing') extra = `<circle cx="164" cy="170" r="14" fill="#7fc4e8" ${st}/>`;
    else if (pose === 'walking') extra = `<path d="M158 150 q24 -6 30 -36" fill="none" stroke="#e86a6a" stroke-width="4" stroke-linecap="round"/>`;
    else if (pose === 'sick' && !B.sick) { const [ix, iy] = B.ice;   // 아픈 그림이 아직 없는 견종: 기본 그림 + 임시 얼음주머니
      extra = `<g ${st}><circle cx="${ix}" cy="${iy}" r="8.5" fill="#bfe3ff"/></g><g stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M${ix} ${iy - 5}V${iy + 5}M${ix - 4.3} ${iy - 2.5}L${ix + 4.3} ${iy + 2.5}M${ix - 4.3} ${iy + 2.5}L${ix + 4.3} ${iy - 2.5}"/></g>`; }
    const dy = { ...B.dy }, hs = dy.hs || 1;
    if (pose === 'walking' && B.walk) { dy.body -= 5; }   // 서 있는 몸통은 앉은 몸통보다 낮고 짧아서 옷을 위로 올림   // 머리 옷은 모자 밑면(y 62)을 기준으로 크기를 줄여서(푸들) 정수리 뭉치 위에 얹음
    const put = (slot) => equipped[slot] ? `<g transform="translate(-2.25 ${dy[slot]})${slot === 'head' && hs !== 1 ? ` translate(100 62) scale(${hs}) translate(-100 -62)` : ''}">${clothes[equipped[slot]]()}</g>` : '';
    const sway = pose === 'playing' ? 'class="bounce"' : '';
    // 목욕·양치 뒤 반짝 표시 (임시 코드 그림)
    const sp = shine ? [[26, 58], [176, 66], [150, 24], [34, 128], [172, 138]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><path class="tw" style="animation-delay:${i * 0.25}s" d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="#fff6a8" stroke="#f5c542" stroke-width="1" stroke-linejoin="round"/></g>`).join('') : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g ${sway}>${art}${put('body')}${put('neck')}${put('head')}${extra}</g>${sp}</svg>`;
  }

  const BG = {
    showroom: ['#ffe9f1', '#ffd3e4'], meadow: ['#d9f2d0', '#fff3b8'],
    party: ['#e6dcff', '#ffd6ec'], picnic: ['#d6ecff', '#fff0cf']
  };
  const BGDECO = {
    showroom: '<rect x="0" y="330" width="100%" height="150" fill="#fff7fa" opacity=".8"/>',
    meadow: '<circle cx="60" cy="400" r="14" fill="#ff9ec1"/><circle cx="300" cy="420" r="14" fill="#fff"/><circle cx="170" cy="440" r="14" fill="#ffd54a"/>',
    party: '<circle cx="50" cy="60" r="12" fill="#ff8fb1"/><circle cx="310" cy="90" r="12" fill="#7fc4e8"/><circle cx="170" cy="40" r="12" fill="#ffd54a"/>',
    picnic: '<rect x="30" y="360" width="300" height="80" fill="#ffb3b3" opacity=".6"/>'
  };
  function bgSVG(id, w = 360, h = 480) {
    const [a, b] = BG[id] || BG.showroom;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 360 480"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="360" height="480" fill="url(#g)"/>${BGDECO[id] || ''}</svg>`;
  }
  const VB = { head: '48 18 104 62', neck: '52 118 96 62', body: '36 112 128 78' };
  function clothIcon(id) {
    const c = DATA.clothes.find(x => x.id === id);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB[c.slot]}" class="cicon">${clothes[id]()}</svg>`;
  }
  return { dog, bgSVG, clothIcon, ready, breedOf, BREEDS };
})();
