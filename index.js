const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("./config.json");
const fs = require("fs");
const CroxyDB = require("croxydb");

// Discord bot istemcisini başlat
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();
const rest = new REST({ version: '9' }).setToken(config.token);

// Commands klasöründeki komutları yükleyin
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
const commands = []; // commands dizisini tanımlıyoruz

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON()); // Komutları JSON formatında diziye ekliyoruz
  client.commands.set(command.data.name, command); // Komutları collection'a ekliyoruz
}

// Slash komutlarını Discord'a kaydet
(async () => {
  try {
    console.log('Slash komutları yükleniyor...');

    await rest.put(
      Routes.applicationCommands(config.botId), // Bot ID'nizi kullanın
      { body: commands },
    );

    console.log('Slash komutları başarıyla yüklendi!');
  } catch (error) {
    console.error(error);
  }
})();

// Bot hazır olduğunda çalışacak kısım
client.once("ready", () => {
  console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
});

// Aktif kanalları kontrol etmek için bir nesne oluşturun
const activeChannels = {};

// Slash komutları dinleyici
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    // Eğer komut /active ise
    if (interaction.commandName === 'active') {
      activeChannels[interaction.channel.id] = true;
      await interaction.reply(`Bu kanalda bot aktif edildi.`);
    } 
    // Eğer komut /disable ise
    else if (interaction.commandName === 'disable') {
      activeChannels[interaction.channel.id] = false;
      await interaction.reply(`Bu kanalda bot devre dışı bırakıldı.`);
    } 
    // Diğer komutlar
    else {
      await command.execute(interaction);
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "Komutu çalıştırırken bir hata oluştu.", ephemeral: true });
  }
});

// Mesajları dinleyin ve bot etiketlenirse yanıt verin
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // Kanal aktif mi kontrol et
  if (!activeChannels[message.channel.id]) {
    return; // Kanal devre dışıysa hiçbir şey yapma
  }

  const prompt = message.mentions.has(client.user) 
    ? `Kullanıcı: ${message.content.replace(`<@${client.user.id}>`, '').trim()}` 
    : `Kullanıcı: ${message.content}`;

  const genAI = new GoogleGenerativeAI(config.geminiKey);

  try {
    const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // 'await' ekleniyor
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    // Yanıtın uzunluğunu kontrol et
    if (responseText.length > 2000) {
      // Yanıtı iki parçaya böl
      const firstPart = responseText.slice(0, 2000);
      const secondPart = responseText.slice(2000);

      await message.reply(firstPart);
      await message.reply(secondPart);
    } else {
      await message.reply(responseText || "Yanıt alınamadı, lütfen tekrar deneyin.");
    }
  } catch (error) {
    console.error("Hata:", error);
    await message.reply("Yanıt alınırken bir hata oluştu.");
  }
});

// Botu başlat
client.login(config.token);
