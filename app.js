/* Sharma NEC Code app — v1 review build.
   Content loads from content/*.json (Mike Holt's files land there via GitHub).
   Calculator tables are mirrored here as fallback if the JSON can't load. */
"use strict";
const $ = (s, el=document) => el.querySelector(s);
const view = $("#view");
let DATA = { lookup:null, checklists:null, quiz:null, sharma:null, tables:null };
const FALLBACK_TABLES = {"boxFillVolumePerConductor":{"18":2,"16":2.25,"14":2.25,"12":2.5,"10":2.5,"8":3,"6":5},"ampacity75C":{"copper":{"14":20,"12":25,"10":35,"8":50,"6":65,"4":85,"3":100,"2":115,"1":130,"1/0":150,"2/0":175,"3/0":200,"4/0":230},"aluminum":{"12":20,"10":30,"8":40,"6":50,"4":65,"3":75,"2":90,"1":100,"1/0":120,"2/0":135,"3/0":155,"4/0":180}},"smallConductorCaps":{"copper":{"14":15,"12":20,"10":30},"aluminum":{"12":15,"10":25}},"circularMils":{"14":4110,"12":6530,"10":10380,"8":16510,"6":26240,"4":41740,"3":52620,"2":66360,"1":83690,"1/0":105600,"2/0":133100,"3/0":167800,"4/0":211600},"conduitAreas40pct":{"EMT":{"1/2":0.122,"3/4":0.213,"1":0.346,"1-1/4":0.598,"1-1/2":0.814,"2":1.342}},"conductorAreasTHHN":{"14":0.0097,"12":0.0133,"10":0.0211,"8":0.0366,"6":0.0507,"4":0.0824,"3":0.0973,"2":0.1158}};
const favs = new Set(JSON.parse(localStorage.getItem("nec-favs")||"[]"));
function saveFavs(){ localStorage.setItem("nec-favs", JSON.stringify([...favs])); }
async function loadJSON(name){
  try{ const r = await fetch("content/"+name+".json"); if(r.ok) return await r.json(); }catch(e){}
  return null;
}
let tab = "lookup";
document.querySelectorAll("#tabs button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x===b));
  tab=b.dataset.tab; render();
}));
$("#search").addEventListener("input",()=>{ if(tab!=="lookup"){ tab="lookup";
  document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab==="lookup")); } render(); });

function favBtn(id){ return `<button class="favbtn" data-fav="${id}" title="Save">${favs.has(id)?"❤️":"🤍"}</button>`; }
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-fav]"); if(!f) return;
  const id=f.dataset.fav; favs.has(id)?favs.delete(id):favs.add(id); saveFavs(); render();
});
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

