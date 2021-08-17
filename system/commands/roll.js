const Discord = require("discord.js");
const functions = require("../functions");

module.exports = {
  async execute(message) {
    functions.rollDice(message.channel, message.author);
  },
};
