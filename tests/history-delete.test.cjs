const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const historyCode = app.slice(app.indexOf('  function updateHistoryControls()'),
  app.indexOf('  const CONTACT_STATUS_LABELS'));

class Element {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.disabled = false;
    this.hidden = false;
    this.textContent = '';
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelectorAll() {
    const results = [];
    for (const child of this.children) {
      if (child.dataset?.historyDelete) results.push(child);
      results.push(...(child.querySelectorAll?.() || []));
    }
    return results;
  }
}

const record = (id) => ({id, action:'create', module:'animais',
  recordLabel:'Vaca 01', actorName:'Dono', actorRole:'owner', changedFields:[],
  occurredAt:'2026-09-17T14:00:00Z'});

function setup({ result, confirm = true, role = 'owner', online = true, request } = {}) {
  const calls = [], prompts = [], toasts = [], statuses = [];
  const elements = {};
  for (const name of ['historyRefresh','historyLoadMore','historyModuleFilter',
    'historyActionFilter','historyList','historyEmpty','historyLoadMoreWrap','historyCount']) {
    elements[name] = new Element();
  }
  const query = {
    delete() { calls.push(['delete']); return this; },
    eq(key, value) { calls.push(['eq',key,value]); return this; },
    select(columns) {
      calls.push(['select',columns]);
      return request ? request() : Promise.resolve(result || {data:[{id:101}],error:null});
    },
  };
  const context = vm.createContext({
    window: {ruralSupabase:{from(table) { calls.push(['from',table]); return query; }},
      confirm(message) { prompts.push(message); return confirm; }},
    navigator:{onLine:online},
    activeAccount:{userId:'owner-1',farmId:'farm-1',role},
    activityHistory:[record('101'),record('100')],
    activityHistoryCursor:'100', activityHistoryHasMore:true,
    activityHistoryLoading:false, activityHistoryDeleting:false,
    document:{createElement:tag => new Element(tag)}, elements,
    HISTORY_ACTIONS:{create:{label:'Criou',className:'create'}},
    HISTORY_MODULES:{animais:{label:'Animais',icon:'A'}},
    TEAM_ROLE_LABELS:{owner:'Dono'}, HISTORY_PAGE_SIZE:30,
    reportDateTime:new Intl.DateTimeFormat('pt-BR'),
    showToast:message=>toasts.push(message),
    setHistoryStatus:(...value)=>statuses.push(value),
    naturalList:values=>values.join(', '), historyFieldLabel:field=>field,
    console:{error(){}},
  });
  vm.runInContext(historyCode, context);
  return {context,calls,prompts,toasts,statuses,elements};
}

test('owner deletes only the selected history row in the current farm', async () => {
  const t = setup();
  await t.context.deleteHistoryEntry('101');
  assert.deepEqual(t.calls, [['from','activity_log'],['delete'],
    ['eq','farm_id','farm-1'],['eq','id','101'],['select','id']]);
  assert.equal(t.context.activityHistory.length,1);
  assert.equal(t.context.activityHistory[0].id,'100');
  assert.match(t.prompts[0],/Vaca 01/);
  assert.match(t.prompts[0],/cadastros continuarão salvos/);
  assert.match(t.prompts[0],/Não será possível desfazer/);
  assert.equal(t.context.activityHistoryDeleting,false);
  assert.equal(t.elements.historyRefresh.disabled,false);
});

for (const role of ['caseiro','vaqueiro']) {
  test(`blocks ${role} before confirmation or any request`, async () => {
    const t = setup({role});
    await t.context.deleteHistoryEntry('101');
    assert.equal(t.calls.length,0);
    assert.equal(t.prompts.length,0);
    t.context.renderActivityHistory();
    assert.equal(t.elements.historyList.querySelectorAll().length,0);
  });
}

test('cancel leaves every row untouched and makes no request', async () => {
  const t = setup({confirm:false});
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.calls.length,0);
  assert.equal(t.context.activityHistory.length,2);
});

test('offline deletion is not queued', async () => {
  const t = setup({online:false});
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.calls.length,0);
  assert.equal(t.prompts.length,0);
  assert.match(t.toasts[0],/internet/);
});

test('cached offline access is blocked even if the device reports online', async () => {
  const t = setup();
  t.context.activeAccount.offlineAccess = true;
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.calls.length,0);
});

