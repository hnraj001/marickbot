const fs = require("fs");
const config = require("../data/config.json");
const { id_ } = config;
const Discord = require("discord.js");
let request = require(`request`);
const disbut = require("discord-buttons");
const Canvas = require("canvas");

/**
 * Starts a multi style game
 *
 * @param {Discord.TextChannel} channel
 */
async function startMultiGame(channel, totalQuestions = 10, minutes = 2) {
  let playing = [];
  let embed = new Discord.MessageEmbed()
    .setTitle("Multi Style Quiz Started")
    .addField("Questions", totalQuestions, true)
    .setColor("ORANGE")
    .addField(
      "Time required",
      `${(totalQuestions * 120000) / (1000 * 60)} minutes`,
      true
    )
    .setDescription(
      "Each question will have multiple answers and you will have two minutes for each.\n\n Click the `Join` button below to join the game. "
    )
    .setFooter("Starting")
    .setTimestamp(Date.now() + minutes * 60 * 1000);

  let joinButtonID = `join${Math.floor(Math.random() * 100)}`;
  let joinButton = new disbut.MessageButton()
    .setID(joinButtonID)
    .setLabel("Join")
    .setStyle("blurple");

  let joinMsg = await channel.send(embed, joinButton);

  channel.client.on("clickButton", async (button) => {
    await button.clicker.fetch();

    if (
      button.id == joinButtonID &&
      playing.indexOf(button.clicker.user.id) == -1
    ) {
      playing.push(button.clicker.user.id);
      button.reply.send(
        `${button.clicker.member} joined :white_check_mark:`,
        true
      );
    }
  });

  setTimeout(async () => {
    joinMsg.delete();
    let guildid = channel.guild.id;
    if (!fs.existsSync(`./data/guilds/${guildid}.json`)) return;
    let guildSettings = JSON.parse(
      fs.readFileSync(`./data/guilds/${guildid}.json`)
    );

    let questions = [...guildSettings.multiq];
    if (questions.length < totalQuestions) {
      totalQuestions = questions.length;
    }
    questions = shuffle(questions).slice(0, totalQuestions);

    let lb = [];
    lb = await getMultiAnswers(
      questions,
      lb,
      channel,
      0,
      totalQuestions,
      playing
    );

    let lb_score = [];
    for (let i = 0; i < playing.length; ++i) {
      let score = lb.filter((a) => a.user == playing[i]).length;
      lb_score.push({ user: playing[i], score });
    }

    lb_score = lb_score.sort((a, b) => b.score - a.score);

    let desc = "";

    for (let i = 0; i < playing.length && i < 10; ++i) {
      let member = channel.guild.members.resolve(lb_score[i].user);
      if (member) {
        desc += `${i + 1}. **${member.user.username}** | ${
          lb_score[i].score
        } points\n`;
      }
    }

    let em = new Discord.MessageEmbed()
      .setTitle("Quiz Results")
      .setDescription(desc)
      .setTimestamp()
      .setColor("DARK_GREEN");
    channel.send(em);
  }, minutes * 60 * 1000);
}

async function getMultiAnswers(
  questions,
  lb,
  channel,
  numberOfQuestions,
  totalQuestions,
  playing
) {
  return new Promise(async (md) => {
    i = numberOfQuestions;
    if (i >= totalQuestions) return md(lb);
    let q = questions[i];
    let answered = [];
    let embed = new Discord.MessageEmbed()
      .setTitle(`Question #${i + 1}`)
      .setDescription(q.question)
      .setColor("DARK_BLUE");
    await channel.send(embed);

    const filter = (m) => !m.author.bot && playing.indexOf(m.author.id) != -1;

    const collector = channel.createMessageCollector(filter, {
      max: 200,
      time: 60000, //1 minute for testing, 2 for prod
    });

    collector.on("collect", async (m) => {
      let ans = m.content.toLowerCase();
      if (answered.findIndex((a) => a.ans == ans) != -1) return;

      if (q.answers.findIndex((a) => a.toLowerCase() == ans) != -1) {
        answered.push({ user: m.author.id, ans });

        let embed = new Discord.MessageEmbed()
          .setColor("GREEN")
          .setAuthor(m.author.tag, m.author.displayAvatarURL())
          .setDescription(`✅ **${m.author.username}** got it right.`);
        m.channel.send(embed);
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        let embed = new Discord.MessageEmbed()
          .setColor("RED")
          .setDescription(`⌛ Timeout for question #${i + 1}.`);
        channel.send(embed);
      }

      lb.push(...answered);
      lb = await getMultiAnswers(
        questions,
        lb,
        channel,
        i + 1,
        totalQuestions,
        playing
      );
      return md(lb);
    });
  });
}

