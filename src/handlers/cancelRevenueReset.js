async function handle(interaction) {
  await interaction.update({ content: 'Cancelled — no changes made.', embeds: [], components: [] });
}

module.exports = { handle };
