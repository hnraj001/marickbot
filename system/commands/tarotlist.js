const Discord = require("discord.js");
const functions = require("../functions");
const config = require("../../data/config.json");

module.exports = {
  /**
   *
   * @param {Discord.Message} message
   */
  async execute(message) {
    let decks = await functions.getDecks();
    let embed = new Discord.MessageEmbed()
      .setTitle("Tarot Deck List")
      .setColor("DARK_BLUE")
      .addField("Number", decks.map((d) => `${d.number}`).join("\n"), true)
      .addField("Deck Name", decks.map((d) => `${d.name}`).join("\n"), true);

    message.channel.send(embed);
    return;
  },
};
