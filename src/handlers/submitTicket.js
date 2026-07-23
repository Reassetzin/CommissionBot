const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const services = require('../data/services');
const config = require('../config');
const { ticketChannelName } = require('../utils/sanitize');

async function handle(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const serviceKeys = interaction.customId.split('|')[1]?.split(',').filter(Boolean) || [];
  const selectedServices = serviceKeys.map((k) => services[k]).filter(Boolean);

  const channelName = ticketChannelName(interaction.user.username);

  // Re-check for an existing ticket here too, in case one was opened in the
  // window between the button click and modal submit (race condition guardrail).
  const existing = interaction.guild.channels.cache.find((c) => c.name === channelName);
  if (existing) {
    return interaction.editReply({
      content: `You already have an open commission ticket: <#${existing.id}>.`,
    });
  }

  const budget = interaction.fields.getTextInputValue('budget');
  const deadline = interaction.fields.getTextInputValue('deadline');
  const description = interaction.fields.getTextInputValue('description');

  const overwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      // Without this, the @everyone deny above blocks the bot too (unless it
      // happens to have server-wide Administrator), so it can create the
      // channel but then fail to post the summary embed into it.
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];
  if (config.staffRoleId) {
    overwrites.push({
      id: config.staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  let channel;
  try {
    channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: config.commissionsCategoryId || undefined,
      topic: `Commission ticket opened by ${interaction.user.id} (${interaction.user.tag})`,
      permissionOverwrites: overwrites,
    });
  } catch (err) {
    console.error('Failed to create ticket channel:', err);
    return interaction.editReply({
      content:
        'Something went wrong creating your ticket channel. Please contact staff directly, or try again in a moment.',
    });
  }

  const serviceLines =
    selectedServices
      .map((s) => `${s.emoji} **${s.label}** — ${s.price ? `starting at $${s.price}` : 'custom quote'}`)
      .join('\n') || 'None specified';

  const numericTotal = selectedServices.reduce((sum, s) => (s.price ? sum + s.price : sum), 0);
  const hasCustomQuote = selectedServices.some((s) => s.price === null);
  const totalLine = hasCustomQuote
    ? numericTotal > 0
      ? `$${numericTotal}+ (plus a custom quote item)`
      : 'Custom quote needed'
    : `$${numericTotal}`;

  const summaryEmbed = new EmbedBuilder()
    .setTitle('🎟️ New Commission Request')
    .setColor(0x57f287)
    .addFields(
      { name: 'Requested by', value: `<@${interaction.user.id}>`, inline: false },
      { name: 'Service(s)', value: serviceLines, inline: false },
      { name: 'Starting total', value: totalLine, inline: true },
      { name: 'Budget range', value: budget, inline: true },
      { name: 'Deadline', value: deadline, inline: true },
      { name: 'Description', value: description, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'Studio Duo Commissions' });

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  const pingContent = config.notifyRoleId ? `<@&${config.notifyRoleId}> new commission ticket:` : undefined;

  await channel.send({ content: pingContent, embeds: [summaryEmbed], components: [closeRow] });

  await interaction.editReply({ content: `Your commission ticket has been created: <#${channel.id}>` });
}

module.exports = { handle };
