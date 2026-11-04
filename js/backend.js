/* 저장소/서버 연결.
 * config.js 에 서버 주소가 있으면 Remote(진짜 서버, 친구와 연결),
 * 없으면 Local(이 기기 안에서 혼자 연습)으로 동작해.
 * 두 모드는 화면에 같은 모양의 데이터(view)를 줘서 화면 코드는 모드를 몰라도 돼. */
const CONFIG = (typeof window !== 'undefined' && window.MALANG_CONFIG) || {};

const LocalBackend = {
  mode: 'local', view: null,
  KEY: 'malang_pet_v2', offKey: 'malang_pet_dev_offset',
  off() { try { return +localStorage.getItem(this.offKey) || 0; } catch (e) { return 0; } },
  now() { return Date.now() + this.off(); },
  devSkip(ms) { try { localStorage.setItem(this.offKey, String(this.off() + ms)); } catch (e) {} },
  load() { try { return JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { return null; } },
  save(s) { try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch (e) {} },
  reset() { try { localStorage.removeItem(this.KEY); localStorage.removeItem(this.offKey); } catch (e) {} this.view = null; },
  hasPlayer() { return !!this.load(); },
  async create(nick, pet, color, age) {
    const me = Game.newState(this.now(), nick, pet, color, age);
    this.save({ me, rooms: {}, players: {} }); await this.sync(); return { ok: true };
  },
  async sync() {
    const st = this.load();
    this.view = st ? Game.view(st.me, { rooms: st.rooms, players: st.players }, this.now()) : null; return this.view;
  },
  async act(type, p) {
    const st = this.load(); if (!st) return { ok: false, msg: '저장된 게임이 없어' };
    const r = Game.act(st.me, type, p, this.now(), { rooms: st.rooms, players: st.players });
    if (r.ok) { st.me = r.state; st.rooms = r.rooms; st.players = r.players; this.save(st); }
    await this.sync(); return { ok: r.ok, msg: r.msg };
  },
  async recover() { return { ok: false, msg: '서버에 연결된 뒤에 쓸 수 있어' }; }
};

const RemoteBackend = {
  mode: 'remote', view: null, offset: 0, CRED: 'malang_pet_creds',
  creds() { try { return JSON.parse(localStorage.getItem(this.CRED)); } catch (e) { return null; } },
  saveCreds(c) { try { localStorage.setItem(this.CRED, JSON.stringify(c)); } catch (e) {} },
  now() { return Date.now() + this.offset; },
  hasPlayer() { return !!this.creds(); },
  reset() { try { localStorage.removeItem(this.CRED); } catch (e) {} this.view = null; },
  async call(body) {
    try {
      const r = await fetch(CONFIG.url.replace(/\/$/, '') + '/functions/v1/api', { method: 'POST',
        headers: { 'content-type': 'application/json', apikey: CONFIG.key, authorization: 'Bearer ' + CONFIG.key }, body: JSON.stringify(body) });
      return await r.json();
    } catch (e) { return { ok: false, msg: '인터넷 연결을 확인해줘', net: true }; }
  },
  take(j) {
    if (j && j.now) this.offset = j.now - Date.now();
    if (j && j.view) this.view = j.view;
    if (j && j.auth === false) this.reset();
    return j;
  },
  async create(nick, pet, color, age) {
    const j = this.take(await this.call({ op: 'create', nick, pet, color, age }));
    if (j.ok) this.saveCreds({ id: j.id, token: j.token }); return j;
  },
  async recover(code) {
    const j = this.take(await this.call({ op: 'recover', code }));
    if (j.ok) this.saveCreds({ id: j.id, token: j.token }); return j;
  },
  async sync() { const c = this.creds(); if (!c) return null; this.take(await this.call({ op: 'sync', ...c })); return this.view; },
  async act(type, p) { const c = this.creds(); if (!c) return { ok: false, msg: '계정이 없어' }; const j = this.take(await this.call({ op: 'act', ...c, type, p })); return { ok: j.ok, msg: j.msg }; }
};

const Backend = CONFIG.url && CONFIG.key ? RemoteBackend : LocalBackend;
