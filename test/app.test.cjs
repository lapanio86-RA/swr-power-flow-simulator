const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function boot(){
  const html=fs.readFileSync(path.join(__dirname,'../simulador.html'),'utf8');
  const elements={};
  for(const tag of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){
    elements[tag[1]]={value:/\bvalue="([^"]*)"/.exec(tag[0])?.[1]??'',hidden:tag[0].includes(' hidden'),style:{},innerHTML:'',textContent:'',events:{},addEventListener(type,fn){this.events[type]=fn;}};
  }
  const timers=new Map();let timerID=0;
  const sandbox={document:{getElementById:id=>{assert.ok(elements[id],`Missing ${id}`);return elements[id];},addEventListener(){}},setTimeout:fn=>{timers.set(++timerID,fn);return timerID;},clearTimeout:id=>timers.delete(id)};
  vm.createContext(sandbox);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],sandbox);
  return {elements,timers,evaluate:code=>vm.runInContext(code,sandbox),change(id,value){elements[id].value=value;elements[id].events.change();},click(id){elements[id].events.click();}};
}
test('offline bundle boots with all manufacturer presets, provenance and valid results',()=>{
  const app=boot();
  assert.equal(app.elements.results.hidden,false);assert.equal(app.elements.lossDb100m.readOnly,true);
  assert.match(app.elements.cableType.innerHTML,/LMR-400-UF/);assert.match(app.elements.sourceInfo.innerHTML,/8240_techdata.pdf/);
  assert.match(app.elements.comparisonTable.innerHTML,/75 Ω/);
  assert.ok(app.evaluate('last.acceptedW')>80);
});
test('unit toggles preserve physical length and custom attenuation; presets stay read-only',()=>{
  const app=boot();app.change('cableType','Custom');app.change('lossDb100m','5');
  const before=app.evaluate('last.acceptedW');
  app.change('lossUnit','100ft');assert.equal(app.elements.lossDb100m.readOnly,false);
  assert.ok(Math.abs(app.evaluate('last.acceptedW')-before)<1e-8);
  app.change('lengthUnit','ft');assert.ok(Math.abs(app.evaluate('last.lengthM')-10)<1e-9);
  assert.ok(Math.abs(app.evaluate('last.acceptedW')-before)<1e-8);
  app.change('freqMHz','100');assert.equal(app.elements.lossDb100m.value,'1,524');
  app.change('cableType','LMR-400');assert.equal(app.elements.lossDb100m.readOnly,true);
  assert.equal(app.elements.lossDb100m.value,'1,248900');
});
test('invalid inputs hide stale results and cannot animate; valid edits recover',()=>{
  const app=boot();app.click('animateButton');assert.ok(app.timers.size>0);
  app.change('freqMHz','');assert.equal(app.elements.results.hidden,true);assert.equal(app.timers.size,0);
  app.click('animateButton');assert.equal(app.timers.size,0);
  app.change('freqMHz','30');assert.equal(app.elements.results.hidden,false);
  app.change('systemMode','direct');app.change('lengthM','0');app.change('swrInput','3');
  assert.equal(app.elements.cardAntenna.textContent,'75,00 W');assert.equal(app.elements.cardReturned.textContent,'25,00 W');
});
test('animation recalculates uncommitted field edits and reset restores defaults',()=>{
  const app=boot();app.elements.powerW.value='200';app.click('animateButton');
  assert.equal(app.evaluate('last.powerConfiguredW'),200);
  for(const fn of app.timers.values())fn();
  assert.match(app.elements.timeline.textContent,/200,00 W/);
  app.click('resetButton');assert.equal(app.timers.size,0);assert.equal(app.elements.powerW.value,'100');
});
test('75-ohm warning and unsupported frequency are visible',()=>{
  const app=boot();app.change('cableType','1694A');assert.match(app.elements.cableWarning.textContent,/75 Ω/);
  app.change('freqMHz','7000');assert.equal(app.elements.results.hidden,true);assert.match(app.elements.errorMessage.textContent,/faixa disponível/);
});
test('index and legacy filename are identical standalone entry points',()=>{
  const root=path.join(__dirname,'..');
  assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),fs.readFileSync(path.join(root,'simulador.html'),'utf8'));
});
