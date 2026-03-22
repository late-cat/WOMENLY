document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('year').textContent = new Date().getFullYear();
  renderResult();
});

var DOCTOR_ADVICE = {
  green: "✅ Your indicators look healthy. Continue maintaining a balanced lifestyle and regular check-ups.",
  yellow: "⚠️ Some indicators need attention. Consider scheduling a visit with a gynecologist within the next month for a thorough evaluation.",
  red: "🚨 Multiple risk indicators detected. Please consult a gynecologist or endocrinologist as soon as possible for proper clinical tests (ultrasound, blood tests)."
};

function renderResult() {
  var raw = sessionStorage.getItem('screening_result');
  if (!raw) return;

  var r = JSON.parse(raw);
  var input = JSON.parse(sessionStorage.getItem('screening_input') || '{}');
  var allowedColors = { green: true, yellow: true, red: true };
  var color = allowedColors[r.tag_color] ? r.tag_color : 'yellow';
  var score = Math.round(Number(r.risk_score) || 0);
  var labels = { green: 'Low Risk', yellow: 'Moderate Risk', red: 'High Risk' };
  var icons = { green: '🟢', yellow: '🟡', red: '🔴' };

  var html = '';

  // Big tag
  html += '<div class="big-tag ' + color + '">' + icons[color] + ' ' + labels[color] + '</div>';

  // Score bar
  html += '<p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 4px;">Risk Score: <strong>' + score + '%</strong></p>';
  html += '<div class="risk-score-bar"><div class="risk-score-fill ' + color + '" style="width: ' + score + '%;"></div></div>';


  html += '<div class="screening-disclaimer">';
  html += r.screening_disclaimer || '⚠️ This result is a screening indicator only and is NOT a clinical diagnosis. Please consult a qualified healthcare professional.';
  html += '</div>';


  html += '<div class="doctor-advice ' + color + '">';
  html += '<strong>Doctor Recommendation</strong><br>';
  html += r.doctor_recommendation || DOCTOR_ADVICE[color] || 'Please consult a doctor for a detailed evaluation.';
  html += '</div>';


  html += '<div style="text-align: left; margin-top: 20px;">';
  html += '<h4 style="font-size: 0.9rem; margin-bottom: 8px;">Your Inputs</h4>';
  html += '<div class="table-responsive">';
  html += '<table class="history-table"><tbody>';
  var friendlyNames = {
    age: 'Age', bmi: 'BMI', period_duration: 'Period Duration', cycle_regularity: 'Cycle Regularity',
    weight_gain: 'Weight Gain', skin_darkening: 'Skin Darkening',
    hair_growth: 'Excess Hair Growth', hair_loss: 'Hair Loss', pimples: 'Pimples/Acne',
    exercise: 'Regular Exercise', fast_food: 'Fast Food (frequent)',
    fsh: 'FSH (mIU/mL)', lh: 'LH (mIU/mL)', amh: 'AMH (ng/mL)',
    tsh: 'TSH (mIU/L)', hemoglobin: 'Hemoglobin (g/dL)'
  };
  for (var key in input) {
    var val = input[key];
    var display = (val === 1 ? 'Yes' : (val === 0 && key !== 'age' && key !== 'bmi' && key !== 'period_duration' ? 'No' : val));
    html += '<tr><td style="color: var(--text-light);">' + (friendlyNames[key] || key) + '</td><td><strong>' + display + '</strong></td></tr>';
  }
  html += '</tbody></table></div>';

  document.getElementById('resultContent').innerHTML = html;

  // Show save state
  auth.onAuthStateChanged(function (user) {
    document.getElementById('saveSection').style.display = 'block';
    document.getElementById('saveHint').textContent = user
      ? 'Save this month\'s result to your profile history'
      : 'Please log in to save this record to your monthly history';
  });
}

function getCurrentUserOnce() {
  return new Promise(function (resolve) {
    var timeoutId = setTimeout(function () {
      resolve(null);
    }, 1500);

    var unsub = auth.onAuthStateChanged(function (user) {
      clearTimeout(timeoutId);
      unsub();
      resolve(user || null);
    });
  });
}

function getLocalRecordsKey(uid) {
  return 'womenly_records_' + uid;
}

function saveRecordLocally(uid, recordId, monthLabel, input, result) {
  var key = getLocalRecordsKey(uid);
  var existing = JSON.parse(localStorage.getItem(key) || '[]');
  var next = existing.filter(function (r) { return r.id !== recordId; });
  next.push({
    id: recordId,
    month: monthLabel,
    input: input,
    result: result,
    timestamp: new Date().toISOString(),
    source: 'local'
  });
  next.sort(function (a, b) { return (a.month < b.month ? 1 : -1); });
  localStorage.setItem(key, JSON.stringify(next));
}

async function saveToProfile() {
  var user = auth.currentUser;
  if (!user) {
    user = await getCurrentUserOnce();
  }

  if (!user) {
    alert('Please log in from the top right menu first to save this record to your profile!');
    return;
  }

  var result = JSON.parse(sessionStorage.getItem('screening_result'));
  var input = JSON.parse(sessionStorage.getItem('screening_input'));
  var recordId = new Date().toISOString();
  var monthLabel = recordId.slice(0, 7);
  var btn = document.querySelector('#saveSection button');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    var savePromise = db.collection('users').doc(user.uid).collection('records').doc(recordId).set({
      input: input || {},
      result: result || {},
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      month: monthLabel
    }, { merge: true });

    var timeoutPromise = new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('timeout')); }, 5000);
    });

    await Promise.race([savePromise, timeoutPromise]);

    saveRecordLocally(user.uid, recordId, monthLabel, input, result);
    alert('✅ Record saved to your profile!');
    btn.textContent = '✓ Saved';
    document.getElementById('saveHint').textContent = 'Saved. You can view it in Dashboard.';
  } catch (err) {
    saveRecordLocally(user.uid, recordId, monthLabel, input, result);
    btn.textContent = '✓ Saved Locally';
    document.getElementById('saveHint').textContent = 'Saved locally.';
    alert('Saved locally. Cloud save failed (' + (err.code || 'unknown') + '): ' + err.message);
  }
}
