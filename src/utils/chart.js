/**
 * Builds a QuickChart.io URL for a dark-themed bar chart, styled to match
 * Discord's embed background so text/gridlines stay readable. No native
 * canvas dependency needed — QuickChart renders the PNG server-side and we
 * just link to it from the embed's image.
 */
function buildBarChartUrl({ labels, data, label = 'Revenue ($)', color = '#38bdf8' }) {
  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: color,
          borderRadius: 6,
          maxBarThickness: 48,
        },
      ],
    },
    options: {
      color: '#e5e7eb',
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Monthly Revenue', color: '#e5e7eb', font: { size: 16 } },
      },
      scales: {
        x: { ticks: { color: '#e5e7eb' }, grid: { display: false } },
        y: {
          ticks: { color: '#e5e7eb', callback: 'function(v) { return "$" + v; }' },
          grid: { color: 'rgba(255,255,255,0.08)' },
          beginAtZero: true,
        },
      },
    },
  };

  const params = new URLSearchParams({
    c: JSON.stringify(config),
    backgroundColor: '#2b2d31',
    width: '600',
    height: '320',
    devicePixelRatio: '2',
  });

  return `https://quickchart.io/chart?${params.toString()}`;
}

module.exports = { buildBarChartUrl };
