const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('pino')();

dotenv.config();

// tempolary ไว้เช็คห้องที่ register ไว้
// read channel.json() and get id
const fs = require('fs');
const path = require('path');
const channelPath = path.join(__dirname, 'channel.json');
// console.log(`Reading channel.json from ${channelPath}`);
let channelData;
let channelID = [];
try {
    channelData = JSON.parse(fs.readFileSync(channelPath, 'utf8'));
    for (const channel of channelData) {
        if (!channel.id) {
            console.error(`Channel ID not found in channel.json`);
            process.exit(1);
        }
        channelID.push(channel.id);
    }
}

catch (err) {
    console.error(`Error reading channel.json: ${err}`);
    process.exit(1);
}
console.log(`Loaded channel IDs: ${channelID.join(', ')}`);
// console.log(`channel.json: ${JSON.stringify(channelData)}`);

// const channelID = ['1373865366492545085']

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
            edited: message.editedAt ? message.editedAt : null,
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