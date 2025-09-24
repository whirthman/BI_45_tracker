/* ---------- Data model & persistence ---------- */
const STORAGE_KEY = 'binary_tracker_v3';
let store = {
  trades: [], sessions: [], days: [], weeks: [],
  currentSession: {wins:0, losses:0},
  currentDaySessions: [], currentWeekDays: [],
  images: [],           // {id, url, caption}
  strategyNotes: '',    // editable strategy notes
  schemaText: ''        // editable schema text
};

function saveStore(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
function loadStore(){ const raw = localStorage.getItem(STORAGE_KEY); if(raw) store = JSON.parse(raw); }
loadStore();

/* ---------- DOM refs ---------- */
const tabs = document.querySelectorAll('.tab');
const sections = { dashboard: document.getElementById('tab-dashboard'), strategy: document.getElementById('tab-strategy'), schema: document.getElementById('tab-schema') };

// dashboard refs
const pairInput = document.getElementById('pair');
const resultSelect = document.getElementById('result');
const logBtn = document.getElementById('logBtn');
const resetBtn = document.getElementById('resetBtn');

const sessionLiveLabel = document.getElementById('sessionLiveLabel');
const sessionLiveBar = document.getElementById('sessionLiveBar');
const sessionLivePct = document.getElementById('sessionLivePct');

const tradeBar = document.getElementById('tradeBar');
const tradePct = document.getElementById('tradePct');
const sessionBar = document.getElementById('sessionBar');
const sessionPct = document.getElementById('sessionPct');

const k_totalTrades = document.getElementById('k_totalTrades');
const k_tradeWins = document.getElementById('k_tradeWins');
const k_tradeLosses = document.getElementById('k_tradeLosses');
const k_tradeDiff = document.getElementById('k_tradeDiff');

const tradesBar = document.getElementById('tradesBar');
const tradesPct = document.getElementById('tradesPct');
const tradesDetails = document.getElementById('tradesDetails');
const tradesSummary = document.getElementById('tradesSummary');

const sessionsBar = document.getElementById('sessionsBar');
const sessionsPct = document.getElementById('sessionsPct');
const sessionsDetails = document.getElementById('sessionsDetails');
const sessionsSummary = document.getElementById('sessionsSummary');

const daysBar = document.getElementById('daysBar');
const daysPct = document.getElementById('daysPct');
const daysDetails = document.getElementById('daysDetails');
const daysSummary = document.getElementById('daysSummary');

const weeksBar = document.getElementById('weeksBar');
const weeksPct = document.getElementById('weeksPct');
const weeksDetails = document.getElementById('weeksDetails');
const weeksSummary = document.getElementById('weeksSummary');

const pairsTbody = document.getElementById('pairsTbody');
const pairCount = document.getElementById('pairCount');

const btnWin = document.getElementById('btnWin');
const btnLoss = document.getElementById('btnLoss');
const btnExport = document.getElementById('btnExport');
const btnImport = document.getElementById('btnImport');

/* strategy/schema refs */
const strategyNotesEl = document.getElementById('strategyNotes');
const saveStrategyBtn = document.getElementById('saveStrategyBtn');
const clearStrategyBtn = document.getElementById('clearStrategyBtn');
const galleryEl = document.getElementById('gallery');
const addImageBtn = document.getElementById('addImageBtn');

const schemaTextEl = document.getElementById('schemaText');
const saveSchemaBtn = document.getElementById('saveSchemaBtn');
const resetSchemaBtn = document.getElementById('resetSchemaBtn');

/* small helpers */
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function safePct(w,l){ const t = w + l; return t ? Math.round((w / t) * 100) : 0; }
function formatDiff(w,l){ const d = w - l; return (d>0? '+'+d : d); }

/* ---------- aggregates & pair stats ---------- */
function calcPairStats(){
  const map = {};
  store.trades.forEach(t=>{
    if(!t.pair) return;
    if(!map[t.pair]) map[t.pair] = {wins:0, losses:0};
    if(t.result === 'win') map[t.pair].wins++; else map[t.pair].losses++;
  });
  return map;
}

function aggregates(){
  const tradeWins = store.trades.filter(t=>t.result==='win').length;
  const tradeLosses = store.trades.filter(t=>t.result==='loss').length;
  const sessionWins = store.sessions.filter(s=>s==='win').length;
  const sessionLosses = store.sessions.filter(s=>s==='loss').length;
  const dayWins = store.days.filter(d=>d==='win').length;
  const dayLosses = store.days.filter(d=>d==='loss').length;
  const weekWins = store.weeks.filter(w=>w==='win').length;
  const weekLosses = store.weeks.filter(w=>w==='loss').length;
  return { tradeWins, tradeLosses, sessionWins, sessionLosses, dayWins, dayLosses, weekWins, weekLosses };
}

/* ---------- rendering ---------- */
function renderAll(){
  saveStore();

  // session live
  const cs = store.currentSession;
  const csTotal = cs.wins + cs.losses;
  const csPct = csTotal ? Math.round((cs.wins / csTotal) * 100) : 0;
  sessionLiveLabel.textContent = `${cs.wins}W • ${cs.losses}L`;
  sessionLiveBar.style.width = csPct + '%';
  sessionLivePct.textContent = csPct + '%';

  // aggregates
  const agg = aggregates();

  // trades
  const totalTrades = agg.tradeWins + agg.tradeLosses;
  k_totalTrades.textContent = totalTrades;
  k_tradeWins.textContent = agg.tradeWins;
  k_tradeLosses.textContent = agg.tradeLosses;
  k_tradeDiff.textContent = formatDiff(agg.tradeWins, agg.tradeLosses);
  const tradePct = safePct(agg.tradeWins, agg.tradeLosses);
  tradeBar.style.width = tradePct + '%'; tradePct.textContent = tradePct + '%';
  tradesBar.style.width = tradePct + '%'; tradesPct.textContent = tradePct + '%';
  tradesSummary.textContent = `${agg.tradeWins}W • ${agg.tradeLosses}L`;
  tradesDetails.textContent = `Difference: ${formatDiff(agg.tradeWins, agg.tradeLosses)} • Win Rate: ${tradePct}%`;

  // sessions
  const sessionPctVal = safePct(agg.sessionWins, agg.sessionLosses);
  sessionBar.style.width = sessionPctVal + '%'; sessionPct.textContent = sessionPctVal + '%';
  sessionsBar.style.width = sessionPctVal + '%'; sessionsPct.textContent = sessionPctVal + '%';
  sessionsSummary.textContent = `${agg.sessionWins}W • ${agg.sessionLosses}L`;
  sessionsDetails.textContent = `Difference: ${formatDiff(agg.sessionWins, agg.sessionLosses)} • Rate: ${sessionPctVal}%`;

  // days
  const dayPctVal = safePct(agg.dayWins, agg.dayLosses);
  daysBar.style.width = dayPctVal + '%'; daysPct.textContent = dayPctVal + '%';
  daysSummary.textContent = `${agg.dayWins}W • ${agg.dayLosses}L`;
  daysDetails.textContent = `Difference: ${formatDiff(agg.dayWins, agg.dayLosses)} • Rate: ${dayPctVal}%`;

  // weeks
  const weekPctVal = safePct(agg.weekWins, agg.weekLosses);
  weeksBar.style.width = weekPctVal + '%'; weeksPct.textContent = weekPctVal + '%';
  weeksSummary.textContent = `${agg.weekWins}W • ${agg.weekLosses}L`;
  weeksDetails.textContent = `Difference: ${formatDiff(agg.weekWins, agg.weekLosses)} • Rate: ${weekPctVal}%`;

  // pairs table
  const map = calcPairStats();
  pairsTbody.innerHTML = '';
  const pairs = Object.keys(map).sort((a,b)=> (map[b].wins - map[b].losses) - (map[a].wins - map[a].losses));
  pairs.forEach(pair=>{
    const data = map[pair];
    const diff = data.wins - data.losses;
    const pct = safePct(data.wins, data.losses);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="font-weight:600">${pair}</td>
      <td class="pair-win">${data.wins}</td>
      <td class="pair-loss">${data.losses}</td>
      <td>${diff>0? '+'+diff: diff}</td>
      <td>${pct}%</td>`;
    pairsTbody.appendChild(tr);
  });
  pairCount.textContent = pairs.length + ' pairs';

  // strategy notes & schema
  strategyNotesEl.value = store.strategyNotes || '';
  schemaTextEl.value = store.schemaText || '';
  renderGallery();
}

/* ---------- session/day/week logic ---------- */
function completeSessionIfNeeded(){
  const cs = store.currentSession;
  if(Math.abs(cs.wins - cs.losses) >= 3){
    const res = cs.wins > cs.losses ? 'win' : 'loss';
    store.sessions.push(res);
    store.currentDaySessions.push(res);
    store.currentSession = {wins:0, losses:0};

    // 2 sessions -> day
    if(store.currentDaySessions.length >= 2){
      const s0 = store.currentDaySessions[0], s1 = store.currentDaySessions[1];
      if(s0==='win' && s1==='win'){ store.days.push('win'); store.currentWeekDays.push('win'); }
      else if(s0==='loss' && s1==='loss'){ store.days.push('loss'); store.currentWeekDays.push('loss'); }
      // else neutral - do nothing
      store.currentDaySessions = [];

      // 6 days -> week (conservative)
      if(store.currentWeekDays.length >= 6){
        const allWin = store.currentWeekDays.every(d=>d==='win');
        const allLoss = store.currentWeekDays.every(d=>d==='loss');
        if(allWin) store.weeks.push('win');
        else if(allLoss) store.weeks.push('loss');
        store.currentWeekDays = [];
      }
    }
  }
}

function logTrade(pair, result){
  if(!pair) return;
  const trade = { pair, result, ts: Date.now() };
  store.trades.push(trade);
  if(result === 'win') store.currentSession.wins++; else store.currentSession.losses++;
  completeSessionIfNeeded();
  renderAll();
}

/* ---------- export/import ---------- */
function exportCSV(){
  const rows = [['pair','result','timestamp']];
  store.trades.forEach(t=> rows.push([t.pair, t.result, new Date(t.ts).toISOString()]));
  const csv = rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download='binary-trades.csv'; a.click(); URL.revokeObjectURL(url);
}

function importCSVFile(file){
  const reader = new FileReader();
  reader.onload = e=>{
    const text = e.target.result;
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    for(let i=1;i<lines.length;i++){
      const parts = lines[i].split(',').map(p=>p.replace(/^"|"$/g,'').trim());
      if(parts.length>=3){
        const pair = parts[0], result = parts[1], ts = Date.parse(parts[2]) || Date.now();
        if(pair && (result==='win' || result==='loss')) store.trades.push({pair, result, ts});
      }
    }
    rebuildFromTrades();
    renderAll();
  };
  reader.readAsText(file);
}

/* ---------- rebuild from trades (idempotent) ---------- */
function rebuildFromTrades(){
  store.sessions = []; store.days = []; store.weeks = [];
  store.currentSession = {wins:0, losses:0}; store.currentDaySessions = []; store.currentWeekDays = [];
  const ordered = [...store.trades].sort((a,b)=> a.ts - b.ts);
  for(const t of ordered){
    if(t.result==='win') store.currentSession.wins++; else store.currentSession.losses++;
    if(Math.abs(store.currentSession.wins - store.currentSession.losses) >= 3){
      const res = store.currentSession.wins > store.currentSession.losses ? 'win' : 'loss';
      store.sessions.push(res);
      store.currentDaySessions.push(res);
      store.currentSession = {wins:0, losses:0};
      if(store.currentDaySessions.length >= 2){
        const s0 = store.currentDaySessions[0], s1 = store.currentDaySessions[1];
        if(s0==='win' && s1==='win'){ store.days.push('win'); store.currentWeekDays.push('win'); }
        else if(s0==='loss' && s1==='loss'){ store.days.push('loss'); store.currentWeekDays.push('loss'); }
        store.currentDaySessions = [];
        if(store.currentWeekDays.length >= 6){
          const allWin = store.currentWeekDays.every(d=>d==='win');
          const allLoss = store.currentWeekDays.every(d=>d==='loss');
          if(allWin) store.weeks.push('win'); else if(allLoss) store.weeks.push('loss');
          store.currentWeekDays = [];
        }
      }
    }
  }
}

/* ---------- strategy images (pool) ---------- */
function renderGallery(){
  galleryEl.innerHTML = '';
  if(!store.images) store.images = [];
  if(store.images.length === 0){
    galleryEl.innerHTML = '<div class="tiny" style="opacity:.6">No images yet. Click + Add Image to paste a URL (Google Drive direct links recommended).</div>';
    return;
  }
  store.images.forEach(img=>{
    const div = document.createElement('div');
    div.className = 'gallery-card';
    div.innerHTML = `
      <img src="${img.url}" alt="screenshot" onerror="this.style.opacity=.5;this.nextElementSibling && (this.nextElementSibling.textContent='Image failed to load')">
      <div class="gallery-caption">${img.caption || ''}</div>
      <div class="gallery-controls">
        <button class="control-btn edit" data-id="${img.id}">✎ Edit</button>
        <button class="control-btn del" data-id="${img.id}">✖ Delete</button>
      </div>
    `;
    galleryEl.appendChild(div);
  });

  // attach listeners for edit/delete
  galleryEl.querySelectorAll('.control-btn.edit').forEach(btn=>{
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      const img = store.images.find(i => i.id === id);
      if(img){
        const newUrl = prompt("Edit image URL:", img.url);
        const newCaption = prompt("Edit image caption:", img.caption);
        if(newUrl !== null) img.url = newUrl;
        if(newCaption !== null) img.caption = newCaption;
        saveStore();
        renderGallery();
      }
    });
  });
  galleryEl.querySelectorAll('.control-btn.del').forEach(btn=>{
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      if(confirm('Are you sure you want to delete this image?')){
        store.images = store.images.filter(i => i.id !== id);
        saveStore();
        renderGallery();
      }
    });
  });
}

/* ---------- event listeners ---------- */
// tab switching
tabs.forEach(tab=>{
  tab.addEventListener('click', e => {
    tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    for(const section in sections){ sections[section].style.display = 'none'; }
    sections[e.target.dataset.tab].style.display = 'block';
  });
});

// dashboard controls
logBtn.addEventListener('click', () => logTrade(pairInput.value, resultSelect.value));
btnWin.addEventListener('click', () => logTrade(pairInput.value, 'win'));
btnLoss.addEventListener('click', () => logTrade(pairInput.value, 'loss'));
resetBtn.addEventListener('click', () => {
  if(confirm('Are you sure you want to reset all data? This cannot be undone.')){
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
});

// keyboard shortcuts
document.addEventListener('keydown', e => {
  if(e.key === 'w' || e.key === 'W') { logTrade(pairInput.value, 'win'); }
  if(e.key === 'l' || e.key === 'L') { logTrade(pairInput.value, 'loss'); }
  if(e.key === 's' && (e.ctrlKey || e.metaKey)){
    e.preventDefault();
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    if(activeTab === 'dashboard') logTrade(pairInput.value, resultSelect.value);
    else if(activeTab === 'strategy') saveStrategyBtn.click();
    else if(activeTab === 'schema') saveSchemaBtn.click();
  }
});

// export/import
btnExport.addEventListener('click', exportCSV);
btnImport.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.csv';
  input.onchange = e => { if(e.target.files[0]) importCSVFile(e.target.files[0]); };
  input.click();
});

// strategy/schema
saveStrategyBtn.addEventListener('click', () => { store.strategyNotes = strategyNotesEl.value; saveStore(); });
clearStrategyBtn.addEventListener('click', () => { if(confirm('Are you sure?')) { store.strategyNotes = ''; saveStore(); renderAll(); } });
saveSchemaBtn.addEventListener('click', () => { store.schemaText = schemaTextEl.value; saveStore(); });
resetSchemaBtn.addEventListener('click', () => { if(confirm('Are you sure?')) { store.schemaText = ''; saveStore(); renderAll(); } });

addImageBtn.addEventListener('click', () => {
  const url = prompt('Paste image URL here:');
  if(url){
    const caption = prompt('Add a caption (optional):', '');
    store.images.push({id: uid('img'), url, caption});
    saveStore();
    renderGallery();
  }
});

// initial render
renderAll();