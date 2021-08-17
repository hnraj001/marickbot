const Discord = require("discord.js");
const client = new Discord.Client({ fetchAllMembers: true });
require("discord-buttons")(client);
const disbut = require("discord-buttons");

const config = require("./data/config.json");
const { token, prefix } = config;

const functions = require("./system/functions");
const roll = require("./system/commands/roll");
const addmulti = require("./system/commands/addmulti");
const addsingle = require("./system/commands/addsingle");
const addimage = require("./system/commands/addimage");
const addnumber = require("./system/commands/addnumber");
const resetmulti = require("./system/commands/resetmulti");
const resetsingle = require("./system/commands/resetsingle");
const resetimage = require("./system/commands/resetimage");
const resetnumber = require("./system/commands/resetnumber");
const tarotlist = require("./system/commands/tarotlist");
const tarot = require("./system/commands/tarot");
const addtarot = require("./system/commands/addtarot");

client.on("ready", async () => {
  console.log(`[${new Date()}] Bot online`);

  client.api
    .applications(client.user.id)
    .guilds(client.guilds.cache.first().id)
    .commands.post({
      data: {
        name: "startquiz",
        description: "Starts a new quiz/game",
        options: [
          {
            name: "type",
            description: "Quiz type.",
            type: 3,
            choices: [
              {
                name: "Multi style",
                value: "multi",
              },
              {
                name: "Single answer",
                value: "single",
              },
              {
                name: "Image",
                value: "image",
              },
              {
                name: "Numbers",
                value: "numbers",
              },
            ],
            required: true,
          },
          {
            name: "questions",
            description: "Number of questions (Optional)",
            type: 4,
            required: false,
          },
          {
            name: "minutes",
            description: "Minutes until quiz starts (Optional)",
            type: 4,
            required: false,
          },
        ],
        // possible options here e.g. options: [{...}]
      },
    });

  client.api
    .applications(client.user.id)
    .guilds(client.guilds.cache.first().id)
    .commands.post({
      data: {
        name: "announce",
        description: "Sends an announcement to a specific channel",
        options: [
          {
            name: "message",
            description: "The main message for announcement.",
            type: 3,
            required: true,
          },
          {
            name: "color",
            description: "The color for message. (i.e. DARK_GREEN or 	#006400)",
            type: 3,
            required: true,
          },
          {
            name: "channel",
            description: "The channel where message should be sent.",
            type: 7,
            required: true,
          },
          {
            name: "role_mention",
            description:
              "The role to mention (leave the optional parameter to avoid mentioning).",
            type: 8,
            required: false,
          },
          {
            name: "title",
            description: "The optional title.",
            type: 3,
            required: false,
          },
        ],
        // possible options here e.g. options: [{...}]
      },
    });
});

client.on("message", (message) => {
  if (message.author.bot || message.guild == null) return;
  msg = message.content.toLowerCase();
  md = message.content.split(" ");

  if (md[0] == `${prefix}roll`) {
    roll.execute(message);
  }

  if (md[0] == `${prefix}addmulti`) {
    addmulti.execute(message);
  }
  if (md[0] == `${prefix}addsingle`) {
    addsingle.execute(message);
  }
  if (md[0] == `${prefix}addimage`) {
    addimage.execute(message);
  }
  if (md[0] == `${prefix}addnumber`) {
    addnumber.execute(message);
  }

  if (md[0] == `${prefix}resetmulti`) {
    resetmulti.execute(message);
  }
  if (md[0] == `${prefix}resetsingle`) {
    resetsingle.execute(message);
  }
  if (md[0] == `${prefix}resetimage`) {
    resetimage.execute(message);
  }
  if (md[0] == `${prefix}resetnumber`) {
    resetnumber.execute(message);
  }
  if (md[0] == `${prefix}tarotlist`) {
    tarotlist.execute(message);
  }
  if (md[0] == `${prefix}tarot`) {
    tarot.execute(message);
  }
  if (md[0] == `${prefix}addtarot`) {
    addtarot.execute(message);
  }
});

client.ws.on("INTERACTION_CREATE", async (interaction) => {
  if (interaction.type != 2) return;
  const command = interaction.data.name.toLowerCase();
  const args = interaction.data.options;
  let memberId = interaction.member.user.id;
  let guild = client.guilds.cache.get(interaction.guild_id);
  let member = guild.members.resolve(memberId);
  if (!member.permissions.has("MANAGE_GUILD")) return;
  let channelId = interaction.channel_id;
  let channel = guild.channels.resolve(channelId);
  if (command === "startquiz") {
    let type = args[0].value;

    if (type == "multi") {
      let questions = args[1] ? args[1].value : 10;
      questions = parseInt(questions);
      let minutes = args[2] ? args[2].value : 2;
      minutes = parseInt(minutes);
      functions.startMultiGame(channel, questions, minutes);
    } else if (type == "single") {
      let questions = args[1] ? args[1].value : 10;
      questions = parseInt(questions);
      let minutes = args[2] ? args[2].value : 2;
      minutes = parseInt(minutes);
      functions.startSingleGame(channel, questions, minutes);
    } else if (type == "image") {
      let questions = args[1] ? args[1].value : 6;
      questions = parseInt(questions);
      let minutes = args[2] ? args[2].value : 2;
      functions.startImageGame(channel, questions, minutes);
    } else if (type == "numbers") {
      functions.startNumberGame(channel);
    }
  }

  if (command === "announce") {
    let desc = args[0].value;
    let color = args[1].value;
    let channelId = args[2].value;
    let roleMention = args[3] ? args[3].value : null;
    let title = args[4] ? args[4].value : null;

    let embed = new Discord.MessageEmbed().setDescription(desc).setColor(color);
    if (title) embed.setTitle(title);
    let channel = guild.channels.resolve(channelId);
    if (channel.isText()) {
      if (roleMention) {
        channel.send({ content: `<@&${roleMention}>`, embed });
      } else {
        channel.send(embed);
      }
    } else {
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            flags: 1 << 6,
            content: ":x: Not a valid text channel.",
          },
        },
      });
      return;
    }

    client.api.interactions(interaction.id, interaction.token).callback.post({
      data: {
        type: 4,
        data: {
          flags: 1 << 6,
          content: "Announcement Sent ✅",
        },
      },
    });
  }
});

client.login(token.replace("HAMZAH",""));
