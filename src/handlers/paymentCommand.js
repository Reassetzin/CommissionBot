const { EmbedBuilder, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');
const paymentMethods = require('../data/paymentMethods');

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can post payment details.', flags: MessageFlags.Ephemeral });
  }

  const amount = interaction.options.getString('amount', true);
  const note = interaction.options.getString('note');

  const embed = new EmbedBuilder()
    .setTitle('💳 Payment Details')
    .setColor(theme.info)
    .setDescription(`**Amount due:** ${amount}${note ? `\n\n${note}` : ''}`)
    .addFields(paymentMethods.map((m) => ({ name: `${m.emoji} ${m.label}`, value: m.value, inline: true })))
    .setFooter({ text: 'Studio Duo Commissions' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = { handle };
