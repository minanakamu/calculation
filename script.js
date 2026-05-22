// ── データ ────────────────────────────────
const entries = [];

// ── クイック入力ボタンの生成 ─────────────
const QUICK_HOURS = [4, 5, 6, 7, 8, 9, 10];
const quickContainer = document.getElementById('quick-btns');
QUICK_HOURS.forEach(h => {
  const btn = document.createElement('button');
  btn.className = 'btn-quick';
  btn.textContent = h + 'h';
  btn.addEventListener('click', () => addDirect(h));
  quickContainer.appendChild(btn);
});

// ── 時給の連動更新 ────────────────────────
const wageInput     = document.getElementById('wage');
const otWageInput   = document.getElementById('overtime-wage');
wageInput.addEventListener('input', () => {
  otWageInput.value = (parseFloat(wageInput.value) || 1300) + 200;
});

// ── 計算ロジック（Pythonコードと同一） ───
function calcBreak(t) {
  if (t < 5) return 0;
  if (t < 7) return 0.5;
  return 1.0;
}

function fmt(n) {
  return Number.isInteger(n) ? n.toString() : parseFloat(n.toFixed(2)).toString();
}

// ── エントリ追加（入力欄から） ───────────
function addEntry() {
  const input = document.getElementById('time-input');
  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 400);
    input.focus();
    return;
  }
  pushEntry(val);
  input.value = '';
  input.focus();
}

// ── エントリ追加（クイックボタンから） ───
function addDirect(hours) {
  pushEntry(hours);
}

// ── まとめて追加 ──────────────────────────
function addBatch() {
  const textarea = document.getElementById('batch-input');
  const lines = textarea.value.trim().split('\n');
  let added = 0;
  lines.forEach(line => {
    const val = parseFloat(line.trim());
    if (!isNaN(val) && val >= 0) {
      pushEntry(val, false);
      added++;
    }
  });
  if (added > 0) {
    renderList();
    textarea.value = '';
  }
}

// ── 内部追加処理 ──────────────────────────
function pushEntry(val, rerender = true) {
  entries.push(val);
  if (rerender) renderList();
}

// ── エントリ削除 ──────────────────────────
function removeEntry(i) {
  entries.splice(i, 1);
  renderList();
}

// ── リスト描画 ────────────────────────────
function renderList() {
  const ul = document.getElementById('day-list');
  if (!entries.length) {
    ul.innerHTML = '<li class="empty">まだ入力がありません</li>';
    return;
  }
  ul.innerHTML = entries.map((t, i) => {
    const brk    = calcBreak(t);
    const actual = t - brk;
    const ot     = Math.max(0, actual - 8);
    let tags = '';
    if (brk > 0) tags += `<span class="tag tag-break">休憩 ${fmt(brk)}h</span>`;
    if (ot  > 0) tags += `<span class="tag tag-ot">残業 ${fmt(ot)}h</span>`;
    return `
      <li class="day-item">
        <span class="day-num">Day ${i + 1}</span>
        <span class="day-hours">${t} 時間</span>
        ${tags}
        <button class="btn-del" onclick="removeEntry(${i})" title="削除">✕</button>
      </li>`;
  }).join('');
}

// ── 給料計算 ──────────────────────────────
function calculate() {
  if (!entries.length) return;

  const WAGE    = parseFloat(document.getElementById('wage').value)         || 1300;
  const OT_WAGE = parseFloat(document.getElementById('overtime-wage').value) || 1500;

  let totalSalary = 0, totalActual = 0, totalOT = 0;
  const rows = [];

  for (const t of entries) {
    const brk = calcBreak(t);
    let actual = t - brk;
    let ot = 0;
    if (actual >= 8) { ot = actual - 8; actual = 8; }
    const daily = actual * WAGE + ot * OT_WAGE;
    totalSalary += daily;
    totalActual += actual;
    totalOT     += ot;
    rows.push({ t, brk, actual, ot, daily });
  }

  // 合計表示
  document.getElementById('total-amount').textContent = Math.floor(totalSalary).toLocaleString();
  document.getElementById('stat-days').textContent    = entries.length;
  document.getElementById('stat-hours').textContent   = fmt(totalActual);
  document.getElementById('stat-ot').textContent      = fmt(totalOT);

  // 日別テーブル
  document.getElementById('detail-body').innerHTML = rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.t} h</td>
      <td>${r.brk > 0 ? fmt(r.brk) + ' h' : '—'}</td>
      <td class="td-center">${fmt(r.actual)} h</td>
      <td class="td-center">${r.ot > 0 ? `<span class="ot-badge">${fmt(r.ot)} h</span>` : '—'}</td>
      <td class="td-right daily-sal">${Math.floor(r.daily).toLocaleString()} 円</td>
    </tr>`).join('');

  const el = document.getElementById('result');
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── リセット ──────────────────────────────
function resetAll() {
  entries.length = 0;
  renderList();
  document.getElementById('result').style.display = 'none';
  document.getElementById('time-input').focus();
}

// ── Enter キー ────────────────────────────
document.getElementById('time-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addEntry();
});

// ── ページ読み込み時にフォーカス ─────────
window.addEventListener('load', () => {
  document.getElementById('time-input').focus();
});