/**
 * Starts a single answer game
 *
 * @param {Discord.TextChannel} channel
 */
async function startSingleGame(channel, totalQuestions = 10, minutes = 2) {
  let playing = [];
  let embed = new Discord.MessageEmbed()
    .setTitle("Single Answer Quiz Started")
    .addField("Questions", totalQuestions, true)
    .setColor("ORANGE")
    .addField(
      "Time required",
      `${(totalQuestions * 60000) / (1000 * 60)} minutes`,
      true
    )
    .setDescription(
      "You will have four choices for each question, only one of them will be correct.\n\n Click the `Join` button below to join the game. "
    )
    .setFooter("Starting")
    .setTimestamp(Date.now() + minutes * 60 * 1000);

  let joinButtonID = `join${Math.floor(Math.random() * 100)}`;
  let joinButton = new disbut.MessageButton()
    .setID(joinButtonID)
    .setLabel("Join")
    .setStyle("blurple");

  let joinMsg = await channel.send(embed, joinButton);

  channel.client.on("clickButton", async (button) => {
    await button.clicker.fetch();
    if (
      button.id == joinButtonID &&
      playing.indexOf(button.clicker.user.id) == -1
    ) {
      playing.push(button.clicker.user.id);
      button.reply.send(
        `${button.clicker.member} joined :white_check_mark:`,
        true
      );
    }
  });

  setTimeout(async () => {
    joinMsg.delete();

    let guildid = channel.guild.id;
    if (!fs.existsSync(`./data/guilds/${guildid}.json`)) return;
    let guildSettings = JSON.parse(
      fs.readFileSync(`./data/guilds/${guildid}.json`)
    );

    let questions = [...guildSettings.singleq];
    if (questions.length < totalQuestions) {
      totalQuestions = questions.length;
    }
    questions = shuffle(questions).slice(0, totalQuestions);

    let lb = [];

    for (let i = 0; i < totalQuestions; ++i) {
      let q = questions[i];
      let answered = [];

      let b1 = new disbut.MessageButton()
        .setID(q.answers[0].text)
        .setLabel(q.answers[0].text)
        .setStyle("blurple");
      let b2 = new disbut.MessageButton()
        .setID(q.answers[1].text)
        .setLabel(q.answers[1].text)
        .setStyle("blurple");
      let b3 = new disbut.MessageButton()
        .setID(q.answers[2].text)
        .setLabel(q.answers[2].text)
        .setStyle("blurple");
      let b4 = new disbut.MessageButton()
        .setID(q.answers[3].text)
        .setLabel(q.answers[3].text)
        .setStyle("blurple");

      let row = new disbut.MessageActionRow().addComponents(b1, b2, b3, b4);

      let embed = new Discord.MessageEmbed()
        .setTitle(`Question #${i + 1}`)
        .setDescription(q.question)
        .setColor("DARK_BLUE");
      let msg0 = await channel.send(embed, row);

      async function clickListen(button) {
        await button.clicker.fetch();
        console.log(button.id + " clicked");
        console.log(button.clicker.user.id);
        console.log(playing.indexOf(button.clicker.user.id) != -1);

        if (playing.indexOf(button.clicker.user.id) == -1) return;
        console.log("Joined");
        if (answered.findIndex((a) => a.user == button.clicker.user.id) != -1) {
          button.reply.send("You already picked an answer!", true);
          return;
        }
        if (!q.answers.some((a) => a.text == button.id)) return;
        if (q.answers.some((a) => a.correct && a.text == button.id)) {
          answered.push({ user: button.clicker.user.id, correct: true });
        } else {
          answered.push({ user: button.clicker.user.id, correct: false });
        }

        button.reply.send(
          `${button.clicker.member} you selected **${button.id}**.`,
          true
        );
      }
      channel.client.on("clickButton", clickListen);

      await timer(60000);
      channel.client.removeListener("clickButton", clickListen);
      msg0.edit({ embed, components: [] });
      lb.push(...answered);
    }

    let lb_score = [];
    for (let i = 0; i < playing.length; ++i) {
      let score = lb.filter((a) => a.user == playing[i] && a.correct).length;
      lb_score.push({ user: playing[i], score });
    }

    lb_score = lb_score.sort((a, b) => b.score - a.score);

    let desc = "";

    for (let i = 0; i < playing.length && i < 10; ++i) {
      let member = channel.guild.members.resolve(lb_score[i].user);
      if (member) {
        desc += `${i + 1}. **${member.user.username}** | ${
          lb_score[i].score
        } points\n`;
      }
    }

    let em = new Discord.MessageEmbed()
      .setTitle("Quiz Results")
      .setDescription(desc)
      .setTimestamp()
      .setColor("DARK_GREEN");
    channel.send(em);

    console.log(lb);
  }, minutes * 60 * 1000);
}
async function getImages(images) {
  //width of one card
  const cwidth = 218;
  //creating canvas to contain cards
  var myCanva = Canvas.createCanvas(cwidth * 3 + 50, 650);
  var context = myCanva.getContext("2d");
  context.fillStyle = "#2F3137"; // background color of embed messages
  context.fillRect(0, 0, myCanva.width, myCanva.height);
  context.textAlign = "center";
  context.fillStyle = "#7ab2ff";
  context.font = "35pt Sans";

  //rendering all cards in horizontal order
  for (var i = 0; i < images.length; ++i) {
    //loading image
    let imageURL = !images[i].url.includes("m.jpg")
      ? images[i].url.replace(".jpg", "m.jpg")
      : images[i].url;

    const cardImage = await Canvas.loadImage(imageURL);
    // Draw a shape onto the main canvas
    context.drawImage(
      cardImage,
      (cwidth + 10) * (i % 3) + 10,
      i < 3 ? 0 : 330,
      cwidth,
      320
    );
    context.fillText(
      `${i + 1}`,
      (cwidth + 10) * (i % 3) + 50,
      i < 3 ? 50 : 380
    );
  }

  const attachment = new Discord.MessageAttachment(
    myCanva.toBuffer(),
    "image.jpg"
  );

  return attachment;
}
async function startImageGame(channel, totalQuestions = 10, minutes = 2) {
  let playing = [];
  let embed = new Discord.MessageEmbed()
    .setTitle("Image Quiz Started")
    .addField("Questions", totalQuestions, true)
    .setColor("ORANGE")
    .addField(
      "Time required",
      `${(totalQuestions * 120000) / (1000 * 60)} minutes`,
      true
    )
    .setDescription(
      "Each question will require you to pick one correct image out of six.\n\n Click the `Join` button below to join the game. "
    )
    .setFooter("Starting")
    .setTimestamp(Date.now() + minutes * 60 * 1000);

  let joinButtonID = `join${Math.floor(Math.random() * 100)}`;
  let joinButton = new disbut.MessageButton()
    .setID(joinButtonID)
    .setLabel("Join")
    .setStyle("blurple");

  let joinMsg = await channel.send(embed, joinButton);

  channel.client.on("clickButton", async (button) => {
    await button.clicker.fetch();
    if (
      button.id == joinButtonID &&
      playing.indexOf(button.clicker.user.id) == -1
    ) {
      playing.push(button.clicker.user.id);
      button.reply.send(
        `${button.clicker.member} joined :white_check_mark:`,
        true
      );
    }
  });

  setTimeout(async () => {
    joinMsg.delete();

    let guildid = channel.guild.id;
    if (!fs.existsSync(`./data/guilds/${guildid}.json`)) return;
    let guildSettings = JSON.parse(
      fs.readFileSync(`./data/guilds/${guildid}.json`)
    );

    let questions = [...guildSettings.imageq];
    if (questions.length < totalQuestions) {
      totalQuestions = questions.length;
    }
    questions = shuffle(questions).slice(0, totalQuestions);

    let lb = [];

    for (let i = 0; i < totalQuestions; ++i) {
      let q = questions[i];
      let answered = [];
      let rows = [];
      let row = new disbut.MessageActionRow();
      for (let j = 0; j < q.images.length; ++j) {
        if (j == 3) {
          rows.push(row);
          row = new disbut.MessageActionRow();
        }
        let b = new disbut.MessageButton()
          .setID(`${j}`)
          .setLabel(`${j + 1}`)
          .setStyle(`blurple`);
        row.addComponent(b);
      }
      if (q.images.length) rows.push(row);

      const attachment = await getImages(q.images);

      let embed = new Discord.MessageEmbed()
        .setTitle(`Question #${i + 1}`)
        .setDescription(q.question)
        .setImage("attachment://image.jpg")
        .setColor("DARK_BLUE");
      let msg0 = await channel.send({
        embed,
        files: [attachment],
        components: rows,
      });

      async function clickListen(button) {
        await button.clicker.fetch();

        if (playing.indexOf(button.clicker.user.id) == -1) return;

        if (answered.findIndex((a) => a.user == button.clicker.user.id) != -1) {
          button.reply.send("You already picked an answer!", true);
          return;
        }
        if (isNaN(button.id)) return;
        let index = parseInt(button.id);

        if (index > -1 && q.images[index].correct) {
          answered.push({ user: button.clicker.user.id, correct: true });
        } else {
          answered.push({ user: button.clicker.user.id, correct: false });
        }

        button.reply.send(
          `${button.clicker.member} you selected **${index + 1}**.`,
          true
        );
      }
      channel.client.on("clickButton", clickListen);

      await timer(60000);
      channel.client.removeListener("clickButton", clickListen);
      msg0.edit({ embed, components: [] });
      lb.push(...answered);
    }

    let lb_score = [];
    for (let i = 0; i < playing.length; ++i) {
      let score = lb.filter((a) => a.user == playing[i] && a.correct).length;
      lb_score.push({ user: playing[i], score });
    }

    lb_score = lb_score.sort((a, b) => b.score - a.score);

    let desc = "";

    for (let i = 0; i < playing.length && i < 10; ++i) {
      let member = channel.guild.members.resolve(lb_score[i].user);
      if (member) {
        desc += `${i + 1}. **${member.user.username}** | ${
          lb_score[i].score
        } points\n`;
      }
    }

    let em = new Discord.MessageEmbed()
      .setTitle("Quiz Results")
      .setDescription(desc)
      .setTimestamp()
      .setColor("DARK_GREEN");
    channel.send(em);

    console.log(lb);
  }, minutes * 60 * 1000);
}
async function startNumberGame(channel) {
  let embed = new Discord.MessageEmbed()
    .setTitle("Number game started")
    .setColor("ORANGE")
    .setDescription(
      "You can roll a dice every 6 hours and get a number which determinds your current field. First player to reach field 90 will be the winner.\n\n Click the `Roll` button below to roll a dice. "
    )
    .setTimestamp(Date.now());

  fs.writeFileSync(
    "./data/rolls.json",
    JSON.stringify({
      active: true,
      users: [],
    })
  );

  let joinButtonID = `roll${Math.floor(Math.random() * 100)}`;
  let joinButton = new disbut.MessageButton()
    .setID(joinButtonID)
    .setLabel("Roll")
    .setStyle("blurple");

  let joinMsg = await channel.send(embed, joinButton);

  channel.client.on("clickButton", async (button) => {
    await button.clicker.fetch();
    if (button.id == joinButtonID) {
      button.reply.defer();
      rollDice(channel, button.clicker.user);
    }
  });
}

