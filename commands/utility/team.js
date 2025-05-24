const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// load env variables
require('dotenv').config();


// show team info 
module.exports = {
    data: new SlashCommandBuilder()
        .setName('team')
        .setDescription('Show your team information'),
    async execute(interaction) {
        
        // send message to n8n then get response send to discord
        await interaction.deferReply();
        
        const payload = {
            service: 'team',
            channelId: interaction.channelId,
            guildId: interaction.guildId,
        };

        try {
            // Send the data to n8n
            const response = await fetch(process.env.N8N_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                // Check if the response contains the expected data
                const result = data.result;

                await interaction.editReply(result.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
            } else {
                await interaction.editReply('Failed to get team information from n8n.');
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            await interaction.editReply(`There was an error processing your request. ${error.message}`);
        }
    },
};