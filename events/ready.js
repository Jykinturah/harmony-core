module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(client.user.tag + " online.");
    client.user.setPresence({
      activities: [{ name: `queries...`, type: ActivityType.Listening}],
      status: 'dnd'
    });
    console.log("https://discordapp.com/oauth2/authorize?client_id="+client.user.id+"&scope=bot");
  }
};