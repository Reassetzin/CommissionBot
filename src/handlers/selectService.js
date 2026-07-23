const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const services = require('../data/services');
const { ticketChannelName } = require('../utils/sanitize');

async function handle(interaction) {
  const selectedKeys = interaction.values;
  const channelName = ticketChannelName(interaction.user.username);

  // Early check for a nicer UX — the real guardrail is re-checked on confirm.
  const existing = interaction.guild.channels.cache.find((c) => c.name === channelName);
  if (existing) {
    return interaction.update({
      content: `You already have an open commission ticket: <#${existing.id}>.`,
      components: [],
    });
  }

  const selectedServices = selectedKeys.map((k) => services[k]).filter(Boolean);
  const summaryLines = selectedServices
    .map((s) => `${s.emoji} **${s.label}** — ${s.price ? `starting at $${s.price}` : 'custom quote'}`)
    .join('\n');

  // Rebuild the menu with the current picks marked as default, so it stays
  // visually in sync and the person can still change their selection.
  const menu = new StringSelectMenuBuilder()
    .setCustomId('commission_select')
    .setPlaceholder('Select one or more services...')
    .setMinValues(1)
    .setMaxValues(Object.keys(services).length)
    .addOptions(
      Object.entries(services).map(([value, s]) => ({
        label: s.label,
        description: s.price ? `Starting at $${s.price}` : 'Tell us what you need',
        value,
        emoji: s.emoji,
        default: selectedKeys.includes(value),
      }))
    );

  const selectRow = new ActionRowBuilder().addComponents(menu);
  const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_commission|${selectedKeys.join(',')}`)
      .setLabel('Confirm & Open Ticket')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
  );

  await interaction.update({
    content: `**You selected:**\n${summaryLines}\n\nChange your selection above if needed, or confirm below to open your ticket.`,
    components: [selectRow, confirmRow],
  });
}

module.exports = { handle };
