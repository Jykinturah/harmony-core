'use strict';

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientId, guildId, clientToken } = require('./config.json');

const rest = new REST({ version: '10' }).setToken(clientToken);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
  .then(() => console.log('Successfully deleted all guild commands.'))
  .catch(console.error);

rest.put(Routes.applicationCommands(clientId), { body: [] })
  .then(() => console.log('Successfully deleted all application commands.'))
  .catch(console.error);