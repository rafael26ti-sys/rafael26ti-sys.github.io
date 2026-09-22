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
  focus() {}
}
function storage() {
  const data = new Map();
  return {getItem:key => data.get(key) ?? null, setItem:(key,val) => data.set(key,val), removeItem:key => data.delete(key),
    get length() { return data.size; }, key:index => [...data.keys()][index] ?? null};
}
function setup({role = 'owner', online = true, offlineAccess = false, rpc, remove, href = 'https://example.test/painel.html', local = storage(), session = storage()} = {}) {
  const ids = ['farms-dialog','farm-switch-open','farms-close','farms-list','farm-create-form','new-farm-name','farm-create-button','farms-feedback',
    'delete-farm-dialog','delete-farm-form','delete-farm-name','delete-farm-confirm-name','delete-farm-submit','delete-farm-close','delete-farm-cancel','delete-farm-feedback'];
  const elements = Object.fromEntries(ids.map(id => [id,new Element()]));
  const listeners = {}, calls = [], navigation = [], removals = [];
  const account = {userId:'user-1',farmId:'farm-a',farmName:'Fazenda A',role,offlineAccess,
    farms:[{farmId:'farm-a',farmName:'Fazenda A',role},{farmId:'farm-b',farmName:'Fazenda B',role}]};
  const context = vm.createContext({URL,localStorage:local,sessionStorage:session,crypto:require('node:crypto'),navigator:{onLine:online},
    document:{querySelector:selector => elements[selector.slice(1)],createElement:() => new Element()},
    CustomEvent:class { constructor(type, options) { Object.assign(this, options); this.type = type; } preventDefault() { this.defaultPrevented = true; } },
    window:{location:{href,assign:url => navigation.push(url),replace:url => navigation.push(url)},
      addEventListener:(type,fn) => (listeners[type] ||= []).push(fn),
      dispatchEvent:event => { for(const fn of listeners[event.type] || []) fn(event); return !event.defaultPrevented; },
      ruralOffline:{purgeFarm: id => removals.push(id)},
      ruralSupabase:{rpc:async (name,args) => { calls.push({name,args}); return rpc ? rpc(name,args) :
        name === 'list_owned_farm_evidence' ? {data:[]} : name === 'delete_owned_farm' ? {data:true} : {data:[{farm_id:args.p_farm_id}]}; },
        storage:{from:() => ({remove:async paths => {removals.push(paths); return remove ? remove(paths) : {data:paths.map(name => ({name}))};}})}}}
  });
  vm.runInContext(source, context);
  context.window.dispatchEvent({type:'rural:account-ready',detail:account});
  const create = async name => { elements['new-farm-name'].value = name; await elements['farm-create-form'].listeners.submit({preventDefault(){}}); };
  const switchToB = () => elements['farms-list'].children[1].children[1].children[0].listeners.click();
  const openDelete = () => elements['farms-list'].children[0].children[1].children[1]?.listeners.click();
  const submitDelete = async name => {elements['delete-farm-confirm-name'].value = name; await elements['delete-farm-form'].listeners.submit({preventDefault(){}});};
  return {context,elements,calls,navigation,account,local,session,create,switchToB,openDelete,submitDelete,removals};
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
for(const role of ['gerente','vaqueiro','caseiro']) {
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
  assert.equal(row['aria-current'],'true'); assert.equal(row.children[1].children[0].disabled,true);
  assert.equal(row.children[1].children[1].textContent,'Excluir');
});
test('offline snapshots and queued operations never cross farms or users', () => {
  const context = vm.createContext({window:{},localStorage:storage(),crypto:require('node:crypto'),console});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','offline.js'),'utf8'),context);
  const offline = context.window.ruralOffline;
  const a = {userId:'owner',farmId:'a'}, b = {userId:'owner',farmId:'b'};
  offline.saveSnapshot(a,{animals:[{id:'only-a'}]});
  offline.saveSnapshot(b,{animals:[{id:'only-b'}]});
  offline.saveAccount({...a,role:'owner',fullName:'Owner',farmName:'A'});
  offline.saveAccount({userId:'other',farmId:'b',role:'owner',fullName:'Other',farmName:'B'});
  offline.enqueue(a,{entity:'animal',action:'create',recordId:'only-a',values:{name:'Estrela'}});
  assert.equal(offline.getSnapshot(b).state.animals[0].id,'only-b'); assert.equal(offline.getQueue(b).length,0);
  assert.equal(offline.getSnapshot({userId:'other',farmId:'a'}),null);
  assert.equal(offline.getSnapshot(a).state.animals[0].id,'only-a'); assert.equal(offline.getQueue(a).length,1);
  offline.purgeFarm('a');
  assert.equal(offline.getSnapshot(a),null); assert.equal(offline.getQueue(a).length,0);
  assert.equal(offline.getAccount('owner'),null);
  assert.equal(offline.getSnapshot(b).state.animals[0].id,'only-b');
  assert.equal(offline.getAccount('other').farmId,'b');
});
test('manager and staff never receive a delete control', () => {
  for (const role of ['gerente','vaqueiro','caseiro']) {
    const t = setup({role});
    assert.equal(t.elements['farms-list'].children[0].children[1].children.length,1);
    t.openDelete();
    assert.equal(t.elements['delete-farm-dialog'].open,undefined);
  }
});
test('only the selected farm can be deleted, with an exact name', async () => {
  const t = setup(); t.openDelete();
  assert.equal(t.elements['delete-farm-name'].textContent,'Fazenda A');
  await t.submitDelete('Fazenda B');
  assert.equal(t.calls.length,0); assert.equal(t.navigation.length,0);
  t.elements['delete-farm-confirm-name'].value = 'Fazenda A';
  t.elements['delete-farm-confirm-name'].listeners.input();
  assert.equal(t.elements['delete-farm-submit'].disabled,false);
  await t.submitDelete('Fazenda A');
  assert.equal(t.calls[0].name,'list_owned_farm_evidence');
  assert.equal(t.calls[1].name,'delete_owned_farm');
  assert.equal(t.calls[1].args.p_farm_id,'farm-a');
  assert.equal(t.removals[0],'farm-a');
  assert.equal(new URL(t.navigation[0]).searchParams.get('fazenda'),'farm-b');
});
test('file removal fails closed; no database deletion follows', async () => {
  const t = setup({rpc:name => name === 'list_owned_farm_evidence' ? {data:[{path:'farm-a/task/photo.jpg'}]} : {data:true},
    remove:() => ({data:[],error:{message:'Storage unavailable'}})});
  t.openDelete(); await t.submitDelete('Fazenda A');
  assert.equal(t.calls.some(call => call.name === 'delete_owned_farm'),false);
  assert.equal(t.elements['delete-farm-dialog'].open,true);
  assert.equal(t.navigation.length,0);
  assert.equal(t.elements['delete-farm-feedback'].textContent,'Storage unavailable');
});
test('photos are removed via Storage API before the database deletion', async () => {
  let batches = 0;
  const t = setup({rpc:name => name === 'list_owned_farm_evidence'
    ? {data:batches++ ? [] : [{path:'farm-a/task/photo.jpg'}]} : {data:true}});
  t.openDelete(); await t.submitDelete('Fazenda A');
  assert.equal(t.calls[0].name,'list_owned_farm_evidence');
  assert.equal(t.calls[1].args.p_after,'farm-a/task/photo.jpg');
  assert.equal(t.calls[2].name,'delete_owned_farm');
  assert.equal(t.removals[0][0],'farm-a/task/photo.jpg');
});
test('deletion blocked without internet or when another save is pending', async () => {
  const offline = setup({online:false}); offline.openDelete(); await offline.submitDelete('Fazenda A');
  assert.equal(offline.calls.length,0);
  const t = setup(); t.context.window.addEventListener('rural:before-farm-switch',e => e.preventDefault());
  t.openDelete(); await t.submitDelete('Fazenda A'); assert.equal(t.calls.length,0);
});
test('deleting the last farm sends the owner to onboarding', async () => {
  const t = setup(); t.account.farms = t.account.farms.slice(0,1);
  t.elements['farm-switch-open'].listeners.click();
  t.openDelete(); await t.submitDelete('Fazenda A');
  assert.deepEqual(t.navigation,['login.html']);
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
