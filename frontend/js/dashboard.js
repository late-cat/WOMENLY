var LABELS = { green: 'Low Risk', yellow: 'Moderate Risk', red: 'High Risk' };
var ICONS = { green: '🟢', yellow: '🟡', red: '🔴' };
var TRENDS = { improving: '↗ Improving', stable: '→ Stable', worsening: '↘ Worsening' };

function normalizeRecord(record) {
  if (!record || !record.result) return null;

  var allowedColors = { green: true, yellow: true, red: true };
  var color = allowedColors[record.result.tag_color] ? record.result.tag_color : 'yellow';
  var score = Number(record.result.risk_score);
  if (!Number.isFinite(score)) score = 0;

  return {
    id: record.id || '',
    month: record.month || '–',
    result: {
      tag_color: color,
      risk_score: score,
      doctor_recommendation: record.result.doctor_recommendation || ''
    }
  };
}

function getLocalRecords(uid) {
  var key = 'womenly_records_' + uid;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

auth.onAuthStateChanged(async function (user) {
  if (!user) return;

  document.getElementById('authGate').style.display = 'none';
  document.getElementById('dashContent').style.display = 'block';

  // Load records
  var snap;
  try {
    snap = await db.collection('users').doc(user.uid)
      .collection('records')
      .orderBy('timestamp', 'desc')
      .get();
  } catch (err) {
    console.error('Record load failed:', err.code, err.message);
    snap = null;
  }

  var records = [];
  if (snap) {
    snap.forEach(function (doc) {
      var data = doc.data();
      records.push({ id: doc.id, ...data });
    });
  }

  if (records.length === 0) {
    records = getLocalRecords(user.uid);
  }

  records = records.map(normalizeRecord).filter(function (r) { return r !== null; });

  if (records.length === 0) return;

  // Render records table
  var html = '<div class="table-responsive"><table class="history-table">';
  html += '<thead><tr><th>Month</th><th>Risk Score</th><th>Tag</th><th>Doctor Advice</th></tr></thead><tbody>';

  records.forEach(function (r) {
    var color = r.result.tag_color;
    var score = Math.round(r.result.risk_score);
    html += '<tr>';
    html += '<td>' + (r.month || '–') + '</td>';
    html += '<td>' + score + '%</td>';
    html += '<td><span class="risk-tag ' + color + '"><span class="risk-dot ' + color + '"></span> ' + LABELS[color] + '</span></td>';
    html += '<td style="font-size: 0.8rem; max-width: 200px;">' + (r.result.doctor_recommendation || '') + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  document.getElementById('recordsList').innerHTML = html;

  // Profile-level tag (pattern recognition)
  if (records.length >= 2) {
    computeProfileTag(records);
  } else {
    var one = records[0];
    var score = Math.round(one.result.risk_score);
    var color = one.result.tag_color;
    var level = LABELS[color] || 'Risk';
    document.getElementById('profileTag').innerHTML =
      '<div style="text-align: center;">' +
      '<span class="risk-tag ' + color + '" style="font-size: 1.05rem; padding: 10px 20px;">' +
      '<span class="risk-dot ' + color + '"></span> ' + level + ' (' + score + '%)</span>' +
      '<p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light);">Need one more monthly record for trend analysis.</p>' +
      '</div>';
  }
});

function computeProfileTag(records) {
  // Average risk score across all months
  var total = 0;
  records.forEach(function (r) { total += r.result.risk_score; });
  var avg = total / records.length;

  // Determine tag from average
  var color, level;
  if (avg <= 30) { color = 'green'; level = 'Low Risk'; }
  else if (avg <= 60) { color = 'yellow'; level = 'Moderate Risk'; }
  else { color = 'red'; level = 'High Risk'; }

  // Detect trend (compare first half vs second half)
  var mid = Math.floor(records.length / 2);
  var recentAvg = 0, olderAvg = 0;
  // records are desc ordered, so [0] is most recent
  for (var i = 0; i < mid; i++) recentAvg += records[i].result.risk_score;
  for (var i = mid; i < records.length; i++) olderAvg += records[i].result.risk_score;
  recentAvg /= mid;
  olderAvg /= (records.length - mid);

  var trend, trendClass;
  if (recentAvg < olderAvg - 5) { trend = TRENDS.improving; trendClass = 'improving'; }
  else if (recentAvg > olderAvg + 5) { trend = TRENDS.worsening; trendClass = 'worsening'; }
  else { trend = TRENDS.stable; trendClass = 'stable'; }

  var PROFILE_ADVICE = {
    green: "Your health pattern over the past months looks good. Keep it up!",
    yellow: "Some recurring indicators detected across months. A routine gynecologist check-up is recommended.",
    red: "Consistent high-risk indicators across months. Please schedule a consultation with a specialist soon."
  };

  var html = '';
  html += '<div style="text-align: center;">';
  html += '<span class="risk-tag ' + color + '" style="font-size: 1.1rem; padding: 10px 24px;">';
  html += '<span class="risk-dot ' + color + '"></span> ' + level;
  html += '</span>';
  html += '<p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light);">Based on <strong>' + records.length + ' monthly records</strong></p>';
  html += '<p class="trend ' + trendClass + '">' + trend + '</p>';
  html += '<div class="doctor-advice ' + color + '" style="text-align: left; margin-top: 12px;">' + PROFILE_ADVICE[color] + '</div>';
  html += '</div>';

  document.getElementById('profileTag').innerHTML = html;
}
