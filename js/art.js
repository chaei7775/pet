/* 임시 그림 (PLACEHOLDER)
 * GPT로 뽑은 진짜 그림이 나오면 이 파일의 함수만 이미지(<img>)를 돌려주도록 바꾸면 돼.
 * 지금은 코드로 그린 간단한 말랑 강아지야. */
const Art = (() => {
  const PAL = {
    cream: { body: '#F8E6C8', ear: '#E5C28F', muzzle: '#FFF6E6' },
    choco: { body: '#A57855', ear: '#6F4A33', muzzle: '#D9B995' },
    apricot: { body: '#F4BC85', ear: '#DA915A', muzzle: '#FFE2C2' }
  };
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

  function dog({ color = 'cream', pose = 'basic', equipped = {}, sick = false } = {}) {
    const P = PAL[color] || PAL.cream;
    if (sick) pose = 'sick';
    let eyes, mouth = `<path d="M92 112 Q100 120 108 112" fill="none" ${st}/>`, extra = '';
    if (pose === 'eating') {
      eyes = `<path d="M74 92 Q82 84 90 92 M110 92 Q118 84 126 92" fill="none" ${st}/>`;
      mouth = `<ellipse cx="100" cy="114" rx="7" ry="5" fill="#d86a6a" ${st}/>`;
      extra = `<ellipse cx="100" cy="186" rx="30" ry="9" fill="#d9c3a5" ${st}/>`;
    } else if (pose === 'playing') {
      eyes = `<path d="M74 94 Q82 84 90 94 M110 94 Q118 84 126 94" fill="none" ${st}/>`;
      mouth = `<path d="M90 110 Q100 126 110 110 Z" fill="#d86a6a" ${st}/>`;
      extra = `<circle cx="164" cy="170" r="14" fill="#7fc4e8" ${st}/>`;
    } else if (pose === 'sick') {
      eyes = `<path d="M74 90 L90 96 M74 98 L90 96 M126 90 L110 96 M126 98 L110 96" fill="none" ${st}/>`;
      mouth = `<path d="M92 116 Q100 108 108 116" fill="none" ${st}/>`;
      extra = `<path d="M142 66 q6 10 0 16 q-6 -6 0 -16z" fill="#8fd3f4"/><rect x="40" y="70" width="26" height="9" rx="4" fill="#fff" ${st} transform="rotate(-25 53 74)"/>`;
    } else if (pose === 'walking') {
      eyes = `<circle cx="82" cy="92" r="5.5" fill="${OL}"/><circle cx="118" cy="92" r="5.5" fill="${OL}"/>`;
      extra = `<path d="M158 150 q24 -6 30 -36" fill="none" stroke="#e86a6a" stroke-width="4" stroke-linecap="round"/>`;
    } else {
      eyes = `<circle cx="82" cy="92" r="6" fill="${OL}"/><circle cx="118" cy="92" r="6" fill="${OL}"/><circle cx="84" cy="90" r="2" fill="#fff"/><circle cx="120" cy="90" r="2" fill="#fff"/>`;
    }
    const sway = pose === 'playing' ? 'class="bounce"' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g ${sway}>
      <circle cx="152" cy="136" r="13" fill="${P.body}" ${st}/>
      <ellipse cx="100" cy="148" rx="52" ry="38" fill="${P.body}" ${st}/>
      <ellipse cx="74" cy="182" rx="14" ry="9" fill="${P.muzzle}" ${st}/><ellipse cx="126" cy="182" rx="14" ry="9" fill="${P.muzzle}" ${st}/>
      ${equipped.body ? clothes[equipped.body]() : ''}
      <ellipse cx="54" cy="84" rx="16" ry="26" fill="${P.ear}" ${st} transform="rotate(14 54 84)"/>
      <ellipse cx="146" cy="84" rx="16" ry="26" fill="${P.ear}" ${st} transform="rotate(-14 146 84)"/>
      <circle cx="100" cy="92" r="50" fill="${P.body}" ${st}/>
      <ellipse cx="100" cy="110" rx="22" ry="16" fill="${P.muzzle}"/>
      <ellipse cx="100" cy="102" rx="7" ry="5" fill="${OL}"/>
      ${eyes}${mouth}
      <circle cx="66" cy="106" r="7" fill="#ffb3c1" opacity=".7"/><circle cx="134" cy="106" r="7" fill="#ffb3c1" opacity=".7"/>
      ${equipped.neck ? clothes[equipped.neck]() : ''}${equipped.head ? clothes[equipped.head]() : ''}
      ${extra}</g></svg>`;
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
  return { dog, bgSVG, clothIcon };
})();
