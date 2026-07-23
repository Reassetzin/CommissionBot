const { StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');

const STAR_OPTIONS = [
  { label: '⭐ 1 — Poor', value: '1' },
  { label: '⭐⭐ 2 — Fair', value: '2' },
  { label: '⭐⭐⭐ 3 — Good', value: '3' },
  { label: '⭐⭐⭐⭐ 4 — Great', value: '4' },
  { label: '⭐⭐⭐⭐⭐ 5 — Excellent', value: '5' },
];

async function handle(interaction) {
  const topic = interaction.channel.topic || '';
  const isTicketOpener = topic.includes(interaction.user.id);

  if (!isTicketOpener) {
    return interaction.reply({
      content: 'Only the person who opened this ticket can leave a review for it.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('review_stars')
    .setPlaceholder('Pick a star rating...')
    .addOptions(STAR_OPTIONS);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({ content: 'How would you rate this commission?', components: [row], flags: MessageFlags.Ephemeral });
}

module.exports = { handle };
