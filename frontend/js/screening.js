var currentMode = 'basic';

function switchTab(mode) {
  currentMode = mode;
  var tabs = document.querySelectorAll('.tab-btn');
  tabs[0].classList.toggle('active', mode === 'basic');
  tabs[1].classList.toggle('active', mode === 'advanced');
  document.getElementById('advancedFields').classList.toggle('active', mode === 'advanced');

  // Make blood test fields required only in advanced mode
  var advInputs = document.querySelectorAll('#advancedFields input');
  advInputs.forEach(function (inp) { inp.required = (mode === 'advanced'); });
}

function toggleSelect(btn) {
  var group = btn.parentElement;
  group.querySelectorAll('.toggle-btn').forEach(function (b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function getToggleValue(field) {
  var sel = document.querySelector('[data-field="' + field + '"].selected');
  return sel ? parseInt(sel.getAttribute('data-value')) : 0;
}

async function submitScreening() {
  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';

  var bmi = calcBMI();
  if (!bmi || bmi < 10 || bmi > 60) {
    alert('Please enter valid weight and height to calculate BMI.');
    btn.disabled = false;
    btn.textContent = 'Get Risk Assessment';
    return;
  }

  var data = {
    age: parseFloat(document.getElementById('age').value),
    bmi: bmi,
    period_duration: parseFloat(document.getElementById('period_duration').value),
    cycle_regularity: getToggleValue('cycle_regularity'),
    weight_gain: getToggleValue('weight_gain'),
    hair_growth: getToggleValue('hair_growth'),
    skin_darkening: getToggleValue('skin_darkening'),
    hair_loss: getToggleValue('hair_loss'),
    pimples: getToggleValue('pimples'),
    fast_food: getToggleValue('fast_food'),
    exercise: getToggleValue('exercise')
  };

  var endpoint = '/predict';

  if (currentMode === 'advanced') {
    data.fsh = parseFloat(document.getElementById('fsh').value);
    data.lh = parseFloat(document.getElementById('lh').value);
    data.amh = parseFloat(document.getElementById('amh').value);
    data.tsh = parseFloat(document.getElementById('tsh').value);
    data.hemoglobin = parseFloat(document.getElementById('hemoglobin').value);
    endpoint = '/predict-advanced';
  }

  try {
    var resp = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (resp.status === 422) {
      alert('Please fill out all required fields properly.');
      btn.disabled = false;
      btn.textContent = 'Get Risk Assessment';
      return;
    }

    if (!resp.ok) throw new Error('Server error');

    var result = await resp.json();
    sessionStorage.setItem('screening_result', JSON.stringify(result));
    sessionStorage.setItem('screening_input', JSON.stringify(data));

    var user = auth.currentUser;
    if (user) {
      try {
        await db.collection('users').doc(user.uid).collection('records').add({
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          result: result,
          input: data
        });
      } catch (fsErr) {
        console.error('Failed to save to Firestore:', fsErr);
      }
    }

    window.location.href = 'results.html';
  } catch (err) {
    alert('Could not connect to the API server.');
    btn.disabled = false;
    btn.textContent = 'Get Risk Assessment';
  }
}

function calcBMI() {
  var w = parseFloat(document.getElementById('weight').value);
  var h = parseFloat(document.getElementById('height').value);
  var display = document.getElementById('bmiDisplay');
  if (w > 0 && h > 0) {
    var bmi = w / ((h / 100) * (h / 100));
    bmi = Math.round(bmi * 10) / 10;
    var label = '';
    if (bmi < 18.5) label = ' (Underweight)';
    else if (bmi < 25) label = ' (Normal)';
    else if (bmi < 30) label = ' (Overweight)';
    else label = ' (Obese)';
    display.textContent = bmi + label;
    return bmi;
  }
  display.textContent = '—';
  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
