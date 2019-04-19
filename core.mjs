import Discord from "discord.js";
import Config from "./config.json";
import Repl from "./src/repl";
import Game from "./src/game";
import cityList from "./res/cities500.json";
import { firstLetterUp } from "./src/utils.mjs";

const Client = new Discord.Client();
const repl = new Repl();
let game = null;

repl.subscribe("event--clear", ({ channel }) => {
  channel.bulkDelete(100).then(() => {
    console.log("-- cleaned --");
  });
});

repl.subscribe("event--start", ({ channel }) => {
  if (!game) {
    game = new Game({ cityList });
    const { startCity, getNameRu, nextStartLetter } = game;
    channel.send(`Игра начинается в городе ${getNameRu(startCity)} в координатах ${game.getCurrentCoords()}`);
    channel.send(`Назовите следующий пункт путешествия на букву '${nextStartLetter}'`);
    console.log("-- game: started --", startCity);
  }
});

repl.subscribe("event--stop", ({ channel }) => {
  if (game) {
    game = null;
    channel.send("Игра остановлена");
    console.log("-- game: stopped --");
  }
});

repl.subscribe("event--city", ({ channel, author, text }) => {
  const { result, cities, dist } = game.checkCity({ usercity: text });
  if (result === "first-letter-error") {
    channel.send(`${author.username}: Название города должно начинаться с буквы '${game.nextStartLetter}'`);
    console.log(`-- game: first-letter-error -> ${text} --`);
  } else if (result === "city-not-found") {
    channel.send(`${author.username}: Город с именем ${firstLetterUp(text)} не найден`);
    console.log(`-- game: city-not-found -> ${text} --`);
  } else if (result === "already-named") {
    channel.send(`Город ${firstLetterUp(text)} уже был посещён ранее`);
    console.log(`-- game: already-named -> ${text} --`);
  } else if (result === "ok") {
    if (cities === 1) {
      channel.send(`Путешествуем в город ${firstLetterUp(text)} в координаты ${game.getCurrentCoords()}`);
      console.log(`-- game: travel to -> ${text} --`, game.currentCity);
    } else {
      channel.send(
        `Найдено ${cities} городов с именем ${firstLetterUp(
          text
        )}.\nПутешествуем в ближайший в координаты ${game.getCurrentCoords()}`
      );
      console.log(`-- game: ${cities} cities found. Travel to -> ${text} --`, game.currentCity);
    }
    channel.send(`Пройдено ${Math.round(dist)} км. Всего: ${Math.round(game.totalDistance)} км`);
    channel.send(`Назовите следующий пункт путешествия на букву '${game.nextStartLetter}'`);
  }
});

Client.on("ready", () => {
  console.log("City master is ready");
});

Client.on("message", ({ author, channel, content }) => {
  if (author.bot) {
    return;
  }
  if (!content.startsWith(Config.prefix)) {
    if (!game) {
      return;
    }
    repl.on({ author, channel, cmd: null, text: content.trim().toLowerCase() });
  }

  const args = content
    .slice(Config.prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();
  repl.on({ author, channel, cmd, args });
});

Client.login(process.argv[2] || process.env.BOT_TOKEN);
