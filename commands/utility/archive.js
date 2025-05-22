const { SlashCommandBuilder, MessageFlags, Attachment, AttachmentBuilder  } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('archive-message')
        .setDescription('Archive channel messages to a database'),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // const limit = interaction.options.getInteger('limit') || 100;
        // const includeBots = interaction.options.getBoolean('include-bots') || false;

        // Fetch messages
        const messages = await interaction.channel.messages.fetch();

        // Format messages as JSON
        // const messagesData = Array.from(messages.values()).map(msg => ({
        //     id: msg.id,
        //     content: msg.content,
        //     author: {
        //         id: msg.author.id,
        //         username: msg.author.username,
        //         tag: msg.author.tag,
        //         bot: msg.author.bot
        //     },
        //     timestamp: msg.createdAt.toISOString(),
        //     channel: {
        //         id: interaction.channel.id,
        //         name: interaction.channel.name
        //     },
        //     attachments: msg.attachments.map(att => ({
        //         url: att.url,
        //         name: att.name,
        //         contentType: att.contentType
        //     }))
        // }));

        const tableData = messages.map(msg => ({
                MessageID: msg.id,
                Content: msg.content,
                Author: msg.author.tag,
                AuthorID: msg.author.id,
                Timestamp: msg.createdAt.toISOString(),
                Channel: interaction.channel.name,
                ChannelID: interaction.channel.id,
                Attachments: msg.attachments.map(a => a.url),
                AttachmentType: msg.attachments.map(a => a.contentType),
                Edited: msg.editedAt ? msg.editedAt.toISOString() : null,
            }));

        // Send messages to n8n webhook
        // const payload = {
        //     service: 'archive-messages',
        //     timestamp: new Date().toISOString(),
        //     channelId: interaction.channel.id,
        //     guildId: interaction.guild.id,
        //     data: {
        //         messages: messagesData,
        //     }
        // };

        try {
            // Send the data to n8n
            // const response = await fetch(process.env.N8N_WEBHOOK, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(payload)
            // });

            // Send to your server via webhook
            for (const [index, chunk] of chunks.entries()) {
                
            }
            const response = await axios.post(process.env.N8N_WEBHOOK, {
                type: 'chat_export',
                service: 'archive-messages',
                server: interaction.guild.name,
                channel: interaction.channel.name,
                data: tableData
            });

            if (response.ok) {
                await interaction.editReply('Messages successfully archived!');
            } else {
                await interaction.editReply('Failed to archive messages.');
            }
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('There was an error processing your request.');
        }
    }
    
};