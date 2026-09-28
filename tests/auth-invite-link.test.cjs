const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');
const linkHelpers = source.slice(source.indexOf('  function readLinkedInvite()'), source.indexOf('  function setFeedback('));
const acceptance = source.slice(source.indexOf('  async function finishOnboarding('), source.indexOf('  tabs.forEach((tab) => tab.addEventListener'));

function setup(hash, rpcResult = { data: [{ farm_id: 'new-farm' }] }) {
  const calls = [];
  const window = {
    location: { hash, search: '', replace: url => calls.push(['redirect', url]) },
  };
  const client = {
    rpc: async (...args) => { calls.push(['rpc', ...args]); return rpcResult; },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { full_name: 'Nome do Perfil' } }) }) }) }),
  };
  const context = vm.createContext({ window, client, calls, URLSearchParams, encodeURIComponent,
    findMembership: async () => { calls.push(['membership']); return { farm_id: 'old-farm' }; },
    showOnboarding: () => calls.push(['onboarding']),
    returnTarget: 'painel.html#dashboard',
  });
  vm.runInContext(`${linkHelpers}\nconst linkedInvite = readLinkedInvite();\n${acceptance}\nthis.run = continueAfterAuthentication; this.invite = linkedInvite;`, context);
  return context;
}

test('invited existing member joins the linked farm after login', async () => {
  const flow = setup('#invite=ab12cd34ef&role=vaqueiro');
  await flow.run({ id: 'person', user_metadata: { full_name: 'Pessoa Convidada' } });
  assert.equal(flow.invite.code, 'AB12CD34EF');
  assert.equal(flow.calls[0][1], 'accept_farm_invite');
  assert.deepEqual(JSON.parse(JSON.stringify(flow.calls[0][2])), {
    p_full_name: 'Pessoa Convidada', p_code: 'AB12CD34EF', p_requested_role: 'vaqueiro',
  });
  assert.deepEqual(flow.calls[1], ['redirect', 'painel.html?fazenda=new-farm#dashboard']);
  assert.equal(flow.calls.some(call => call[0] === 'membership'), false);
});

test('server rejection does not open a farm for the wrong account', async () => {
  const flow = setup('#invite=ab12cd34ef&role=gerente', { error: new Error('Este convite foi criado para outro e-mail.') });
  await assert.rejects(flow.run({ id: 'other', user_metadata: { full_name: 'Outra Pessoa' } }), /outro e-mail/);
  assert.equal(flow.calls.some(call => call[0] === 'redirect'), false);
});

test('malformed invitation is ignored', () => {
  const flow = setup('#invite=bad!&role=owner');
  assert.equal(flow.invite, null);
});
