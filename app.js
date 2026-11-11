/* Sharma NEC Code app — v1 review build.
   Content loads from content/*.json (Mike Holt's files land there via GitHub).
   Calculator tables are mirrored here as fallback if the JSON can't load. */
"use strict";
const $ = (s, el=document) => el.querySelector(s);
const view = $("#view");
let DATA = { lookup:null, checklists:null, quiz:null, sharma:null, tables:null, book:null, bookLookup:null, bookQuiz:null, bookChecklists:null };
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


/* ---------- Learning: diagrams, key numbers, progress ---------- */
const learned = new Set(JSON.parse(localStorage.getItem("nec-learned")||"[]"));
function saveLearned(){ localStorage.setItem("nec-learned", JSON.stringify([...learned])); }
document.addEventListener("click",e=>{
  const l=e.target.closest("[data-learn]"); if(l){ const id=l.dataset.learn; learned.has(id)?learned.delete(id):learned.add(id); saveLearned(); render(); return; }
  const qz=e.target.closest("[data-quizjump]"); if(qz){ tab="quiz"; document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab==="quiz")); render(); }
});
const DG = {
"box-fill":`<rect x="100" y="18" width="120" height="84" rx="8" fill="none" stroke="#004585" stroke-width="3"/><circle cx="128" cy="45" r="11" fill="#0058a3"/><circle cx="160" cy="45" r="11" fill="#0058a3"/><circle cx="192" cy="45" r="11" fill="#0058a3"/><circle cx="144" cy="76" r="11" fill="#7fb3dd"/><circle cx="176" cy="76" r="11" fill="#7fb3dd"/><text x="160" y="116" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">COUNT EVERY CONDUCTOR</text>`,
"ampacity":`<line x1="30" y1="38" x2="290" y2="38" stroke="#004585" stroke-width="3"/><line x1="30" y1="62" x2="290" y2="62" stroke="#0058a3" stroke-width="6"/><line x1="30" y1="90" x2="290" y2="90" stroke="#004585" stroke-width="10"/><text x="34" y="28" font-size="13" font-weight="800" fill="#004585">14 AWG</text><text x="34" y="54" font-size="13" font-weight="800" fill="#004585">12 AWG</text><text x="34" y="82" font-size="13" font-weight="800" fill="#004585">10 AWG</text><text x="240" y="116" font-size="13" font-weight="800" fill="#004585">BIGGER WIRE = MORE AMPS</text>`,
"conduit-fill":`<circle cx="130" cy="58" r="42" fill="none" stroke="#004585" stroke-width="4"/><circle cx="112" cy="44" r="13" fill="#0058a3"/><circle cx="146" cy="44" r="13" fill="#0058a3"/><circle cx="129" cy="72" r="13" fill="#7fb3dd"/><text x="200" y="52" font-size="21" font-weight="900" fill="#004585">40%</text><text x="196" y="74" font-size="13" font-weight="800" fill="#004585">MAX FILL</text><text x="188" y="92" font-size="12" font-weight="700" fill="#004585">3+ CONDUCTORS</text>`,
"voltage-drop":`<rect x="18" y="38" width="52" height="42" fill="none" stroke="#004585" stroke-width="3"/><text x="44" y="64" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">PANEL</text><line x1="70" y1="59" x2="240" y2="59" stroke="#0058a3" stroke-width="4" stroke-dasharray="8 5"/><rect x="240" y="38" width="58" height="42" fill="none" stroke="#004585" stroke-width="3"/><text x="269" y="64" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">LOAD</text><text x="155" y="40" text-anchor="middle" font-size="14" font-weight="900" fill="#004585">LONG RUN = BIGGER WIRE</text><text x="155" y="104" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">GOAL: 3% OR LESS</text>`,
"branch-210":`<line x1="16" y1="70" x2="304" y2="70" stroke="#004585" stroke-width="4"/><rect x="34" y="56" width="18" height="28" fill="#0058a3"/><rect x="150" y="56" width="18" height="28" fill="#0058a3"/><rect x="266" y="56" width="18" height="28" fill="#0058a3"/><text x="43" y="104" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">START</text><text x="97" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#004585">≤ 6 FT</text><text x="213" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#004585">≤ 6 FT</text><text x="275" y="104" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">END</text>`,
"afci-gfci":`<rect x="118" y="14" width="84" height="64" rx="8" fill="#0058a3"/><text x="160" y="44" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">DF BREAKER</text><text x="160" y="64" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">AFCI + GFCI</text><path d="M60 96 q10 -12 20 0 q10 12 20 0" fill="none" stroke="#0058a3" stroke-width="3"/><path d="M220 96 q10 -12 20 0 q10 12 20 0" fill="none" stroke="#0058a3" stroke-width="3"/><text x="160" y="108" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">PROTECTION LIVES AT THE BREAKER</text>`,
"clearances":`<rect x="140" y="16" width="70" height="56" fill="none" stroke="#004585" stroke-width="3"/><text x="175" y="48" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">PANEL</text><rect x="105" y="76" width="140" height="30" fill="#d3e7f8" stroke="#0058a3" stroke-width="2"/><text x="175" y="96" text-anchor="middle" font-size="13" font-weight="900" fill="#004585">3 FT DEEP · 30 IN WIDE</text><text x="266" y="44" font-size="13" font-weight="900" fill="#004585">6.5 FT</text><text x="262" y="60" font-size="12" font-weight="800" fill="#004585">HEADROOM</text><text x="52" y="96" font-size="12" font-weight="800" fill="#004585">KEEP CLEAR</text>`,
"grounding":`<rect x="126" y="10" width="68" height="40" fill="none" stroke="#004585" stroke-width="3"/><text x="160" y="35" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">PANEL</text><line x1="160" y1="50" x2="160" y2="82" stroke="#0058a3" stroke-width="4"/><line x1="160" y1="82" x2="160" y2="98" stroke="#004585" stroke-width="5"/><line x1="118" y1="100" x2="202" y2="100" stroke="#004585" stroke-width="3"/><line x1="132" y1="108" x2="188" y2="108" stroke="#004585" stroke-width="3"/><line x1="146" y1="116" x2="174" y2="116" stroke="#004585" stroke-width="3"/><text x="238" y="86" font-size="13" font-weight="800" fill="#004585">GROUND ROD</text>`,
"load-calc":`<path d="M60 62 L160 20 L260 62" fill="none" stroke="#004585" stroke-width="4"/><rect x="84" y="62" width="152" height="44" fill="none" stroke="#004585" stroke-width="3"/><text x="160" y="80" text-anchor="middle" font-size="14" font-weight="900" fill="#004585">3 VA / SQ FT</text><text x="160" y="99" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">+ APPLIANCES + HVAC</text>`,
"pools":`<rect x="70" y="22" width="180" height="66" rx="16" fill="#d3e7f8" stroke="#0058a3" stroke-width="3"/><rect x="52" y="10" width="216" height="90" rx="20" fill="none" stroke="#004585" stroke-width="2" stroke-dasharray="7 5"/><text x="160" y="60" text-anchor="middle" font-size="15" font-weight="900" fill="#004585">WATER</text><text x="160" y="116" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">BOND EVERYTHING METAL NEAR IT</text>`,
"solar":`<rect x="86" y="34" width="148" height="52" fill="none" stroke="#004585" stroke-width="3"/><line x1="123" y1="34" x2="123" y2="86" stroke="#0058a3" stroke-width="2"/><line x1="160" y1="34" x2="160" y2="86" stroke="#0058a3" stroke-width="2"/><line x1="197" y1="34" x2="197" y2="86" stroke="#0058a3" stroke-width="2"/><line x1="86" y1="60" x2="234" y2="60" stroke="#0058a3" stroke-width="2"/><circle cx="272" cy="26" r="12" fill="#7fb3dd"/><text x="160" y="106" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">RAPID SHUTDOWN · LABELS · 120% RULE</text>`,
"ev":`<path d="M52 74 q6 -26 34 -30 l14 -14 q5 -6 14 -6 h62 q10 0 16 7 l18 16 q44 4 52 28" fill="none" stroke="#004585" stroke-width="3"/><line x1="46" y1="74" x2="268" y2="74" stroke="#004585" stroke-width="3"/><circle cx="96" cy="78" r="13" fill="none" stroke="#004585" stroke-width="3"/><circle cx="222" cy="78" r="13" fill="none" stroke="#004585" stroke-width="3"/><text x="160" y="110" text-anchor="middle" font-size="14" font-weight="900" fill="#004585">SIZE IT AT 125% — IT RUNS FOR HOURS</text>`,
"generators":`<rect x="26" y="36" width="66" height="46" fill="none" stroke="#004585" stroke-width="3"/><text x="59" y="64" text-anchor="middle" font-size="11" font-weight="800" fill="#004585">UTILITY</text><rect x="128" y="36" width="66" height="46" fill="#0058a3"/><text x="161" y="56" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">TRANSFER</text><text x="161" y="72" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">SWITCH</text><rect x="230" y="36" width="66" height="46" fill="none" stroke="#004585" stroke-width="3"/><text x="263" y="64" text-anchor="middle" font-size="11" font-weight="800" fill="#004585">GENERATOR</text><text x="160" y="106" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">NEVER BACKFEED THE UTILITY</text>`,
"smokes":`<path d="M46 58 L160 16 L274 58" fill="none" stroke="#004585" stroke-width="4"/><rect x="70" y="58" width="180" height="48" fill="none" stroke="#004585" stroke-width="3"/><circle cx="104" cy="82" r="9" fill="#0058a3"/><circle cx="160" cy="82" r="9" fill="#0058a3"/><circle cx="216" cy="82" r="9" fill="#0058a3"/><text x="160" y="122" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">EVERY BEDROOM · OUTSIDE SLEEPING AREAS · EVERY LEVEL</text>`,
"hvac440":`<rect x="92" y="26" width="90" height="62" rx="6" fill="none" stroke="#004585" stroke-width="3"/><circle cx="137" cy="57" r="19" fill="none" stroke="#0058a3" stroke-width="3"/><path d="M137 40 v34 M120 57 h34" stroke="#0058a3" stroke-width="2"/><rect x="216" y="34" width="34" height="46" fill="#0058a3"/><text x="233" y="61" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">DISC.</text><line x1="182" y1="57" x2="216" y2="57" stroke="#004585" stroke-width="3"/><text x="160" y="108" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">DISCONNECT WITHIN SIGHT · NAMEPLATE RULES</text>`
};
function diagram(id){ return DG[id]? `<div class="diagram"><svg viewBox="0 0 320 124" role="img" aria-label="diagram">${DG[id]}</svg></div>` : ""; }
function keyNums(t){ const m=[...String(t.summary).matchAll(/(\d+(?:\.\d+)?\s?(?:ft|in|%|VA|A\b|AWG))/g)].map(x=>x[1].replace(/\s+/g," ").trim()); return [...new Set(m)].slice(0,4); }
function steps(t){ return String(t.summary).split(/(?<=\.)\s+/).filter(x=>x.trim()).slice(0,4); }

