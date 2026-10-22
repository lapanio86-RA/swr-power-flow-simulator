const {test}=require('node:test');
const assert=require('node:assert/strict');
const {calculate}=require('../src/model.js');
const base={powerConfiguredW:100,freqMHz:100,cableType:'LMR-400',length:100,lengthUnit:'ft',lossUnit:'100m',customZ0:50,radioSWR:1,swrReference:'load',swrInput:3};
test('Powertec L-400 observed reference agrees at displayed precision with forward-power basis',()=>{
  // Browser observation 2026-10-22: 30.48 m, 100 MHz, 100 W, VSWR 3.
  // Powertec L-400 is not claimed to be the identical manufactured LMR cable.
  const r=calculate({...base,systemMode:'direct'});
  assert.equal(r.matchedLossDb.toFixed(2),'1.25');
  assert.equal(r.overallLossDb.toFixed(2),'2.50');
  assert.equal(r.acceptedW.toFixed(1),'56.3');
});
test('QSL example agrees after normalizing its legacy attenuation and net-power basis',()=>{
  // Browser observation 2026-10-22: TMS LMR-400, 100 ft, 100 MHz, SWR 3, 100 W.
  // Matched 1.232 dB; extra 0.586; total 1.818; output 65.798 W.
  // Use the displayed matched loss as custom input: QSL's older coefficients differ.
  const r=calculate({...base,cableType:'Custom',customLoss:1.232,lossUnit:'100ft',systemMode:'tuner'});
  assert.ok(Math.abs(r.extraLossDb-.586)<.002);
  assert.ok(Math.abs(r.lineLossDb-1.818)<.002);
  assert.ok(Math.abs(r.acceptedW-65.798)<.02);
});
