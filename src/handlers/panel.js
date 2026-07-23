const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const services = require('../data/services');
const config = require('../config');

const PANEL_TITLE = '📋 Studio Duo Commissions';

function buildPanel() {
  const serviceLines = Object.values(services)
    .map((s) => `${s.emoji} **${s.label}** — ${s.price ? `starting at $${s.price}` : 'custom quote'}`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle(PANEL_TITLE)
    .setColor(0x5865f2)
    .setDescription(
      `Want to commission custom work from Studio Duo? Click **Open Commission** below to get started.\n\n` +
        `**Our Services**\n${serviceLines}\n\n` +
        `Not sure which fits? Pick **Not sure / Other** and describe what you need — we'll follow up with a quote.`
    )
    .setFooter({ text: 'Starting prices are a baseline — final quotes depend on scope.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_commission')
      .setLabel('Open Commission')
      .setEmoji('🎟️')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row };
}

/**
 * Called once on bot startup. Makes sure the commissions channel has a pinned
 * panel embed with the Open Commission button. If one's already pinned there
 * (posted by this bot), it's left alone. If it's missing — first run, or someone
 * unpinned/deleted it — a fresh one is posted and pinned automatically.
 */
async function ensurePanel(client) {
  if (!config.commissionsChannelId) {
    console.warn('COMMISSIONS_CHANNEL_ID is not set; skipping panel setup.');
    return;
  }

  const channel = await client.channels.fetch(config.commissionsChannelId).catch((err) => {
    console.error('Could not fetch COMMISSIONS_CHANNEL_ID channel:', err.message);
    return null;
  });
  if (!channel) return;

  const pinned = await channel.messages.fetchPins().catch((err) => {
    console.error('Could not fetch pinned messages in commissions channel:', err.message);
    return null;
  });

  const alreadyPosted = pinned?.items.find(
    (item) => item.message.author.id === client.user.id && item.message.embeds[0]?.title === PANEL_TITLE
  );
  if (alreadyPosted) {
    console.log('Commission panel already pinned; leaving it as-is.');
    return;
  }

  const { embed, row } = buildPanel();
  const msg = await channel.send({ embeds: [embed], components: [row] });
  await msg.pin().catch((err) => console.warn('Could not pin panel message:', err.message));
  console.log('Posted and pinned a new commission panel.');
}

module.exports = { buildPanel, ensurePanel };
