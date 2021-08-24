/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

const { Client, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const harmsIntents = new Intents();
const Chance = require("chance");
var chance = new Chance();
var replies = require("./replies.json");
var config = require("./config.json");
const CRIT_MULT = config.crit;
const ROLL_DESC = false;
const rest = new REST({ version: '9' }).setToken(config.clientToken);

/** Intents */
harmsIntents.add( Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS )

/** '/' Commands */
const commands = [{
  name: 'harm',
  description: 'Give Harmony Core a poke.'
}];

/** REST call to register slash commands */
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

function reply(author) {
    return replies[Math.floor(Math.random() * replies.length)].replace("{usr}", author);
}

/** Modified code from https://github.com/dbkang/dice-expression-evaluator **/

function Dice(countIn, sidesIn){
  this.count = countIn;
  this.sides = sidesIn;
  this.setCount = function(countIn){
    this.count = countIn;
  };
}

function roll(dice){
  var result = [];
  for(var i = 0; i < dice.count; i++)
    result = result.concat(chance.natural({ min: 1, max: dice.sides }));
  return result.sort((a,b) => {return b - a;});
}

function diceExpMatcher(str) {
  var match = /^([1-9][0-9]*)?(d|D)(([1-9][0-9]*)|\%)/.exec(str);
  if (match === null) return null;
  var diceCount = Number(match[1]) || 1;
  var sideCount = (match[3] === "%") ? 100 : Number(match[3]);
  return {tokens: [new Dice(diceCount, sideCount)], rest: str.slice(match[0].length)};
}

function spaceMatcher(str) {
  var match = /^[ ]*/.exec(str);
  return {tokens: [], rest: str.slice(match[0].length)};
}

function operatorMatcher(str) {
  var match = /^[+|-]/.exec(str);
  if (match === null) {
    return null;
  }
  return {tokens: [], rest: str.slice(1)};
}

function orCombinator(matcher1, matcher2) {
  return function (str) {
    return matcher1(str) || matcher2(str);
  };
}

function parseDiceExpression(exp) {
  var remaining = exp;
  var expOrSpace = orCombinator(operatorMatcher, spaceMatcher);
  var matcherRotation = [spaceMatcher, diceExpMatcher, spaceMatcher, expOrSpace];
  var i = 0;
  var tokens = [];
  while (remaining.length > 0) {
    var currentMatcher = matcherRotation[i];
    var matchResult = currentMatcher(remaining);
    if (matchResult) {
      tokens = tokens.concat(matchResult.tokens);
      remaining = matchResult.rest;
    } else {
      throw new Error("Parse error @ position " + (exp.length - remaining.length) + " - '" +
                      remaining.slice(Math.max(remaining.length, 10)));
    }
    i = (i + 1) % matcherRotation.length;
  }
  return tokens;
}

function sortCollapseDice(uncolDie){
  uncolDie.sort((a,b)=>{return b.sides - a.sides;});
  var currentDice = new Dice(0,uncolDie[0].sides);
  var dice = [];
  // sorted
  for(var i = 0; i < uncolDie.length; i++){
    if(uncolDie[i].sides == currentDice.sides){
      currentDice.setCount(currentDice.count + uncolDie[i].count);
    }else{
      dice = dice.concat(currentDice);
      currentDice = new Dice(uncolDie[i].count,uncolDie[i].sides);
    }
  }
  if(currentDice) dice = dice.concat(currentDice);
  return dice;
}

function rollDiceString(exp){
  var dice = null;
  try{
    dice = parseDiceExpression(exp);
    dice = sortCollapseDice(dice);
    
    for(var i = 0; i < dice.length; i++){
      if(dice.count > 500) return "**Are you trying to _test_ me? Cease at once.**";
      if(dice.sides > 1000) return "**There is no valid reason to roll a dice with " + dice.sides + " sides. Don't be ridiculous.**";
    }

    var max = 0;
    var maxCrit = false;
    var str = "";

    if(ROLL_DESC){
      str += "Rolling: ";
      for(var i = 0; i < dice.length - 1; i++){
        str += dice[i].count + "D" + dice[i].sides + " ";
      }
      str += dice[dice.length - 1].count + "D" + dice[dice.length - 1].sides + "\n";
    }

    var rollStr = "";

    for(var i = 0; i < dice.length; i++){
      var diceMax = dice[i].sides;
      var rolls = roll(dice[i]);
      var crit = [];
      for(var j = 0; j < rolls.length; j++) {
        if(rolls[j] == diceMax) crit[j] = true; 
        else crit[j] = false;
        if( max < (crit[j] ? rolls[j] * CRIT_MULT : rolls[j])){
          max = (crit[j] ? rolls[j] * CRIT_MULT : rolls[j]);
          maxCrit = crit[j];
        }
      }
      rollStr += "`D" + diceMax + "`[";
      for(var k = 0; k < rolls.length-1;k++){
        if(crit[k]) rollStr += "**" + rolls[k] + "**, ";
        else rollStr += rolls[k] + ", ";
      }
      if(crit[rolls.length-1]) rollStr += "**" + rolls[rolls.length-1] + "**]   ";
      else rollStr += rolls[rolls.length-1] + "]   ";
    }

    str += "Result: " + (maxCrit ? "**" + max/CRIT_MULT + "**" : max ) + "\n" + rollStr;

    return str;
  } catch(err) {
    return "**Seems your input was invalid, try again and hope for my mercy.**";
  }
}

const client = new Client({ intents: harmsIntents });

client.on('ready',() => {
  console.log("Harmony Core online.");
  client.user.setActivity("queries...",{type:"LISTENING"});
  console.log("https://discordapp.com/oauth2/authorize?client_id="+client.user.id+"&scope=bot");
});

/* jshint ignore:start */
client.on('messageCreate', async message => {
  if (message.mentions.users.has(client.user.id)){
    return message.channel.send(reply("<@" + message.author + ">")).catch(err => {
      console.log(err);
    });
  }
  if(message.author.bot) return;
  if(message.content.indexOf(config.prefix)!==0) return;
  if(message.content.toLowerCase().startsWith("$roll")){
    return message.channel.send("<@" + message.author +"> " + rollDiceString(message.content.substring(5))).catch(err => {
      console.log(err);
    });;
  }
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'harm') {
    await interaction.reply(reply("<@"+interaction.user.id+">"));
  }
});
/* jshint ignore:end */

client.login(config.clientToken);
