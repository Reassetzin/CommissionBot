const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const services = require('../data/services');
const { ticketChannelName } = require('../utils/sanitize');

async function handle(interaction) {
  // Guardrail: block opening a second ticket while one is already open.
  const existing = interaction.guild.channels.cache.find(
    (c) => c.name === ticketChannelName(interaction.user.username)
  );
  if (existing) {
    return interaction.reply({
      content: `You already have an open commission ticket: <#${existing.id}>. Please use that one, or ask staff to close it first.`,
      ephemeral: true,
    });
  }

  const options = Object.entries(services).map(([value, s]) => ({
    label: s.label,
    description: s.price ? `Starting at $${s.price}` : 'Tell us what you need',
    value,
    emoji: s.emoji,
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId('commission_select')
    .setPlaceholder('Select one or more services...')
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    content: 'What are you interested in commissioning? (You can pick more than one.)',
    components: [row],
    ephemeral: true,
  });
}

module.exports = { handle };
