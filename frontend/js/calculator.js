const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function fmt(d) {
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

function addDays(d, n) {
  var r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Populate dropdowns
(function init() {
  var s = document.getElementById('shortest');
  var l = document.getElementById('longest');
  for (var i = 21; i <= 40; i++) {
    s.innerHTML += '<option value="' + i + '">' + i + ' days</option>';
    l.innerHTML += '<option value="' + i + '">' + i + ' days</option>';
  }
  s.value = 28;
  l.value = 30;

  var today = new Date();
  document.getElementById('lmp').max =
    today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
})();

function calculateCycle() {
  var val = document.getElementById('lmp').value;
  if (!val) { alert('Please select your LMP date.'); return; }

  var lmp = new Date(val);
  var sh = parseInt(document.getElementById('shortest').value);
  var lg = parseInt(document.getElementById('longest').value);

  if (sh > lg) { alert('Shortest cycle must be ≤ longest cycle.'); return; }

  var fertileStart = addDays(lmp, sh - 18 - 1);
  var fertileEnd = addDays(lmp, lg - 11 - 1);
  var ovStart = addDays(lmp, sh - 14 - 1);
  var ovEnd = addDays(lmp, lg - 14 - 1);
  var nextStart = addDays(lmp, sh);
  var nextEnd = addDays(lmp, lg);
  var safeBeforeEnd = addDays(fertileStart, -1);
  var safeAfterStart = addDays(fertileEnd, 1);
  var safeAfterEnd = addDays(nextStart, -1);

  var html = '';
  html += '<div style="margin-bottom: 14px; padding: 10px; background: #fce7f3; border-radius: 8px;">';
  html += '<strong style="color: var(--pink-600);">🩷 Fertile Window</strong><br>';
  html += '<span style="font-size: 0.85rem;">' + fmt(fertileStart) + ' → ' + fmt(fertileEnd) + '</span></div>';

  html += '<div style="margin-bottom: 14px; padding: 10px; background: #fef3c7; border-radius: 8px;">';
  html += '<strong style="color: #92400e;">🟡 Ovulation (approx)</strong><br>';
  html += '<span style="font-size: 0.85rem;">' + fmt(ovStart) + ' → ' + fmt(ovEnd) + '</span></div>';

  html += '<div style="margin-bottom: 14px; padding: 10px; background: #d1fae5; border-radius: 8px;">';
  html += '<strong style="color: #065f46;">🟢 Safer Days</strong><br>';
  html += '<span style="font-size: 0.85rem;">' + fmt(lmp) + ' → ' + fmt(safeBeforeEnd) + '</span><br>';
  if (safeAfterEnd >= safeAfterStart) {
    html += '<span style="font-size: 0.85rem;">' + fmt(safeAfterStart) + ' → ' + fmt(safeAfterEnd) + '</span>';
  }
  html += '</div>';

  html += '<div style="padding: 10px; background: #dbeafe; border-radius: 8px;">';
  html += '<strong style="color: #1e40af;">📅 Next Period Expected</strong><br>';
  html += '<span style="font-size: 0.85rem;">' + fmt(nextStart) + ' → ' + fmt(nextEnd) + '</span></div>';

  document.getElementById('resultsPlaceholder').style.display = 'none';
  var el = document.getElementById('results');
  el.innerHTML = html;
  el.style.display = 'block';
}
