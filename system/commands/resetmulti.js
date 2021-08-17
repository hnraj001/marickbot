const Discord = require("discord.js");
const functions = require("../functions");
const fs = require("fs");

module.exports = {
  /**
   *
   * @param {Discord.Message} message
   */
  async execute(message) {
    if (!message.member.permissions.has("MANAGE_GUILD")) return;

    let guildid = message.guild.id;

    if (fs.existsSync(`./data/guilds/${guildid}.json`)) {
      let guildSettings = JSON.parse(
        fs.readFileSync(`./data/guilds/${guildid}.json`)
      );
      guildSettings.multiq = [];
      fs.writeFileSync(
        `./data/guilds/${guildid}.json`,
        JSON.stringify(guildSettings, null, 4)
      );
    }

    let embed1 = new Discord.MessageEmbed()
      .setDescription(`Multi style questions cleared.`)
      .setColor("DARK_GREEN");
    message.channel.send(embed1);
  },
};
