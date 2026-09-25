const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = source.indexOf('  function weatherLocationName() {');
const end = source.indexOf('  function weatherAlertsFromData(data)', start);
assert.ok(start >= 0 && end > start, 'farm weather selection is available');
const selection = source.slice(start, end);

function setup() {
  const queries = [];
  const elements = Object.fromEntries(['weatherCurrent','weatherForecast','weatherAlerts'].map(key =>
    [key,{replaceChildren() {}}]));
  for (const key of ['navClimateCount','metricWeatherTemperature','metricWeatherSummary','weatherLocationLabel','weatherUpdatedAt','weatherSearchInput']) {
    elements[key] = {textContent:'',value:''};
  }
  const context = vm.createContext({
    state:{weatherLocation:{name:'Belo Horizonte',latitude:-19.9208,longitude:-43.9378},weatherLocationFarmId:'old-farm'},
    elements,weatherFetchController:null,weatherData:{old:true},weatherDataSavedAt:'yesterday',
    renderDashboardAlerts() {},loadWeather() { queries.push({...context.state.weatherLocation}); },
  });
  vm.runInContext(selection, context);
  return {context,elements,queries};
}

test('climate follows the selected farm rather than the previous farm or default city', () => {
  const t = setup();
  t.context.useFarmWeatherLocation({farmId:'farm-a',farmName:'Fazenda A',locationLatitude:'-18.123456',locationLongitude:'-47.987654'});
  assert.equal(t.queries.at(-1).latitude,-18.123456);
  assert.equal(t.context.state.weatherLocationFarmId,'farm-a');
  assert.equal(t.elements.weatherLocationLabel.textContent,'Fazenda A');
  assert.equal(t.context.weatherData,null);

  t.context.useFarmWeatherLocation({farmId:'farm-b',farmName:'Fazenda B',locationLatitude:'-20.345678',locationLongitude:'-44.123456'});
  assert.equal(t.queries.at(-1).longitude,-44.123456);
  assert.equal(t.context.state.weatherLocationFarmId,'farm-b');
});

test('a farm without a saved location does not inherit another farm forecast', () => {
  const t = setup();
  t.context.useFarmWeatherLocation({farmId:'farm-b',farmName:'Fazenda B',locationLatitude:null,locationLongitude:null});
  assert.equal(t.queries.at(-1).latitude,null);
  assert.equal(t.context.weatherData,null);
  assert.equal(t.elements.weatherSearchInput.value,'');
  t.context.useFarmWeatherLocation({farmId:'farm-b',farmName:'Fazenda B',locationLatitude:-21,locationLongitude:-45},true);
  assert.equal(t.queries.at(-1).latitude,-21);
  t.context.useFarmWeatherLocation({farmId:'farm-b',farmName:'Fazenda B',locationLatitude:null,locationLongitude:null},true);
  assert.equal(t.queries.at(-1).latitude,null);
});
