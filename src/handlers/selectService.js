const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

async function handle(interaction) {
  // Carry the selected service keys forward on the modal's customId, since modals
  // can't hold hidden fields. Keys are short (see data/services.js) so this stays
  // well under Discord's 100-char customId limit even with all 5 selected.
  const serviceKeys = interaction.values.join(',');

  const modal = new ModalBuilder()
    .setCustomId(`commission_modal|${serviceKeys}`)
    .setTitle('Commission Details');

  const budget = new TextInputBuilder()
    .setCustomId('budget')
    .setLabel('Budget range')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. $100 - $150')
    .setRequired(true)
    .setMaxLength(100);

  const deadline = new TextInputBuilder()
    .setCustomId('deadline')
    .setLabel('Deadline')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Flexible, or Aug 15')
    .setRequired(true)
    .setMaxLength(100);

  const description = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('Project description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Tell us what you need, references, style, etc.')
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(budget),
    new ActionRowBuilder().addComponents(deadline),
    new ActionRowBuilder().addComponents(description)
  );

  await interaction.showModal(modal);
}

module.exports = { handle };
