/* Sharma NEC Code app — v1 review build.
   Content loads from content/*.json (Mike Holt's files land there via GitHub).
   Calculator tables are mirrored here as fallback if the JSON can't load. */
"use strict";
const $ = (s, el=document) => el.querySelector(s);
const view = $("#view");
let DATA = { lookup:null, checklists:null, quiz:null, sharma:null, tables:null, book:null, bookLookup:null, bookQuiz:null, bookChecklists:null, bookSet:{}, v1lookup:[], v1quiz:[], v1checklists:[], v1sharma:[], books:[] };
const FALLBACK_TABLES = {"boxFillVolumePerConductor":{"18":1.5,"16":1.75,"14":2,"12":2.25,"10":2.5,"8":3,"6":5},"ampacity75C":{"copper":{"14":20,"12":25,"10":35,"8":50,"6":65,"4":85,"3":100,"2":115,"1":130,"1/0":150,"2/0":175,"3/0":200,"4/0":230},"aluminum":{"12":20,"10":30,"8":40,"6":50,"4":65,"3":75,"2":90,"1":100,"1/0":120,"2/0":135,"3/0":155,"4/0":180}},"smallConductorCaps":{"copper":{"14":15,"12":20,"10":30},"aluminum":{"12":15,"10":25}},"circularMils":{"14":4110,"12":6530,"10":10380,"8":16510,"6":26240,"4":41740,"3":52620,"2":66360,"1":83690,"1/0":105600,"2/0":133100,"3/0":167800,"4/0":211600},"conduitAreas40pct":{"EMT":{"1/2":0.122,"3/4":0.213,"1":0.346,"1-1/4":0.598,"1-1/2":0.814,"2":1.342}},"conductorAreasTHHN":{"14":0.0097,"12":0.0133,"10":0.0211,"8":0.0366,"6":0.0507,"4":0.0824,"3":0.0973,"2":0.1158},"table8Resistance":{"copper":{"14":3.14,"12":1.98,"10":1.24,"8":0.778,"6":0.491,"4":0.308,"3":0.245,"2":0.194,"1":0.154,"1/0":0.122,"2/0":0.0967,"3/0":0.0766,"4/0":0.0608},"aluminum":{"12":3.25,"10":2.04,"8":1.28,"6":0.808,"4":0.508,"3":0.403,"2":0.319,"1":0.253,"1/0":0.201,"2/0":0.159,"3/0":0.126,"4/0":0.100}}};
const favs = new Set(JSON.parse(localStorage.getItem("nec-favs")||"[]"));
function saveFavs(){ localStorage.setItem("nec-favs", JSON.stringify([...favs])); }
const CONTENT_V = "10";
async function loadJSON(name){
  try{ const r = await fetch("content/"+name+".json?v="+CONTENT_V); if(r.ok) return await r.json(); }catch(e){}
  return null;
}
let tab = "home";
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
  const qz=e.target.closest("[data-quizjump]"); if(qz){ setTab("quiz"); startQuiz("all",0); render(); }
});
const DG = {
"box-fill":`<rect x="100" y="18" width="120" height="84" rx="8" fill="none" stroke="#004585" stroke-width="3"/><circle cx="128" cy="45" r="11" fill="#0058a3"/><circle cx="160" cy="45" r="11" fill="#0058a3"/><circle cx="192" cy="45" r="11" fill="#0058a3"/><circle cx="144" cy="76" r="11" fill="#7fb3dd"/><circle cx="176" cy="76" r="11" fill="#7fb3dd"/><text x="160" y="116" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">COUNT EVERY CONDUCTOR</text>`,
"ampacity":`<line x1="30" y1="38" x2="290" y2="38" stroke="#004585" stroke-width="3"/><line x1="30" y1="62" x2="290" y2="62" stroke="#0058a3" stroke-width="6"/><line x1="30" y1="90" x2="290" y2="90" stroke="#004585" stroke-width="10"/><text x="34" y="28" font-size="13" font-weight="800" fill="#004585">14 AWG</text><text x="34" y="54" font-size="13" font-weight="800" fill="#004585">12 AWG</text><text x="34" y="82" font-size="13" font-weight="800" fill="#004585">10 AWG</text><text x="240" y="116" font-size="13" font-weight="800" fill="#004585">BIGGER WIRE = MORE AMPS</text>`,
"conduit-fill":`<circle cx="130" cy="58" r="42" fill="none" stroke="#004585" stroke-width="4"/><circle cx="112" cy="44" r="13" fill="#0058a3"/><circle cx="146" cy="44" r="13" fill="#0058a3"/><circle cx="129" cy="72" r="13" fill="#7fb3dd"/><text x="200" y="52" font-size="21" font-weight="900" fill="#004585">40%</text><text x="196" y="74" font-size="13" font-weight="800" fill="#004585">MAX FILL</text><text x="188" y="92" font-size="12" font-weight="700" fill="#004585">3+ CONDUCTORS</text>`,
"voltage-drop":`<rect x="18" y="38" width="52" height="42" fill="none" stroke="#004585" stroke-width="3"/><text x="44" y="64" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">PANEL</text><line x1="70" y1="59" x2="240" y2="59" stroke="#0058a3" stroke-width="4" stroke-dasharray="8 5"/><rect x="240" y="38" width="58" height="42" fill="none" stroke="#004585" stroke-width="3"/><text x="269" y="64" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">LOAD</text><text x="155" y="40" text-anchor="middle" font-size="14" font-weight="900" fill="#004585">LONG RUN = BIGGER WIRE</text><text x="155" y="104" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">GOAL: 3% OR LESS</text>`,
"branch-210":`<line x1="16" y1="70" x2="304" y2="70" stroke="#004585" stroke-width="4"/><rect x="34" y="56" width="18" height="28" fill="#0058a3"/><rect x="150" y="56" width="18" height="28" fill="#0058a3"/><rect x="266" y="56" width="18" height="28" fill="#0058a3"/><text x="43" y="104" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">START</text><text x="97" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#004585">≤ 6 FT</text><text x="213" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#004585">≤ 6 FT</text><text x="275" y="104" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">END</text>`,
"afci-gfci":`<rect x="104" y="14" width="112" height="64" rx="8" fill="#0058a3"/><text x="160" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#fff">DF BREAKER</text><text x="160" y="64" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">AFCI + GFCI</text><path d="M60 96 q10 -12 20 0 q10 12 20 0" fill="none" stroke="#0058a3" stroke-width="3"/><path d="M220 96 q10 -12 20 0 q10 12 20 0" fill="none" stroke="#0058a3" stroke-width="3"/><text x="160" y="108" text-anchor="middle" font-size="13" font-weight="800" fill="#004585">PROTECTION LIVES AT THE BREAKER</text>`,
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
/* ---------- Pictures that help: theme diagrams for every answer ---------- */
const THEME_DG = {
"gfci":`<rect x="118" y="12" width="84" height="78" rx="10" fill="none" stroke="#004585" stroke-width="3"/><circle cx="144" cy="38" r="5" fill="#0058a3"/><circle cx="176" cy="38" r="5" fill="#0058a3"/><rect x="146" y="54" width="28" height="13" rx="3" fill="#0058a3"/><text x="160" y="64" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff">TEST</text><rect x="146" y="70" width="28" height="13" rx="3" fill="#7fb3dd"/><text x="160" y="80" text-anchor="middle" font-size="8" font-weight="900" fill="#004585">RESET</text><path d="M52 102 q10 -12 20 0 q10 12 20 0 M228 102 q10 -12 20 0 q10 12 20 0" fill="none" stroke="#0058a3" stroke-width="3"/><text x="160" y="112" text-anchor="middle" font-size="12.5" font-weight="800" fill="#004585">WATER NEARBY? IT NEEDS GFCI PROTECTION</text>`,
"panel":`<rect x="112" y="8" width="96" height="104" rx="6" fill="none" stroke="#004585" stroke-width="3"/><rect x="126" y="20" width="68" height="16" fill="#0058a3"/><text x="160" y="32" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">MAIN</text><rect x="126" y="44" width="30" height="13" fill="#d3e7f8" stroke="#0058a3" stroke-width="1.5"/><rect x="164" y="44" width="30" height="13" fill="#d3e7f8" stroke="#0058a3" stroke-width="1.5"/><rect x="126" y="63" width="30" height="13" fill="#d3e7f8" stroke="#0058a3" stroke-width="1.5"/><rect x="164" y="63" width="30" height="13" fill="#d3e7f8" stroke="#0058a3" stroke-width="1.5"/><rect x="126" y="82" width="30" height="13" fill="#d3e7f8" stroke="#0058a3" stroke-width="1.5"/><rect x="164" y="82" width="30" height="13" fill="#d3e7f8" stroke="#0058a3" stroke-width="1.5"/><text x="52" y="66" font-size="12" font-weight="800" fill="#004585">SERVICE</text><text x="236" y="66" font-size="12" font-weight="800" fill="#004585">CIRCUITS</text><text x="160" y="122" text-anchor="middle" font-size="12" font-weight="800" fill="#004585">EVERY BREAKER LABELED — NO GUESSING</text>`,
"lighting":`<line x1="60" y1="14" x2="60" y2="44" stroke="#004585" stroke-width="3"/><rect x="38" y="44" width="44" height="26" rx="4" fill="none" stroke="#004585" stroke-width="3"/><text x="60" y="61" text-anchor="middle" font-size="10" font-weight="800" fill="#004585">SWITCH</text><line x1="82" y1="57" x2="196" y2="57" stroke="#0058a3" stroke-width="3" stroke-dasharray="7 4"/><path d="M196 30 h68 M230 30 v14" stroke="#004585" stroke-width="3"/><path d="M214 62 l16 -18 M246 62 l-16 -18 M230 66 v-22" stroke="#0058a3" stroke-width="3"/><circle cx="230" cy="52" r="13" fill="#fef3c7" stroke="#0058a3" stroke-width="2.5"/><text x="160" y="102" text-anchor="middle" font-size="12.5" font-weight="800" fill="#004585">SWITCH CONTROLS THE LIGHT — HOT IS SWITCHED</text>`,
"receptacle":`<rect x="126" y="14" width="68" height="72" rx="10" fill="none" stroke="#004585" stroke-width="3"/><line x1="146" y1="34" x2="146" y2="50" stroke="#0058a3" stroke-width="4"/><line x1="174" y1="34" x2="174" y2="50" stroke="#0058a3" stroke-width="4"/><circle cx="160" cy="66" r="4" fill="#0058a3"/><text x="160" y="104" text-anchor="middle" font-size="12.5" font-weight="800" fill="#004585">TAMPER-RESISTANT IN HOMES — SHUTTERS INSIDE</text><text x="52" y="54" font-size="12" font-weight="800" fill="#004585">HOT</text><text x="238" y="54" font-size="12" font-weight="800" fill="#004585">NEUTRAL</text>`,
"motor":`<circle cx="140" cy="56" r="36" fill="none" stroke="#004585" stroke-width="3"/><circle cx="140" cy="56" r="12" fill="#0058a3"/><path d="M140 24 v64 M108 56 h64 M118 34 l44 44 M162 34 l-44 44" stroke="#0058a3" stroke-width="2"/><rect x="222" y="32" width="52" height="48" fill="none" stroke="#004585" stroke-width="3"/><text x="248" y="60" text-anchor="middle" font-size="10" font-weight="800" fill="#004585">FUSES /</text><text x="248" y="73" text-anchor="middle" font-size="10" font-weight="800" fill="#004585">BREAKER</text><line x1="176" y1="56" x2="222" y2="56" stroke="#004585" stroke-width="3"/><text x="160" y="112" text-anchor="middle" font-size="12.5" font-weight="800" fill="#004585">MOTORS: NAMEPLATE AMPS RUN THE SHOW</text>`
};
const THEME_RULES = [
[/pool|spa|hot tub|680\./,"pools"],[/solar|photovoltaic|\bpv\b|690\./,"solar"],[/electric vehicle|\bev\b|charging|625\./,"ev"],
[/generator|transfer switch|standby|702\.|700\./,"generators"],[/smoke|carbon monoxide|fire alarm|co detector/,"smokes"],
[/gfci|ground-fault|ground fault|210\.8|422\.5/,"gfci"],[/afci|arc-fault|arc fault|210\.12/,"afci-gfci"],
[/grounding|bonding|electrode|250\./,"grounding"],[/box fill|314\.16|junction box|box volume/,"box-fill"],
[/conduit fill|raceway fill|chapter 9 table 1|fill percent/,"conduit-fill"],[/voltage drop/,"voltage-drop"],
[/hvac|air condition|heat pump|refrigerat|440\.|motor|430\./,"motor"],[/ampacity|310\.16|310\.15|conductor rating/,"ampacity"],
[/load calc|demand factor|service size|220\.82|220\.83/,"load-calc"],[/working clearance|110\.26|panel clearance|headroom/,"clearances"],
[/receptacle spacing|210\.52|countertop|wall space/,"branch-210"],[/panel|service|disconnect|breaker|230\.|408\.|240\./,"panel"],
[/light|luminaire|switch|dimmer|410\.|404\./,"lighting"],[/receptacle|outlet|406\./,"receptacle"],[/wire|cable|conductor|334\.|300\./,"ampacity"]
];
const FALLBACK_DG = `<rect x="96" y="10" width="128" height="88" rx="6" fill="none" stroke="#004585" stroke-width="3"/><rect x="96" y="10" width="16" height="88" fill="#0058a3"/><line x1="126" y1="30" x2="208" y2="30" stroke="#0058a3" stroke-width="3"/><line x1="126" y1="48" x2="208" y2="48" stroke="#7fb3dd" stroke-width="3"/><line x1="126" y1="66" x2="190" y2="66" stroke="#7fb3dd" stroke-width="3"/><text x="160" y="90" text-anchor="middle" font-size="12" font-weight="900" fill="#004585">NEC</text><path d="M248 22 l22 8 v18 c0 16 -9 26 -22 32 c-13 -6 -22 -16 -22 -32 v-18 z" fill="#d3e7f8" stroke="#004585" stroke-width="2.5"/><path d="M238 52 l7 7 l14 -15" fill="none" stroke="#004585" stroke-width="3.5"/><text x="160" y="114" text-anchor="middle" font-size="12.5" font-weight="800" fill="#004585">THE CODE IS THE SAFETY FLOOR — START HERE</text>`;
function themeDiagram(text){
  const t=String(text||"").toLowerCase();
  for(const [re,key] of THEME_RULES){
    if(re.test(t)){
      if(THEME_DG[key]) return `<div class="diagram"><svg viewBox="0 0 320 124" role="img" aria-label="helpful picture">${THEME_DG[key]}</svg></div>`;
      if(DG[key]) return diagram(key);
    }
  }
  return `<div class="diagram"><svg viewBox="0 0 320 124" role="img" aria-label="helpful picture">${FALLBACK_DG}</svg></div>`;
}
function keyNums(t){ const m=[...String(t.summary).matchAll(/(\d+(?:\.\d+)?\s?(?:ft|in|%|VA|A\b|AWG))/g)].map(x=>x[1].replace(/\s+/g," ").trim()); return [...new Set(m)].slice(0,4); }
function steps(t){ return String(t.summary).split(/(?<=\.)\s+/).filter(x=>x.trim()).slice(0,4); }

function favBtn(id){ return `<button class="favbtn" data-fav="${id}" title="Save">${favs.has(id)?"❤️":"🤍"}</button>`; }
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-fav]"); if(!f) return;
  const id=f.dataset.fav; favs.has(id)?favs.delete(id):favs.add(id); saveFavs(); render();
});
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

