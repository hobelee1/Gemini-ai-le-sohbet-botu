const { SlashCommandBuilder } = require("discord.js");
const CroxyDB = require("croxydb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("active")
    .setDescription("Botu aktif hale getirir."),
  async execute(interaction, model) {
    // Yalnızca sunucu yöneticisi kontrolü
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "Bu komutu kullanmak için yeterli izniniz yok.", ephemeral: true });
    }

    await interaction.reply("Bot aktif hale getirildi.");

    // Aktif kanal bilgilerini CroxyDB'ye kaydet
    CroxyDB.set(`activeChannel_${interaction.guild.id}`, interaction.channel.id);

    // Mesajlar dinlemeye başlama
    const messageHandler = async (message) => {
      if (message.author.bot) return;

      const prompt = message.content;
      const result = await model.generateContent(prompt);

      // Kullanıcının mesaj geçmişini kaydetme
      const userHistory = CroxyDB.get(`userHistory_${message.author.id}`) || [];
      userHistory.push({ content: message.content, timestamp: new Date() });
      CroxyDB.set(`userHistory_${message.author.id}`, userHistory);

      // Eğer DM ise, cevap ver
      if (message.channel.type === 'DM') {
        await message.reply(result.response.text());
      } else {
        // Sunucu kanalında ise yanıt ver
        await message.reply(result.response.text());
      }
    };

    // Mesaj dinleyicisini ayarla
    interaction.client.on("messageCreate", messageHandler);
  },
};

