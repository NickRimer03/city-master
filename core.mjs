import Discord from "discord.js";
import Config from "./config.json";
import Repl from "./src/repl";
import Game from "./src/game";
import cityList from "./res/cities500.json";
import { firstLetterUp, pluralization } from "./src/utils.mjs";

const BOT_CITY_TIMEOUT = 4000;
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
    const channelText = [];
    channelText.push(`Игра начинается в городе \`${getNameRu(startCity)}\` в координатах ${game.getCurrentCoords()}`);
    channelText.push(`Называй следующий пункт путешествия на букву \`${nextStartLetter}\``);
    channel.send(channelText.join("\n"));
    console.log("-- game: started --", startCity);

    game.timeout = Client.setTimeout(() => {
      channel.send("Время вышло!");
      repl.emit("event--stop", { channel });
    }, game.TIMEOUT);
  }
});

repl.subscribe("event--stop", ({ channel }) => {
  Client.clearTimeout(game.timeout);
  if (game) {
    const channelText = [];
    channelText.push("---");
    channelText.push("Игра остановлена");
    channelText.push("```Статистика игры:");
    channelText.push(`Игрок прошёл: ${Math.round(game.totalDistance.hero)} км`);
    channelText.push(`Бот прошёл:   ${Math.round(game.totalDistance.bot)} км`);
    channelText.push("```");
    channel.send(channelText.join("\n"));
    console.log(`-- game: stopped; hero: ${game.totalDistance.hero}, bot: ${game.totalDistance.bot} --`);
    game = null;
  }
});

repl.subscribe("event--city", ({ channel, author, text }) => {
  const { result, cities, dist } = game.checkCity({ usercity: text });
  const channelText = [];
  if (result === "first-letter-error") {
    channelText.push(`${author.username}: Название города должно начинаться с буквы \`${game.nextStartLetter}\``);
    console.log(`-- game: first-letter-error -> ${text} --`);
  } else if (result === "city-not-found") {
    channelText.push(`${author.username}: Город с именем ${firstLetterUp(text)} не найден`);
    console.log(`-- game: city-not-found -> ${text} --`);
  } else if (result === "already-named") {
    channelText.push(`Город ${firstLetterUp(text)} уже был посещён ранее`);
    console.log(`-- game: already-named -> ${text} --`);
  } else if (result === "ok") {
    Client.clearTimeout(game.timeout);
    if (cities === 1) {
      channelText.push(`Путешествуем в город \`${firstLetterUp(text)}\` в координаты ${game.getCurrentCoords()}`);
      console.log(`-- game: travel to -> ${text} --`, game.currentCity);
    } else {
      channelText.push(
        `${pluralization(["Найден", "Найдено", "Найдено"], cities)} ${cities} ${pluralization(
          ["город", "города", "городов"],
          cities
        )} с именем \`${firstLetterUp(text)}\``
      );
      channelText.push(`Путешествуем в ближайший в координаты ${game.getCurrentCoords()}`);
      console.log(`-- game: ${cities} cities found. Travel to -> ${text} --`, game.currentCity);
    }
    channelText.push(`Пройдено ${Math.round(dist)} км. Всего: ${Math.round(game.totalDistance.hero)} км`);
    channelText.push("---");
    channelText.push(`Теперь мой ход! И я должен назвать город на букву \`${game.nextStartLetter}\``);

    const { distance, cityname } = game.botTurn();
    Client.setTimeout(() => {
      channelText.length = 0;
      channelText.push(
        `Мы путешествуем в город \`${firstLetterUp(cityname)}\` в координаты ${game.getCurrentCoords()}`
      );
      channelText.push(`Я прошёл ${Math.round(distance)} км. Всего: ${Math.round(game.totalDistance.bot)} км`);
      channelText.push(`Куда отправимся теперь? Называй город на букву \`${game.nextStartLetter}\``);
      game.isBotTurn = false;
      console.log(`-- game: bot turn. Travel to -> ${cityname} --`, game.currentCity);
      channel.send(channelText.join("\n"));

      game.timeout = Client.setTimeout(() => {
        channel.send("Время вышло!");
        repl.emit("event--stop", { channel });
      }, game.TIMEOUT);
    }, BOT_CITY_TIMEOUT);
  }

  channel.send(channelText.join("\n"));
});

Client.on("ready", () => {
  console.log("City master is ready");
});

Client.on("message", ({ author, channel, content }) => {
  if (author.bot) {
    return;
  }
  if (!content.startsWith(Config.prefix)) {
    if (!game || game.isBotTurn) {
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
