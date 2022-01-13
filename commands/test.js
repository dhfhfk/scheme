const { Message, Client, MessageEmbed } = require("discord.js");

module.exports = {
    name: "test",
    aliases: ['p'],
    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        const test = new MessageEmbed()
            .setTitle(`TEST`)
            .setDescription(
                `EMBED TEST`
            )
            .setTimestamp()
        message.channel.send({content:"<@366222616018550787>", embeds: [test],});
    },
};
