/* NEC Field Book engine — split out of app.js for the 15 KB gz script diet
   (Steve review 2026-11-19). Loaded on demand by app.js ensureBook();
   content and behaviour unchanged. */
"use strict";
const CHIP_ALIAS = {"220.82":"C2-220.82","310.16":"C3-310.16","314.16(A)":"C3-314.16","314.16(B)":"C3-314.16(B)","334.80":"C3-334.80","300.4":"C3-300.4","Ch9-T4":"C9-Table4","Ch9-T5":"C9-Table5","Ch9-T8":"C9-Table8"};
function relChip(id){
  const target = CHIP_ALIAS[id] || id;
  const sec = bookSection(target);
  if(sec) return `<button class="bkchip" data-bookpage="${target}">${esc(id)} — ${esc(sec.title)}</button>`;
  const label = relatedLabel(id);
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
  const ch=e.target.closest("[data-bookchapter]"); if(ch){ bookState={chapter:parseInt(ch.dataset.bookchapter,10), page:null, view:"toc"}; if(tab!=="book"){ tab="book"; document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab==="book")); } render(); topScroll(); return; }
  const p=e.target.closest("[data-bookpage]"); if(p){ const s=bookSection(p.dataset.bookpage); if(s) bookState.chapter=s.chapter; bookState={chapter:bookState.chapter, page:p.dataset.bookpage, view:"page"}; if(tab!=="book"){ tab="book"; document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.tab==="book")); } render(); topScroll(); return; }
  const v=e.target.closest("[data-bookview]"); if(v){ bookState.view=v.dataset.bookview; if(v.dataset.bookview!=="page") bookState.page=null; render(); topScroll(); return; }
  const rj=e.target.closest("[data-reljump]"); if(rj){ const [kind,id]=rj.dataset.reljump.split(":");
    if(kind==="lookup"){ const hit=chapterLookupItem(id); lookupState={chapter:hit?hit.ch:null, highlight:id}; $("#search").value=""; setTab("lookup"); render(); setTimeout(()=>{ const el=document.getElementById("lk-"+id); if(el) el.scrollIntoView({block:"center"}); },60); return; }
    if(kind==="quiz"){ const hit=chapterQuizItem(id); if(hit){ setTab("quiz"); startQuizSmart("ch"+hit.ch, hit.index); render(); } return; }
    if(kind==="rooms"){ roomsHighlight=id; setTab("rooms"); render(); setTimeout(()=>{ const el=document.getElementById("ck-"+id); if(el) el.scrollIntoView({block:"center"}); },60); return; }
    if(kind==="v1"){ v1Overlay=id; if(tab!=="book") setTab("book"); render(); topScroll(); return; }
  }
  const lc=e.target.closest("[data-lookupch]"); if(lc){ const n=parseInt(lc.dataset.lookupch,10); lookupState={chapter:lookupState.chapter===n?null:n, highlight:null}; render(); return; }
  const qb=e.target.closest("[data-quizbank]"); if(qb){ startQuizSmart(qb.dataset.quizbank,0); render(); return; }
  const vb=e.target.closest("[data-v1back]"); if(vb){ v1Overlay=null; render(); topScroll(); return; }
});
function renderBook(){
  if(v1Overlay){
    const id=v1Overlay; let body="";
    const lk=v1Lookup(id), qz=v1Quiz(id), ck=v1Checklist(id), sh=v1Sharma(id);
    if(lk) body=`<div class="cite">${esc(id)} · Field Book v1 lookup · ${esc(lk.nec_ref||"")}</div><h3>${esc(lk.question)}</h3>${dgTheme(lk.question+" "+lk.answer_plain)}<p>${esc(lk.answer_plain)}</p>${lk.verified_by?`<span class="flag">Verified by ${esc(lk.verified_by)}${lk.verified_date? " · "+esc(lk.verified_date):""}</span>`:""}`;
    else if(qz) body=`<div class="cite">${esc(id)} · Field Book v1 quiz · ${esc(qz.nec_ref||"")}</div><h3>${esc(qz.question)}</h3>${dgTheme(qz.question+" "+qz.explain_plain)}<ul class="steps">${qz.choices.map((c,ix)=>`<li>${ix===qz.answer_index? '<b><svg class="sk-icon sk-ck"><use href="#i-check"/></svg> '+esc(c)+"</b>" : esc(c)}</li>`).join("")}</ul><p>${esc(qz.explain_plain)}</p>`;
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
    `<div class="rowbtns"><button class="quizbtn" data-bookview="toc">Lessons in this chapter</button><button class="quizbtn" data-bookview="index">A–Z Index</button><button class="quizbtn" data-goto="home">All chapters</button></div>`+
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
      ${s.verified? `<span class="tag">VERIFIED</span>` : `<span class="flag">UNVERIFIED${s.unverified_reason? " — "+esc(s.unverified_reason):""}</span>`}
      <h4>In plain words</h4>
      ${dgTheme(s.title+" "+s.plain_explanation+" "+(s.figure_idea||""))}
      <p>${esc(s.plain_explanation)}</p>
      ${s.on_the_job? `<h4>What it means on the job</h4><p>${esc(s.on_the_job)}</p>`:""}
      ${s.sharma_note? `<h4>Sharma note</h4><p>${esc(s.sharma_note)}</p>`:""}
      ${s.florida_note? `<h4>Florida note</h4><p>${esc(s.florida_note)}</p>`:""}
      ${s.figure_idea? `<h4>Figure idea</h4><p class="bkfig">${esc(s.figure_idea)}</p>`:""}
      ${(s.related_ids&&s.related_ids.length)? `<h4>Related</h4><div>${s.related_ids.map(id=>relChip(id)).join(" ")}</div>`:""}
      <div class="rowbtns"><button class="learnbtn ${isDone?"done":""}" data-learn="${s.id}">${isDone?"Learned — tap to undo":"Mark as learned"}</button><button class="quizbtn" data-quizjump="1">Quiz me →</button></div>
      <div class="bknav">
        ${prev? `<button class="go" data-bookpage="${prev.id}">\u2190 Previous lesson</button>` : `<span class="bkmeta">Start of chapter</span>`}
        ${next? `<button class="go" data-bookpage="${next.id}">Next lesson: ${esc(next.title)} \u2192</button>` : `<span class="bkmeta">End of chapter — nice work. Take the Chapter ${B.chapter} quiz under Practice.</span>`}
      </div>
      <div class="rowbtns"><button class="quizbtn" data-bookview="toc">All lessons in this chapter</button><button class="quizbtn" data-bookview="index">A–Z Index</button></div>
    </div>`;
    return;
  }
  const lessonRow=(id,secLabel,title)=>`<li><button class="lessonrow" data-bookpage="${id}"><span class="lcheck">${learned.has(id)?'<svg class="sk-icon sk-ck"><use href="#i-check"/></svg>':""}</span><span class="lsec">${esc(secLabel)}</span><span class="ltitle">${esc(title)}</span><span class="pathgo">›</span></button></li>`;
  view.innerHTML = head + `<p class="bkmeta">Work down the list in order — tap a lesson to open it, mark it learned, then tap Next lesson. A ✓ means you finished it.</p>` + B.toc.map(a=>{
    const isArt = a.article && a.article!==String(B.chapter);
    return `<div class="card"><h3>${isArt? `Article ${esc(a.article)} — `:""}${esc(a.title)}</h3><ul class="bktoc">
      ${lessonRow(a.id, isArt? "Intro":"Start", isArt? `About Article ${esc(a.article)}`:"Chapter introduction")}
      ${a.children.map(c=>lessonRow(c.id, c.section, c.title)).join("")}
    </ul></div>`; }).join("") +
    `<div class="card"><div class="cite">Finished this chapter?</div><h3>Take the Chapter ${B.chapter} practice quiz</h3><p>80% to pass. Wrong answers explain why, in plain words.</p><button class="go" data-gotoquiz="ch${B.chapter}">Start Chapter ${B.chapter} quiz →</button></div>`;
}
window.renderBook = renderBook;
