const Discord = require("discord.js");
const functions = require("../functions");
const config = require("../../data/config.json");

module.exports = {
  /**
   *
   * @param {Discord.Message} message
   */
  async execute(message) {
    let args = message.content
      .toLowerCase()
      .split(" ")
      .slice(1)
      .filter((s) => s != "");
    if (args.length != 2 || isNaN(args[0]) || isNaN(args[1])) {
      let embed = new Discord.MessageEmbed()
        .setTitle("Invalid Arguments")
        .setColor("DARK_RED")
        .setDescription(
          `:warning: Please make sure arguments are correct.  Command syntax: \`${config.prefix}tarot <deck number> <number of cards>\``
        );
      message.channel.send(embed);
      return;
    }
    let deckNumber = parseInt(args[0]);
    let numberOfCards = parseInt(args[1]);

    if (numberOfCards > 10) {
      let embed = new Discord.MessageEmbed()
        .setColor("DARK_RED")
        .setDescription(
          `:warning: You cannot pick more than 10 cards at a time.`
        );
      message.channel.send(embed);
      return;
    }
    let { cards, deckName } = await functions.pickTarot(
      deckNumber,
      numberOfCards
    );
    if (!cards) {
      let decks = await functions.getDecks();
      let embed = new Discord.MessageEmbed()
        .setTitle("Invalid Deck")
        .setColor("DARK_RED")
        .addField("Number", decks.map((d) => `${d.number}`).join("\n"), true)
        .addField("Deck Name", decks.map((d) => `${d.name}`).join("\n"), true)
        .setDescription(
          `:warning: Please make sure the deck number is from this given list.`
        );
      message.channel.send(embed);
      return;
    }

    for (let i = 0; i < cards.length; ++i) {
      let c = cards[i];
      let embed = new Discord.MessageEmbed()
        .setTitle(`Card #${c.number} | ${c.name}`)
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setImage(c.image)
        .setColor("DARK_BLUE")
        .setDescription(c.meaning)
        .setFooter(`from "${deckName}"`);
      message.channel.send(embed);
    }
  },
};
