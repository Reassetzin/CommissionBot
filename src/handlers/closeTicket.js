const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const config = require('../config');
const { buildTranscript } = require('../utils/transcript');

async function handle(interaction) {
  if (!config.staffRoleId || !interaction.member.roles.cache.has(config.staffRoleId)) {
    return interaction.reply({ content: 'Only staff can close tickets.', flags: MessageFlags.Ephemeral });
  }

  await interaction.reply({ content: '🔒 Closing this ticket and saving a transcript...' });

  const channel = interaction.channel;
  const transcriptText = await buildTranscript(channel);

  if (config.logChannelId) {
    const logChannel = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);

    if (logChannel) {
      const attachment = new AttachmentBuilder(Buffer.from(transcriptText, 'utf-8'), {
        name: `${channel.name}-transcript.txt`,
      });

      const logEmbed = new EmbedBuilder()
        .setTitle('🗒️ Commission Ticket Closed')
        .setColor(0xed4245)
        .addFields(
          { name: 'Channel', value: `#${channel.name}`, inline: true },
          { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Ticket info', value: channel.topic || 'N/A', inline: false }
        )
        .setTimestamp();

      await logChannel
        .send({ embeds: [logEmbed], files: [attachment] })
        .catch((err) => console.error('Failed to send transcript to log channel:', err));
    } else {
      console.warn('LOG_CHANNEL_ID is set but the channel could not be found; skipping transcript log.');
    }
  } else {
    console.warn('LOG_CHANNEL_ID is not configured; skipping transcript log.');
  }

  setTimeout(() => {
    channel.delete('Commission ticket closed').catch((err) => console.error('Failed to delete ticket channel:', err));
  }, 5000);
}

module.exports = { handle };
