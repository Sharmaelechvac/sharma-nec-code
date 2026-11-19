/* Sharma NEC Code app — v1 review build.
   Content loads from content/*.json (Mike Holt's files land there via GitHub).
   Calculator tables are mirrored here as fallback if the JSON can't load. */
"use strict";
const $ = (s, el=document) => el.querySelector(s);
/* Sharma kit v1.3: SK.stack shell. Render functions paint into the current
   stack page through the view facade; chapter + lesson screens are pushes. */
let nav = null, topKey = "root:home";
const SK_LOGO = '<img src="https://sharma-kit.sharma-crew.workers.dev/assets/logo-white-header.png" alt="Sharma Electric &amp; HVAC" width="103" height="20">';
const SK_PHONE = '<button class="sk-header__btn" type="button" data-sheet-open="moreSheet" aria-label="More"><svg class="sk-icon"><use href="#i-more"/></svg></button><a class="sk-header__btn" href="tel:+14078819076" aria-label="Call Sharma"><svg class="sk-icon"><use href="#i-phone"/></svg></a>';
function routeKey(){
  if (tab === "book"){
    if (typeof v1Overlay !== "undefined" && v1Overlay) return "v1";
    if (bookState.view === "page" && bookState.page) return "sec:" + bookState.page;
    if (bookState.chapter && bookState.chapter !== 1) return "ch:" + bookState.chapter;
  }
  return "root:" + tab;
}
function pushHeader(key){
  if (key.indexOf("sec:") === 0){ const s = window.bookSection ? window.bookSection(key.slice(4)) : null; return { lead:'<a class="sk-header__back" href="#/book" data-back>Learn</a>', title: s ? s.title : "Lesson", backHref:"#/book", trail: SK_PHONE }; }
  if (key.indexOf("ch:") === 0){ return { lead:'<a class="sk-header__back" href="#/book" data-back>Learn</a>', title:"Chapter " + key.slice(3), backHref:"#/book", trail: SK_PHONE }; }
  return { lead:'<a class="sk-header__back" href="#/book" data-back>Back</a>', title:"Field Book", backHref:"#/book", trail: SK_PHONE };
}
function syncAfterPop(popped){
  if (popped.indexOf("sec:") === 0){ bookState.page = null; bookState.view = "toc"; }
  else if (popped.indexOf("ch:") === 0){ bookState = { chapter:null, page:null, view:"toc" }; }
  else if (popped === "v1"){ v1Overlay = null; }
}
function paint(html){
  if (!nav){ const m = document.getElementById("app"); if (m) m.innerHTML = html; return; }
  const top = nav.top();
  if (top){
    const actual = nav.depth() === 1 ? "root:" + top.key : top.key;
    if (actual !== topKey && routeKey() === topKey){ syncAfterPop(topKey); topKey = actual; }
  }
  const key = routeKey();
  if (key.indexOf("root:") === 0){
    const t = key.slice(5);
    nav.root(t, P=>{ P.setHeader({ lead: SK_LOGO, title: "NEC Code", trail: SK_PHONE }); });
    const P = nav.top(); if (P) P.html(html);
    if (topKey !== key){ try { history.replaceState(null, "", "#/" + t); } catch(e){} }
    topKey = key; return;
  }
  if (key === topKey && nav.top()){ nav.top().html(html); return; }
  const i = nav.find(key);
  if (i >= 0){ nav.popTo(i); if (nav.top()) nav.top().html(html); }
  else { nav.push(key, P=>{ P.setHeader(pushHeader(key)); P.html(html); }); if (location.hash !== "#/" + key){ try { location.hash = "#/" + key; } catch(e){} } }
  topKey = key;
}
addEventListener("hashchange", ()=>{
  if (!nav || nav.depth() < 2) return;
  const h = location.hash.replace(/^#\//, "");
  const top = nav.top(); if (!top || h === top.key) return;
  const popped = top.key; nav.pop(); syncAfterPop(popped);
  topKey = nav.depth() === 1 ? "root:" + nav.top().key : nav.top().key;
  render();
});
const view = { set innerHTML(h){ paint(h); }, get innerHTML(){ const P = nav && nav.top(); return P ? P.body.innerHTML : ""; },
  querySelector(s){ const P = nav && nav.top(); return P ? P.body.querySelector(s) : null; },
  querySelectorAll(s){ const P = nav && nav.top(); return P ? P.body.querySelectorAll(s) : []; } };
function topScroll(){ const P = nav && nav.top(); if (P) P.el.scrollTop = 0; else window.scrollTo(0, 0); }
function buildNav(){ if (nav) return; if (window.SK && SK.stack){ nav = SK.stack("#app", { lead: SK_LOGO, title: "NEC Code" }); } }
let DATA = { lookup:null, checklists:null, quiz:null, sharma:null, tables:null, book:null, bookLookup:null, bookQuiz:null, bookChecklists:null, bookSet:{}, v1lookup:[], v1quiz:[], v1checklists:[], v1sharma:[], books:[] };
const favs = new Set(JSON.parse(localStorage.getItem("nec-favs")||"[]"));
function saveFavs(){ localStorage.setItem("nec-favs", JSON.stringify([...favs])); }
const CONTENT_V = "14";
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
  const qz=e.target.closest("[data-quizjump]"); if(qz){ setTab("quiz"); if(bookState.page && bookState.chapter) startQuizSmart("ch"+bookState.chapter,0); else startQuizSmart("starter",0); render(); }
});
function keyNums(t){ const m=[...String(t.summary).matchAll(/(\d+(?:\.\d+)?\s?(?:ft|in|%|VA|A\b|AWG))/g)].map(x=>x[1].replace(/\s+/g," ").trim()); return [...new Set(m)].slice(0,4); }
function steps(t){ return String(t.summary).split(/(?<=\.)\s+/).filter(x=>x.trim()).slice(0,4); }

