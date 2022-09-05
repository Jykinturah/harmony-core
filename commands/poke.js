var replies = require("../replies.json");
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('poke')
		.setDescription('Intent for interaction detected.'),
	async execute(interaction) {
		await interaction.reply(reply("<@"+interaction.user.id+">"));
	}
};

function reply(author) {
    return replies[Math.floor(Math.random() * replies.length)].replace("{usr}", author);
}