function favBtn(id){ return `<button class="favbtn" data-fav="${id}" title="Save">${favs.has(id)?"❤️":"🤍"}</button>`; }
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-fav]"); if(!f) return;
  const id=f.dataset.fav; favs.has(id)?favs.delete(id):favs.add(id); saveFavs(); render();
});
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

function render(){
  if(tab==="book") return renderBook();
  if(tab==="lookup") return renderLookup();
  if(tab==="calc") return renderCalc();
  if(tab==="rooms") return renderRooms();
  if(tab==="quiz") return renderQuiz();
  if(tab==="sharma") return renderSharma();
  if(tab==="favs") return renderFavs();
}
/* ---------- Lookup ---------- */
function topicCard(t, ix){
  const kn = keyNums(t);
  const st = steps(t);
  const done = learned.has(t.id);
  return `<div class="card">${favBtn("t:"+t.id)}<div class="cite">${typeof ix==="number"?`<span class="num-badge">${ix+1}</span>`:""}${esc(t.cite)}</div><h3>${esc(t.title)}</h3>${diagram(t.id)}${kn.length?`<div class="keynums">${kn.map(k=>`<span class="keynum">${esc(k)}</span>`).join("")}</div>`:""}<ul class="steps">${st.map((x,i)=>`<li><b>Step ${i+1}.</b> ${esc(x)}</li>`).join("")}</ul>${t.flag?`<span class="flag">${esc(t.flag)}</span>`:""}<div class="rowbtns"><button class="learnbtn ${done?"done":""}" data-learn="${t.id}">${done?"✓ Learned":"Mark as learned"}</button><button class="quizbtn" data-quizjump="1">Quiz me →</button></div></div>`;
}
function renderLookup(){
  const q=($("#search").value||"").toLowerCase().trim();
  const topics=(DATA.lookup&&DATA.lookup.topics)||[];
  const list=q? topics.filter(t=>(t.title+" "+t.cite+" "+t.summary).toLowerCase().includes(q)) : topics;
  const total=(DATA.lookup&&DATA.lookup.topics||[]).length;
  view.innerHTML = `<h2 class="sec">${q?"Code lookup":"Learn the code — one rule at a time"}</h2>` +
    (!q&&total? `<div class="progresswrap"><div class="plabel">Your progress: ${[...learned].filter(id=>(DATA.lookup.topics||[]).some(t=>t.id===id)).length} of ${total} rules learned</div><div class="pbar"><div style="width:${Math.round(100*[...learned].filter(id=>(DATA.lookup.topics||[]).some(t=>t.id===id)).length/Math.max(total,1))}%"></div></div></div>`:"") +
    (DATA.lookup? `<p class="flag">${esc(DATA.lookup.meta.status)}</p>`:"") +
    (list.length? list.map((t,i)=>topicCard(t, q?undefined:topics.indexOf(t))).join("") : `<div class="empty">No matches. Try a topic name or an article number.</div>`);
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
/* ---------- Field Book (draft chapters; book-v1 schema from 00-COMMON) ---------- */
let bookState = { page:null, view:"toc" };
function bookSection(id){ return ((DATA.book&&DATA.book.sections)||[]).find(s=>s.id===id); }
function relatedLabel(id){
  if(id.startsWith("C1-L-")){ const e=(DATA.bookLookup||[]).find(x=>x.id===id); return e? e.question : id; }
  if(id.startsWith("C1-Q-")){ const e=(DATA.bookQuiz||[]).find(x=>x.id===id); return e? ("Quiz: "+e.question) : id; }
  if(id.startsWith("C1-SP-")){ for(const r of (DATA.bookChecklists||[])) for(const it of r.items) if(it.id===id) return ("Checklist: "+it.text); return id; }
  if(/^S-\d+$/.test(id)) return "Sharma rule "+id+" (Field Book rules file)";
  if(/^L-\d+$/.test(id)) return "Field Book v1 lookup "+id;
  if(/^Q-\d+$/.test(id)) return "Field Book v1 quiz "+id;
  return id;
}
document.addEventListener("click",e=>{
  const p=e.target.closest("[data-bookpage]"); if(p){ bookState={page:p.dataset.bookpage, view:"page"}; if(tab!=="book"){ tab="book"; document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab==="book")); } render(); window.scrollTo(0,0); return; }
  const v=e.target.closest("[data-bookview]"); if(v){ bookState.view=v.dataset.bookview; if(v.dataset.bookview!=="page") bookState.page=null; render(); window.scrollTo(0,0); }
});
function renderBook(){
  const B=DATA.book;
  if(!B){ view.innerHTML=`<h2 class="sec">Sharma NEC Field Book</h2><div class="empty">Field Book chapter file not loaded yet.</div>`; return; }
  const pages=B.sections.length;
  const unverified=B.sections.filter(s=>!s.verified).length;
  const head=`<h2 class="sec">Sharma NEC Field Book — Chapter ${B.chapter}: ${esc(B.chapter_title)}</h2>`+
    `<p class="flag">DRAFT — under Mike Holt review. Goes live only on Sanjay's OK. NEC ${esc(B.nec_edition)} · ${esc(B.jurisdiction)}. ${esc(B.label||"")}</p>`+
    `<p class="bkmeta">${B.toc.length} articles · ${pages} pages · ${unverified} unverified item${unverified===1?"":"s"} · plus ${(DATA.bookLookup||[]).length} lookup, ${(DATA.bookQuiz||[]).length} quiz, ${((DATA.bookChecklists||[])[0]||{items:[]}).items.length} checklist items</p>`+
    `<div class="rowbtns"><button class="quizbtn" data-bookview="toc">Contents</button><button class="quizbtn" data-bookview="index">Index</button></div>`;
  if(bookState.view==="index"){
    view.innerHTML = head + `<div class="card"><h3>Index</h3><ul class="bkindex">${B.index.map(en=>
      `<li><b>${esc(en.term)}</b><br>${en.ids.map(id=>{ const s=bookSection(id); return `<button class="bkchip" data-bookpage="${id}">${esc(id.replace(/^C1-/,""))}${s? " — "+esc(s.title):""}</button>`; }).join(" ")}</li>`).join("")}</ul></div>`;
    return;
  }
  if(bookState.view==="page" && bookState.page){
    const s=bookSection(bookState.page);
    if(!s){ bookState={page:null,view:"toc"}; return renderBook(); }
    const prev=s.prev_id? bookSection(s.prev_id):null, next=s.next_id? bookSection(s.next_id):null;
    view.innerHTML = head + `<div class="card bkpage">
      <div class="cite">Article ${esc(s.article)} · Section ${esc(s.section)}</div>
      <h3>${esc(s.title)}</h3>
      ${s.verified? `<span class="tag">VERIFIED</span>` : `<span class="flag">⚠ UNVERIFIED${s.unverified_reason? " — "+esc(s.unverified_reason):""}</span>`}
      <p>${esc(s.plain_explanation)}</p>
      ${s.on_the_job? `<h4>What it means on the job</h4><p>${esc(s.on_the_job)}</p>`:""}
      ${s.sharma_note? `<h4>Sharma note</h4><p>${esc(s.sharma_note)}</p>`:""}
      ${s.florida_note? `<h4>Florida note</h4><p>${esc(s.florida_note)}</p>`:""}
      ${s.figure_idea? `<h4>Figure idea</h4><p class="bkfig">${esc(s.figure_idea)}</p>`:""}
      ${(s.related_ids&&s.related_ids.length)? `<h4>Related</h4><div>${s.related_ids.map(id=>`<span class="bkchip static">${esc(id)} — ${esc(relatedLabel(id))}</span>`).join(" ")}</div>`:""}
      <div class="bknav">
        ${prev? `<button class="go" data-bookpage="${prev.id}">← Previous: ${esc(prev.section)} ${esc(prev.title)}</button>` : `<span class="bkmeta">Start of chapter</span>`}
        ${next? `<button class="go" data-bookpage="${next.id}">Next: ${esc(next.section)} ${esc(next.title)} →</button>` : `<span class="bkmeta">End of chapter</span>`}
      </div>
      <div class="rowbtns"><button class="quizbtn" data-bookview="toc">Back to contents</button><button class="quizbtn" data-bookview="index">Index</button></div>
    </div>`;
    return;
  }
  view.innerHTML = head + B.toc.map(a=>
    `<div class="card"><h3>Article ${esc(a.article)} — ${esc(a.title)}</h3><ul class="bktoc">
      <li><button class="bkchip" data-bookpage="${a.id}">Intro — Article ${esc(a.article)}</button></li>
      ${a.children.map(c=>`<li><button class="bkchip" data-bookpage="${c.id}">${esc(c.section)} — ${esc(c.title)}</button></li>`).join("")}
    </ul></div>`).join("");
}
/* ---------- boot ---------- */
(async()=>{ const [l,c,q,s,t,bk,bl,bq,bc]=await Promise.all([loadJSON("lookup"),loadJSON("checklists"),loadJSON("quiz"),loadJSON("sharma-rules"),loadJSON("calc-tables"),loadJSON("book/c1"),loadJSON("book/c1-lookup"),loadJSON("book/c1-quiz"),loadJSON("book/c1-checklists")]);
  DATA={lookup:l,checklists:c,quiz:q,sharma:s,tables:t||FALLBACK_TABLES,book:bk,bookLookup:bl,bookQuiz:bq,bookChecklists:bc}; render(); })();
