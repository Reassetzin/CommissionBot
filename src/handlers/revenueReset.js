const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can reset the revenue ledger.', flags: MessageFlags.Ephemeral });
  }

  const embed = new EmbedBuilder()
    .setTitle('⚠️ Reset Revenue Ledger?')
    .setColor(theme.closed)
    .setDescription(
      'This permanently deletes every logged payment record. `/revenue` will start back at $0 for all time ' +
        'ranges. **This cannot be undone.**'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_revenue_reset')
      .setLabel('Yes, reset everything')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('cancel_revenue_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
}

module.exports = { handle };
