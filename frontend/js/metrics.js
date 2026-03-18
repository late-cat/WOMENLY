async function loadMetrics() {
  try {
    var resp = await fetch(API_URL + '/metrics');
    if (!resp.ok) throw new Error('Server not reachable');
    var m = await resp.json();

    document.getElementById('metricAccuracy').textContent = (m.accuracy * 100).toFixed(1) + '%';
    document.getElementById('metricPrecision').textContent = (m.precision * 100).toFixed(1) + '%';
    document.getElementById('metricRecall').textContent = (m.recall * 100).toFixed(1) + '%';
    document.getElementById('metricF1').textContent = (m.f1 * 100).toFixed(1) + '%';

    if (m.confusion_matrix) {
      document.getElementById('cm_tn').textContent = m.confusion_matrix[0][0];
      document.getElementById('cm_fp').textContent = m.confusion_matrix[0][1];
      document.getElementById('cm_fn').textContent = m.confusion_matrix[1][0];
      document.getElementById('cm_tp').textContent = m.confusion_matrix[1][1];
    }

    if (m.feature_importance) {
      var features = Object.keys(m.feature_importance);
      var values = Object.values(m.feature_importance);

      var pairs = features.map(function (f, i) { return { name: f, val: values[i] }; });
      pairs.sort(function (a, b) { return b.val - a.val; });

      new Chart(document.getElementById('featureChart'), {
        type: 'bar',
        data: {
          labels: pairs.map(function (p) { return p.name; }),
          datasets: [{
            label: 'Importance',
            data: pairs.map(function (p) { return p.val; }),
            backgroundColor: 'rgba(236, 72, 153, 0.3)',
            borderColor: 'rgba(236, 72, 153, 0.8)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { display: false } },
            y: { grid: { display: false } }
          }
        }
      });
    }
  } catch (err) {
    console.log('Could not load metrics:', err.message);
    var msg = '—';
    if (err.message.includes('503')) {
      msg = 'Model not trained';
    }
    document.getElementById('metricAccuracy').textContent = msg;
    document.getElementById('metricPrecision').textContent = msg;
    document.getElementById('metricRecall').textContent = msg;
    document.getElementById('metricF1').textContent = msg;
  }
}

loadMetrics();