function favBtn(id){ return `<button class="favbtn${favs.has(id)?" on":""}" data-fav="${id}" title="Save">${favs.has(id)?"Saved":"Save"}</button>`; }
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-fav]"); if(!f) return;
  const id=f.dataset.fav; favs.has(id)?favs.delete(id):favs.add(id); saveFavs(); render();
});
function dgTheme(t){ return window.themeDiagram ? window.themeDiagram(t) : ""; }
function dgDiagram(id){ return window.diagram ? window.diagram(id) : ""; }
let __dgTries = 0;
function ensureDiagrams(){
  if (window.themeDiagram) return Promise.resolve();
  return new Promise(res=>{
    const s = document.createElement("script");
    s.src = "assets/diagrams.js?v=14";
    s.onload = ()=>res();
    s.onerror = ()=>{ if (++__dgTries < 2) setTimeout(()=>ensureDiagrams().then(res), 700); else res(); };
    document.head.appendChild(s);
  });
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

function render(){
  if(tab==="book"){ const ent=currentEntry(); if(ent&&ent._light){ ensureChapter(ent.book.chapter).then(()=>{ if(tab==="book") render(); }); view.innerHTML='<h2 class="sec">Learn</h2><div class="sk-skel" style="margin:14px"></div><div class="sk-skel" style="margin:14px"></div>'; return; } ensureV1(); }
  if(tab==="lookup"){ if(!allLoaded) ensureAllChapters().then(()=>{ if(allLoaded&&tab==="lookup") render(); }); ensureV1(); }
  if(tab==="rooms"){ if(!allLoaded) ensureAllChapters().then(()=>{ if(allLoaded&&tab==="rooms") render(); }); }
  if(tab==="quiz" && !quizState){ if(!allLoaded) ensureAllChapters().then(()=>{ if(allLoaded&&tab==="quiz"&&!quizState) render(); }); }
  if(tab==="home") return renderHome();
  if(tab==="book"){ if(window.renderBook) return window.renderBook(); ensureBook().then(()=>{ if(tab==="book") render(); }); view.innerHTML='<h2 class="sec">Learn</h2><div class="sk-skel" style="margin:14px"></div><div class="sk-skel" style="margin:14px"></div>'; return; }
  if(tab==="lookup") return renderLookup();
  if(tab==="calc") return renderCalc();
  if(tab==="rooms") return renderRooms();
  if(tab==="quiz") return renderQuiz();
  if(tab==="sharma") return renderSharma();
}
/* ---------- Home: education-first start page ---------- */
const CH_SUB = {1:"The rules that apply to every job",2:"Services, feeders, grounding and breakers",3:"Cable, conduit, boxes and wire",4:"Switches, receptacles, lights and equipment",5:"Hazardous places, health care and assembly",6:"Pools, solar, EVs, signs and special gear",7:"Generators, emergency systems and fire alarm",8:"Low voltage, data and antennas",9:"The tables you use every day"};
function allBookSections(){ const out=[]; for(const e of bookEntries()) for(const s of e.book.sections) out.push(s); return out; }
function chProgress(e){ const secs=e.book.sections||[]; const done=secs.filter(s=>learned.has(s.id)).length; return {done:done, total:secs.length, pct:secs.length?Math.round(100*done/secs.length):0}; }
document.addEventListener("click",e=>{
  const gq=e.target.closest("[data-gotoquiz]"); if(gq){ setTab("quiz"); startQuizSmart(gq.dataset.gotoquiz,0); render(); topScroll(); return; }
  const g=e.target.closest("[data-goto]"); if(!g) return;
  if(g.dataset.goto==="favs"){ setTab("home"); render(); setTimeout(()=>{ const el=document.getElementById("savedSec"); if(el) el.scrollIntoView({block:"start"}); },90); return; }
  setTab(g.dataset.goto); render(); topScroll();
});
const BANNER_HTML = '<div class="banner">DRAFT — not cleared for field use. Mike Holt has not signed off on this content. Confirm every answer against the printed NEC 2020 (Florida Building Code, 8th Edition) and your AHJ before you build to it.</div><div class="learnstrip">Read a lesson. Answer a question. Use it on the job.</div>';
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
    continueCard=`<div class="card hero-continue"><div class="cite">All lessons done</div><h3>You have worked through every lesson</h3><p>Keep sharp with the Practice quizzes, or look anything up any time.</p><button class="go" data-goto="quiz">Practice now →</button></div>`;
  }
  view.innerHTML =
  BANNER_HTML +
  `<div class="hero"><h2>Learn the NEC, one lesson at a time</h2><p>No code-book language to fight through. Every lesson is in plain words, in order, with the NEC section on it so you can check the real book.</p>
   <div class="howsteps"><span><b>1</b> Read a lesson</span><span><b>2</b> Answer a question</span><span><b>3</b> Use it on the job</span></div></div>` +
  (totalLessons? `<div class="progresswrap"><div class="plabel">Your learning progress: ${doneCount} of ${totalLessons} lessons</div><div class="pbar"><div style="width:${pct}%"></div></div></div>`:"") +
  continueCard +
  `<h2 class="sec">Your learning path — Chapters 1 to 9, in order</h2><p class="bkmeta">Tap a chapter to open its lessons. Work top to bottom, or jump to the chapter you need today — your checkmarks are saved on this phone.</p>` +
  bookEntries().map(e=>{ const pr=chProgress(e); return `<button class="pathcard" data-bookchapter="${e.book.chapter}"><span class="pathnum">${e.book.chapter}</span><span class="pathbody"><b>Chapter ${e.book.chapter} — ${esc(e.book.chapter_title)}</b><i>${esc(CH_SUB[e.book.chapter]||"")}</i><small>${pr.total} lessons · ${e._light?e._quizCount:(e.quiz||[]).length} practice questions${pr.done?` · ${pr.done} learned`:""}</small><span class="pbar mini"><span style="width:${pr.pct}%"></span></span></span><span class="pathgo">›</span></button>`; }).join("") +
  `<h2 class="sec">Quick ways in</h2><div class="tiles">
     <button class="tile" data-goto="lookup"><b>Start Here</b><span>The 15 essential lessons, with pictures</span></button>
     <button class="tile" data-goto="quiz"><b>Practice</b><span>Quiz yourself — 80% to pass</span></button>
     <button class="tile" data-goto="calc"><b>Tools</b><span>Box fill, conduit fill, voltage drop, load calc</span></button>
     <button class="tile" data-goto="rooms"><b>Room Checklists</b><span>Room by room, before the inspector comes</span></button>
     <button class="tile" data-goto="sharma"><b>Sharma Rules</b><span>How Sharma does it — stricter than code</span></button>
     <button class="tile" data-goto="favs"><b>Saved</b><span>The lessons and rules you bookmarked</span></button>
   </div>
   <div class="card"><div class="cite">Just need one answer?</div><h3>Use Look Up</h3><p>Type what you are looking for in the search box at the top — it searches every lesson, every quick answer and every quiz question in the app at once.</p><button class="go" data-goto="lookup">Go to Look Up →</button></div>` + `<h2 class="sec" id="savedSec">Saved</h2>` + favsHTML();
}
/* ---------- Lookup ---------- */
function topicCard(t, ix){
  const kn = keyNums(t);
  const st = steps(t);
  const done = learned.has(t.id);
  return `<div class="card">${favBtn("t:"+t.id)}<div class="cite">${typeof ix==="number"?`<span class="num-badge">${ix+1}</span>`:""}${esc(t.cite)}</div><h3>${esc(t.title)}</h3>${dgDiagram(t.id)}${kn.length?`<div class="keynums">${kn.map(k=>`<span class="keynum">${esc(k)}</span>`).join("")}</div>`:""}<ul class="steps">${st.map((x,i)=>`<li><b>Step ${i+1}.</b> ${esc(x)}</li>`).join("")}</ul>${t.flag?`<span class="flag">${esc(t.flag)}</span>`:""}<div class="rowbtns"><button class="learnbtn ${done?"done":""}" data-learn="${t.id}">${done?"Learned":"Mark as learned"}</button><button class="quizbtn" data-quizjump="1">Quiz me →</button></div></div>`;
}
function lookupCard(ch, x){
  return `<div class="card" id="lk-${esc(x.id)}"${lookupState.highlight===x.id?` style="outline:3px solid #0058a3"`:``}><div class="cite">Ch. ${ch} · ${esc(x.nec_ref||"")} · ${esc(x.id)}</div><h3>${esc(x.question)}</h3>${dgTheme(x.question+" "+x.answer_plain)}<p>${esc(x.answer_plain)}</p>${x.verified===false?`<span class="flag">UNVERIFIED${x.unverified_reason? " — "+esc(x.unverified_reason):""}</span>`:""}${x.sharma_rule_id?`<span class="tag">SHARMA ${esc(x.sharma_rule_id)}</span>`:""}</div>`;
}
function renderLookup(){
  const q=($("#search").value||"").toLowerCase().trim();
  const topics=(DATA.lookup&&DATA.lookup.topics)||[];
  if(q){
    const tlist=topics.filter(t=>(t.title+" "+t.cite+" "+t.summary).toLowerCase().includes(q));
    const bank=chapterLookupAll().filter(({item:x})=>(x.id+" "+x.question+" "+x.answer_plain+" "+(x.nec_ref||"")+" "+(x.aliases||[]).join(" ")).toLowerCase().includes(q));
    const v1=(DATA.v1lookup||[]).filter(x=>(x.id+" "+x.question+" "+x.answer_plain+" "+(x.nec_ref||"")+" "+(x.aliases||[]).join(" ")).toLowerCase().includes(q));
    const pages=[]; for(const e of bookEntries()) for(const s of e.book.sections) if((s.id+" "+s.section+" "+s.title+" "+s.plain_explanation).toLowerCase().includes(q)) pages.push(s);
    const quizzes=[]; for(const e of bookEntries()) for(const x of (e.quiz||[])) if((x.id+" "+x.question+" "+(x.explain_plain||"")+" "+(x.nec_ref||"")).toLowerCase().includes(q)) quizzes.push({ch:e.book.chapter, item:x});
    const rules=((DATA.sharma&&DATA.sharma.rules)||[]).filter(r=>(r.id+" "+r.title+" "+r.text).toLowerCase().includes(q));
    view.innerHTML = `<h2 class="sec">Search results</h2>` +
      (tlist.length? `<h2 class="sec">Learn-the-code topics</h2>`+tlist.map(t=>topicCard(t)).join(""):"") +
      (bank.length? `<h2 class="sec">Field Book lookup (${bank.length})</h2>`+bank.slice(0,120).map(({ch,item})=>lookupCard(ch,item)).join("")+(bank.length>120?`<p class="flag">Showing the first 120 matches — narrow the search to see more.</p>`:""):"") +
      (v1.length? `<h2 class="sec">Field Book v1 lookup (${v1.length})</h2>`+v1.slice(0,60).map(x=>`<div class="card"><div class="cite">${esc(x.id)} · ${esc(x.nec_ref||"")}</div><h3>${esc(x.question)}</h3>${dgTheme(x.question+" "+x.answer_plain)}<p>${esc(x.answer_plain)}</p></div>`).join(""):"") +
      (pages.length? `<h2 class="sec">Field Book pages (${pages.length})</h2><div class="card">${pages.slice(0,60).map(s=>`<button class="bkchip" data-bookpage="${s.id}">${esc(s.id.replace(/^C\d+-/,""))} — ${esc(s.title)}</button>`).join(" ")}</div>`:"") +
      (quizzes.length? `<h2 class="sec">Practice questions (${quizzes.length})</h2><div class="card">${quizzes.slice(0,40).map(({item})=>`<button class="bkchip" data-reljump="quiz:${item.id}">${esc(item.id)} — ${esc(item.question)}</button>`).join(" ")}</div>`:"") +
      (rules.length? `<h2 class="sec">Sharma rules</h2>`+rules.map(r=>`<div class="card"><span class="tag">${esc(r.id)}</span><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p>${r.status?`<span class="flag">${esc(r.status)}</span>`:""}</div>`).join(""):"") +
      (!tlist.length&&!bank.length&&!v1.length&&!pages.length&&!quizzes.length&&!rules.length? `<div class="empty">No matches. Try a topic name or an article number.</div>`:"");
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
  view.innerHTML = `<h2 class="sec">Sharma Rules — how we do it</h2><p class="bkmeta">The code is the floor. These are Sharma's own rules on top of it — when a Sharma rule and the code differ, follow the stricter one and ask your foreman if you are not sure. The id on each card is the same id the Field Book uses.</p>` + (rules.length? rules.map(r=>
    `<div class="card">${favBtn("s:"+r.id)}<span class="tag">${esc(r.id)}</span><h3 style="margin-top:6px">${esc(r.title)}</h3><p>${esc(r.text)}</p>${r.status?`<span class="flag">${esc(r.status)}</span>`:""}</div>`).join("")
    : `<div class="empty">Sharma rules file not loaded yet.</div>`);
}
/* ---------- Favorites ---------- */
function favsHTML(){
  const topics=(DATA.lookup&&DATA.lookup.topics)||[]; const rules=(DATA.sharma&&DATA.sharma.rules)||[];
  let html="";
  const ft=topics.filter(t=>favs.has("t:"+t.id)); const fr=rules.filter(r=>favs.has("s:"+r.id));
  if(!ft.length&&!fr.length) html+=`<div class="empty">Tap Save on any topic or Sharma rule to save it here.</div>`;
  html+=ft.map(topicCard).join("");
  html+=fr.map(r=>`<div class="card">${favBtn("s:"+r.id)}<span class="tag">SHARMA RULE</span><h3 style="margin-top:6px">${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join("");
  return html;
}
function renderFavs(){ view.innerHTML = `<h2 class="sec">Saved</h2>` + favsHTML(); }
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
  if(s.i>=qs.length){ view.innerHTML=`<div class="card"><div class="score">Score: ${s.score} / ${qs.length} (${Math.round(100*s.score/qs.length)}%)<br>${100*s.score/qs.length>=80?"<span class=\"ok-t\">Pass</span>":"<span class=\"no-t\">Below the 80% pass mark — run it again"}</div><div class="rowbtns"><button class="go" id="qrestart">Restart this bank</button><button class="quizbtn" id="qbank">Change bank</button></div></div>`;
    $("#qrestart").onclick=()=>{ startQuiz(s.bank,0); renderQuiz(); };
    $("#qbank").onclick=()=>{ quizState=null; renderQuiz(); }; return; }
  const q=qs[s.i];
  view.innerHTML=`<h2 class="sec">Practice — question ${s.i+1} of ${qs.length}</h2><div class="card"><h3>${esc(q.q)}</h3>${dgTheme(q.q+" "+(q.why||""))}`+
    q.choices.map((c,ix)=>`<button class="qopt" data-q="${ix}">${esc(c)}</button>`).join("")+
    `<div id="qwhy"></div></div>`;
  view.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{
    if(s.answered) return; s.answered=true;
    const pick=+b.dataset.q;
    view.querySelectorAll("[data-q]").forEach(x=>{ const ix=+x.dataset.q;
      if(ix===q.answer) x.classList.add("right"); else if(ix===pick) x.classList.add("wrong"); });
    if(pick===q.answer) s.score++;
    $("#qwhy").innerHTML=`<div class="why">${pick===q.answer?"<b class=\"ok-t\">Correct.</b> ":"<b class=\"no-t\">Not quite.</b> "}${esc(q.why)} <b>(${esc(q.cite)})</b></div><button class="go" id="qnext">${s.i+1>=qs.length?"See score":"Next question"}</button>`;
    $("#qnext").onclick=()=>{ s.i++; s.answered=false; renderQuiz(); };
  });
}
/* ---------- Calculators ---------- */
function num(id){ const v=parseFloat($(id).value); return isNaN(v)?0:v; }
function sel(id){ return $(id).value; }
function renderCalc(){
  const T=DATA.tables||window.FALLBACK_TABLES; if(!T){ view.innerHTML=`<h2 class="sec">Tools — calculators for the job</h2><div class="sk-skel" style="margin:14px"></div>`; ensureDiagrams().then(()=>{ if(tab==="calc") render(); }); return; }
  const awgs=Object.keys(T.circularMils);
  const opts=(arr,v)=>arr.map(a=>`<option ${a===v?"selected":""}>${a}</option>`).join("");
  const emtSizes=Object.keys((T.conduitFillEMT||T.conduitAreas40pct.EMT));
  const matOpts=`<option value="copper">Copper</option><option value="aluminum">Aluminum</option><option value="cca">Copper-clad aluminum (CCA)</option>`;
  view.innerHTML=`
  <h2 class="sec">Tools — calculators for the job</h2>
  <p class="bkmeta">EMT fill here covers 1/2 in through 2 in, THHN through 2 AWG. Ampacity is the Table 310.16 temperature column only — no ambient correction and no adjustment for more than three current-carrying conductors. Box fill and conduit fill do not change with copper, aluminum, or CCA; the metal only changes the size you already chose.</p>
  <div class="tiles"><button class="tile" data-goto="rooms"><b>Room Checklists</b><span>Check a room before inspection</span></button><button class="tile" data-goto="sharma"><b>Sharma Rules</b><span>Stricter than code — our way</span></button></div>
  <div class="card"><h3>Box fill <span class="cite">314.16</span></h3>
    <label class="f">Wire size (AWG) — one size for every conductor in this count, including the largest ground</label><select class="n" id="bf-awg">${opts(["14","12","10","8","6"],"12")}</select>
    <label class="f">Conductors entering the box (count each insulated conductor; do NOT count grounds here — use the grounds field)</label><input class="n" id="bf-cond" type="number" value="6" min="0">
    <label class="f">Devices (switches / receptacles)</label><input class="n" id="bf-dev" type="number" value="1" min="0">
    <label class="f">Internal cable clamps?</label><select class="n" id="bf-clamp"><option value="0">No / external</option><option value="1">Yes (counts as 1)</option></select>
    <label class="f">Equipment grounding conductors entering the box (count) — 2020 rule 314.16(B)(5): the first four together take ONE allowance; each ground past four adds a QUARTER allowance</label><input class="n" id="bf-egc" type="number" value="2" min="0">
    <label class="f">Box volume (cu in — printed inside the box)</label><input class="n" id="bf-box" type="number" value="22.5" step="0.5">
    <button class="go" id="bf-go">Calculate box fill</button><div id="bf-out"></div></div>
  <div class="card"><h3>Conduit fill <span class="cite">Ch. 9 Tables 1, 4, 5</span></h3>
    <p class="bkmeta">EMT only, 1/2 in through 2 in, THHN/THWN through 2 AWG. Copper, aluminum, and CCA use the same area.</p>
    <label class="f">Conduit (EMT)</label><select class="n" id="cf-size">${opts(emtSizes,"3/4")}</select>
    <label class="f">Wire size (THHN)</label><select class="n" id="cf-awg">${opts(Object.keys(T.conductorAreasTHHN),"12")}</select>
    <label class="f">How many conductors (grounds count too)</label><input class="n" id="cf-n" type="number" value="3" min="1">
    <button class="go" id="cf-go">Calculate conduit fill</button><div id="cf-out"></div></div>
  <div class="card"><h3>Voltage drop <span class="cite">210.19 / 215.2 notes · Ch. 9 Table 8</span></h3>
    <label class="f">Material</label><select class="n" id="vd-mat">${matOpts}</select>
    <label class="f">Wire size (AWG)</label><select class="n" id="vd-awg">${opts(awgs,"12")}</select>
    <label class="f">Load (amps)</label><input class="n" id="vd-i" type="number" value="16" step="0.5">
    <label class="f">One-way length (ft)</label><input class="n" id="vd-l" type="number" value="75">
    <label class="f">Circuit voltage</label><input class="n" id="vd-v" type="number" value="120">
    <label class="f">System</label><select class="n" id="vd-ph"><option value="1">Single-phase</option><option value="3">Three-phase</option></select>
    <button class="go" id="vd-go">Calculate voltage drop</button><div id="vd-out"></div></div>
  <div class="card"><h3>Wire ampacity <span class="cite">Table 310.16 · 240.4(D) · 334.80 · 110.14(C)</span></h3>
    <p class="bkmeta">75°C column, 30°C ambient, not more than three current-carrying conductors. No bundling adjustment and no ambient correction in this tool.</p>
    <label class="f">Material</label><select class="n" id="am-mat">${matOpts}</select>
    <label class="f">Wire size (AWG)</label><select class="n" id="am-awg">${opts(Object.keys(T.ampacity75C.copper),"12")}</select>
    <button class="go" id="am-go">Look up ampacity</button><div id="am-out"></div></div>
  <div class="card"><h3>Residential load calc <span class="cite">220.82 optional method</span></h3>
    <p class="bkmeta">For a dwelling on one 120/240 V or 120/208 V service or feeder of 100 A or more. Fixed-appliance nameplates go inside the 10 kVA demand split. Heating and cooling are not added together.</p>
    <label class="f">Living area (sq ft) — outside dimensions, not porches, garages, or unused space</label><input class="n" id="lc-sf" type="number" value="1800">
    <label class="f">Small-appliance branch circuits (1,500 VA each)</label><input class="n" id="lc-sa" type="number" value="2" min="0">
    <label class="f">Laundry branch circuits (1,500 VA each)</label><input class="n" id="lc-ld" type="number" value="1" min="0">
    <label class="f">Fastened appliance nameplates (VA) — range, dryer, water heater, and other fastened loads. These sit inside the 10 kVA / 40% split.</label><input class="n" id="lc-app" type="number" value="12000">
    <label class="f">Heating type for 220.82(C)</label><select class="n" id="lc-mode">
      <option value="space-lt4" selected>Electric space heat, fewer than 4 separately controlled units (65%)</option>
      <option value="space-4">Electric space heat, 4 or more separately controlled units (40%)</option>
      <option value="hp">Heat pump, no supplemental heat (100%)</option>
      <option value="hp-strips">Heat pump plus strips that can run together (100% compressor + 65% strips)</option>
      <option value="none">No electric heat</option>
    </select>
    <label class="f">Heat or heat-pump compressor (VA)</label><input class="n" id="lc-heat" type="number" value="10000">
    <label class="f">Supplemental strips (VA) — used only for heat pump plus strips</label><input class="n" id="lc-strips" type="number" value="0">
    <label class="f">Air conditioning / cooling nameplate (VA), counted at 100%</label><input class="n" id="lc-ac" type="number" value="7200">
    <button class="go" id="lc-go">Calculate service load</button><div id="lc-out"></div></div>`;
  $("#bf-go").onclick=()=>{ const per=T.boxFillVolumePerConductor[sel("#bf-awg")];
    const egcN=num("#bf-egc"); const egcF= egcN===0?0 : egcN<=4?1 : 1+0.25*(egcN-4);
    const total=per*(num("#bf-cond")+2*num("#bf-dev")+num("#bf-clamp")+egcF);
    const box=num("#bf-box");
    $("#bf-out").innerHTML=`<div class="result" id="bf-result">Required volume: <b>${total.toFixed(2)} cu in</b> (grounds allowance: ${egcF} × ${per} cu in)<br>Box volume: <b>${box} cu in</b> → ${total<=box?"<b class=\"ok-t\">FITS</b>":"<b class=\"no-t\">TOO SMALL</b> — use a bigger box or a box extension"}<br><span class="flag">Copper, aluminum, and CCA do not change this volume — 314.16 charges the AWG, not the metal. This count assumes every conductor and the largest ground are the size selected. A smaller ground, a mixed size, or a fixture stud or hickey (one allowance each) is not in this number.</span></div>`; };
  $("#cf-go").onclick=()=>{
    const size=sel("#cf-size"), each=T.conductorAreasTHHN[sel("#cf-awg")], n=num("#cf-n");
    const row=(T.conduitFillEMT||{})[size] || {p40:T.conduitAreas40pct.EMT[size]};
    const p40=row.p40, p53=row.p53!=null?row.p53:row.p40/0.40*0.53, p31=row.p31!=null?row.p31:row.p40/0.40*0.31;
    const allow = n<=1 ? p53 : n===2 ? p31 : p40;
    const pct = n<=1 ? 53 : n===2 ? 31 : 40;
    const used=each*n;
    const note7=allowArea=>{ const raw=allowArea/each; const base=Math.floor(raw+1e-9); const frac=raw-base; return {raw, maxN: frac>=0.8-1e-6 ? base+1 : base}; };
    const here=note7(allow), at40=note7(p40);
    const fits = n<=here.maxN;
    const note = (fits && used>allow+1e-6) ? `<br>Chapter 9 Note 7 permits this count: the remainder is 0.8 or more, so the next whole number is allowed.` : "";
    $("#cf-out").innerHTML=`<div class="result" id="cf-result">Conductors take <b>${used.toFixed(3)} sq in</b>. Allowed at ${pct}% (Chapter 9, Table 1): <b>${allow.toFixed(3)} sq in</b> → ${fits?"<b class=\"ok-t\">FITS</b>":"<b class=\"no-t\">OVERFILLED</b> — upsize the conduit"}${note}<br>Note 7 maximum of this size at ${pct}%: <b>${here.maxN}</b>. At 40% (three or more conductors): <b>${at40.maxN}</b>.<br><span class="flag">Same area for copper, aluminum, or CCA. Nipples 24 in or shorter may use 60% fill (Table 1, Note 4), and that note also skips the 310.15(C)(1) adjustment — this tool does not apply the 60% figure. EMT 1/2 in through 2 in, THHN through 2 AWG only.</span></div>`; };
  $("#vd-go").onclick=()=>{ const mat=sel("#vd-mat"), start=sel("#vd-awg"), I=num("#vd-i"), L=num("#vd-l"), V=num("#vd-v");
    if(mat==="cca"){
      $("#vd-out").innerHTML=`<div class="result" id="vd-result"><b>No voltage drop is computed for copper-clad aluminum.</b><br>Chapter 9, Table 8 lists DC resistance for copper and for aluminum. It has no copper-clad aluminum value, and this app has no cited 75°C CCA resistance from a manufacturer or a standard. A number is not invented here. Do not use the copper column for a CCA run.</div>`;
      return;
    }
    const f= sel("#vd-ph")==="3"? 1.732 : 2;
    const R8=(T.table8Resistance||{})[mat]||{};
    const dropFor=a=>{ const R=R8[a]; if(R) return f*L*I*R/1000; const K=mat==="copper"?12.9:21.2; return f*K*I*L/T.circularMils[a]; };
    const vd=dropFor(start); const pct=100*vd/V;
    let size=start;
    const bySize=[...awgs].sort((x,y)=>T.circularMils[x]-T.circularMils[y]);
    for(const a of bySize){ if(R8[a] && 100*dropFor(a)/V<=3){ size=a; break; } }
    const basis= R8[start]? `Chapter 9, Table 8, stranded uncoated, 75°C (${R8[start]} Ω per 1,000 ft)` : "approximate K (12.9 copper, 21.2 aluminum) because no Table 8 value is loaded for this size";
    const rec = pct<=3 ? "Within the 3% recommendation in the informational notes to 210.19 and 215.2. That note is not an NEC maximum." : `Above the 3% recommendation in the informational notes to 210.19 and 215.2 (not an NEC maximum). Smallest loaded size at or under 3% on this run: <b>${size} AWG</b>.`;
    $("#vd-out").innerHTML=`<div class="result" id="vd-result">Voltage drop: <b>${vd.toFixed(2)} V (${pct.toFixed(1)}%)</b> — ${basis}<br>${rec}<br><span class="flag">Table 8 here is DC resistance, not the Table 9 impedance used for a long large feeder. Florida commercial work: FBC Energy Conservation C405.5.3 sizes feeders and branch circuits together for 5% total drop. Solid wire is slightly lower resistance than this stranded value.</span></div>`; };
  $("#am-go").onclick=()=>{ const mat=sel("#am-mat"), a=sel("#am-awg");
    const key = mat==="copper" ? "copper" : "aluminum";
    const label = mat==="cca" ? "copper-clad aluminum (CCA)" : mat;
    const amp=T.ampacity75C[key][a];
    const amp60=(T.ampacity60C&&T.ampacity60C[key]||{})[a];
    const cap=(T.smallConductorCaps[key]||{})[a];
    if(!amp){ $("#am-out").innerHTML=`<div class="result" id="am-result">No 75°C Table 310.16 value for ${a} AWG ${label}. 14 AWG aluminum and 14 AWG CCA are not in that column.</div>`; return; }
    const cca = mat==="cca" ? `<br>Copper-clad aluminum uses the <b>aluminum column</b> of Table 310.16. The table has no CCA column. 240.4(D) applies the aluminum small-conductor caps to CCA.` : "";
    const col60 = amp60 ? `<br>60°C column: <b>${amp60}A</b>. Under 110.14(C), equipment 100A or less, and terminations on 14 AWG through 1 AWG, use the 60°C column unless the termination is marked for 75°C.` : "";
    const nm = amp60 ? `<br>334.80: NM cable's final ampacity cannot exceed the 60°C column (${amp60}A), even when the conductors are rated 90°C.` : "";
    const capLine = cap ? `<br>240.4(D) small-conductor cap: breaker not over <b>${cap}A</b>.` : `<br>240.4(D) does not cap this size.`;
    $("#am-out").innerHTML=`<div class="result" id="am-result"><b>${a} AWG ${label}</b> — Table 310.16, 75°C column: <b>${amp}A</b> (30°C ambient, not more than three current-carrying conductors).${cca}${col60}${nm}${capLine}<br><span class="flag">This tool does not apply ambient correction or the 310.15(C)(1) adjustment for more than three current-carrying conductors.</span></div>`; };
  $("#lc-go").onclick=()=>{
    const sf=num("#lc-sf"), appVA=num("#lc-app"), heat=num("#lc-heat"), strips=num("#lc-strips"), ac=num("#lc-ac");
    const sa=1500*num("#lc-sa"), ld=1500*num("#lc-ld"), light=3*sf;
    const general=light+sa+ld+appVA;
    const demand=Math.min(general,10000)+0.4*Math.max(general-10000,0);
    const mode=sel("#lc-mode");
    let heatVA=0, heatWhy="No electric heat counted";
    if(mode==="space-lt4"){ heatVA=0.65*heat; heatWhy="Electric space heat, fewer than 4 separately controlled units, at 65%"; }
    else if(mode==="space-4"){ heatVA=0.40*heat; heatWhy="Electric space heat, 4 or more separately controlled units, at 40%"; }
    else if(mode==="hp"){ heatVA=heat; heatWhy="Heat pump with no supplemental heat, at 100%"; }
    else if(mode==="hp-strips"){ heatVA=heat+0.65*strips; heatWhy="Heat-pump compressor at 100% plus supplemental strips at 65%"; }
    const hvac=Math.max(heatVA, ac);
    const hvacWhy = heatVA>=ac ? heatWhy : "Air conditioning at 100%";
    const total=demand+hvac, amps=total/240;
    const svc=[100,110,125,150,175,200,225,250,300,350,400].find(s=>s>=amps)||">400";
    const fmt=n=>Math.round(n).toLocaleString();
    $("#lc-out").innerHTML=`<div class="result" id="lc-result">Lighting, 3 VA/sq ft: <b>${fmt(light)} VA</b><br>Small-appliance + laundry: <b>${fmt(sa+ld)} VA</b><br>Fastened appliances: <b>${fmt(appVA)} VA</b><br>General load before demand: <b>${fmt(general)} VA</b><br>220.82(B): first 10 kVA at 100% and the remainder at 40%: <b>${fmt(demand)} VA</b><br>220.82(C), larger of heat and cooling — ${hvacWhy}: <b>${fmt(hvac)} VA</b> (heat side ${fmt(heatVA)} VA, cooling ${fmt(ac)} VA; they are not added)<br>Total: <b>${fmt(total)} VA = ${amps.toFixed(1)} A at 240 V</b><br>Next standard size in this list: <b>${svc} A</b><br><span class="flag">Optional method only, for a dwelling on one 120/240 V or 120/208 V set of conductors rated 100 A or more. The other 220.82(C) choices (thermal storage, and a controller that keeps the compressor and the strips from running together) are not separate buttons — pick the matching type above. Confirm against the printed section before the service is ordered.</span></div>`; };
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
let __bookPromise = null;
function ensureBook(){
  if (window.renderBook) return Promise.resolve();
  if (__bookPromise) return __bookPromise;
  __bookPromise = new Promise(res=>{ const s = document.createElement("script"); s.src = "assets/book.js?v=14"; s.onload = ()=>res(); s.onerror = ()=>{ __bookPromise = null; res(); }; document.head.appendChild(s); });
  return __bookPromise;
}
/* ---------- boot ---------- */
const CHAP_DEFS = [
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
const chapPromises = {};
let allLoaded = false, allChaptersPromise = null, v1Promise = null;
function lightEntry(ix){ return { book:{ chapter:ix.chapter, chapter_title:ix.chapter_title, nec_edition:ix.nec_edition||"", jurisdiction:ix.jurisdiction||"", sections:(ix.sections||[]).map(s=>({ id:s.id, title:s.title, section:s.section||"", chapter:s.chapter||ix.chapter, plain_explanation:"", on_the_job:"" })) }, lookup:[], quiz:[], checklists:[], _light:true, _quizCount:ix.quizCount||0, _ckCount:ix.ckCount||0 }; }
function ensureChapter(n){
  if (chapPromises[n]) return chapPromises[n];
  const d = CHAP_DEFS[n-1]; if (!d) return Promise.resolve();
  chapPromises[n] = Promise.all([loadJSON(d.book), loadJSON(d.lookup), loadJSON(d.quiz), loadJSON(d.checklists)]).then(([bk,bl,bq,bc])=>{
    if (bk && bk.sections){ const i = DATA.books.findIndex(e=>e.book.chapter===n); if (i>=0) DATA.books[i] = { book:bk, lookup:bl||[], quiz:bq||[], checklists:bc||[] }; }
  });
  return chapPromises[n];
}
function ensureAllChapters(){ if (!allChaptersPromise) allChaptersPromise = Promise.all([1,2,3,4,5,6,7,8,9].map(ensureChapter)).then(()=>{ allLoaded = true; }); return allChaptersPromise; }
function ensureV1(){ if (!v1Promise) v1Promise = Promise.all([loadJSON("v1/lookup"), loadJSON("v1/quiz"), loadJSON("v1/checklists"), loadJSON("v1/sharma-rules")]).then(([a,b,c,d])=>{ DATA.v1lookup=a||[]; DATA.v1quiz=b||[]; DATA.v1checklists=c||[]; DATA.v1sharma=d||[]; }); return v1Promise; }
function startQuizSmart(bank, idx){
  const need = bank==="all" ? ensureAllChapters() : (bank.indexOf("ch")===0 ? ensureChapter(parseInt(bank.slice(2),10)) : Promise.resolve());
  need.then(()=>{ startQuiz(bank, idx); render(); });
}
(async()=>{
  const [l,c,q,s,t,ix] = await Promise.all([loadJSON("lookup"),loadJSON("checklists"),loadJSON("quiz"),loadJSON("sharma-rules"),loadJSON("calc-tables"),loadJSON("book-index")]);
  const books = (ix||[]).map(lightEntry);
  books.sort((a,b)=>a.book.chapter-b.book.chapter);
  const first = books[0]||null;
  DATA = { lookup:l, checklists:c, quiz:q, sharma:s, tables:t||null, books:books, v1lookup:[], v1quiz:[], v1checklists:[], v1sharma:[],
        book:first?first.book:null, bookLookup:[], bookQuiz:[], bookChecklists:[] };
  buildNav();
  render();
  ensureDiagrams();
  setTimeout(()=>{ ensureBook(); }, 600);
  if (document.readyState !== "complete") addEventListener("load", ()=>{ buildNav(); render(); });
})();
