const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const code = source.slice(source.indexOf('  async function createTeamInvite(event)'),
  source.indexOf('  async function updateTeamMember('));

function setup({ email = 'pessoa@example.com', functionResult, role = 'owner' } = {}) {
  const calls = [], messages = [];
  const button = {disabled:false,textContent:'Criar convite'};
  const form = {querySelector:() => button, reset:() => { calls.push('reset'); }};
  const elements = {teamLatestCode:{},teamLatestExpiry:{},teamLatestInvite:{hidden:true}};
  const context = vm.createContext({
    activeAccount:{farmId:'farm-1',role,offlineAccess:false},
    navigator:{onLine:true},
    FormData:class { get(key) { return {role:'caseiro',email}[key]; } },
    window:{ruralSupabase:{
      functions:{invoke:async (...args) => {calls.push(['invoke',...args]);return functionResult; }},
      rpc:async (...args) => {calls.push(['rpc',...args]);return {data:[{invite_code:'MANUAL123',expires_at:'2026-10-01'}]};},
    }},
    elements,latestInviteCode:null,
    teamDateTime:() => '01/10',
    loadTeamFromSupabase:async () => {calls.push('refresh');},
    showToast:message => messages.push(message),
    console:{error:()=>{}},
  });
  vm.runInContext(`${code}\nthis.runInvite = createTeamInvite`,context);
  return {calls,messages,elements,button,run:() => context.runInvite({preventDefault(){},currentTarget:form})};
}

test('addressed invitation sends email once and uses the returned code', async () => {
  const flow = setup({functionResult:{data:{invite_code:'EMAIL123',expires_at:'2026-10-01',email_sent:true}}});
  await flow.run();
  assert.equal(flow.calls.filter(call => Array.isArray(call) && call[0] === 'rpc').length,0);
  assert.equal(flow.calls[0][1],'send-farm-invite');
  assert.equal(flow.elements.teamLatestCode.textContent,'EMAIL123');
  assert.match(flow.messages[0],/enviado para pessoa@example.com/);
  assert.equal(flow.button.disabled,false);
});

test('unconfigured mail gives a manual code and clearly reports no email', async () => {
  const flow = setup({functionResult:{error:{context:{status:503}}}});
  await flow.run();
  assert.equal(flow.calls.filter(call => Array.isArray(call) && call[0] === 'rpc').length,1);
  assert.match(flow.elements.teamLatestExpiry.textContent,/E-mail não enviado/);
  assert.equal(flow.elements.teamLatestCode.textContent,'MANUAL123');
});

test('uncertain or unauthorized errors never create a duplicate invitation', async () => {
  for (const status of [403, undefined]) {
    const flow = setup({functionResult:{error:{context:{status}}}});
    await flow.run();
    assert.equal(flow.calls.filter(call => Array.isArray(call) && call[0] === 'rpc').length,0);
    assert.equal(flow.elements.teamLatestInvite.hidden,true);
    assert.equal(flow.button.disabled,false);
  }
});
