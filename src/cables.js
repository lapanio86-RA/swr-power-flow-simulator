(function(root){
'use strict';
// Attenuation numbers are factual manufacturer data, in dB/100 ft.
// 100 ft = 30.48 m exactly. Never relabel these as dB/100 m.
const verified='2026-10-22';
const belden=(part,name,z0,points)=>({id:part,name,manufacturer:'Belden',z0,kind:'table',points,unit:'dB/100 ft',range:[points[0][0],points.at(-1)[0]],verified,source:`https://catalog.belden.com/techdata/EN/${part}_techdata.pdf`,method:'Interpolação log-log entre pontos nominais do fabricante; sem extrapolação.'});
const lmr=(id,k1,k2,max,source,points)=>({id,name:id,manufacturer:'Times Microwave Systems',z0:50,kind:'coefficients',k1,k2,points,unit:'dB/100 ft',range:[1,max],publishedRange:[30,max],verified,source,method:'k1 × √f + k2 × f, com f em MHz. Abaixo de 30 MHz: extrapolação da fórmula publicada.'});
const cables=[
  belden('8240','RG-58 / Belden 8240',50,[[1,.3],[10,1.1],[50,2.5],[100,3.8],[200,5.6],[400,8.4],[700,11.7],[900,13.7],[1000,14.5]]),
  belden('9258','RG-8X / Belden 9258',50,[[1,.3],[10,.9],[50,2.1],[100,3.1],[200,4.5],[400,6.6],[700,9.1],[900,10.7],[1000,11.2]]),
  belden('8267','RG-213 / Belden 8267',50,[[1,.17],[10,.55],[50,1.3],[100,1.9],[200,2.7],[400,4.1],[700,6.5],[900,7.6],[1000,8],[4000,21.5]]),
  belden('1694A','RG-6 / Belden 1694A (75 Ω)',75,[[1,.24],[3.58,.44],[5,.52],[6,.57],[7,.61],[10,.71],[12,.78],[25,1.08],[67.5,1.65],[71.5,1.69],[88.5,1.86],[100,1.95],[135,2.24],[143,2.3],[180,2.57],[270,3.17],[360,3.69],[540,4.5],[720,5.3],[750,5.4],[1000,6.3],[1500,7.8],[2000,9.2],[2250,9.8],[3000,11.5],[4500,14.5],[6000,17.7]]),
  lmr('LMR-240',.242080,.000330,8000,'https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-240-datasheet.pdf',[[30,1.3],[50,1.7],[150,3],[220,3.7],[450,5.3],[900,7.6],[1500,9.9],[1800,10.9],[2000,11.5],[2500,12.9],[5800,20.4],[8000,24.3]]),
  lmr('LMR-400',.122290,.000260,8000,'https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-400-datasheet.pdf',[[30,.7],[50,.9],[150,1.5],[220,1.9],[450,2.7],[900,3.9],[1500,5.1],[1800,5.7],[2000,6],[2500,6.8],[5800,10.8],[8000,13]]),
  lmr('LMR-400-UF',.146748,.000312,5800,'https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-400-uf-datasheet-1.pdf',[[30,.8],[50,1.1],[150,1.8],[220,2.2],[450,3.3],[900,4.7],[1500,6.2],[1800,6.8],[2000,7.2],[2500,8.1],[5800,13]]),
  lmr('LMR-600',.075550,.000260,8000,'https://timesmicrowave.com/wp-content/uploads/2022/03/lmr-600-coax-cables-datasheet.pdf',[[30,.4],[50,.5],[150,1],[220,1.2],[450,1.7],[900,2.5],[1500,3.3],[1800,3.7],[2000,3.9],[2500,4.4],[5800,7.3],[8000,8.8]])
];
for(const cable of cables){
  cable.points.forEach(Object.freeze);Object.freeze(cable.points);Object.freeze(cable.range);
  if(cable.publishedRange)Object.freeze(cable.publishedRange);
  Object.freeze(cable);
}
const api=Object.freeze({cables:Object.freeze(cables),verified});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SWRCables=api;
})(globalThis);
