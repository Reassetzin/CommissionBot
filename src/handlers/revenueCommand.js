const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');
const { fetchPaymentRecords } = require('../utils/paymentLedger');
const { renderRevenueChart } = require('../utils/chart');

const PERIOD_MS = {
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};
const PERIOD_LABELS = {
  all: 'All time',
  week: 'Last 7 days',
  month: 'Last 30 days',
};

/** Buckets records into the last 6 calendar months, oldest first. */
function bucketByMonth(records) {
  const now = new Date();
  const buckets = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-US', { month: 'short' }),
      total: 0,
    });
  }

  for (const r of records) {
    const d = new Date(r.ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.total += Number(r.amount) || 0;
  }

  return buckets;
}

function trendLine(buckets) {
  const current = buckets[buckets.length - 1].total;
  const previous = buckets[buckets.length - 2].total;

  if (current === 0 && previous === 0) return '📊 No payments logged in the last two months yet.';
  if (previous === 0) return `📈 First payments this month: **$${current.toFixed(2)}**`;

  const diff = current - previous;
  const pct = (diff / previous) * 100;
  const arrow = diff >= 0 ? '📈' : '📉';
  const sign = diff >= 0 ? '+' : '−';

  return `${arrow} **${sign}$${Math.abs(diff).toFixed(2)}** (${sign}${Math.abs(pct).toFixed(0)}%) vs. last month`;
}

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can check revenue.', flags: MessageFlags.Ephemeral });
  }

  const period = interaction.options.getString('period') || 'all';

  if (!config.paymentLogChannelId) {
    return interaction.reply({
      content: 'No payment log channel is configured (set PAYMENT_LOG_CHANNEL_ID or LOG_CHANNEL_ID).',
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply();

  const logChannel = await interaction.guild.channels.fetch(config.paymentLogChannelId).catch(() => null);
  if (!logChannel) {
    return interaction.editReply('Could not access the configured payment log channel.');
  }

  const allRecords = await fetchPaymentRecords(logChannel);
  const cutoff = PERIOD_MS[period] ? Date.now() - PERIOD_MS[period] : null;
  const records = cutoff ? allRecords.filter((r) => r.ts >= cutoff) : allRecords;
  const total = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const buckets = bucketByMonth(allRecords); // chart always shows the full 6-month trend, independent of the period filter
  const chartBuffer = renderRevenueChart({
    labels: buckets.map((b) => b.label),
    data: buckets.map((b) => Math.round(b.total * 100) / 100),
  });
  const chartAttachment = new AttachmentBuilder(chartBuffer, { name: 'revenue-chart.png' });

  const embed = new EmbedBuilder()
    .setTitle('💰 Studio Duo Revenue')
    .setColor(theme.success)
    .setDescription(trendLine(buckets))
    .addFields(
      { name: '📅 Period', value: PERIOD_LABELS[period] || 'All time', inline: true },
      { name: '🧾 Payments', value: `${records.length}`, inline: true },
      { name: '💵 Total', value: `$${total.toFixed(2)}`, inline: true }
    )
    .setImage('attachment://revenue-chart.png')
    .setFooter({ text: 'Studio Duo Commissions • Monthly totals, last 6 months' })
    .setTimestamp();

  const guildIcon = interaction.guild.iconURL({ size: 128 });
  if (guildIcon) embed.setThumbnail(guildIcon);

  await interaction.editReply({ embeds: [embed], files: [chartAttachment] });
}

module.exports = { handle };