test('unlisted row IDs are not sent to the server', async () => {
  const t = setup();
  await t.context.deleteHistoryEntry('999');
  assert.equal(t.calls.length,0);
});

test('missing account or client never sends a deletion', async () => {
  const t = setup();
  t.context.activeAccount = null;
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.calls.length,0);
});

for (const result of [{data:[],error:null},{data:[{id:999}],error:null},
  {data:null,error:{message:'permission denied'}}]) {
  test(`does not claim success for ${JSON.stringify(result)}`, async () => {
    const t = setup({result});
    await t.context.deleteHistoryEntry('101');
    assert.equal(t.context.activityHistory.length,2);
    assert.equal(t.context.activityHistoryDeleting,false);
    assert.equal(t.statuses.at(-1)[0],'error');
    assert.ok(!t.toasts.some(message=>message.startsWith('Atividade apagada')));
  });
}

test('network rejection preserves rows and re-enables controls', async () => {
  const t = setup({request:()=>Promise.reject(new Error('network error'))});
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.context.activityHistory.length,2);
  assert.equal(t.context.activityHistoryDeleting,false);
  assert.equal(t.elements.historyRefresh.disabled,false);
});

test('loading history blocks deletion', async () => {
  const t = setup();
  t.context.activityHistoryLoading = true;
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.calls.length,0);
});

test('double clicks and refreshes cannot overlap an in-flight delete', async () => {
  let resolve;
  const t = setup({request:()=>new Promise(done=>{resolve=done;})});
  t.context.renderActivityHistory();
  const pending = t.context.deleteHistoryEntry('101');
  assert.equal(t.elements.historyRefresh.disabled,true);
  assert.ok(t.elements.historyList.querySelectorAll().every(button=>button.disabled));
  await t.context.deleteHistoryEntry('101');
  await t.context.loadActivityHistory();
  assert.equal(t.prompts.length,1);
  assert.equal(t.calls.filter(call=>call[0]==='from').length,1);
  resolve({data:[{id:101}],error:null});
  await pending;
});

test('account changes do not remove rows or show a success in another farm', async () => {
  let resolve;
  const t = setup({request:()=>new Promise(done=>{resolve=done;})});
  const pending = t.context.deleteHistoryEntry('101');
  t.context.activeAccount = {userId:'owner-2',farmId:'farm-2',role:'owner'};
  resolve({data:[{id:101}],error:null});
  await pending;
  assert.equal(t.context.activityHistory.length,2);
  assert.equal(t.toasts.length,0);
});

test('deleting the last displayed row keeps the cursor and older-page access', async () => {
  const t = setup();
  t.context.activityHistory = [record('101')];
  t.context.activityHistoryCursor = '101';
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.context.activityHistory.length,0);
  assert.equal(t.context.activityHistoryCursor,'101');
  assert.equal(t.elements.historyLoadMoreWrap.hidden,false);
});

test('no older-page button after deleting the final record', async () => {
  const t = setup();
  t.context.activityHistory = [record('101')];
  t.context.activityHistoryHasMore = false;
  await t.context.deleteHistoryEntry('101');
  assert.equal(t.elements.historyLoadMoreWrap.hidden,true);
});

test('render uses text for labels and exposes an accessible deletion control', () => {
  const t = setup();
  const label = '<img src=x onerror=alert(1)>';
  t.context.activityHistory = [{...record('101'),recordLabel:label}];
  t.context.renderActivityHistory();
  const button = t.elements.historyList.querySelectorAll()[0];
  assert.equal(button.dataset.historyDelete,'101');
  assert.equal(button.textContent,'×');
  assert.equal(button.attributes.title,'Apagar do histórico');
  assert.equal(button.attributes['aria-label'],`Apagar atividade: ${label}`);
  assert.equal(t.elements.historyList.children[0].children[1].children[1].textContent,label);
});

test('SQL restricts DELETE to the existing farm-owner check', () => {
  const sql = fs.readFileSync(path.join(__dirname,'..','supabase','migrations',
    '20260922221219_allow_owner_delete_activity_log.sql'),'utf8');
  assert.match(sql,/for delete\s+to authenticated/);
  assert.match(sql,/private\.is_farm_owner\(farm_id, \(select auth\.uid\(\)\)\)/);
  assert.match(sql,/grant delete on table public\.activity_log to authenticated/);
  assert.doesNotMatch(sql,/grant (all|insert|update)|security definer|delete from/i);
});
