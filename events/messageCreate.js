var replies = require("../replies.json");

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.mentions.users.has(client.user.id))
      return message.channel.send(reply("<@" + message.author + ">")).catch(err => {console.log(err);});
  }
};

function reply(author) {
  return replies[Math.floor(Math.random() * replies.length)].replace("{usr}", author);
}