function toggleSelect(btn) {
  var group = btn.parentElement;
  var buttons = group.querySelectorAll('.toggle-btn');
  buttons.forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function getToggleValue(field) {
  var selected = document.querySelector('[data-field="' + field + '"].selected');
  return selected ? parseInt(selected.getAttribute('data-value')) : 0;
}

async function submitScreening() {
  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';

  var data = {
    age: parseInt(document.getElementById('age').value),
    bmi: parseFloat(document.getElementById('bmi').value),
    cycle_length: parseInt(document.getElementById('cycle_length').value),
    period_duration: parseInt(document.getElementById('period_duration').value),
    irregular_periods: getToggleValue('irregular_periods'),
    weight_gain: getToggleValue('weight_gain'),
    skin_darkening: getToggleValue('skin_darkening'),
    hair_growth: getToggleValue('hair_growth'),
    hair_loss: getToggleValue('hair_loss'),
    pimples: getToggleValue('pimples'),
    exercise: getToggleValue('exercise'),
    fast_food: getToggleValue('fast_food')
  };

  try {
    var resp = await fetch(API_URL + '/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!resp.ok) throw new Error('Server error');

    var result = await resp.json();
    sessionStorage.setItem('screening_result', JSON.stringify(result));
    sessionStorage.setItem('screening_input', JSON.stringify(data));
    window.location.href = 'results.html';
  } catch (err) {
    alert('Could not connect to the prediction server. Make sure the backend is running.');
    btn.disabled = false;
    btn.textContent = 'Get Risk Assessment';
  }
}
