(function(root){
'use strict';
const catalog=typeof module!=='undefined'&&module.exports ? require('./cables.js') : root.SWRCables;
const FT_TO_M=0.3048;
function number(value,label,min,max){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)
    throw new RangeError(`${label}: informe um número entre ${min} e ${max}.`);
  return value;
}
function parseNumber(value){
  if(typeof value==='number')return Number.isFinite(value)?value:NaN;
  let s=String(value).trim();
  if(/^[+-]?\d{1,3}(?:\.\d{3})+,\d+$/.test(s))s=s.replace(/\./g,'');
  if(!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(s))return NaN;
  return Number(s.replace(',','.'));
}
function lengthToMeters(length,unit){
  number(length,'Comprimento',0,100000);
  if(!['m','ft'].includes(unit))throw new RangeError('Unidade de comprimento inválida.');
  return length*(unit==='ft'?FT_TO_M:1);
}
function lossToDb100m(value,unit){
  number(value,'Atenuação',0,10000);
  if(!['100m','100ft'].includes(unit))throw new RangeError('Unidade de atenuação inválida.');
  return unit==='100ft'?value/FT_TO_M:value;
}
function cableById(id){
  const cable=catalog.cables.find(c=>c.id===id);
  if(!cable)throw new RangeError('Cabo não encontrado no catálogo.');
  return cable;
}
function cableLoss(id,freqMHz,customLoss=0,unit='100m'){
  number(freqMHz,'Frequência (MHz)',0.001,100000);
  if(id==='Custom')return {db100m:lossToDb100m(customLoss,unit),warning:'Perda manual válida somente na frequência informada.'};
  const cable=cableById(id),[min,max]=cable.range;
  if(freqMHz<min||freqMHz>max)throw new RangeError(`${cable.name}: faixa disponível ${min}–${max} MHz. Use um dado medido no modo Personalizado fora dessa faixa.`);
  let loss;
  if(cable.kind==='coefficients')loss=cable.k1*Math.sqrt(freqMHz)+cable.k2*freqMHz;
  else{
    const exact=cable.points.find(p=>p[0]===freqMHz);
    if(exact)loss=exact[1];
    else{
      const upper=cable.points.findIndex(p=>p[0]>freqMHz);
      const [f1,l1]=cable.points[upper-1],[f2,l2]=cable.points[upper];
      const t=Math.log(freqMHz/f1)/Math.log(f2/f1);
      loss=Math.exp(Math.log(l1)+t*Math.log(l2/l1));
    }
  }
  return {db100m:loss/FT_TO_M,warning:cable.publishedRange&&freqMHz<cable.publishedRange[0] ? 'Frequência abaixo de 30 MHz: extrapolação da fórmula do fabricante; confirme com medição.' : ''};
}
function gammaFromSWR(swr){return (swr-1)/(swr+1);}
function swrFromGamma(g){return (1+g)/(1-g);}
function lineMetrics(matchedLossDb,gammaLoad){
  const a=Math.pow(10,-matchedLossDb/10),g2=gammaLoad*gammaLoad,loopFactor=g2*a*a;
  const denominator=1-loopFactor;
  const efficiency=a*(1-g2)/denominator;
  const extraLossDb=10*Math.log10(denominator/(1-g2));
  return {loopFactor,denominator,efficiency,extraLossDb,lineLossDb:matchedLossDb+extraLossDb};
}
function buildTrips(p0,a,g2,count=8){
  const rows=[];let outgoing=p0;
  for(let i=1;i<=count;i++){
    const arriveLoad=outgoing*a,accepted=arriveLoad*(1-g2),reflectedLoad=arriveLoad*g2,returnedInput=reflectedLoad*a;
    rows.push({i,outgoing,arriveLoad,accepted,reflectedLoad,returnedInput,heatForward:outgoing-arriveLoad,heatReturn:reflectedLoad-returnedInput});
    outgoing=returnedInput;
    if(outgoing<=Math.max(1e-12,p0*1e-10))break;
  }
  return {rows,remainingW:outgoing};
}
function calculate(input){
  const powerConfiguredW=number(input.powerConfiguredW,'Potência (W)',0,1000000);
  const freqMHz=number(input.freqMHz,'Frequência (MHz)',0.001,100000);
  const lengthM=lengthToMeters(input.length,input.lengthUnit);
  const swrInput=number(input.swrInput,'SWR',1,10000);
  if(!['tuner','direct'].includes(input.systemMode))throw new RangeError('Modo do sistema inválido.');
  if(!['load','line'].includes(input.swrReference))throw new RangeError('Referência do SWR inválida.');
  const radioSWR=input.systemMode==='tuner'?number(input.radioSWR,'SWR residual',1,10000):1;
  const customZ0=input.cableType==='Custom'?number(input.customZ0,'Impedância do cabo',1,1000):null;
  const attenuation=cableLoss(input.cableType,freqMHz,input.customLoss,input.lossUnit);
  const cable=input.cableType==='Custom'?{name:'Personalizado',z0:customZ0}:cableById(input.cableType);
  const matchedLossDb=attenuation.db100m*lengthM/100;
  const a=Math.pow(10,-matchedLossDb/10);
  let gammaLoad,gammaLineInput;
  if(input.swrReference==='load'){
    gammaLoad=gammaFromSWR(swrInput);gammaLineInput=gammaLoad*a;
  }else{
    gammaLineInput=gammaFromSWR(swrInput);
    if(a===0)throw new RangeError('A atenuação impede inferir o SWR da carga a partir da entrada; informe o SWR na carga.');
    gammaLoad=gammaLineInput/a;
    if(gammaLoad>=1)throw new RangeError(`SWR de entrada incompatível com uma carga passiva e essa atenuação. Deve ser menor que ${swrFromGamma(a).toFixed(3)}:1; confira o local de medição.`);
    if(gammaLoad>gammaFromSWR(10000)+1e-14)throw new RangeError('O SWR inferido na carga excede 10000:1, limite numérico deste modelo. Confira a atenuação e a medição.');
  }
  const g2=gammaLoad*gammaLoad;
  // Net line input = forward power minus returning power. Never subtract mismatch twice.
  const {loopFactor,denominator,efficiency,extraLossDb,lineLossDb}=lineMetrics(matchedLossDb,gammaLoad);
  const residual=gammaFromSWR(radioSWR);
  let netInputW,forwardInputW,sourceReturnW,acceptedW,cableHeatW,trips;
  if(input.systemMode==='tuner'){
    sourceReturnW=powerConfiguredW*residual*residual;
    netInputW=powerConfiguredW-sourceReturnW;
    forwardInputW=netInputW/denominator;
    acceptedW=netInputW*efficiency;
    cableHeatW=netInputW-acceptedW;
    // Energy-packet illustration, not time-domain RF waves (phase is not modeled).
    trips=buildTrips(netInputW,a,g2);
  }else{
    forwardInputW=powerConfiguredW;
    sourceReturnW=forwardInputW*loopFactor;
    netInputW=forwardInputW-sourceReturnW;
    acceptedW=forwardInputW*a*(1-g2);
    cableHeatW=forwardInputW*(1-a)*(1+a*g2);
    trips=buildTrips(forwardInputW,a,g2,1);
  }
  const lineReturnedW=forwardInputW*loopFactor;
  const mismatchFraction=input.systemMode==='tuner'?residual*residual:loopFactor;
  const mismatchLossDb=Math.max(0,-10*Math.log10(1-mismatchFraction));
  const overallLossDb=lineLossDb+mismatchLossDb;
  const first=trips.rows[0];
  return {...input,freqMHz,lengthM,radioSWR,cableName:cable.name,z0:cable.z0,lossDb100m:attenuation.db100m,
    warning:attenuation.warning,matchedLossDb,a,gammaLoad,gammaLineInput,swrLoad:swrFromGamma(gammaLoad),swrLineInput:swrFromGamma(gammaLineInput),
    powerConfiguredW,forwardInputW,netInputW,sourceReturnW,lineReturnedW,acceptedW,cableHeatW:Math.max(0,cableHeatW),
    efficiency,lineLossDb,extraLossDb,mismatchLossDb,overallLossDb,loopFactor,
    trips:trips.rows,remainingW:input.systemMode==='tuner'?trips.remainingW:0,
    firstAcceptedW:first.accepted,firstArriveLoadW:first.arriveLoad,reflectedFirstW:first.reflectedLoad,firstReturnedW:first.returnedInput,
    recoveredW:input.systemMode==='tuner'?Math.max(0,acceptedW-first.accepted):0,
    balanceErrorW:powerConfiguredW-acceptedW-cableHeatW-sourceReturnW};
}
const api={FT_TO_M,parseNumber,lengthToMeters,lossToDb100m,cableById,cableLoss,gammaFromSWR,swrFromGamma,lineMetrics,buildTrips,calculate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SWRModel=Object.freeze(api);
})(globalThis);
