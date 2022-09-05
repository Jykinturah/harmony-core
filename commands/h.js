const config = require('../config.json');
const Chance = require('chance');
const wait = require('node:timers/promises').setTimeout;
var chance = new Chance();
const CRIT_MULT = config.crit;
const ROLL_DESC = false;
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('h')
    .setDescription('Function list requested. Enumerating.')
    .addStringOption(option =>
      option.setName('roll')
        .setDescription('Dice roll request registered. Calculating.')
        .setRequired(true)
    ),
  async execute(interaction) {
    // await interaction.deferReply();
    var resp = rollDiceString(interaction.options.getString('roll'));
    await interaction.reply("<@" + interaction.user.id + "> " + resp);
    // await interaction.editReply("<@" + interaction.user.id + "> " + resp);
  },
};

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