const { Client, Message, MessageEmbed } = require("discord.js");
const request = require("request");
const { guilds } = require("../..");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

module.exports = {
    name: "정보",
    description: "봇의 정보를 알려줘요.",
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        const info = new MessageEmbed()
            .setTitle(`안녕하세요! 👋`)
            .setAuthor(
                client.user.username,
                `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.webp`
            )
            .setDescription(
                `귀찮게 여러 앱 설치할 필요 없이 급식을 조회하고 불편한 자가진단 앱 대신 디스코드로 간편히 해결할 수 있어요, 게다가 자동으로!`
            )
            .addFields(
                {
                    name: `🔗 초대 및 공유`,
                    value: `다른 서버에서도 사용하고 싶거나 다른 친구에게 추천해주고 싶다면 언제든지 이 [링크](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=137439472720&scope=bot%20applications.commands)를 이용해 서버에 초대하세요! [초대하기](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=137439472720&scope=bot%20applications.commands)`,
                    inline: false,
                },
                {
                    name: `🖋️ 사용 방법`,
                    value: `\`/도움말\` 명령어를 이용해 사용 방법을 확인할 수 있어요!`,
                    inline: false,
                },
                {
                    name: `🧑‍💻 사용 라이브러리`,
                    value: `[Discord.js](https://github.com/discordjs/discord.js/)
                    [MongoDB](https://www.mongodb.com/)`,
                    inline: true,
                }
            )
            .setColor(config.color.primary);
        interaction.reply({
            embeds: [info],
            ephemeral: true,
        });
    },
};
