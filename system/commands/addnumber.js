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
    if (!message.attachments || !message.attachments.size) {
      message.channel.send(
        "> :x: You didn't attach any file with your message."
      );
      return;
    }

    let file = message.attachments.first();
    let data = null;
    try {
      functions.downloadAttachment(file.url, "./data/tmp.json");
      setTimeout(() => {
        let read_data = fs.readFileSync("./data/tmp.json");
        data = JSON.parse(read_data);
        if (!data.length) {
          let embed = new Discord.MessageEmbed()
            .setTitle("An Error Occured")
            .setDescription("Empty data or not a valid array")
            .setColor("DARK_RED");

          message.channel.send(embed);
          return;
        }

        let guildid = message.guild.id;
        let guildSettings = {
          guildId: message.guild.id,
          multiq: [],
          singleq: [],
          imageq: [],
          numbersq: data,
        };
        if (fs.existsSync(`./data/guilds/${guildid}.json`)) {
          guildSettings = JSON.parse(
            fs.readFileSync(`./data/guilds/${guildid}.json`)
          );
          guildSettings.numbersq.push(...data);
        }

        fs.writeFileSync(
          `./data/guilds/${guildid}.json`,
          JSON.stringify(guildSettings, null, 4)
        );

        let embed1 = new Discord.MessageEmbed()
          .setDescription(`${data.length} questions added.`)
          .setColor("DARK_GREEN");

        message.channel.send(embed1);
      }, 5000);
    } catch (err) {
      let embed = new Discord.MessageEmbed()
        .setTitle("An Error Occured")
        .setDescription(err)
        .setColor("DARK_RED");

      message.channel.send(embed);
    }
  },
};
