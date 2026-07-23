const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('payment')
    .setDescription('Post payment details and links for the customer in this channel (staff only)')
    .addNumberOption((option) =>
      option.setName('amount').setDescription('Amount due in USD, e.g. 75.50').setRequired(true).setMinValue(0)
    )
    .addStringOption((option) =>
      option.setName('label').setDescription('What this is for, e.g. "50% deposit"').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('note').setDescription('Optional note for the customer').setRequired(false)
    )
    .setDefaultMemberPermissions(0), // hidden by default; grant to staff via Server Settings > Integrations
  new SlashCommandBuilder()
    .setName('revenue')
    .setDescription('See total confirmed payments (staff only)')
    .addStringOption((option) =>
      option
        .setName('period')
        .setDescription('Time range')
        .setRequired(false)
        .addChoices(
          { name: 'All time', value: 'all' },
          { name: 'Last 7 days', value: 'week' },
          { name: 'Last 30 days', value: 'month' }
        )
    )
    .setDefaultMemberPermissions(0),
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

    // If we're registering to a specific guild, wipe any leftover *global*
    // commands with the same names — otherwise switching from global to
    // guild-scoped (or back) leaves stale duplicates showing up in the "/"
    // picker until manually cleared.
    if (config.guildId) {
      const globalCommands = await rest.get(Routes.applicationCommands(config.clientId));
      const commandNames = new Set(commands.map((c) => c.name));
      const stale = globalCommands.filter((c) => commandNames.has(c.name));

      for (const c of stale) {
        await rest.delete(Routes.applicationCommand(config.clientId, c.id));
        console.log(`Removed stale global command: /${c.name}`);
      }
    }
  } catch (err) {
    console.error('Failed to register slash commands:', err);
  }
}

module.exports = { registerCommands, commands };
