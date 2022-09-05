module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(client.user.tag + " online.");
    client.user.setActivity("queries...",{type:"LISTENING"});
    console.log("https://discordapp.com/oauth2/authorize?client_id="+client.user.id+"&scope=bot");
  }
};