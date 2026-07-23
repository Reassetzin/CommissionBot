const { createCanvas } = require('@napi-rs/canvas');

const WIDTH = 700;
const HEIGHT = 380;
const PADDING = { top: 60, right: 40, bottom: 56, left: 56 };

function roundRectTop(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/**
 * Renders a dark-themed monthly revenue bar chart entirely locally (no
 * external service, no native canvas compile step — @napi-rs/canvas ships
 * prebuilt binaries). Returns a PNG Buffer ready to attach to a Discord message.
 */
function renderRevenueChart({ labels, data }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background, matching Discord's dark embed shade
  ctx.fillStyle = '#2b2d31';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = '#f2f3f5';
  ctx.font = 'bold 22px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('Monthly Revenue', PADDING.left, 20);

  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;
  const baseY = PADDING.top + chartH;

  const maxVal = Math.max(...data, 1);
  const scaleMax = maxVal * 1.25; // headroom so value labels never clip the top

  // Horizontal gridlines
  const gridLines = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa0a6';
  ctx.font = '12px sans-serif';
  for (let i = 0; i <= gridLines; i++) {
    const y = PADDING.top + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, y);
    ctx.lineTo(PADDING.left + chartW, y);
    ctx.stroke();

    const value = scaleMax - (scaleMax / gridLines) * i;
    ctx.textAlign = 'right';
    ctx.fillText(`$${Math.round(value)}`, PADDING.left - 10, y - 5);
  }

  // Bars
  const n = data.length;
  const slot = chartW / n;
  const barW = Math.min(56, slot * 0.55);

  data.forEach((value, i) => {
    const x = PADDING.left + slot * i + (slot - barW) / 2;
    const barH = scaleMax > 0 ? (value / scaleMax) * chartH : 0;
    const y = baseY - barH;
    const isCurrentMonth = i === n - 1;

    const gradient = ctx.createLinearGradient(0, y, 0, baseY);
    if (isCurrentMonth) {
      gradient.addColorStop(0, '#7dd3fc');
      gradient.addColorStop(1, '#0ea5e9');
    } else {
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(1, '#0284c7');
    }
    ctx.fillStyle = gradient;

    if (barH > 0) {
      roundRectTop(ctx, x, y, barW, Math.max(barH, 2), 8);
      ctx.fill();
    }

    // Value label above the bar
    ctx.fillStyle = '#f2f3f5';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${Math.round(value)}`, x + barW / 2, y - 20);

    // Month label below the axis
    ctx.fillStyle = isCurrentMonth ? '#7dd3fc' : '#9aa0a6';
    ctx.font = isCurrentMonth ? 'bold 13px sans-serif' : '13px sans-serif';
    ctx.fillText(labels[i], x + barW / 2, baseY + 12);
  });

  // Baseline
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(PADDING.left, baseY);
  ctx.lineTo(PADDING.left + chartW, baseY);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

module.exports = { renderRevenueChart };
