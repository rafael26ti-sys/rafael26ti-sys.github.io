const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'fazendas.js'), 'utf8');

class Element {
  constructor() { this.children = []; this.listeners = {}; this.dataset = {}; this.value = ''; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(key, value) { this[key] = value; }
  setCustomValidity(value) { this.validation = value; }
  reportValidity() { return true; }
  showModal() { this.open = true; }
  close() { this.open = false; }
}
function storage() {
  const data = new Map();
  return {getItem:key => data.get(key) ?? null, setItem:(key,val) => data.set(key,val), removeItem:key => data.delete(key)};
}
function setup({role = 'owner', online = true, offlineAccess = false, rpc, href = 'https://example.test/painel.html', local = storage(), session = storage()} = {}) {
  const ids = ['farms-dialog','farm-switch-open','farms-close','farms-list','farm-create-form','new-farm-name','farm-create-button','farms-feedback'];
  const elements = Object.fromEntries(ids.map(id => [id,new Element()]));
  const listeners = {}, calls = [], navigation = [];
  const account = {userId:'user-1',farmId:'farm-a',farmName:'Fazenda A',role,offlineAccess,
    farms:[{farmId:'farm-a',farmName:'Fazenda A',role},{farmId:'farm-b',farmName:'Fazenda B',role}]};
  const context = vm.createContext({URL,localStorage:local,sessionStorage:session,crypto:require('node:crypto'),navigator:{onLine:online},
    document:{querySelector:selector => elements[selector.slice(1)],createElement:() => new Element()},
    CustomEvent:class { constructor(type, options) { Object.assign(this, options); this.type = type; } preventDefault() { this.defaultPrevented = true; } },
    window:{location:{href,assign:url => navigation.push(url)},
      addEventListener:(type,fn) => (listeners[type] ||= []).push(fn),
      dispatchEvent:event => { for(const fn of listeners[event.type] || []) fn(event); return !event.defaultPrevented; },
      ruralSupabase:{rpc:async (name,args) => { calls.push({name,args}); return rpc ? rpc(name,args) : {data:[{farm_id:args.p_farm_id}]}; }}}
  });
  vm.runInContext(source, context);
  context.window.dispatchEvent({type:'rural:account-ready',detail:account});
  const create = async name => { elements['new-farm-name'].value = name; await elements['farm-create-form'].listeners.submit({preventDefault(){}}); };
  const switchToB = () => elements['farms-list'].children[1].children[1].listeners.click();
  return {context,elements,calls,navigation,account,local,session,create,switchToB};
}

test('selects only verified memberships; URL overrides saved farm and revoked farm falls back', () => {
  const t = setup({href:'https://example.test/painel.html?fazenda=foreign'});
  const farms = [{farm_id:'farm-a'},{farm_id:'farm-b'}];
  t.context.window.ruralFarms.rememberFarm('user-1','farm-b');
  assert.equal(t.context.window.ruralFarms.chooseMembership('user-1',farms).farm_id,'farm-b');
  assert.equal(t.context.window.ruralFarms.chooseMembership('user-2',farms).farm_id,'farm-a');
  t.context.window.location.href = 'https://example.test/painel.html?fazenda=farm-a';
  assert.equal(t.context.window.ruralFarms.chooseMembership('user-1',farms).farm_id,'farm-a');
  assert.equal(t.context.window.ruralFarms.chooseMembership('user-1',[]),null);
});
test('switch uses a fresh page and keeps selection scoped to the signed-in user', () => {
  const t = setup(); t.switchToB();
  assert.equal(new URL(t.navigation[0]).searchParams.get('fazenda'),'farm-b');
  assert.equal(new URL(t.navigation[0]).hash,'#dashboard');
  assert.equal(t.account.farmId,'farm-a');
  assert.equal(t.local.getItem('controle-rural.selected-farm.v1.user-1'),'farm-b');
});
test('pending saves block both navigation and creation', async () => {
  const t = setup(); t.context.window.addEventListener('rural:before-farm-switch',event => {event.preventDefault(); event.detail.reason = 'Salvando';});
  t.switchToB(); await t.create('Fazenda C');
  assert.equal(t.navigation.length,0); assert.equal(t.calls.length,0);
  assert.equal(t.elements['farms-feedback'].textContent,'Salvando');
});
for(const options of [{online:false},{offlineAccess:true}]) {
  test(`offline access prevents farm creation and switching: ${JSON.stringify(options)}`, async () => {
    const t = setup(options); t.switchToB(); await t.create('Fazenda C');
    assert.equal(t.calls.length,0); assert.equal(t.navigation.length,0);
  });
}
for(const role of ['vaqueiro','caseiro']) {
  test(`${role} cannot create a farm`, async () => {
    const t = setup({role}); await t.create('Fazenda C');
    assert.equal(t.elements['farm-create-form'].hidden,true); assert.equal(t.calls.length,0);
  });
}
test('new farm creation sends a trimmed name and navigates only on success', async () => {
  const t = setup(); await t.create('  Fazenda C  ');
  assert.equal(t.calls[0].name,'create_owned_farm'); assert.equal(t.calls[0].args.p_name,'Fazenda C');
  assert.equal(new URL(t.navigation[0]).searchParams.get('fazenda'),t.calls[0].args.p_farm_id);
  assert.equal(t.session.getItem('controle-rural.new-farm.v1.user-1'),null);
});
test('uncertain network failure reuses the same operation ID, including after reload', async () => {
  const t = setup({rpc:() => { throw new Error('Network error'); }});
  await t.create('Fazenda C'); await t.create('Fazenda C');
  assert.equal(t.navigation.length,0); assert.equal(t.calls[0].args.p_farm_id,t.calls[1].args.p_farm_id);
  const restored = setup({session:t.session}); await restored.create('Fazenda C');
  assert.equal(restored.calls[0].args.p_farm_id,t.calls[0].args.p_farm_id);
});
test('double submit cannot create two farms', async () => {
  let release; const t = setup({rpc:(_,args) => new Promise(resolve => {release = () => resolve({data:[{farm_id:args.p_farm_id}]});})});
  const pending = t.create('Fazenda C'); await t.create('Fazenda C');
  assert.equal(t.calls.length,1); release(); await pending;
});
test('render treats farm names as text and labels the selected farm', () => {
  const t = setup(); t.account.farms[0].farmName = '<img onerror=alert(1)>';
  t.elements['farm-switch-open'].listeners.click();
  const row = t.elements['farms-list'].children[0];
  assert.equal(row.children[0].children[0].textContent,'<img onerror=alert(1)>');
  assert.equal(row['aria-current'],'true'); assert.equal(row.children[1].disabled,true);
});
test('offline snapshots and queued operations never cross farms or users', () => {
  const context = vm.createContext({window:{},localStorage:storage(),crypto:require('node:crypto'),console});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','offline.js'),'utf8'),context);
  const offline = context.window.ruralOffline;
  const a = {userId:'owner',farmId:'a'}, b = {userId:'owner',farmId:'b'};
  offline.saveSnapshot(a,{animals:[{id:'only-a'}]});
  offline.enqueue(a,{entity:'animal',action:'create',recordId:'only-a',values:{name:'Estrela'}});
  assert.equal(offline.getSnapshot(b),null); assert.equal(offline.getQueue(b).length,0);
  assert.equal(offline.getSnapshot({userId:'other',farmId:'a'}),null);
  assert.equal(offline.getSnapshot(a).state.animals[0].id,'only-a'); assert.equal(offline.getQueue(a).length,1);
});
test('mutation tracker releases its lock on success and network failure', async () => {
  let options, release;
  const context = vm.createContext({window:{supabase:{createClient:(_,__,opts) => {options = opts;}}},console,
    fetch:() => new Promise(resolve => {release = resolve;})});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','supabase-client.js'),'utf8'),context);
  const pending = options.global.fetch('/rest/v1/animals',{method:'POST'});
  assert.equal(context.window.ruralPendingWrites(),1); release({ok:true}); await pending;
  assert.equal(context.window.ruralPendingWrites(),0);
  context.fetch = () => Promise.reject(new Error('Network error'));
  await assert.rejects(options.global.fetch('/rest/v1/animals',{method:'DELETE'}));
  assert.equal(context.window.ruralPendingWrites(),0);
});
