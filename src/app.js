'use strict';
const {cables}=SWRCables;
const {parseNumber,cableById,cableLoss,lineMetrics,calculate,FT_TO_M}=SWRModel;
const $=id=>document.getElementById(id);
const fmt=(n,digits=2)=>Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits}):'—';
const watts=n=>`${fmt(n)} W`;
const db=n=>`${fmt(n,3)} dB`;
const inputText=n=>String(Number(n.toPrecision(12))).replace('.',',');
let last=null,timers=[],previousLengthUnit='m',previousLossUnit='100m';
function readInput(){
  return {powerConfiguredW:parseNumber($('powerW').value),freqMHz:parseNumber($('freqMHz').value),
    cableType:$('cableType').value,length:parseNumber($('lengthM').value),lengthUnit:$('lengthUnit').value,
    customLoss:parseNumber($('lossDb100m').value),lossUnit:$('lossUnit').value,customZ0:parseNumber($('customZ0').value),
    systemMode:$('systemMode').value,radioSWR:parseNumber($('radioSWR').value),swrReference:$('swrReference').value,swrInput:parseNumber($('swrInput').value)};
}
function syncControls(){
  const custom=$('cableType').value==='Custom',tuner=$('systemMode').value==='tuner';
  $('lossDb100m').readOnly=!custom;$('customZ0Box').hidden=!custom;$('radioSWRBox').hidden=!tuner;
  $('modeNote').textContent=tuner
    ? 'Tuner sem perdas: a potência líquida alimenta a linha descasada. O SWR residual, antes do tuner, é separado do SWR no cabo.'
    : 'Fonte casada ao Z₀ do cabo: a potência configurada é a onda incidente. O retorno é absorvido na fonte; não há segunda subtração do descasamento.';
  if(!custom){
    const result=cableLoss($('cableType').value,parseNumber($('freqMHz').value));
    $('lossDb100m').value=(result.db100m*($('lossUnit').value==='100ft'?FT_TO_M:1)).toFixed(6).replace('.',',');
  }
}
function renderCable(r){
  const custom=r.cableType==='Custom';
  $('cableMeta').textContent=custom
    ? `Cabo personalizado · Z₀ ${fmt(r.z0,0)} Ω. O valor manual não muda automaticamente com a frequência.`
    : `${r.cableName} · Z₀ ${r.z0} Ω · dados conferidos em ${cableById(r.cableType).verified}.`;
  const warning=[r.warning,r.z0!==50?`Atenção: cabo de ${r.z0} Ω. O SWR deve ser referido a ${r.z0} Ω; uma leitura em medidor de 50 Ω não é convertida automaticamente.`:''].filter(Boolean).join(' ');
  $('cableWarning').textContent=warning;$('cableWarning').hidden=!warning;
  if(custom){$('sourceInfo').textContent='Dado fornecido pelo usuário na frequência atual. Confirme a unidade e a ficha do seu cabo.';$('sourceTable').innerHTML='';return;}
  const c=cableById(r.cableType);
  $('sourceInfo').innerHTML=`${c.method}<br>${c.kind==='coefficients'?`k1 = ${c.k1}; k2 = ${c.k2}; resultado em dB/100 ft.<br>`:''}Faixa aceita: ${c.range[0]}–${c.range[1]} MHz.<br><a href="${c.source}" target="_blank" rel="noopener">Ficha técnica — ${c.manufacturer} ${c.id}</a><br>100 ft = 30,48 m. Os pontos publicados podem ter arredondamento diferente da fórmula.`;
  $('sourceTable').innerHTML=c.points.map(([f,l])=>`<tr><td>${fmt(f,2)}</td><td>${fmt(l,3)}</td><td>${fmt(l/FT_TO_M,3)}</td></tr>`).join('');
}
function renderComparison(r){
  $('comparisonTable').innerHTML=cables.map(c=>{
    try{
      const attenuation=cableLoss(c.id,r.freqMHz);
      const matchedLossDb=attenuation.db100m*r.lengthM/100;
      const comparison={...lineMetrics(matchedLossDb,r.gammaLoad),matchedLossDb,lossDb100m:attenuation.db100m,warning:attenuation.warning};
      return `<tr><td>${c.name} / ${c.z0} Ω${comparison.warning?' *':''}</td><td>${fmt(comparison.lossDb100m,3)}</td><td>${db(comparison.matchedLossDb)}</td><td>${db(comparison.lineLossDb)}</td><td>${fmt(comparison.efficiency*100,1)}%</td></tr>`;
    }catch(error){return `<tr><td>${c.name}</td><td colspan="4">Fora da faixa ${c.range[0]}–${c.range[1]} MHz</td></tr>`;}
  }).join('')+'<tr><td colspan="5">* Fórmula LMR extrapolada abaixo de 30 MHz. Valores nominais; não incluem conectores nem envelhecimento.</td></tr>';
}
function renderResults(r){
  $('cardAntenna').textContent=watts(r.acceptedW);$('cardCableHeat').textContent=watts(r.cableHeatW);
  $('cardReturned').textContent=watts(r.sourceReturnW);$('cardLineLoss').textContent=db(r.lineLossDb);
  $('balanceCaption').textContent=`Fonte: ${watts(r.powerConfiguredW)} incidentes disponíveis. Entrada líquida na linha: ${watts(r.netInputW)}. SWR na carga: ${fmt(r.swrLoad)}:1.`;
  const percentages=[r.acceptedW,r.cableHeatW,r.sourceReturnW].map(w=>r.powerConfiguredW?w/r.powerConfiguredW*100:0);
  ['energyLoad','energyHeat','energyReturn'].forEach((id,i)=>{$(id).style.width=`${percentages[i]}%`;});
  $('energyLegend').textContent=`Carga ${fmt(percentages[0],1)}% · calor no cabo ${fmt(percentages[1],1)}% · retorno à fonte ${fmt(percentages[2],1)}%. ${watts(r.acceptedW+r.cableHeatW+r.sourceReturnW)} contabilizados.`;
  $('simpleExplain').innerHTML=[
    ['Atenuação casada',`${db(r.matchedLossDb)} no comprimento informado (${fmt(r.lossDb100m,3)} dB/100 m). É a referência com SWR 1:1.`],
    ['Perda adicional na linha',`${db(r.extraLossDb)} além da perda casada. Mede dissipação adicional, não toda a potência refletida.`],
    ['Descasamento visto pela fonte',`${db(r.mismatchLossDb)} de redução na potência líquida. O retorno de ${watts(r.sourceReturnW)} não é calor no cabo.`],
    ['Da fonte até a carga',`${db(r.overallLossDb)} de redução total. ${r.systemMode==='tuner'?'Tuner ideal, com o SWR residual informado.':'Fonte ideal casada, sem foldback.'}`]
  ].map(([title,body])=>`<div class="step-box"><div class="step-title">${title}</div>${body}</div>`).join('');
  const rows=[['Cabo / referência',`${r.cableName} / ${r.z0} Ω`],['Frequência / comprimento',`${fmt(r.freqMHz,3)} MHz / ${fmt(r.lengthM,3)} m`],
    ['Perda casada no comprimento informado',db(r.matchedLossDb)],['SWR na carga',`${fmt(r.swrLoad,3)}:1`],['SWR na entrada da linha',`${fmt(r.swrLineInput,3)}:1`],
    ['Potência incidente disponível na fonte',watts(r.powerConfiguredW)],['Potência direta na entrada da linha (P+)',watts(r.forwardInputW)],
    ['Potência reversa na entrada da linha (P−)',watts(r.lineReturnedW)],['Entrada líquida na linha (P+ − P−)',watts(r.netInputW)],
    ['Entregue à carga',watts(r.acceptedW)],['Dissipada no cabo',watts(r.cableHeatW)],['Retorno à fonte (antes do tuner, quando presente)',watts(r.sourceReturnW)],
    ['Perda dissipativa da linha (entrada líquida → carga)',db(r.lineLossDb)],['Parcela adicional de perda da linha por SWR',db(r.extraLossDb)],
    ['Redução fonte → carga (inclui descasamento da fonte)',db(r.overallLossDb)],['Eficiência da linha (carga / entrada líquida)',`${fmt(r.efficiency*100,2)}%`]];
  $('mainResultsTable').innerHTML=rows.map(([label,value])=>`<tr><th scope="row">${label}</th><td>${value}</td></tr>`).join('');
  $('tripTable').innerHTML=r.trips.map(t=>`<tr><td>${t.i}</td><td>${watts(t.outgoing)}</td><td>${watts(t.arriveLoad)}</td><td>${watts(t.accepted)}</td><td>${watts(t.reflectedLoad)}</td><td>${watts(t.returnedInput)}</td></tr>`).join('');
  $('advancedNote').textContent=r.systemMode==='tuner'
    ? `Decomposição didática em até 8 parcelas. Os resultados principais usam a soma infinita analítica, não o truncamento desta tabela. Restam ${watts(r.remainingW)} a repartir após as parcelas exibidas. Não representa transientes de RF nem inclui fase.`
    : 'Uma ida e uma volta: a fonte casada absorve o retorno. Não se aplica outra redução por SWR à potência incidente.';
  $('radioPowerLabel').textContent=watts(r.powerConfiguredW);$('antennaSWRLabel').textContent=`SWR ${fmt(r.swrLoad)}:1`;
  $('powerLabel').textContent=`${watts(r.acceptedW)} na carga`;$('wave').textContent='→';
  $('timeline').textContent='Cálculo atualizado. Animar mostra as parcelas de energia; o balanço acima é o resultado em regime permanente.';
  renderCable(r);renderComparison(r);
}
function stopAnimation(){timers.forEach(clearTimeout);timers=[];}
function calculateAndRender(){
  stopAnimation();
  try{
    syncControls();const result=calculate(readInput());
    last=result;$('errorMessage').hidden=true;$('results').hidden=false;renderResults(result);return result;
  }catch(error){last=null;$('errorMessage').textContent=error.message;$('errorMessage').hidden=false;$('results').hidden=true;return null;}
}
function runAnimation(){
  const r=calculateAndRender();if(!r)return;
  const first=r.trips[0];
  const steps=[
    ['→',`Entrada: ${watts(first.outgoing)}.`,r.systemMode==='tuner'?'Parcela inicial líquida após o tuner. As demais parcelas são contabilizadas pela série geométrica.':'Onda incidente da fonte casada; o descasamento ainda não foi subtraído.'],
    ['→',`Ida: ${watts(first.heatForward)} de calor.`,`${watts(first.arriveLoad)} chegam à carga na primeira parcela.`],
    ['←',`Carga aceita ${watts(first.accepted)}.`,`${watts(first.reflectedLoad)} são refletidos; refletir não significa dissipar no cabo.`],
    ['←',`Volta: ${watts(first.heatReturn)} de calor.`,`${watts(first.returnedInput)} retornam à entrada da linha.`],
    [r.systemMode==='tuner'?'→':'←',r.systemMode==='tuner'?'As parcelas retornadas continuam no modelo ideal.':'A fonte casada absorve o retorno.',r.systemMode==='tuner'?`A soma analítica entrega ${watts(r.acceptedW)} à carga; o restante vira calor na linha.`:`${watts(r.sourceReturnW)} voltam à fonte, sem serem contados novamente como perda do cabo.`],
    ['→','Balanço final',`${watts(r.acceptedW)} na carga + ${watts(r.cableHeatW)} no cabo + ${watts(r.sourceReturnW)} na fonte = ${watts(r.powerConfiguredW)}.`]
  ];
  steps.forEach(([arrow,title,body],i)=>timers.push(setTimeout(()=>{$('wave').textContent=arrow;$('powerLabel').textContent=title;$('timeline').textContent=`${i+1}/${steps.length} — ${title}\n${body}`;},i*1300)));
}
function resetDefaults(){
  const defaults={powerW:'100',freqMHz:'30',cableType:'8240',lengthM:'10',lengthUnit:'m',lossUnit:'100m',customZ0:'50',systemMode:'tuner',radioSWR:'1',swrReference:'load',swrInput:'2'};
  for(const [id,value]of Object.entries(defaults))$(id).value=value;
  previousLengthUnit='m';previousLossUnit='100m';calculateAndRender();
}
$('cableType').innerHTML=cables.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')+'<option value="Custom">Personalizado / dado medido</option>';
$('calculateButton').addEventListener('click',calculateAndRender);$('animateButton').addEventListener('click',runAnimation);$('resetButton').addEventListener('click',resetDefaults);
['powerW','freqMHz','cableType','lengthM','lossDb100m','customZ0','systemMode','radioSWR','swrReference','swrInput'].forEach(id=>$(id).addEventListener('change',calculateAndRender));
$('lengthUnit').addEventListener('change',()=>{
  const n=parseNumber($('lengthM').value),next=$('lengthUnit').value;
  if(Number.isFinite(n))$('lengthM').value=inputText(n*(previousLengthUnit==='ft'?FT_TO_M:1)/(next==='ft'?FT_TO_M:1));
  previousLengthUnit=next;calculateAndRender();
});
$('lossUnit').addEventListener('change',()=>{
  const n=parseNumber($('lossDb100m').value),next=$('lossUnit').value;
  if($('cableType').value==='Custom'&&Number.isFinite(n))$('lossDb100m').value=inputText(n/(previousLossUnit==='100ft'?FT_TO_M:1)*(next==='100ft'?FT_TO_M:1));
  previousLossUnit=next;calculateAndRender();
});
document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName==='INPUT')calculateAndRender();});
resetDefaults();
