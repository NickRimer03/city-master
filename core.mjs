import Discord from "discord.js";
import Config from "./config.json";
import Repl from "./src/repl.mjs";
// import utils from "./src/utils.mjs";

const Client = new Discord.Client();
const repl = new Repl();

repl.subscribe("event--clear", ({ channel }) => {
  channel.bulkDelete(100).then(() => {
    console.log("-- cleaned --");
  });
});

Client.on("ready", () => {
  console.log("City master is ready");
});

Client.on("message", ({ author, channel, content }) => {
  if (author.bot || !content.startsWith(Config.prefix)) {
    return;
  }

  const args = content
    .slice(Config.prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();
  repl.on({ author, channel, cmd, args });
});

Client.login(process.argv[2] || process.env.BOT_TOKEN);
