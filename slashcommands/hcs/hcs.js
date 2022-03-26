const { Client, Message, MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
const { doHcs } = require("../../handler/hcs");

module.exports = {
    name: "자가진단",
    description: "등록된 정보를 이용해 자가진단에 참여해요.",
    options: [
        {
            name: "rat",
            description: "제출할 신속항원검사 결과 (미선택시 미검사)",
            type: "STRING",
            required: false,
            choices: [
                {
                    name: "미검사",
                    value: "false",
                },
                {
                    name: "음성",
                    value: "true",
                },
            ],
        },
    ],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        let RAT = false;
        if (args[0]) RAT = JSON.parse(args[0]);
        const userId = interaction.user.id;
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
                        interaction.reply({
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
                    interaction.reply({
                        embeds: [error],
                        ephemeral: true,
                    });
                    return;
                }
                if (users.length == 1) {
                    const response = await doHcs(result.users[0], RAT);
                    if (!response.success) {
                    }
                    const registeredUsers = {
                        name: `${response.user} 사용자 ${response.success ? config.emojis.done : config.emojis.x}`,
                        value: `${response.message}\n자가진단키트 결과: ${response.RAT ? "음성" : "미검사"}`,
                        inline: false,
                    };
                    const registered = {
                        color: config.color.primary,
                        title: `건강상태 자가진단 참여 결과예요.`,
                        fields: [registeredUsers],
                        timestamp: new Date(),
                        footer: {
                            text: client.users.cache.get(String(userId)).username,
                            icon_url: client.users.cache.get(String(userId)).displayAvatarURL(),
                        },
                    };
                    return interaction.editReply({
                        embeds: [registered],
                        components: [],
                        ephemeral: true,
                    });
                }
                if (users.length > 1) {
                    const chooseEmbed = result.users.map((user, index) => {
                        return {
                            name: `사용자 ${index + 1}`,
                            value: `\`${user.name}\` 사용자로 자가진단에 참여해요.`,
                            inline: false,
                        };
                    });
                    const chooseMenu = result.users.map((user, index) => {
                        return {
                            label: `사용자 ${index + 1}`,
                            description: `\`${user.name}\` 사용자로 자가진단에 참여해요.`,
                            value: String(index),
                        };
                    });
                    const choose = {
                        title: `어떤 사용자의 자가진단을 참여할까요?`,
                        description: "아래의 선택 메뉴에서 선택하세요.",
                        color: config.color.primary,
                        fields: [
                            {
                                name: `모든 사용자`,
                                value: `모든 사용자로 자가진단에 참여해요.`,
                                inline: false,
                            },
                            chooseEmbed,
                        ],
                    };
                    const row = new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId("select")
                            .setPlaceholder("어떤 사용자의 자가진단을 참여할까요?")
                            .addOptions([
                                {
                                    label: `모든 사용자`,
                                    description: `모든 사용자로 자가진단에 참여해요.`,
                                    value: "all",
                                },
                                chooseMenu,
                            ])
                    );
                    interaction.editReply({
                        embeds: [choose],
                        components: [row],
                        ephemeral: true,
                    });

                    var collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });
                    collector.on("end", async (SelectMenuInteraction) => {
                        let rawanswer = SelectMenuInteraction.first().values;
                        let response;
                        let registeredUsers;
                        try {
                            if (rawanswer[0] !== "all") {
                                response = await doHcs(result.users[rawanswer], RAT);
                                if (!response.success) {
                                    registeredUsers = {
                                        name: `${response.user} 사용자 ${response.success ? config.emojis.done : config.emojis.x}`,
                                        value: `${response.message}`,
                                        inline: false,
                                    };
                                }
                                registeredUsers = {
                                    name: `${response.user} 사용자 ${response.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${response.message}\n자가진단키트 결과: ${response.RAT ? "음성" : "미검사"}`,
                                    inline: false,
                                };
                            } else {
                                response = await Promise.all(
                                    result.users.map((user, index) => {
                                        return doHcs(user, RAT);
                                    })
                                );
                                registeredUsers = response.map((user) => {
                                    if (!user.success) {
                                        return {
                                            name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                            value: `${user.message}`,
                                            inline: false,
                                        };
                                    }
                                    return {
                                        name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                        value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                        inline: false,
                                    };
                                });
                            }
                            const registered = {
                                color: config.color.primary,
                                title: `건강상태 자가진단 참여 결과예요.`,
                                fields: [registeredUsers],
                                timestamp: new Date(),
                                footer: {
                                    text: client.users.cache.get(String(userId)).username,
                                    icon_url: client.users.cache.get(String(userId)).displayAvatarURL(),
                                },
                            };
                            return interaction.editReply({
                                embeds: [registered],
                                components: [],
                                ephemeral: true,
                            });
                        } catch (e) {
                            console.error(e);
                        } finally {
                        }
                    });
                    return;
                }
            }
        });
    },
};
