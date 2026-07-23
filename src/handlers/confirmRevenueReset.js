const { MessageFlags } = require('discord.js');
const config = require('../config');
const { fetchPaymentMessages } = require('../utils/paymentLedger');

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can reset the revenue ledger.', flags: MessageFlags.Ephemeral });
  }

  await interaction.update({ content: '🗑️ Deleting payment records...', embeds: [], components: [] });

  if (!config.paymentLogChannelId) {
    return interaction.followUp({
      content: 'No payment log channel is configured — nothing to reset.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const logChannel = await interaction.guild.channels.fetch(config.paymentLogChannelId).catch(() => null);
  if (!logChannel) {
    return interaction.followUp({
      content: 'Could not access the configured payment log channel.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const messages = await fetchPaymentMessages(logChannel);
  if (messages.length === 0) {
    return interaction.followUp({ content: 'No payment records found — nothing to reset.', flags: MessageFlags.Ephemeral });
  }

  const now = Date.now();
  const recent = messages.filter((m) => now - m.createdTimestamp < FOURTEEN_DAYS_MS);
  const old = messages.filter((m) => now - m.createdTimestamp >= FOURTEEN_DAYS_MS);

  // Discord's bulk delete only works on messages under 14 days old, and only
  // up to 100 at a time.
  for (let i = 0; i < recent.length; i += 100) {
    const chunk = recent.slice(i, i + 100);
    await logChannel.bulkDelete(chunk, true).catch((err) => console.error('Bulk delete failed:', err));
  }

  // Anything older has to be deleted one at a time, gently paced to avoid rate limits.
  for (const m of old) {
    await m.delete().catch((err) => console.error('Failed to delete old payment record:', err));
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  await interaction.followUp({
    content: `✅ Deleted ${messages.length} payment record(s). Revenue is back to $0.`,
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { handle };
