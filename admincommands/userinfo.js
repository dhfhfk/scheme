const { Client, Message, MessageEmbed } = require("discord.js");
const mongo = require("../mongo");
const schoolSchema = require("../schemas/school-schema");
const config = require("../config.json");
const { getUserInfo } = require("../handler/hcs");

module.exports = {
    name: "get_userinfo",
    description: "[관리자] 특정 유저의 자가진단 userinfo 가져오기",
    options: [
        {
            name: "user_id",
            description: "userinfo를 가져올 특정 유저의 ID",
            type: "STRING",
            required: true,
        },
    ],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        await interaction.deferReply();
        const userId = args[0];
        await mongo().then(async (mongoose) => {
            try {
                var result = await schoolSchema.findOne({
                    _id: userId,
                });
            } finally {
                mongoose.connection.close();
                try {
                    var users = result.users;
                    if (users.length == "0") {
                        const error = new MessageEmbed().setTitle(`${config.emojis.x} 사용자 등록 정보를 찾을 수 없어요!`).setColor(config.color.error).addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 사용자를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `\`/사용자등록 이름:<이름> 생년월일:<생년월일> 비밀번호:<비밀번호> \` 명령어로 사용자를 등록하세요. `,
                                inline: false,
                            }
                        );
                        interaction.editReply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        return;
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 사용자 등록 정보를 찾을 수 없어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 사용자를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `\`/사용자등록 이름:<이름> 생년월일:<생년월일> 비밀번호:<비밀번호> \` 명령어로 사용자를 등록하세요. `,
                                inline: false,
                            }
                        )
                        .setFooter(String(e));
                    interaction.editReply({
                        embeds: [error],
                        ephemeral: true,
                    });
                    return;
                }
                result.users.forEach(async (user) => {
                    return await interaction.editReply({ content: JSON.stringify(await getUserInfo(user)) });
                });
            }
        });
    },
};
