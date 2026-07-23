// Run with `npm run deploy` any time you change command definitions.
// If GUILD_ID is set, commands register instantly to that server (good for dev).
// If it's blank, commands register globally, which can take up to ~1 hour to propagate.
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

if (!config.token || !config.clientId) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in your environment. Check .env / Railway variables.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('payment')
    .setDescription('Post payment details and links for the customer in this channel (staff only)')
    .addStringOption((option) =>
      option.setName('amount').setDescription('Amount due, e.g. "$75 (50% deposit)"').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('note').setDescription('Optional note for the customer').setRequired(false)
    )
    .setDefaultMemberPermissions(0), // hidden by default; grant to staff via Server Settings > Integrations
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    await rest.put(route, { body: commands });
    console.log(
      `Registered ${commands.length} command(s) ${config.guildId ? `to guild ${config.guildId}` : 'globally'}.`
    );
  } catch (err) {
    console.error('Failed to register commands:', err);
    process.exit(1);
  }
})();
