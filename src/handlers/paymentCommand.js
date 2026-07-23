const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');
const paymentMethods = require('../data/paymentMethods');

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can post payment details.', flags: MessageFlags.Ephemeral });
  }

  const amount = interaction.options.getNumber('amount', true);
  const label = interaction.options.getString('label');
  const note = interaction.options.getString('note');

  const embed = new EmbedBuilder()
    .setTitle('💳 Payment Details')
    .setColor(theme.info)
    .addFields(
      { name: '💰 Amount', value: `$${amount.toFixed(2)}`, inline: true },
      { name: '📌 For', value: label || '—', inline: true },
      ...paymentMethods.map((m) => ({ name: `${m.emoji} ${m.label}`, value: m.value, inline: true }))
    )
    .setFooter({ text: 'Studio Duo Commissions' })
    .setTimestamp();

  if (note) embed.setDescription(note);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mark_paid').setLabel('Mark as Paid').setEmoji('✅').setStyle(ButtonStyle.Success)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

module.exports = { handle };
