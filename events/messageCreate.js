const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('pino')();

dotenv.config();

// mock channel ID
const channelID = ['1373865366492545085']

async function sendToN8n(data) {
  try {
    const response = await axios.post(process.env.N8N_WEBHOOK, data, { timeout: 5000 });
    logger.info(`Successfully sent message ${data.id} to n8n`);
    return true;
  } catch (error) {
    logger.error(`Failed to send to n8n: ${error.message}`);
    return false;
  }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return; 
        if (!channelID.includes(message.channel.id)) return;

        logger.info(`Processing message from ${message.author.username}: ${message.content.substring(0, 50)}...`);

        // Prepare data for n8n
        const messageData = {
            service: 'new-message',
            id: message.id,
            content: message.content,
            author: {
                id: message.author.id,
                username: message.author.username,
                global_name: message.author.globalName,
                server_name: message.author.displayName,
                discriminator: message.author.discriminator,
                bot: message.author.bot,
                avatar: message.author.avatarURL() || null
            }, 
            channel: {
                id: message.channel.id,
                name: message.channel.name,
                category: message.channel.parent?.name || null
            },
            guild: message.guild ? {
                id: message.guild.id,
                name: message.guild.name
            } : null,
            timestamp: message.createdAt.toISOString(),
            edited: message.editedAt ? message.editedAt.toISOString() : null,
            attachments: message.attachments.map(a => ({
                filename: a.name,
                url: a.url,
                size: a.size
            })),
            embeds: message.embeds.length > 0,
            mention_count: message.mentions.users.size,
            reference: message.reference ? {
                message_id: message.reference.messageId,
                channel_id: message.reference.channelId,
                guild_id: message.reference.guildId
            } : null
        };

        // Send to n8n
        if (!await sendToN8n(messageData)) {
            logger.warn(`Failed to process message ${message.id}`);
        }

    }
};