const { SlashCommandBuilder } = require("discord.js");
const CroxyDB = require("croxydb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("disable")
    .setDescription("Botun mesajlara cevap vermesini durdurur."),
  async execute(interaction) {
    // Yalnızca sunucu yöneticisi kontrolü
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "Bu komutu kullanmak için yeterli izniniz yok.", ephemeral: true });
    }

    await interaction.reply("Bot mesajlara cevap vermeyi durdurdu.");
    
    // Dinleyici iptal edilecek
    interaction.client.removeAllListeners("messageCreate");
    
    // Aktif kanalı CroxyDB'den kaldır
    CroxyDB.delete(`activeChannel_${interaction.guild.id}`);
  },
};
