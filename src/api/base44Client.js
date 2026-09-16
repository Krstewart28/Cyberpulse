// Local compatibility layer replacing the former Base44 backend.
// Data is stored in this browser's localStorage so the portfolio/demo app
// runs independently with no hosted backend or API keys.

const DB_PREFIX = 'cyberpulse_entity_';
const USERS_KEY = 'cyberpulse_users';
const SESSION_KEY = 'cyberpulse_session';
const PENDING_KEY = 'cyberpulse_pending_registration';

const read = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const clone = (v) => JSON.parse(JSON.stringify(v));
const id = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeEntity(name) {
  const key = `${DB_PREFIX}${name}`;
  const getAll = () => read(key, []);
  const saveAll = (rows) => write(key, rows);
  const normalize = (row) => ({ id: row.id || id(), created_date: row.created_date || new Date().toISOString(), ...row });
  const sortRows = (rows, sort) => {
    if (!sort) return rows;
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    return [...rows].sort((a,b) => {
      const av = a[field] ?? '', bv = b[field] ?? '';
      return (av > bv ? 1 : av < bv ? -1 : 0) * (desc ? -1 : 1);
    });
  };
  return {
    async list(sort, limit) { return clone(sortRows(getAll(), sort).slice(0, limit || undefined)); },
    async filter(criteria = {}, sort, limit) {
      const rows = getAll().filter(r => Object.entries(criteria).every(([k,v]) => r[k] === v));
      return clone(sortRows(rows, sort).slice(0, limit || undefined));
    },
    async create(row) { const rows=getAll(); const item=normalize(row); rows.push(item); saveAll(rows); return clone(item); },
    async bulkCreate(items=[]) { const rows=getAll(); const created=items.map(normalize); saveAll([...rows,...created]); return clone(created); },
    async update(itemId, patch) { const rows=getAll(); const i=rows.findIndex(r=>r.id===itemId); if(i<0) throw new Error(`${name} not found`); rows[i]={...rows[i],...patch,updated_date:new Date().toISOString()}; saveAll(rows); return clone(rows[i]); },
    async bulkUpdate(items=[]) { const rows=getAll(); const map=new Map(items.map(x=>[x.id,x])); const next=rows.map(r=>map.has(r.id)?{...r,...map.get(r.id),updated_date:new Date().toISOString()}:r); saveAll(next); return clone(next.filter(r=>map.has(r.id))); },
    async deleteMany(criteria={}) { const rows=getAll(); const match=r=>Object.entries(criteria).every(([k,v])=>r[k]===v); const next=Object.keys(criteria).length?rows.filter(r=>!match(r)):[]; saveAll(next); return { deleted: rows.length-next.length }; }
  };
}

const entities = new Proxy({}, { get: (_, name) => makeEntity(String(name)) });

const auth = {
  async register({email,password}) {
    const users=read(USERS_KEY,[]);
    if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())) throw new Error('An account with that email already exists');
    // Demo-only local auth. Do not use this password storage approach in production.
    write(PENDING_KEY,{email,password});
    return { success:true, demo_code:'123456' };
  },
  async verifyOtp({email,otpCode}) {
    const pending=read(PENDING_KEY,null);
    if(!pending || pending.email!==email) throw new Error('No pending registration found');
    if(otpCode!=='123456') throw new Error('For this local demo, use verification code 123456');
    const users=read(USERS_KEY,[]); const user={id:id(),email,password:pending.password,full_name:email.split('@')[0],role:'user'};
    users.push(user); write(USERS_KEY,users); localStorage.removeItem(PENDING_KEY); write(SESSION_KEY,{userId:user.id});
    return {access_token:user.id,user:stripPassword(user)};
  },
  async resendOtp() { return {success:true,demo_code:'123456'}; },
  async loginViaEmailPassword(email,password) {
    const user=read(USERS_KEY,[]).find(u=>u.email.toLowerCase()===email.toLowerCase() && u.password===password);
    if(!user) throw new Error('Invalid email or password'); write(SESSION_KEY,{userId:user.id}); return stripPassword(user);
  },
  async me() { const s=read(SESSION_KEY,null); const u=s&&read(USERS_KEY,[]).find(x=>x.id===s.userId); if(!u){const e=new Error('Not authenticated');e.status=401;throw e;} return stripPassword(u); },
  logout(redirect) { localStorage.removeItem(SESSION_KEY); if(redirect) window.location.href='/login'; },
  redirectToLogin(returnTo='/') { window.location.href=`/login?returnTo=${encodeURIComponent(new URL(returnTo,location.origin).pathname)}`; },
  setToken(token) { if(token) write(SESSION_KEY,{userId:token}); },
  loginWithProvider() { throw new Error('Google sign-in is unavailable in the local GitHub demo. Use email and password.'); },
  async resetPasswordRequest() { return {success:true}; },
  async resetPassword({resetToken,newPassword}) { const users=read(USERS_KEY,[]); const i=users.findIndex(u=>u.id===resetToken); if(i<0) throw new Error('Invalid local reset token'); users[i].password=newPassword; write(USERS_KEY,users); return {success:true}; }
};
function stripPassword(user){ const {password,...safe}=user; return safe; }

export const base44 = {
  entities,
  auth,
  app: { async getPublicSettings(){ return {id:'cyberpulse-local',public_settings:{app_name:'Cyberpulse'}}; } }
};
