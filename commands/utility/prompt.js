const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const dotenv = require('dotenv');
const logger = require('pino')();
const axios = require('axios');
dotenv.config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prompt')
        .setDescription('ทดสอบการทำงานของบอท')
        .addStringOption(option =>
            option.setName('คำสั่งทดสอบ')
                .setDescription('prompt ที่ต้องการทดสอบ')
                .setRequired(true)
        ),
    async execute(interaction) {
        const prompt = interaction.options.getString('คำสั่งทดสอบ');
        const channel = interaction.channel;
        const channelName = channel.name;
        const channelId = channel.id; 

        logger.info(`Processing prompt from ${interaction.user.username}: ${prompt.substring(0, 50)}...`);
        const payload = {
            service: 'prompt',
            timestamp: new Date().toISOString(),
            data: {
                id: channelId, 
                prompt: prompt,  
                user: {
                    id: interaction.user.id,
                    username: interaction.user.username,
                }, 
                guild: {
                    id: interaction.guild.id,
                    name: interaction.guild.name
                }
            }
        }

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Send the data to n8n
            
            const response = await fetch(process.env.N8N_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            logger.info(`status: ${response.status} ${response.statusText}`);


            if (response.ok) {
                const data = await response.json();

                logger.info(`response from n8n: ${JSON.stringify(data)}`);
                // Check if the response contains the expected data
                const result = data.result;

                await interaction.editReply(result.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
            } else {
                await interaction.editReply('Failed to send prompt.');
            }
        } catch (error) {
            console.error('Error sending prompt:', error);
            await interaction.editReply('An error occurred while sending the prompt.');
        }
    }

    };