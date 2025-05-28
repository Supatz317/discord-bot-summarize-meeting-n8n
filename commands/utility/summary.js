const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('pino')();

// load env variables
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summary-daily')
        .setDescription('Get a summary of the daily messages [manually]')  
        .addStringOption(option =>
            option.setName('date')
                .setDescription('The date to summarize')
                .setRequired(false)),
    async execute(interaction) {
        // send message to n8n then get response send to discord
        await interaction.deferReply();
        const date = interaction.options.getString('date') || new Date().toISOString().split('T')[0]; // Default to today if no date is provided
        logger.info(`Date: ${date}`);


        const payload = {
            service: 'summary',
            date: date,
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
            logger.info(`status: ${response.status} ${response.statusText}`);
            if (response.ok) {
                const data = await response.json();
                // Check if the response contains the expected data
                logger.info(`Response from n8n: ${JSON.stringify(data)}`);
                const result = data.result

                await interaction.editReply(result.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
            } else {
                await interaction.editReply('Failed to get summary from n8n.');
            }
        } catch (error) {
            logger.error(`Error: ${error.message}` );
            await interaction.editReply({
                content: `There was an error processing your request. ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};