function downloadAttachment(url, dest) {
  console.log("initiating download of " + url + "...");

  request(url).pipe(fs.createWriteStream(dest));
}

async function rollDice(channel, userObj) {
  let userId = userObj.id;
  let rolls = JSON.parse(fs.readFileSync("./data/rolls.json"));
  let index = rolls.users.findIndex((u) => u.user == userId);
  if (!rolls.active) {
    let embed = new Discord.MessageEmbed()
      .setDescription(":warning: No number game active at the moment.")
      .setColor("DARK_RED");
    channel.send(embed);
    return;
  }
  if (index != -1 && rolls.users[index].time > Date.now()) {
    let embed = new Discord.MessageEmbed()
      .setAuthor(`${userObj.username}'s roll`, userObj.displayAvatarURL())
      .setDescription(":warning: You can only roll every 6 hours.")
      .setColor("DARK_RED")
      .setFooter("Coldown until")
      .setTimestamp(rolls.users[index].time);
    channel.send(embed);
    return;
  }

  const rndInt = Math.floor(Math.random() * 9) + 1;
  if (index != -1) {
    rolls.users[index].number = rolls.users[index].number + rndInt;
    rolls.users[index].time = Date.now() + 21600000;
  } else {
    rolls.users.push({
      user: userId,
      time: Date.now() + 21600000, // 6 hours cooldown
      number: rndInt,
    });
    index = rolls.users.length - 1;
  }
  let task = null;
  let guildid = channel.guild.id;
  if (fs.existsSync(`./data/guilds/${guildid}.json`)) {
    let guildSettings = JSON.parse(
      fs.readFileSync(`./data/guilds/${guildid}.json`)
    );

    let i = guildSettings.numbersq.findIndex(
      (n) => n.number == rolls.users[index].number
    );

    if (i != -1) {
      task = guildSettings.numbersq[i].task;
    }
  }

  if (rolls.users[index].number > 90) {
    rolls.users[index].number = 90;
  }

  let embed = new Discord.MessageEmbed()
    .setAuthor(`${userObj.username}'s roll`, userObj.displayAvatarURL())
    .setDescription(`You rolled a dice and got **${rndInt}**`)
    .setColor("DARK_BLUE")
    .addField("Current field", rolls.users[index].number)
    .addField("Task", task)
    .setTimestamp();
  channel.send(embed);

  if (rolls.users[index].number == 90) {
    let embed2 = new Discord.MessageEmbed()
      .setAuthor(`${userObj.username}`, userObj.displayAvatarURL())
      .setDescription(`**${userObj.username}** has won the numbers game!`)
      .setColor("GREEN")
      .addField("Current field", rolls.users[index].number)
      .addField("Task", task)
      .setTimestamp();
    channel.send(embed2);
    rolls.active = false;
  }

  fs.writeFileSync("./data/rolls.json", JSON.stringify(rolls, null, 4));
}
const timer = (ms) => new Promise((res) => setTimeout(res, ms));
function id(digits = false) {
  result = "";
  for (i = 0; i < id_.length; i++) {
    let chars = digits ? id_.characters : id_.characters.replace(/[0-9]/g, "");
    result += chars.charAt(Math.floor(Math.random() * id_.characters.length));
  }
  return result;
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

async function pickTarot(deckNumber, numberOfCards) {
  let decks = JSON.parse(fs.readFileSync("./data/decks.json"));
  let deckIndex = decks.findIndex((d) => d.number == deckNumber);

  if (deckIndex == -1 || !decks[deckIndex].cards.length)
    return { cards: null, deckName: null };
  let cards = decks[deckIndex].cards;

  if (numberOfCards > cards.length) {
    numberOfCards = cards.length;
  }
  cards = shuffle(cards).slice(0, numberOfCards);
  for (let i = 0; i < cards.length; ++i) {
    if (
      cards[i].reversed &&
      cards[i].reversed != "Null" &&
      cards[i].reversed != "null" &&
      cards[i].reversed != "NULL"
    ) {
      if (Math.random() > 0.5) {
        cards[i].name = `${cards[i].name} (reversed)`;
        cards[i].meaning = cards[i].reversed.meaning;
      }
    }
  }

  return { cards, deckName: decks[deckIndex].name };
}

async function getDecks() {
  let decks = JSON.parse(fs.readFileSync("./data/decks.json"));
  return decks.filter((d) => d.cards.length);
}

module.exports = {
  startMultiGame,
  startSingleGame,
  startImageGame,
  startNumberGame,
  rollDice,
  downloadAttachment,
  pickTarot,
  getDecks,
};
