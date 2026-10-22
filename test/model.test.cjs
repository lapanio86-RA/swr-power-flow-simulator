const {test}=require('node:test');
const assert=require('node:assert/strict');
const m=require('../src/model.js');
const {cables}=require('../src/cables.js');
const defaults={powerConfiguredW:100,freqMHz:30,cableType:'8240',length:10,lengthUnit:'m',lossUnit:'100m',customLoss:0,customZ0:50,systemMode:'tuner',radioSWR:1,swrReference:'load',swrInput:2};
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b} (±${tolerance})`);

test('metres, feet and attenuation units use exact 0.3048 conversion',()=>{
  near(m.lengthToMeters(100,'ft'),30.48);near(m.lossToDb100m(1,'100ft'),100/30.48);
  const meters=m.calculate({...defaults,length:30.48});
  const feet=m.calculate({...defaults,length:100,lengthUnit:'ft'});
  near(meters.acceptedW,feet.acceptedW);
  const customM=m.calculate({...defaults,cableType:'Custom',customLoss:5});
  const customFt=m.calculate({...defaults,cableType:'Custom',customLoss:1.524,lossUnit:'100ft'});
  near(customM.acceptedW,customFt.acceptedW);
});
test('manufacturer tables return their published endpoints without relabeling units',()=>{
  for(const c of cables.filter(c=>c.kind==='table'))for(const [frequency,loss]of c.points)near(m.cableLoss(c.id,frequency).db100m,loss/0.3048);
  near(m.cableLoss('8240',100).db100m,12.46719160105,1e-10);
  near(m.cableLoss('8267',100).db100m,6.233595800525,1e-10);
  near(m.cableLoss('1694A',100).db100m,6.397637795276,1e-10);
});
test('manufacturer LMR equations agree with rounded published tables',()=>{
  for(const c of cables.filter(c=>c.kind==='coefficients'))for(const [frequency,loss]of c.points)near(m.cableLoss(c.id,frequency).db100m*.3048,loss,.051);
  near(m.cableLoss('LMR-400',100).db100m,1.2489/.3048);
  assert.ok(m.cableLoss('LMR-400-UF',100).db100m>m.cableLoss('LMR-400',100).db100m);
});
test('HF loss varies with frequency; above-table values are never silently frozen',()=>{
  assert.ok(m.cableLoss('8240',7).db100m<m.cableLoss('8240',14).db100m);
  assert.ok(m.cableLoss('8240',14).db100m<m.cableLoss('8240',30).db100m);
  assert.ok(m.cableLoss('LMR-400',900).db100m>m.cableLoss('LMR-400',450).db100m);
  assert.match(m.cableLoss('LMR-400',7).warning,/extrapolação/);
  assert.throws(()=>m.cableLoss('8240',1001),/faixa/);
  assert.throws(()=>m.cableLoss('8240',.5),/faixa/);
  assert.throws(()=>m.cableLoss('unknown',30),/não encontrado/);
});
test('log-log interpolation equals the geometric mean at geometric midpoint',()=>{
  near(m.cableLoss('8240',Math.sqrt(10*50)).db100m,Math.sqrt(1.1*2.5)/.3048);
});
test('direct ideal cable and SWR 3 deliver 75 W, not the old double-subtracted 56.25 W',()=>{
  const r=m.calculate({...defaults,length:0,swrInput:3,systemMode:'direct'});
  near(r.acceptedW,75);near(r.sourceReturnW,25);near(r.cableHeatW,0);near(r.netInputW,75);
  near(r.lineLossDb,0);near(r.overallLossDb,-10*Math.log10(.75));
});
test('ideal tuner and lossless line deliver all net input despite load mismatch',()=>{
  const r=m.calculate({...defaults,length:0,swrInput:10,radioSWR:2});
  near(r.acceptedW,100*(1-1/9));near(r.sourceReturnW,100/9);near(r.cableHeatW,0);near(r.lineLossDb,0);
  assert.ok(r.forwardInputW>r.netInputW);
});
test('matched load gives ordinary insertion loss in both modes',()=>{
  for(const systemMode of ['tuner','direct']){
    const r=m.calculate({...defaults,systemMode,swrInput:1});
    near(r.acceptedW,100*10**(-r.matchedLossDb/10));near(r.extraLossDb,0);near(r.sourceReturnW,0);
  }
});
test('load and input SWR references produce the same physical result',()=>{
  const load=m.calculate({...defaults,cableType:'LMR-400',swrInput:4});
  const input=m.calculate({...defaults,cableType:'LMR-400',swrInput:load.swrLineInput,swrReference:'line'});
  near(load.acceptedW,input.acceptedW);near(load.swrLoad,input.swrLoad);
  assert.ok(load.swrLineInput<load.swrLoad);
  assert.throws(()=>m.calculate({...defaults,length:10000,swrReference:'line',swrInput:2}),/incompatível|impede/);
});
test('energy conservation across cable, frequency, SWR, length and mode combinations',()=>{
  for(const cable of cables)for(const freqMHz of [1,7,100,1000])for(const length of [0,.1,10,1000])for(const swrInput of [1,3,10,10000])for(const systemMode of ['tuner','direct']){
    const r=m.calculate({...defaults,cableType:cable.id,freqMHz,length,swrInput,systemMode});
    near(r.acceptedW+r.cableHeatW+r.sourceReturnW,100,1e-7);
    near(r.forwardInputW-r.lineReturnedW,r.netInputW,1e-7);
    assert.ok(r.acceptedW>=0&&r.cableHeatW>=0&&r.sourceReturnW>=0);
    assert.ok(r.extraLossDb>=-1e-12&&r.lineLossDb>=0);
  }
});
test('zero power leaves meaningful dB results; very high attenuation stays finite',()=>{
  const zero=m.calculate({...defaults,powerConfiguredW:0});
  near(zero.acceptedW,0);assert.ok(Number.isFinite(zero.lineLossDb));
  const high=m.calculate({...defaults,cableType:'Custom',customLoss:10000,length:10000});
  near(high.acceptedW,0);near(high.cableHeatW,100);assert.ok(Number.isFinite(high.lineLossDb));
});
test('energy-packet table reports the remainder instead of pretending eight trips converged',()=>{
  const r=m.calculate({...defaults,length:0,swrInput:1000});
  const counted=r.trips.reduce((sum,t)=>sum+t.accepted+t.heatForward+t.heatReturn,0);
  near(counted+r.remainingW,100);assert.ok(r.remainingW>90);
});
test('rejects malformed, negative and non-finite inputs without silent defaults',()=>{
  for(const bad of [{powerConfiguredW:-1},{freqMHz:NaN},{length:Infinity},{swrInput:.9},{systemMode:'bad'},{lengthUnit:'yards'},{cableType:'Custom',customLoss:-1}])assert.throws(()=>m.calculate({...defaults,...bad}),RangeError);
  for(const invalid of ['', 'abc','12foo','0x10','1,2,3','1 2'])assert.ok(Number.isNaN(m.parseNumber(invalid)));
  near(m.parseNumber('1.234,50'),1234.5);near(m.parseNumber('14.2'),14.2);near(m.parseNumber('14,2'),14.2);
});
