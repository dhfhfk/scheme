const { Client, Collection, Message, MessageEmbed } = require("discord.js");
const mongo = require("./mongo");
const schoolSchema = require("./schemas/school-schema");
const hcs = require("hcs.js");
const CryptoJS = require("crypto-js");
const config = require("./config.json");
const request = require("request");

const client = new Client({
    intents: 32767,
});
module.exports = client;
// Global Variables
client.commands = new Collection();
client.slashCommands = new Collection();
client.config = require("./config.json");

// Initializing the project
require("./handler")(client);

client.login(client.config.bot.token);
