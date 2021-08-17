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
        if (!data.cards || !data.cards.length) {
          let embed = new Discord.MessageEmbed()
            .setTitle("An Error Occured")
            .setDescription("Empty data or not a valid array")
            .setColor("DARK_RED");

          message.channel.send(embed);
          return;
        }

        let decks = JSON.parse(fs.readFileSync(`./data/decks.json`));
        let deckIndex = decks.findIndex(
          (d) =>
            d.number == data.number ||
            d.deckName.toLowerCase() == data.deckName.toLowerCase()
        );

        if (deckIndex == -1) {
          decks.push(data);
        } else {
          decks[deckIndex].cards = decks[deckIndex].cards.filter(
            (c) =>
              data.cards.map((d) => d.number).indexOf(c.number) == -1 &&
              data.cards.findIndex(
                (d) => d.name.toLowerCase() == c.name.toLowerCase()
              ) == -1
          );
          decks[deckIndex].cards.push(...data.cards);
        }
        fs.writeFileSync(`./data/decks.json`, JSON.stringify(decks, null, 4));

        let embed1 = new Discord.MessageEmbed()
          .setDescription(`${data.cards.length} cards added.`)
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
