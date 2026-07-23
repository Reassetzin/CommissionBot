const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');

async function handle(interaction) {
  const topic = interaction.channel.topic || '';
  const isTicketOpener = topic.includes(interaction.user.id);

  if (!isTicketOpener) {
    return interaction.reply({
      content: 'Only the person who opened this ticket can agree to the terms.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const originalEmbed = interaction.message.embeds[0];
  const updatedEmbed = EmbedBuilder.from(originalEmbed).addFields({
    name: 'Status',
    value: `✅ Agreed by <@${interaction.user.id}> — <t:${Math.floor(Date.now() / 1000)}:f>`,
  });

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('tos_agree')
      .setLabel('Agreed')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true)
  );

  await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });
}

module.exports = { handle };