function render(){
  if(tab==="lookup") return renderLookup();
  if(tab==="calc") return renderCalc();
  if(tab==="rooms") return renderRooms();
  if(tab==="quiz") return renderQuiz();
  if(tab==="sharma") return renderSharma();
  if(tab==="favs") return renderFavs();
}
/* ---------- Lookup ---------- */
function topicCard(t){
  return `<div class="card">${favBtn("t:"+t.id)}<div class="cite">${esc(t.cite)}</div><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>${t.flag?`<span class="flag">${esc(t.flag)}</span>`:""}</div>`;
}
function renderLookup(){
  const q=($("#search").value||"").toLowerCase().trim();
  const topics=(DATA.lookup&&DATA.lookup.topics)||[];
  const list=q? topics.filter(t=>(t.title+" "+t.cite+" "+t.summary).toLowerCase().includes(q)) : topics;
  view.innerHTML = `<h2 class="sec">Code lookup ${q?"":"— most-used first"}</h2>` +
    (DATA.lookup? `<p class="flag">${esc(DATA.lookup.meta.status)}</p>`:"") +
    (list.length? list.map(topicCard).join("") : `<div class="empty">No matches. Try a topic name or an article number.</div>`);
}
/* ---------- Sharma rules ---------- */
function renderSharma(){
  const rules=(DATA.sharma&&DATA.sharma.rules)||[];
  view.innerHTML = `<h2 class="sec">Sharma rules — stricter than code</h2>` + (rules.length? rules.map(r=>
    `<div class="card">${favBtn("s:"+r.id)}<span class="tag">SHARMA RULE</span><h3 style="margin-top:6px">${esc(r.title)}</h3><p>${esc(r.text)}</p>${r.status?`<span class="flag">${esc(r.status)}</span>`:""}</div>`).join("")
    : `<div class="empty">Sharma rules file not loaded yet.</div>`);
}
/* ---------- Favorites ---------- */
function renderFavs(){
  const topics=(DATA.lookup&&DATA.lookup.topics)||[]; const rules=(DATA.sharma&&DATA.sharma.rules)||[];
  let html=`<h2 class="sec">Saved</h2>`;
  const ft=topics.filter(t=>favs.has("t:"+t.id)); const fr=rules.filter(r=>favs.has("s:"+r.id));
  if(!ft.length&&!fr.length) html+=`<div class="empty">Tap 🤍 on any topic or Sharma rule to save it here.</div>`;
  html+=ft.map(topicCard).join("");
  html+=fr.map(r=>`<div class="card">${favBtn("s:"+r.id)}<span class="tag">SHARMA RULE</span><h3 style="margin-top:6px">${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join("");
  view.innerHTML=html;
}
/* ---------- Checklists ---------- */
function renderRooms(){
  const rooms=(DATA.checklists&&DATA.checklists.rooms)||[];
  view.innerHTML=`<h2 class="sec">Room checklists</h2>`+(rooms.length? rooms.map(r=>
    `<div class="card"><h3>${esc(r.room)}</h3><ul class="ck">${r.items.map(i=>`<li><input type="checkbox"><span>${esc(i)}</span></li>`).join("")}</ul></div>`).join("")
    : `<div class="empty">Checklists file not loaded yet.</div>`);
}
/* ---------- Quiz ---------- */
let quizState=null;
function renderQuiz(){
  const qs=(DATA.quiz&&DATA.quiz.questions)||[];
  if(!qs.length){ view.innerHTML=`<div class="empty">Quiz file not loaded yet.</div>`; return; }
  if(!quizState) quizState={i:0,score:0,answered:false};
  const s=quizState;
  if(s.i>=qs.length){ view.innerHTML=`<div class="card"><div class="score">Score: ${s.score} / ${qs.length} (${Math.round(100*s.score/qs.length)}%)<br>${100*s.score/qs.length>=(DATA.quiz.pass||80)?"✅ Pass":"❌ Below the 80% pass mark — run it again"}</div><button class="go" id="qrestart">Restart quiz</button></div>`;
    $("#qrestart").onclick=()=>{quizState=null;renderQuiz();}; return; }
  const q=qs[s.i];
  view.innerHTML=`<h2 class="sec">Quiz — question ${s.i+1} of ${qs.length}</h2><div class="card"><h3>${esc(q.q)}</h3>`+
    q.choices.map((c,ix)=>`<button class="qopt" data-q="${ix}">${esc(c)}</button>`).join("")+
    `<div id="qwhy"></div></div>`;
  view.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{
    if(s.answered) return; s.answered=true;
    const pick=+b.dataset.q;
    view.querySelectorAll("[data-q]").forEach(x=>{ const ix=+x.dataset.q;
      if(ix===q.answer) x.classList.add("right"); else if(ix===pick) x.classList.add("wrong"); });
    if(pick===q.answer) s.score++;
    $("#qwhy").innerHTML=`<div class="why">${pick===q.answer?"✅ Correct. ":"❌ Not quite. "}${esc(q.why)} <b>(${esc(q.cite)})</b></div><button class="go" id="qnext">${s.i+1>=qs.length?"See score":"Next question"}</button>`;
    $("#qnext").onclick=()=>{ s.i++; s.answered=false; renderQuiz(); };
  });
}
/* ---------- Calculators ---------- */
function num(id){ const v=parseFloat($(id).value); return isNaN(v)?0:v; }
function sel(id){ return $(id).value; }
function renderCalc(){
  const T=DATA.tables||FALLBACK_TABLES;
  const awgs=Object.keys(T.circularMils);
  const opts=(arr,v)=>arr.map(a=>`<option ${a===v?"selected":""}>${a}</option>`).join("");
  view.innerHTML=`
  <h2 class="sec">Calculators</h2>
  <div class="card"><h3>📦 Box fill <span class="cite">314.16</span></h3>
    <label class="f">Wire size (AWG)</label><select class="n" id="bf-awg">${opts(["14","12","10","8","6"],"12")}</select>
    <label class="f">Conductors entering the box (count each insulated conductor; grounds count once together)</label><input class="n" id="bf-cond" type="number" value="6" min="0">
    <label class="f">Devices (switches / receptacles)</label><input class="n" id="bf-dev" type="number" value="1" min="0">
    <label class="f">Internal cable clamps?</label><select class="n" id="bf-clamp"><option value="0">No / external</option><option value="1">Yes (counts as 1)</option></select>
    <label class="f">Equipment grounds present?</label><select class="n" id="bf-gnd"><option value="1">Yes (counts as 1 total)</option><option value="0">No</option></select>
    <label class="f">Box volume (cu in — printed inside the box)</label><input class="n" id="bf-box" type="number" value="22.5" step="0.5">
    <button class="go" id="bf-go">Calculate box fill</button><div id="bf-out"></div></div>
  <div class="card"><h3>🔌 Conduit fill <span class="cite">Ch. 9</span></h3>
    <label class="f">Conduit (EMT)</label><select class="n" id="cf-size">${opts(Object.keys(T.conduitAreas40pct.EMT),"3/4")}</select>
    <label class="f">Wire size (THHN)</label><select class="n" id="cf-awg">${opts(Object.keys(T.conductorAreasTHHN),"12")}</select>
    <label class="f">How many conductors (grounds count too)</label><input class="n" id="cf-n" type="number" value="3" min="1">
    <button class="go" id="cf-go">Calculate conduit fill</button><div id="cf-out"></div></div>
  <div class="card"><h3>⚡ Voltage drop <span class="cite">210.19 note</span></h3>
    <label class="f">Material</label><select class="n" id="vd-mat"><option value="copper">Copper</option><option value="aluminum">Aluminum</option></select>
    <label class="f">Wire size (AWG)</label><select class="n" id="vd-awg">${opts(awgs,"12")}</select>
    <label class="f">Load (amps)</label><input class="n" id="vd-i" type="number" value="16" step="0.5">
    <label class="f">One-way length (ft)</label><input class="n" id="vd-l" type="number" value="75">
    <label class="f">Circuit voltage</label><input class="n" id="vd-v" type="number" value="120">
    <button class="go" id="vd-go">Calculate voltage drop</button><div id="vd-out"></div></div>
  <div class="card"><h3>🔋 Wire ampacity <span class="cite">Table 310.16 · 240.4(D)</span></h3>
    <label class="f">Material</label><select class="n" id="am-mat"><option value="copper">Copper</option><option value="aluminum">Aluminum</option></select>
    <label class="f">Wire size (AWG)</label><select class="n" id="am-awg">${opts(Object.keys(T.ampacity75C.copper),"12")}</select>
    <button class="go" id="am-go">Look up ampacity</button><div id="am-out"></div></div>
  <div class="card"><h3>🏠 Residential load calc <span class="cite">220.82 optional</span></h3>
    <label class="f">Living area (sq ft)</label><input class="n" id="lc-sf" type="number" value="1800">
    <label class="f">Appliance nameplate total (VA) — range, dryer, water heater, etc. (beyond the standard allowances)</label><input class="n" id="lc-app" type="number" value="12000">
    <label class="f">Heat (VA) — include heat strips</label><input class="n" id="lc-heat" type="number" value="10000">
    <label class="f">AC / heat pump (VA) — the larger of heat vs AC is used</label><input class="n" id="lc-ac" type="number" value="7200">
    <button class="go" id="lc-go">Calculate service load</button><div id="lc-out"></div></div>`;
  $("#bf-go").onclick=()=>{ const per=T.boxFillVolumePerConductor[sel("#bf-awg")];
    const total=per*(num("#bf-cond")+2*num("#bf-dev")+num("#bf-clamp")+num("#bf-gnd"));
    const box=num("#bf-box");
    $("#bf-out").innerHTML=`<div class="result">Required volume: <b>${total.toFixed(2)} cu in</b><br>Box volume: <b>${box} cu in</b> → ${total<=box?"✅ <b>FITS</b>":"❌ <b>TOO SMALL</b> — use a bigger box or a box extension"}</div>`; };
  $("#cf-go").onclick=()=>{ const allow=T.conduitAreas40pct.EMT[sel("#cf-size")]; const each=T.conductorAreasTHHN[sel("#cf-awg")]; const n=num("#cf-n");
    const used=each*n;
    $("#cf-out").innerHTML=`<div class="result">Conductors take <b>${used.toFixed(3)} sq in</b> of the <b>${allow} sq in</b> allowed (40% fill) → ${used<=allow?"✅ <b>FITS</b>":"❌ <b>OVERFILLED</b> — upsize the conduit"}<br>Max of this size in that conduit: <b>${Math.floor(allow/each)}</b></div>`; };
  $("#vd-go").onclick=()=>{ const K=sel("#vd-mat")==="copper"?12.9:21.2; const cm=T.circularMils[sel("#vd-awg")];
    const vd=2*K*num("#vd-i")*num("#vd-l")/cm; const pct=100*vd/num("#vd-v");
    let size=sel("#vd-awg");
    for(const a of awgs){ const v2=2*K*num("#vd-i")*num("#vd-l")/T.circularMils[a]; if(100*v2/num("#vd-v")<=3){ size=a; break; } }
    $("#vd-out").innerHTML=`<div class="result">Voltage drop: <b>${vd.toFixed(2)} V (${pct.toFixed(1)}%)</b> → ${pct<=3?"✅ Within the 3% recommendation":`❌ Over 3% — smallest size that gets you there: <b>${size} AWG</b>`}</div>`; };
  $("#am-go").onclick=()=>{ const mat=sel("#am-mat"), a=sel("#am-awg");
    const amp=T.ampacity75C[mat][a]; const cap=T.smallConductorCaps[mat][a];
    $("#am-out").innerHTML= amp? `<div class="result"><b>${a} AWG ${mat}</b> — Table 310.16 (75°C): <b>${amp}A</b>${cap?`<br>240.4(D) small-conductor cap: max breaker <b>${cap}A</b>`:""}</div>` : `<div class="result">No 75°C value listed for that combination in v1 — flag for Mike.</div>`; };
  $("#lc-go").onclick=()=>{ const gen=3*num("#lc-sf")+1500+1500+1500;
    const first=Math.min(gen,10000); const rest=Math.max(gen-10000,0);
    const demand=first+0.4*rest+num("#lc-app"); const hvac=Math.max(num("#lc-heat"),num("#lc-ac"));
    const total=demand+hvac; const amps=total/240;
    const svc=[100,125,150,175,200,225,300,400].find(s=>s>=amps)||">400";
    $("#lc-out").innerHTML=`<div class="result">General + appliances after 220.82 demand: <b>${Math.round(demand).toLocaleString()} VA</b><br>Heating/cooling (larger): <b>${Math.round(hvac).toLocaleString()} VA</b><br>Total: <b>${Math.round(total).toLocaleString()} VA = ${amps.toFixed(1)}A at 240V</b><br>Minimum standard service size: <b>${svc}A</b><br><span class="flag">Simplified v1 — Mike to verify against 220.82 before field use</span></div>`; };
}
/* ---------- boot ---------- */
(async()=>{ const [l,c,q,s,t]=await Promise.all([loadJSON("lookup"),loadJSON("checklists"),loadJSON("quiz"),loadJSON("sharma-rules"),loadJSON("calc-tables")]);
  DATA={lookup:l,checklists:c,quiz:q,sharma:s,tables:t||FALLBACK_TABLES}; render(); })();
