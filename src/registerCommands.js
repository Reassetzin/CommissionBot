const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

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

/**
 * Registers slash commands with Discord. Safe to call on every boot — it's
 * idempotent (re-registering the same commands is a no-op from Discord's
 * side) and non-fatal if CLIENT_ID isn't set yet, so it never blocks the bot
 * from starting up and handling buttons/tickets even if this step fails.
 */
async function registerCommands() {
  if (!config.clientId) {
    console.warn('CLIENT_ID is not set; skipping slash command registration (/payment will not be available).');
    return;
  }

  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    await rest.put(route, { body: commands });
    console.log(
      `Registered ${commands.length} slash command(s) ${config.guildId ? `to guild ${config.guildId}` : 'globally'}.`
    );
  } catch (err) {
    console.error('Failed to register slash commands:', err);
  }
}

module.exports = { registerCommands, commands };
