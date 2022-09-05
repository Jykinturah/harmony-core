/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

const { Client, Collection, Routes, REST, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
var config = require("./config.json");
const { clientToken } = require('./config.json');
const rest = new REST({ version: '10' }).setToken(clientToken);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildEmojisAndStickers] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) client.once(event.name, (...args) => event.execute(...args));
  else client.on(event.name, (...args) => event.execute(...args,client));
}

client.login(clientToken);

