const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can mark payments as paid.', flags: MessageFlags.Ephemeral });
  }

  const originalEmbed = interaction.message.embeds[0];
  const amountField = originalEmbed?.fields.find((f) => f.name.includes('Amount'));
  const forField = originalEmbed?.fields.find((f) => f.name.includes('For'));

  const amount = amountField ? parseFloat(amountField.value.replace(/[^0-9.]/g, '')) : 0;
  const label = forField && forField.value !== '—' ? forField.value : null;

  const updatedEmbed = EmbedBuilder.from(originalEmbed)
    .setColor(theme.success)
    .addFields({
      name: 'Status',
      value: `✅ Paid — confirmed by <@${interaction.user.id}> — <t:${Math.floor(Date.now() / 1000)}:f>`,
    });

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mark_paid').setLabel('Paid').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true)
  );

  await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });

  const logChannelId = config.paymentLogChannelId;
  if (!logChannelId) {
    console.warn('No PAYMENT_LOG_CHANNEL_ID or LOG_CHANNEL_ID configured; payment was not logged for /revenue.');
    return;
  }

  const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
  if (!logChannel) {
    console.warn('Payment log channel could not be fetched; payment was not logged for /revenue.');
    return;
  }

  const record = {
    amount,
    label,
    channel: interaction.channel.name,
    staff: interaction.user.id,
    ts: Date.now(),
  };

  await logChannel
    .send({ content: `\`\`\`json\n${JSON.stringify(record)}\n\`\`\`` })
    .catch((err) => console.error('Failed to log payment record:', err));
}

module.exports = { handle };
