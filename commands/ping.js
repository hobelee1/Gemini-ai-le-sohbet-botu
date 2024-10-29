const { SlashCommandBuilder } = require('discord.js');
const os = require('os');
module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping botu kontrol eder."),
    async execute(interaction) {
        const latency = Math.round(interaction.client.ws.ping);
        await interaction.reply(`Pong! Gecikme: ${latency}ms`);
    }
}

