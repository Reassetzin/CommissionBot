const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

async function handle(interaction) {
  const rating = interaction.values[0];

  const modal = new ModalBuilder().setCustomId(`review_modal|${rating}`).setTitle('Leave a Review');

  const reviewText = new TextInputBuilder()
    .setCustomId('review_text')
    .setLabel('Tell us about your experience')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('What did you commission, how did it go, anything else you want to share...')
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(new ActionRowBuilder().addComponents(reviewText));

  await interaction.showModal(modal);
}

module.exports = { handle };