function render(){
  if(tab==="home") return renderHome();
  if(tab==="book") return renderBook();
  if(tab==="lookup") return renderLookup();
  if(tab==="calc") return renderCalc();
  if(tab==="rooms") return renderRooms();
  if(tab==="quiz") return renderQuiz();
  if(tab==="sharma") return renderSharma();
  if(tab==="favs") return renderFavs();
}
/* ---------- Home: education-first start page ---------- */
const CH_SUB = {1:"The rules that apply to every job",2:"Services, feeders, grounding and breakers",3:"Cable, conduit, boxes and wire",4:"Switches, receptacles, lights and equipment",5:"Hazardous places, health care and assembly",6:"Pools, solar, EVs, signs and special gear",7:"Generators, emergency systems and fire alarm",8:"Low voltage, data and antennas",9:"The tables you use every day"};
function allBookSections(){ const out=[]; for(const e of bookEntries()) for(const s of e.book.sections) out.push(s); return out; }
function chProgress(e){ const secs=e.book.sections||[]; const done=secs.filter(s=>learned.has(s.id)).length; return {done:done, total:secs.length, pct:secs.length?Math.round(100*done/secs.length):0}; }
document.addEventListener("click",e=>{
  const gq=e.target.closest("[data-gotoquiz]"); if(gq){ setTab("quiz"); startQuiz(gq.dataset.gotoquiz,0); render(); window.scrollTo(0,0); return; }
  const g=e.target.closest("[data-goto]"); if(!g) return;
  setTab(g.dataset.goto); render(); window.scrollTo(0,0);
});
function renderHome(){
  const topics=(DATA.lookup&&DATA.lookup.topics)||[];
  const secs=allBookSections();
  const totalLessons=topics.length+secs.length;
  const doneCount=[...learned].filter(id=>topics.some(t=>t.id===id)||secs.some(s=>s.id===id)).length;
  const pct=totalLessons?Math.round(100*doneCount/totalLessons):0;
  const nextTopic=topics.find(t=>!learned.has(t.id));
  const nextSec=secs.find(s=>!learned.has(s.id));
  let continueCard="";
  if(nextSec){
    const chE=bookEntries().find(e=>e.book.chapter===nextSec.chapter);
    continueCard=`<div class="card hero-continue"><div class="cite">${doneCount? "Continue where you left off":"Start here — your first lesson"}</div><h3>Chapter ${nextSec.chapter}: ${esc(nextSec.title)}</h3><p>NEC ${esc(nextSec.section)} · ${chE?esc(chE.book.chapter_title):""} — in plain words, with what it means on the job.</p><button class="go" data-bookpage="${nextSec.id}">${doneCount? "Continue learning →":"Start Lesson 1 →"}</button></div>`;
  } else if(nextTopic){
    continueCard=`<div class="card hero-continue"><div class="cite">Start here</div><h3>${esc(nextTopic.title)}</h3><p>One of the 15 essential lessons every electrician should know first.</p><button class="go" data-goto="lookup">Start the essential lessons →</button></div>`;
  } else if(totalLessons){
    continueCard=`<div class="card hero-continue"><div class="cite">🎉 All lessons done</div><h3>You have worked through every lesson</h3><p>Keep sharp with the Practice quizzes, or look anything up any time.</p><button class="go" data-goto="quiz">Practice now →</button></div>`;
  }
  view.innerHTML =
  `<div class="hero"><h2>Learn the NEC, one lesson at a time</h2><p>No code-book language to fight through. Every lesson is in plain words, in order, with the NEC section on it so you can check the real book.</p>
   <div class="howsteps"><span><b>1</b> Read a lesson</span><span><b>2</b> Answer a question</span><span><b>3</b> Use it on the job</span></div></div>` +
  (totalLessons? `<div class="progresswrap"><div class="plabel">Your learning progress: ${doneCount} of ${totalLessons} lessons</div><div class="pbar"><div style="width:${pct}%"></div></div></div>`:"") +
  continueCard +
  `<h2 class="sec">Your learning path — Chapters 1 to 9, in order</h2><p class="bkmeta">Tap a chapter to open its lessons. Work top to bottom, or jump to the chapter you need today — your checkmarks are saved on this phone.</p>` +
  bookEntries().map(e=>{ const pr=chProgress(e); return `<button class="pathcard" data-bookchapter="${e.book.chapter}"><span class="pathnum">${e.book.chapter}</span><span class="pathbody"><b>Chapter ${e.book.chapter} — ${esc(e.book.chapter_title)}</b><i>${esc(CH_SUB[e.book.chapter]||"")}</i><small>${pr.total} lessons · ${(e.quiz||[]).length} practice questions${pr.done?` · ✓ ${pr.done} learned`:""}</small><span class="pbar mini"><span style="width:${pr.pct}%"></span></span></span><span class="pathgo">›</span></button>`; }).join("") +
  `<h2 class="sec">Quick ways in</h2><div class="tiles">
     <button class="tile" data-goto="lookup"><b>⭐ Start Here</b><span>The 15 essential lessons, with pictures</span></button>
     <button class="tile" data-goto="quiz"><b>✏️ Practice</b><span>Quiz yourself — 80% to pass</span></button>
     <button class="tile" data-goto="calc"><b>🧮 Tools</b><span>Box fill, conduit fill, voltage drop, load calc</span></button>
     <button class="tile" data-goto="rooms"><b>🏠 Room Checklists</b><span>Room by room, before the inspector comes</span></button>
     <button class="tile" data-goto="sharma"><b>⭐ Sharma Rules</b><span>How Sharma does it — stricter than code</span></button>
     <button class="tile" data-goto="favs"><b>❤️ Saved</b><span>The lessons and rules you bookmarked</span></button>
   </div>
   <div class="card"><div class="cite">Just need one answer?</div><h3>Use Look Up</h3><p>Type what you are looking for in the search box at the top — it searches every lesson, every quick answer and every quiz question in the app at once.</p><button class="go" data-goto="lookup">Go to Look Up →</button></div>`;
}
/* ---------- Lookup ---------- */
function topicCard(t, ix){
  const kn = keyNums(t);
  const st = steps(t);
  const done = learned.has(t.id);
  return `<div class="card">${favBtn("t:"+t.id)}<div class="cite">${typeof ix==="number"?`<span class="num-badge">${ix+1}</span>`:""}${esc(t.cite)}</div><h3>${esc(t.title)}</h3>${diagram(t.id)}${kn.length?`<div class="keynums">${kn.map(k=>`<span class="keynum">${esc(k)}</span>`).join("")}</div>`:""}<ul class="steps">${st.map((x,i)=>`<li><b>Step ${i+1}.</b> ${esc(x)}</li>`).join("")}</ul>${t.flag?`<span class="flag">${esc(t.flag)}</span>`:""}<div class="rowbtns"><button class="learnbtn ${done?"done":""}" data-learn="${t.id}">${done?"✓ Learned":"Mark as learned"}</button><button class="quizbtn" data-quizjump="1">Quiz me →</button></div></div>`;
}
function lookupCard(ch, x){
  return `<div class="card" id="lk-${esc(x.id)}"${lookupState.highlight===x.id?` style="outline:3px solid #0058a3"`:``}><div class="cite">Ch. ${ch} · ${esc(x.nec_ref||"")} · ${esc(x.id)}</div><h3>${esc(x.question)}</h3>${themeDiagram(x.question+" "+x.answer_plain)}<p>${esc(x.answer_plain)}</p>${x.verified===false?`<span class="flag">⚠ UNVERIFIED${x.unverified_reason? " — "+esc(x.unverified_reason):""}</span>`:""}${x.sharma_rule_id?`<span class="tag">SHARMA ${esc(x.sharma_rule_id)}</span>`:""}</div>`;
}
function renderLookup(){
  const q=($("#search").value||"").toLowerCase().trim();
  const topics=(DATA.lookup&&DATA.lookup.topics)||[];
  if(q){
    const tlist=topics.filter(t=>(t.title+" "+t.cite+" "+t.summary).toLowerCase().includes(q));
    const bank=chapterLookupAll().filter(({item:x})=>(x.id+" "+x.question+" "+x.answer_plain+" "+(x.nec_ref||"")+" "+(x.aliases||[]).join(" ")).toLowerCase().includes(q));
    const v1=(DATA.v1lookup||[]).filter(x=>(x.id+" "+x.question+" "+x.answer_plain+" "+(x.nec_ref||"")+" "+(x.aliases||[]).join(" ")).toLowerCase().includes(q));
    const pages=[]; for(const e of bookEntries()) for(const s of e.book.sections) if((s.id+" "+s.section+" "+s.title+" "+s.plain_explanation).toLowerCase().includes(q)) pages.push(s);
    view.innerHTML = `<h2 class="sec">Search results</h2>` +
      (tlist.length? `<h2 class="sec">Learn-the-code topics</h2>`+tlist.map(t=>topicCard(t)).join(""):"") +
      (bank.length? `<h2 class="sec">Field Book lookup (${bank.length})</h2>`+bank.slice(0,120).map(({ch,item})=>lookupCard(ch,item)).join("")+(bank.length>120?`<p class="flag">Showing the first 120 matches — narrow the search to see more.</p>`:""):"") +
      (v1.length? `<h2 class="sec">Field Book v1 lookup (${v1.length})</h2>`+v1.slice(0,60).map(x=>`<div class="card"><div class="cite">${esc(x.id)} · ${esc(x.nec_ref||"")}</div><h3>${esc(x.question)}</h3>${themeDiagram(x.question+" "+x.answer_plain)}<p>${esc(x.answer_plain)}</p></div>`).join(""):"") +
      (pages.length? `<h2 class="sec">Field Book pages (${pages.length})</h2><div class="card">${pages.slice(0,60).map(s=>`<button class="bkchip" data-bookpage="${s.id}">${esc(s.id.replace(/^C\d+-/,""))} — ${esc(s.title)}</button>`).join(" ")}</div>`:"") +
      (!tlist.length&&!bank.length&&!v1.length&&!pages.length? `<div class="empty">No matches. Try a topic name or an article number.</div>`:"");
    return;
  }
  const total=topics.length;
  let html = `<h2 class="sec">Start Here — the 15 essential lessons</h2><p class="bkmeta">New to the code? Start with these 15. Each one has a picture, the key numbers, and simple steps. Mark it learned when you can explain it back.</p>` +
    (total? `<div class="progresswrap"><div class="plabel">Essential lessons: ${[...learned].filter(id=>topics.some(t=>t.id===id)).length} of ${total} learned</div><div class="pbar"><div style="width:${Math.round(100*[...learned].filter(id=>topics.some(t=>t.id===id)).length/Math.max(total,1))}%"></div></div></div>`:"") +
    (DATA.lookup? `<p class="flag">${esc(DATA.lookup.meta.status)}</p>`:"") +
    (topics.length? topics.map((t,i)=>topicCard(t,i)).join("") : `<div class="empty">Lookup file not loaded yet.</div>`);
  html += `<h2 class="sec">Quick Answers by chapter</h2><p class="bkmeta">Need one fast answer? The nine chapters carry ${chapterLookupAll().length} quick-answer cards. Pick a chapter to browse them, or use the search box at the top — it searches everything in the app at once.</p>`;
  html += `<div class="rowbtns">${bookEntries().map(e=>`<button class="quizbtn" data-lookupch="${e.book.chapter}"${lookupState.chapter===e.book.chapter?` style="background:#0058a3;color:#fff"`:``}>Ch. ${e.book.chapter} (${(e.lookup||[]).length})</button>`).join("")}</div>`;
  if(lookupState.chapter){ const ent=bookEntries().find(e=>e.book.chapter===lookupState.chapter); if(ent) html += (ent.lookup||[]).map(x=>lookupCard(ent.book.chapter,x)).join(""); }
  view.innerHTML = html;
}
/* ---------- Sharma rules ---------- */
function renderSharma(){
  const rules=(DATA.sharma&&DATA.sharma.rules)||[];
  view.innerHTML = `<h2 class="sec">Sharma Rules — how we do it</h2><p class="bkmeta">The code is the floor. These are Sharma's own rules on top of it — when a Sharma rule and the code differ, follow the stricter one and ask your foreman if you are not sure.</p>` + (rules.length? rules.map(r=>
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
  let html=`<h2 class="sec">Room Checklists — check it before inspection</h2><p class="bkmeta">Walk the room, tick each item off. These are the things inspectors look for — and the things that fail jobs.</p>`+(rooms.length? rooms.map(r=>
    `<div class="card"><h3>${esc(r.room)}</h3><ul class="ck">${r.items.map(i=>`<li><input type="checkbox"><span>${esc(i)}</span></li>`).join("")}</ul></div>`).join("")
    : `<div class="empty">Checklists file not loaded yet.</div>`);
  html+=`<h2 class="sec">More checklists — by chapter</h2>`;
  for(const e of bookEntries()) for(const r of (e.checklists||[])){
    html+=`<div class="card"><h3>Ch. ${e.book.chapter} — ${esc(r.room)}</h3><ul class="ck">${r.items.map(i=>`<li id="ck-${esc(i.id)}"${roomsHighlight===i.id?` style="outline:3px solid #0058a3"`:``}><input type="checkbox"><span>${esc(i.text)}${i.nec_ref?` <span class="cite">${esc(i.nec_ref)}</span>`:""}${i.severity==="sharma"?` <span class="tag">SHARMA</span>`:""}</span></li>`).join("")}</ul></div>`;
  }
  view.innerHTML=html;
}
/* ---------- Quiz ---------- */
let quizState=null;
function quizBank(name){
  const norm=x=>({q:x.question, choices:x.choices, answer:x.answer_index, why:x.explain_plain, cite:x.nec_ref});
  if(name==="starter") return ((DATA.quiz&&DATA.quiz.questions)||[]).map(q=>({q:q.q, choices:q.choices, answer:q.answer, why:q.why, cite:q.cite}));
  if(name==="all") return chapterQuizAll().map(({item})=>norm(item));
  const ent=bookEntries().find(e=>e.book.chapter===parseInt(String(name).slice(2),10));
  return ent? (ent.quiz||[]).map(norm) : [];
}
function startQuiz(bank, idx){ quizState={bank:bank, qs:quizBank(bank), i:idx||0, score:0, answered:false}; }
function renderQuiz(){
  if(!quizState){
    view.innerHTML=`<h2 class="sec">Practice — check what you learned</h2><p class="bkmeta">Best way: study one chapter under Learn, then take that chapter's quiz here. 80% to pass.</p><div class="card"><h3>Pick a quiz</h3><div class="rowbtns">
      <button class="quizbtn" data-quizbank="starter">Starter bank (${((DATA.quiz&&DATA.quiz.questions)||[]).length})</button>
      <button class="quizbtn" data-quizbank="all">All chapters (${chapterQuizAll().length})</button>
      ${bookEntries().map(e=>`<button class="quizbtn" data-quizbank="ch${e.book.chapter}">Ch. ${e.book.chapter} (${(e.quiz||[]).length})</button>`).join("")}
      </div><p class="bkmeta">The chapter banks are the Field Book's own exam questions. Pass mark is 80%.</p></div>`;
    return;
  }
  const s=quizState, qs=s.qs;
  if(!qs.length){ view.innerHTML=`<div class="empty">That quiz bank is empty.</div>`; quizState=null; return; }
  if(s.i>=qs.length){ view.innerHTML=`<div class="card"><div class="score">Score: ${s.score} / ${qs.length} (${Math.round(100*s.score/qs.length)}%)<br>${100*s.score/qs.length>=80?"✅ Pass":"❌ Below the 80% pass mark — run it again"}</div><div class="rowbtns"><button class="go" id="qrestart">Restart this bank</button><button class="quizbtn" id="qbank">Change bank</button></div></div>`;
    $("#qrestart").onclick=()=>{ startQuiz(s.bank,0); renderQuiz(); };
    $("#qbank").onclick=()=>{ quizState=null; renderQuiz(); }; return; }
  const q=qs[s.i];
  view.innerHTML=`<h2 class="sec">Practice — question ${s.i+1} of ${qs.length}</h2><div class="card"><h3>${esc(q.q)}</h3>${themeDiagram(q.q+" "+(q.why||""))}`+
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
  <h2 class="sec">Tools — calculators for the job</h2>
  <div class="tiles"><button class="tile" data-goto="rooms"><b>🏠 Room Checklists</b><span>Check a room before inspection</span></button><button class="tile" data-goto="sharma"><b>⭐ Sharma Rules</b><span>Stricter than code — our way</span></button></div>
  <div class="card"><h3>📦 Box fill <span class="cite">314.16</span></h3>
    <label class="f">Wire size (AWG)</label><select class="n" id="bf-awg">${opts(["14","12","10","8","6"],"12")}</select>
    <label class="f">Conductors entering the box (count each insulated conductor; do NOT count grounds here — use the grounds field)</label><input class="n" id="bf-cond" type="number" value="6" min="0">
    <label class="f">Devices (switches / receptacles)</label><input class="n" id="bf-dev" type="number" value="1" min="0">
    <label class="f">Internal cable clamps?</label><select class="n" id="bf-clamp"><option value="0">No / external</option><option value="1">Yes (counts as 1)</option></select>
    <label class="f">Equipment grounding conductors entering the box (count) — 2020 rule 314.16(B)(5): the first four together take ONE allowance; each ground past four adds a QUARTER allowance</label><input class="n" id="bf-egc" type="number" value="2" min="0">
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
    <label class="f">System</label><select class="n" id="vd-ph"><option value="1">Single-phase</option><option value="3">Three-phase</option></select>
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
    const egcN=num("#bf-egc"); const egcF= egcN===0?0 : egcN<=4?1 : 1+0.25*(egcN-4);
    const total=per*(num("#bf-cond")+2*num("#bf-dev")+num("#bf-clamp")+egcF);
    const box=num("#bf-box");
    $("#bf-out").innerHTML=`<div class="result">Required volume: <b>${total.toFixed(2)} cu in</b> (grounds allowance: ${egcF} × ${per} cu in)<br>Box volume: <b>${box} cu in</b> → ${total<=box?"✅ <b>FITS</b>":"❌ <b>TOO SMALL</b> — use a bigger box or a box extension"}</div>`; };
  $("#cf-go").onclick=()=>{ const a40=T.conduitAreas40pct.EMT[sel("#cf-size")]; const each=T.conductorAreasTHHN[sel("#cf-awg")]; const n=num("#cf-n");
    const totalArea=a40/0.40; const pct= n===1?0.53 : n===2?0.31 : 0.40; const allow=totalArea*pct;
    const used=each*n;
    const raw=a40/each; const maxN= (raw-Math.floor(raw)>=0.8)? Math.ceil(raw) : Math.floor(raw);
    $("#cf-out").innerHTML=`<div class="result">Conductors take <b>${used.toFixed(3)} sq in</b> of the <b>${allow.toFixed(3)} sq in</b> allowed (${Math.round(pct*100)}% fill for ${n} conductor${n===1?"":"s"}, Ch. 9 Table 1) → ${used<=allow?"✅ <b>FITS</b>":"❌ <b>OVERFILLED</b> — upsize the conduit"}<br>Max of this size in that conduit at 40%: <b>${maxN}</b> (Note 7: a remainder of 0.8 or more rounds up)<br><span class="flag">Nipples 24 in or shorter may use 60% fill (Table 1, Note 4) — and Note 4 also waives the 310.15(C)(1) ampacity adjustment on those nipples.</span></div>`; };
  $("#vd-go").onclick=()=>{ const mat=sel("#vd-mat"), start=sel("#vd-awg"), I=num("#vd-i"), L=num("#vd-l"), V=num("#vd-v");
    const f= sel("#vd-ph")==="3"? 1.732 : 2;
    const R8=(T.table8Resistance||{})[mat]||{};
    const dropFor=a=>{ const R=R8[a]; if(R) return f*L*I*R/1000; const K=mat==="copper"?12.9:21.2; return f*K*I*L/T.circularMils[a]; };
    const vd=dropFor(start); const pct=100*vd/V;
    let size=start;
    const bySize=[...awgs].sort((x,y)=>T.circularMils[x]-T.circularMils[y]);
    for(const a of bySize){ if(100*dropFor(a)/V<=3){ size=a; break; } }
    const basis= R8[start]? `Chapter 9, Table 8 resistance (${R8[start]} Ω per 1,000 ft)` : "K-constant approximation (no Table 8 value loaded for this size)";
    $("#vd-out").innerHTML=`<div class="result">Voltage drop: <b>${vd.toFixed(2)} V (${pct.toFixed(1)}%)</b> — ${basis}<br>${pct<=3?"✅ Within the 3% recommendation":`❌ Over 3% — smallest size that gets you there: <b>${size} AWG</b>`}<br><span class="flag">Florida commercial work: FBC Energy Conservation C405.5.3 caps feeders + branch circuits COMBINED at 5% total voltage drop.</span></div>`; };
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
let bookState = { chapter:null, page:null, view:"toc" };
function bookEntries(){ return DATA.books||[]; }
function currentEntry(){
  const es = bookEntries();
  return es.find(e=>e.book.chapter===bookState.chapter) || es[0] || null;
}
function bookSection(id){
  for(const e of bookEntries()){ const s=(e.book.sections||[]).find(x=>x.id===id); if(s) return s; }
  return null;
}
function setTab(t){ tab=t; document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab===t)); }
function chapterLookupAll(){ const out=[]; for(const e of bookEntries()) for(const x of (e.lookup||[])) out.push({ch:e.book.chapter, item:x}); return out; }
function chapterQuizAll(){ const out=[]; for(const e of bookEntries()) for(const x of (e.quiz||[])) out.push({ch:e.book.chapter, item:x}); return out; }
function chapterLookupItem(id){ for(const e of bookEntries()){ const x=(e.lookup||[]).find(y=>y.id===id); if(x) return {ch:e.book.chapter, item:x}; } return null; }
function chapterQuizItem(id){ for(const e of bookEntries()){ const ix=(e.quiz||[]).findIndex(y=>y.id===id); if(ix>=0) return {ch:e.book.chapter, item:e.quiz[ix], index:ix}; } return null; }
function chapterChecklistItem(id){ for(const e of bookEntries()) for(const r of (e.checklists||[])) for(const it of r.items) if(it.id===id) return {ch:e.book.chapter, room:r.room, item:it}; return null; }
function v1Lookup(id){ return (DATA.v1lookup||[]).find(x=>x.id===id)||null; }
function v1Quiz(id){ return (DATA.v1quiz||[]).find(x=>x.id===id)||null; }
function v1Checklist(id){ for(const r of (DATA.v1checklists||[])) for(const it of r.items) if(it.id===id) return {room:r.room, item:it}; return null; }
function v1Sharma(id){ return (DATA.v1sharma||[]).find(x=>x.id===id)||null; }
let v1Overlay=null, lookupState={chapter:null, highlight:null}, roomsHighlight=null;
function relChip(id){
  const label = relatedLabel(id);
  if(bookSection(id)) return `<button class="bkchip" data-bookpage="${id}">${esc(id)} — ${esc(label)}</button>`;
  if(chapterLookupItem(id)) return `<button class="bkchip" data-reljump="lookup:${id}">${esc(id)} — ${esc(label)}</button>`;
  if(chapterQuizItem(id)) return `<button class="bkchip" data-reljump="quiz:${id}">${esc(id)} — ${esc(label)}</button>`;
  if(chapterChecklistItem(id)) return `<button class="bkchip" data-reljump="rooms:${id}">${esc(id)} — ${esc(label)}</button>`;
  if(v1Lookup(id)||v1Quiz(id)||v1Checklist(id)||v1Sharma(id)) return `<button class="bkchip" data-reljump="v1:${id}">${esc(id)} — ${esc(label)}</button>`;
  return `<span class="bkchip static">${esc(id)} — ${esc(label)}</span>`;
}
function relatedLabel(id){
  if(/^C\d+-L-/.test(id)){ for(const e of bookEntries()){ const x=(e.lookup||[]).find(y=>y.id===id); if(x) return x.question; } return id; }
  if(/^C\d+-Q-/.test(id)){ for(const e of bookEntries()){ const x=(e.quiz||[]).find(y=>y.id===id); if(x) return "Quiz: "+x.question; } return id; }
  for(const e of bookEntries()) for(const r of (e.checklists||[])) for(const it of r.items) if(it.id===id) return "Checklist: "+it.text;
  if(/^S-\d+$/.test(id)){ const x=v1Sharma(id); return x? "Sharma rule "+id+": "+x.text : "Sharma rule "+id; }
  if(/^L-\d+$/.test(id)){ const x=v1Lookup(id); return x? x.question : "Field Book v1 lookup "+id; }
  if(/^Q-\d+$/.test(id)){ const x=v1Quiz(id); return x? "Quiz: "+x.question : "Field Book v1 quiz "+id; }
  { const c=v1Checklist(id); if(c) return "Checklist ("+c.room+"): "+c.item.text; }
  if(/^(Ch9-T|\d{3}\.\d)/.test(id)) return "Calc table "+id;
  return id;
}
document.addEventListener("click",e=>{
  const ch=e.target.closest("[data-bookchapter]"); if(ch){ bookState={chapter:parseInt(ch.dataset.bookchapter,10), page:null, view:"toc"}; if(tab!=="book"){ tab="book"; document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab==="book")); } render(); window.scrollTo(0,0); return; }
  const p=e.target.closest("[data-bookpage]"); if(p){ const s=bookSection(p.dataset.bookpage); if(s) bookState.chapter=s.chapter; bookState={chapter:bookState.chapter, page:p.dataset.bookpage, view:"page"}; if(tab!=="book"){ tab="book"; document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab==="book")); } render(); window.scrollTo(0,0); return; }
  const v=e.target.closest("[data-bookview]"); if(v){ bookState.view=v.dataset.bookview; if(v.dataset.bookview!=="page") bookState.page=null; render(); window.scrollTo(0,0); return; }
  const rj=e.target.closest("[data-reljump]"); if(rj){ const [kind,id]=rj.dataset.reljump.split(":");
    if(kind==="lookup"){ const hit=chapterLookupItem(id); lookupState={chapter:hit?hit.ch:null, highlight:id}; $("#search").value=""; setTab("lookup"); render(); setTimeout(()=>{ const el=document.getElementById("lk-"+id); if(el) el.scrollIntoView({block:"center"}); },60); return; }
    if(kind==="quiz"){ const hit=chapterQuizItem(id); if(hit){ setTab("quiz"); startQuiz("ch"+hit.ch, hit.index); render(); } return; }
    if(kind==="rooms"){ roomsHighlight=id; setTab("rooms"); render(); setTimeout(()=>{ const el=document.getElementById("ck-"+id); if(el) el.scrollIntoView({block:"center"}); },60); return; }
    if(kind==="v1"){ v1Overlay=id; if(tab!=="book") setTab("book"); render(); window.scrollTo(0,0); return; }
  }
  const lc=e.target.closest("[data-lookupch]"); if(lc){ const n=parseInt(lc.dataset.lookupch,10); lookupState={chapter:lookupState.chapter===n?null:n, highlight:null}; render(); return; }
  const qb=e.target.closest("[data-quizbank]"); if(qb){ startQuiz(qb.dataset.quizbank,0); render(); return; }
  const vb=e.target.closest("[data-v1back]"); if(vb){ v1Overlay=null; render(); window.scrollTo(0,0); return; }
});
function renderBook(){
  if(v1Overlay){
    const id=v1Overlay; let body="";
    const lk=v1Lookup(id), qz=v1Quiz(id), ck=v1Checklist(id), sh=v1Sharma(id);
    if(lk) body=`<div class="cite">${esc(id)} · Field Book v1 lookup · ${esc(lk.nec_ref||"")}</div><h3>${esc(lk.question)}</h3>${themeDiagram(lk.question+" "+lk.answer_plain)}<p>${esc(lk.answer_plain)}</p>${lk.verified_by?`<span class="flag">Verified by ${esc(lk.verified_by)}${lk.verified_date? " · "+esc(lk.verified_date):""}</span>`:""}`;
    else if(qz) body=`<div class="cite">${esc(id)} · Field Book v1 quiz · ${esc(qz.nec_ref||"")}</div><h3>${esc(qz.question)}</h3>${themeDiagram(qz.question+" "+qz.explain_plain)}<ul class="steps">${qz.choices.map((c,ix)=>`<li>${ix===qz.answer_index? "<b>✓ "+esc(c)+"</b>" : esc(c)}</li>`).join("")}</ul><p>${esc(qz.explain_plain)}</p>`;
    else if(ck) body=`<div class="cite">${esc(id)} · Field Book v1 checklist · ${esc(ck.room)} · ${esc(ck.item.nec_ref||"")}</div><h3>${esc(ck.item.text)}</h3>`;
    else if(sh) body=`<div class="cite">${esc(id)} · Sharma rule (v1 file)</div><h3>${esc(sh.text)}</h3><p>Applies: ${esc(sh.applies_when||"")} · ${esc(sh.overrides_or_adds||"")} · Source: ${esc(sh.source||"")}</p>`;
    else body=`<div class="empty">Item ${esc(id)} not found in the v1 pack.</div>`;
    view.innerHTML=`<h2 class="sec">Sharma NEC Field Book — linked item</h2><div class="card bkpage">${body}<div class="rowbtns"><button class="quizbtn" data-v1back="1">← Back to the book page</button></div></div>`;
    return;
  }
  const ent = currentEntry();
  if(!ent || !ent.book){ view.innerHTML=`<h2 class="sec">Sharma NEC Field Book</h2><div class="empty">Field Book chapter files not loaded yet.</div>`; return; }
  const B = ent.book;
  const pages = B.sections.length;
  const unverified = B.sections.filter(s=>!s.verified).length;
  const ckItems = (ent.checklists||[]).reduce((n,r)=>n+((r.items||[]).length),0);
  const pr = chProgress(ent);
  const picker = `<div class="progresswrap"><div class="plabel">Chapter ${B.chapter} progress: ${pr.done} of ${pr.total} lessons learned</div><div class="pbar"><div style="width:${pr.pct}%"></div></div></div>`;
  const head=`<h2 class="sec">Learn — Chapter ${B.chapter}: ${esc(B.chapter_title)}</h2>`+
    `<p class="bkmeta">${esc(CH_SUB[B.chapter]||"")} · ${pages} lessons in order · ${(ent.quiz||[]).length} practice questions · ${ckItems} checklist items${unverified?` · ${unverified} lesson${unverified===1?"":"s"} still marked unverified (shown on the lesson)`:""}</p>`+
    picker+
    `<div class="rowbtns"><button class="quizbtn" data-bookview="toc">📚 Lessons in this chapter</button><button class="quizbtn" data-bookview="index">🔤 A–Z Index</button><button class="quizbtn" data-goto="home">🏠 All chapters</button></div>`+
    `<p class="bkmeta">NEC ${esc(B.nec_edition)} · ${esc(B.jurisdiction)} · Master-audited Nov 2026</p>`;
  if(bookState.view==="index"){
    view.innerHTML = head + `<div class="card"><h3>Index</h3><ul class="bkindex">${B.index.map(en=>
      `<li><b>${esc(en.term)}</b><br>${en.ids.map(id=>{ const s=bookSection(id); return s? `<button class="bkchip" data-bookpage="${id}">${esc(id.replace(/^C\d+-/,""))} — ${esc(s.title)}</button>` : relChip(id); }).join(" ")}</li>`).join("")}</ul></div>`;
    return;
  }
  if(bookState.view==="page" && bookState.page){
    const s=bookSection(bookState.page);
    if(!s){ bookState={chapter:B.chapter,page:null,view:"toc"}; return renderBook(); }
    const prev=s.prev_id? bookSection(s.prev_id):null, next=s.next_id? bookSection(s.next_id):null;
    const pos=B.sections.findIndex(x=>x.id===s.id)+1;
    const isDone=learned.has(s.id);
    view.innerHTML = head + `<div class="card bkpage">
      <div class="cite">Lesson ${pos} of ${B.sections.length} · Chapter ${B.chapter} · NEC ${esc(s.section)} (Article ${esc(s.article)})</div>
      <h3>${esc(s.title)}</h3>
      ${s.verified? `<span class="tag">VERIFIED</span>` : `<span class="flag">\u26a0 UNVERIFIED${s.unverified_reason? " — "+esc(s.unverified_reason):""}</span>`}
      <h4>In plain words</h4>
      ${themeDiagram(s.title+" "+s.plain_explanation+" "+(s.figure_idea||""))}
      <p>${esc(s.plain_explanation)}</p>
      ${s.on_the_job? `<h4>What it means on the job</h4><p>${esc(s.on_the_job)}</p>`:""}
      ${s.sharma_note? `<h4>Sharma note</h4><p>${esc(s.sharma_note)}</p>`:""}
      ${s.florida_note? `<h4>Florida note</h4><p>${esc(s.florida_note)}</p>`:""}
      ${s.figure_idea? `<h4>Figure idea</h4><p class="bkfig">${esc(s.figure_idea)}</p>`:""}
      ${(s.related_ids&&s.related_ids.length)? `<h4>Related</h4><div>${s.related_ids.map(id=>relChip(id)).join(" ")}</div>`:""}
      <div class="rowbtns"><button class="learnbtn ${isDone?"done":""}" data-learn="${s.id}">${isDone?"✓ Learned — tap to undo":"✓ Mark as learned"}</button><button class="quizbtn" data-quizjump="1">Quiz me →</button></div>
      <div class="bknav">
        ${prev? `<button class="go" data-bookpage="${prev.id}">\u2190 Previous lesson</button>` : `<span class="bkmeta">Start of chapter</span>`}
        ${next? `<button class="go" data-bookpage="${next.id}">Next lesson: ${esc(next.title)} \u2192</button>` : `<span class="bkmeta">End of chapter — nice work. Take the Chapter ${B.chapter} quiz under Practice.</span>`}
      </div>
      <div class="rowbtns"><button class="quizbtn" data-bookview="toc">All lessons in this chapter</button><button class="quizbtn" data-bookview="index">A–Z Index</button></div>
    </div>`;
    return;
  }
  const lessonRow=(id,secLabel,title)=>`<li><button class="lessonrow" data-bookpage="${id}"><span class="lcheck">${learned.has(id)?"✓":""}</span><span class="lsec">${esc(secLabel)}</span><span class="ltitle">${esc(title)}</span><span class="pathgo">›</span></button></li>`;
  view.innerHTML = head + `<p class="bkmeta">Work down the list in order — tap a lesson to open it, mark it learned, then tap Next lesson. A ✓ means you finished it.</p>` + B.toc.map(a=>{
    const isArt = a.article && a.article!==String(B.chapter);
    return `<div class="card"><h3>${isArt? `Article ${esc(a.article)} — `:""}${esc(a.title)}</h3><ul class="bktoc">
      ${lessonRow(a.id, isArt? "Intro":"Start", isArt? `About Article ${esc(a.article)}`:"Chapter introduction")}
      ${a.children.map(c=>lessonRow(c.id, c.section, c.title)).join("")}
    </ul></div>`; }).join("") +
    `<div class="card"><div class="cite">Finished this chapter?</div><h3>Take the Chapter ${B.chapter} practice quiz</h3><p>80% to pass. Wrong answers explain why, in plain words.</p><button class="go" data-gotoquiz="ch${B.chapter}">Start Chapter ${B.chapter} quiz →</button></div>`;
}
/* ---------- boot ---------- */
(async()=>{
  const [l,c,q,s,t,vl,vq,vc,vs] = await Promise.all([loadJSON("lookup"),loadJSON("checklists"),loadJSON("quiz"),loadJSON("sharma-rules"),loadJSON("calc-tables"),loadJSON("v1/lookup"),loadJSON("v1/quiz"),loadJSON("v1/checklists"),loadJSON("v1/sharma-rules")]);
  const chapDefs = [
    { book:"book/c1", lookup:"book/c1-lookup", quiz:"book/c1-quiz", checklists:"book/c1-checklists" },
    { book:"book-c2", lookup:"book/c2-lookup", quiz:"book/c2-quiz", checklists:"book/c2-checklists" },
    { book:"book/c3", lookup:"book/c3-lookup", quiz:"book/c3-quiz", checklists:"book/c3-checklists" },
    { book:"book/c4", lookup:"book/c4-lookup", quiz:"book/c4-quiz", checklists:"book/c4-checklists" },
    { book:"book/c5", lookup:"book/c5-lookup", quiz:"book/c5-quiz", checklists:"book/c5-checklists" },
    { book:"book/c6", lookup:"book/c6-lookup", quiz:"book/c6-quiz", checklists:"book/c6-checklists" },
    { book:"book/c7", lookup:"book/c7-lookup", quiz:"book/c7-quiz", checklists:"book/c7-checklists" },
    { book:"book/c8", lookup:"book/c8-lookup", quiz:"book/c8-quiz", checklists:"book/c8-checklists" },
    { book:"book/c9", lookup:"book/c9-lookup", quiz:"book/c9-quiz", checklists:"book/c9-checklists" }
  ];
  const books = [];
  for(const d of chapDefs){
    const [bk,bl,bq,bc] = await Promise.all([loadJSON(d.book),loadJSON(d.lookup),loadJSON(d.quiz),loadJSON(d.checklists)]);
    if(bk && bk.sections) books.push({ book:bk, lookup:bl||[], quiz:bq||[], checklists:bc||[] });
  }
  books.sort((a,b)=>a.book.chapter-b.book.chapter);
  const first = books[0]||null;
  DATA={lookup:l,checklists:c,quiz:q,sharma:s,tables:t||FALLBACK_TABLES,books:books,v1lookup:vl||[],v1quiz:vq||[],v1checklists:vc||[],v1sharma:vs||[],
        book:first?first.book:null, bookLookup:first?first.lookup:[], bookQuiz:first?first.quiz:[], bookChecklists:first?first.checklists:[]};
  render(); })();
