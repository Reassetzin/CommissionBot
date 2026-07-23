const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
const config = require('./config');

const panel = require('./handlers/panel');
const openCommission = require('./handlers/openCommission');
const selectService = require('./handlers/selectService');
const closeTicket = require('./handlers/closeTicket');

if (!config.token) {
  console.error('Missing DISCORD_TOKEN in your environment. Check .env / Railway variables.');
  process.exit(1);
}

// Guilds is the only intent required: buttons, select menus, and modals all
// arrive via interaction payloads, and channel.messages.fetch() (used for
// transcripts and for finding the pinned panel) works over REST without
// needing the privileged Message Content intent.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  await panel.ensurePanel(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === 'open_commission') {
      await openCommission.handle(interaction);
    } else if (interaction.isButton() && interaction.customId === 'close_ticket') {
      await closeTicket.handle(interaction);
    } else if (interaction.isStringSelectMenu() && interaction.customId === 'commission_select') {
      await selectService.handle(interaction);
    }
  } catch (err) {
    console.error('Interaction error:', err);
    const payload = { content: 'Something went wrong. Please try again or contact staff.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

client.login(config.token);
