const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const theme = require('../data/theme');
const config = require('../config');

async function handle(interaction) {
  if (config.staffRoleId && !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can request feedback.', flags: MessageFlags.Ephemeral });
  }

  const embed = new EmbedBuilder()
    .setTitle("🌟 We'd love your feedback!")
    .setColor(theme.gold)
    .setDescription(
      "If you've got a minute, let us know how this commission went. It really helps us out and other people " +
        'deciding whether to commission us.'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('leave_review').setLabel('Leave a Review').setEmoji('⭐').setStyle(ButtonStyle.Success)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

module.exports = { handle };
