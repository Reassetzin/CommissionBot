const { EmbedBuilder, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');
const { fetchPaymentRecords } = require('../utils/paymentLedger');

const PERIOD_MS = {
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};
const PERIOD_LABELS = {
  all: 'All time',
  week: 'Last 7 days',
  month: 'Last 30 days',
};

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can check revenue.', flags: MessageFlags.Ephemeral });
  }

  const period = interaction.options.getString('period') || 'all';

  const logChannelId = config.paymentLogChannelId;
  if (!logChannelId) {
    return interaction.reply({
      content: 'No payment log channel is configured (set PAYMENT_LOG_CHANNEL_ID or LOG_CHANNEL_ID).',
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply();

  const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
  if (!logChannel) {
    return interaction.editReply('Could not access the configured payment log channel.');
  }

  const allRecords = await fetchPaymentRecords(logChannel);
  const cutoff = PERIOD_MS[period] ? Date.now() - PERIOD_MS[period] : null;
  const records = cutoff ? allRecords.filter((r) => r.ts >= cutoff) : allRecords;
  const total = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const embed = new EmbedBuilder()
    .setTitle('💰 Studio Duo Revenue')
    .setColor(theme.success)
    .addFields(
      { name: 'Period', value: PERIOD_LABELS[period] || 'All time', inline: true },
      { name: 'Payments', value: `${records.length}`, inline: true },
      { name: 'Total', value: `$${total.toFixed(2)}`, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { handle };
