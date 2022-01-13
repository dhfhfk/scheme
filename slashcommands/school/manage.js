const {
    Client,
    Message,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");

module.exports = {
    name: "설정",
    description:
        "봇 데이터베이스에 저장된 개인 정보를 조회하거나 삭제를 요청해요.",
    options: [
        {
            name: "명령",
            description: "무슨 명령을 실행할까요?",
            type: "STRING",
            required: true,
            choices: [
                {
                    name: "조회",
                    value: "LOOKUP",
                },
                {
                    name: "삭제",
                    value: "DELETE",
                },
            ],
        },
        {
            name: "종류",
            description: "어떤 정보를 삭제할까요?",
            type: "STRING",
            required: true,
            choices: [
                {
                    name: "모두",
                    value: "all",
                },
                {
                    name: "사용자",
                    value: "users",
                },
                {
                    name: "스케줄",
                    value: "schedule",
                },
            ],
        },
    ],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        await interaction.deferReply({ ephemeral: true });
        const userId = interaction.user.id;
        const userName = interaction.user.username;
        let command = interaction.options.getString("명령");
        let which = interaction.options.getString("종류");
        console.log(`[📄] (${userId}, ${userName}) ${command} ${which}`);
        if (command === "LOOKUP" && which == "all") {
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    try {
                        var validate = result.school.name;
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `DB에서 유저 식별 ID에 등록된 학교를 찾지 못했어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                    inline: false,
                                }
                            )
                            .setFooter(`${e}`);
                        interaction.editReply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        mongoose.connection.close();
                        return;
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(
                            `${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`
                        )
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 학교를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                inline: false,
                            }
                        )
                        .setFooter(`${e}`);
                    interaction.editReply({
                        embeds: [error],
                        ephemeral: true,
                    });
                    mongoose.connection.close();
                    return;
                } finally {
                    if (!validate) {
                        mongoose.connection.close();
                        return;
                    }
                    mongoose.connection.close();
                    var timeTable = [
                        "🕡 오전 06:30 ~ 06:50",
                        "🕖 오전 07:00 ~ 07:20",
                        "🕢 오전 07:30 ~ 07:50",
                    ];
                    var rawTimeTable = ["A", "B", "C"];

                    var kindsTable = [
                        "오늘 급식 + 자가진단 알림",
                        "자가진단 알림",
                        "오늘 급식 알림",
                    ];

                    var rawKindsTable = ["A", "B", "C"];
                    const info = new MessageEmbed()
                        .setTitle(`${interaction.user.username} 님의 정보`)
                        .setDescription(
                            `기능 업데이트 중입니다. 정보가 제대로 표시되지 않을 수 있습니다.`
                        )
                        .setColor(config.color.primary);
                    try {
                        if (
                            result.users[0] == undefined &&
                            result.schedule == undefined
                        ) {
                            info.fields = [
                                {
                                    name: `학교 정보`,
                                    value: `학교명: \`${result.school.name}\`
                                    자가진단 교육청 주소: \`${result.school.endpoint}\`
                                    시도교육청코드: \`${result.school.sc}\`
                                    표준학교코드: \`${result.school.sd}\`
                                    기관코드: \`${result.school.org}\``,
                                },
                            ];
                            interaction.editReply({
                                embeds: [info],
                                ephemeral: true,
                            });
                            return;
                        } else if (result.users[0] == undefined) {
                            info.fields = [
                                {
                                    name: `학교 정보`,
                                    value: `학교명: \`${result.school.name}\`
                                    자가진단 교육청 주소: \`${result.school.endpoint}\`
                                    시도교육청코드: \`${result.school.sc}\`
                                    표준학교코드: \`${result.school.sd}\`
                                    기관코드: \`${result.school.org}\``,
                                },
                                {
                                    name: `스케줄 정보`,
                                    value: `시간대: \`${
                                        timeTable[
                                            rawTimeTable.indexOf(
                                                result.schedule.type
                                            )
                                        ]
                                    }\`
                                    전송 정보: \`${
                                        kindsTable[
                                            rawKindsTable.indexOf(
                                                result.schedule.kinds
                                            )
                                        ]
                                    }\`
                                    전송 채널: <#${result.schedule.channelId}>
                                    일시정지 여부: \`${
                                        result.schedule.paused
                                    }\``,
                                },
                            ];
                            interaction.editReply({
                                embeds: [info],
                                ephemeral: true,
                            });
                        } else if (result.schedule == undefined) {
                            info.fields = [
                                {
                                    name: `학교 정보`,
                                    value: `학교명: \`${result.school.name}\`
                                    자가진단 교육청 주소: \`${result.school.endpoint}\`
                                    시도교육청코드: \`${result.school.sc}\`
                                    표준학교코드: \`${result.school.sd}\`
                                    기관코드: \`${result.school.org}\``,
                                },
                                {
                                    name: `사용자 정보`,
                                    value: `이름: \`${result.users[0].name}\`
                                    암호화된 이름: \`${
                                        result.users[0].encName.substr(0, 14) +
                                        "..."
                                    }\`
                                    암호화된 생년월일: \`${
                                        result.users[0].encBirth.substr(0, 14) +
                                        "..."
                                    }\`
                                    암호화된 비밀번호: \`${
                                        result.users[0].password.substr(0, 14) +
                                        "..."
                                    }\`
                                    자가진단 교육청 주소: \`${
                                        result.users[0].endpoint
                                    }\``,
                                },
                            ];
                            interaction.editReply({
                                embeds: [info],
                                ephemeral: true,
                            });
                        } else {
                            info.fields = [
                                {
                                    name: `학교 정보`,
                                    value: `학교명: \`${result.school.name}\`
                                    자가진단 교육청 주소: \`${result.school.endpoint}\`
                                    시도교육청코드: \`${result.school.sc}\`
                                    표준학교코드: \`${result.school.sd}\`
                                    기관코드: \`${result.school.org}\``,
                                },
                                {
                                    name: `사용자 정보`,
                                    value: `이름: \`${result.users[0].name}\`
                                    암호화된 이름: \`${
                                        result.users[0].encName.substr(0, 14) +
                                        "..."
                                    }\`
                                    암호화된 생년월일: \`${
                                        result.users[0].encBirth.substr(0, 14) +
                                        "..."
                                    }\`
                                    암호화된 비밀번호: \`${
                                        result.users[0].password.substr(0, 14) +
                                        "..."
                                    }\`
                                    자가진단 교육청 주소: \`${
                                        result.users[0].endpoint
                                    }\``,
                                },
                            ];
                            interaction.editReply({
                                embeds: [info],
                                ephemeral: true,
                            });
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
        }
        if (command === "LOOKUP" && which == "users") {
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    var validate = result.users.length;
                    if (validate == 0) {
                        const error = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 사용자 등록 정보를 찾을 수 없어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `DB에서 유저 식별 ID에 등록된 사용자를 찾지 못했어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `\`/사용자등록 이름:<이름> 생년월일:<생년월일> 비밀번호:<비밀번호> \` 명령어로 학교를 등록하세요.`,
                                    inline: false,
                                }
                            );
                        interaction.editReply({
                            embeds: [error],
                            components: [],
                            ephemeral: true,
                        });
                        return;
                    }
                    if (validate == 1) {
                        var userInfo0 = [
                            result.users[0].name,
                            result.users[0].encName.substr(0, 14) + "...",
                            result.users[0].encBirth.substr(0, 14) + "...",
                            result.users[0].password.substr(0, 14) + "...",
                        ];
                    }
                    if (validate == 2) {
                        var userInfo0 = [
                            result.users[0].name,
                            result.users[0].encName.substr(0, 14) + "...",
                            result.users[0].encBirth.substr(0, 14) + "...",
                            result.users[0].password.substr(0, 14) + "...",
                        ];
                        var userInfo1 = [
                            result.users[1].name,
                            result.users[1].encName.substr(0, 14) + "...",
                            result.users[1].encBirth.substr(0, 14) + "...",
                            result.users[1].password.substr(0, 14) + "...",
                        ];
                    }
                    if (validate == 3) {
                        var userInfo0 = [
                            result.users[0].name,
                            result.users[0].encName.substr(0, 14) + "...",
                            result.users[0].encBirth.substr(0, 14) + "...",
                            result.users[0].password.substr(0, 14) + "...",
                        ];
                        var userInfo1 = [
                            result.users[1].name,
                            result.users[1].encName.substr(0, 14) + "...",
                            result.users[1].encBirth.substr(0, 14) + "...",
                            result.users[1].password.substr(0, 14) + "...",
                        ];
                        var userInfo2 = [
                            result.users[2].name,
                            result.users[2].encName.substr(0, 14) + "...",
                            result.users[2].encBirth.substr(0, 14) + "...",
                            result.users[2].password.substr(0, 14) + "...",
                        ];
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 정보를 찾을 수 없어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 정보를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                inline: false,
                            }
                        )
                        .setFooter(`${e}`);
                    interaction.editReply({
                        embeds: [error],
                        components: [],
                        ephemeral: true,
                    });
                    return;
                } finally {
                    mongoose.connection.close();
                    if (validate == 1) {
                        const info = new MessageEmbed()
                            .setTitle(
                                `${interaction.user.username} 님의 사용자 정보`
                            )
                            .setDescription(`\`${validate}\` 명 조회됨`)
                            .setColor(config.color.primary)
                            .addFields({
                                name: `사용자 1`,
                                value: `\`\`\`{
    name: ${userInfo0[0]},
    encName: ${userInfo0[1]},
    encBirth: ${userInfo0[2]},
    password: ${userInfo0[3]}
}\`\`\``,
                                inline: false,
                            });
                        interaction.editReply({
                            embeds: [info],
                            ephemeral: true,
                        });
                        return;
                    }
                    if (validate == 2) {
                        const info = new MessageEmbed()
                            .setTitle(
                                `${interaction.user.username} 님의 사용자 정보`
                            )
                            .setDescription(`\`${validate}\` 명 조회됨`)
                            .setColor(config.color.primary)
                            .addFields(
                                {
                                    name: `사용자 1`,
                                    value: `\`\`\`{
    name: ${userInfo0[0]},
    encName: ${userInfo0[1]},
    encBirth: ${userInfo0[2]},
    password: ${userInfo0[3]}
}\`\`\``,
                                    inline: false,
                                },
                                {
                                    name: `사용자 2`,
                                    value: `\`\`\`{
    name: ${userInfo1[0]},
    encName: ${userInfo1[1]},
    encBirth: ${userInfo1[2]},
    password: ${userInfo1[3]}
}\`\`\``,
                                    inline: false,
                                }
                            );
                        interaction.editReply({
                            embeds: [info],
                            ephemeral: true,
                        });
                        return;
                    }
                    if (validate == 3) {
                        const info = new MessageEmbed()
                            .setTitle(
                                `${interaction.user.username} 님의 사용자 정보`
                            )
                            .setDescription(`\`${validate}\` 명 조회됨`)
                            .setColor(config.color.primary)
                            .addFields(
                                {
                                    name: `사용자 1`,
                                    value: `\`\`\`{
    name: ${userInfo0[0]},
    encName: ${userInfo0[1]},
    encBirth: ${userInfo0[2]},
    password: ${userInfo0[3]}
}\`\`\``,
                                    inline: false,
                                },
                                {
                                    name: `사용자 2`,
                                    value: `\`\`\`{
    name: ${userInfo1[0]},
    encName: ${userInfo1[1]},
    encBirth: ${userInfo1[2]},
    password: ${userInfo1[3]}
}\`\`\``,
                                    inline: false,
                                },
                                {
                                    name: `사용자 3`,
                                    value: `\`\`\`{
    name: ${userInfo2[0]},
    encName: ${userInfo2[1]},
    encBirth: ${userInfo2[2]},
    password: ${userInfo2[3]}
}\`\`\``,
                                    inline: false,
                                }
                            );
                        interaction.editReply({
                            embeds: [info],
                            ephemeral: true,
                        });
                        return;
                    }
                }
            });
        }
        if (command === "LOOKUP" && which == "schedule") {
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    try {
                        var validate = result.schedule.type;
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 스케줄 등록 정보를 찾을 수 없어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `DB에서 유저 식별 ID에 등록된 스케줄을 찾지 못했어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `먼저 \`/스케줄등록 채널:<채널ID> \` 명령어로 스케줄을 등록하세요.`,
                                    inline: false,
                                }
                            )
                            .setFooter(`${e}`);
                        interaction.editReply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        mongoose.connection.close();
                        return;
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(
                            `${config.emojis.x} 스케줄 등록 정보를 찾을 수 없어요!`
                        )
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 스케줄을 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `먼저 \`/스케줄등록 채널:<채널ID> \` 명령어로 스케줄을 등록하세요.`,
                                inline: false,
                            }
                        )
                        .setFooter(`${e}`);
                    interaction.editReply({
                        embeds: [error],
                        ephemeral: true,
                    });
                    mongoose.connection.close();
                    return;
                } finally {
                    if (!validate) {
                        mongoose.connection.close();
                        return;
                    }
                    var timeTable = [
                        "🕡 오전 06:30 ~ 06:50",
                        "🕖 오전 07:00 ~ 07:20",
                        "🕢 오전 07:30 ~ 07:50",
                    ];
                    var rawTimeTable = ["A", "B", "C"];

                    var kindsTable = [
                        "오늘 급식 + 자가진단 알림",
                        "자가진단 알림",
                        "오늘 급식 알림",
                    ];

                    var rawKindsTable = ["A", "B", "C"];
                    mongoose.connection.close();
                    const info = new MessageEmbed()
                        .setTitle(`${interaction.user.username} 님의 정보`)
                        .setColor(config.color.primary)
                        .addFields({
                            name: `raw:`,
                            value: `\`\`\`_id: ${userId},
schedule: {
    type: ${result.schedule.type}, (${
                                timeTable[
                                    rawTimeTable.indexOf(result.schedule.type)
                                ]
                            })
    kinds: ${result.schedule.kinds}, (${
                                kindsTable[
                                    rawKindsTable.indexOf(result.schedule.kinds)
                                ]
                            })
    channelId: <#${result.schedule.channelId}>,
    paused: ${result.schedule.paused}
}\`\`\``,
                            inline: false,
                        });
                    interaction.editReply({
                        embeds: [info],
                        ephemeral: true,
                    });
                }
            });

            return;
        }
        if (command === "DELETE" && which == "all") {
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    try {
                        var validate = result.school.name;
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `DB에서 유저 식별 ID에 등록된 학교를 찾지 못했어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                    inline: false,
                                }
                            )
                            .setFooter(`${e}`);
                        interaction.editReply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        return;
                    }
                    var userInfo = [
                        userId,
                        result.school.name,
                        result.school.endpoint,
                        result.school.sc,
                        result.school.sd,
                        result.school.org,
                    ];
                } finally {
                    if (!validate) {
                        mongoose.connection.close();
                    }
                    try {
                        var validate = userInfo[0];
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `DB에서 유저 식별 ID에 등록된 학교를 찾지 못했어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                    inline: false,
                                }
                            )
                            .setFooter(`${e}`);
                        interaction.editReply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        return;
                    }
                    mongoose.connection.close();
                    const check = new MessageEmbed()
                        .setTitle(
                            `${config.emojis.delete} 정말 모든 정보를 삭제할까요?`
                        )
                        .setColor(config.color.delete)
                        .addFields(
                            {
                                name: `삭제되는 정보:`,
                                value: `\`\`\`_id: ${userInfo[0]},
school: {
    name: ${userInfo[1]},
    endpoint: ${userInfo[2]},
    sc: ${userInfo[3]},
    sd: ${userInfo[4]},
    org: ${userInfo[5]},
},
users: [
    {
        모든 사용자 정보들
    }
],
schedule: {
    모든 스케줄 정보들
}\`\`\``,
                                inline: false,
                            },
                            {
                                name: `주의사항:`,
                                value: "삭제 후 다시 되돌릴 수 없습니다.",
                                inline: false,
                            }
                        );
                    const choose = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId("0")
                                .setLabel("예")
                                .setStyle("DANGER")
                        )
                        .addComponents(
                            new MessageButton()
                                .setCustomId("1")
                                .setLabel("아니요")
                                .setStyle("PRIMARY")
                        );
                    interaction.editReply({
                        embeds: [check],
                        components: [choose],
                        ephemeral: true,
                    });
                    const collector =
                        interaction.channel.createMessageComponentCollector({
                            max: 1,
                        });
                    collector.on("end", async (ButtonInteraction) => {
                        {
                            var rawanswer = ButtonInteraction.first().customId;
                            if (rawanswer == "1") {
                                const cancelled = new MessageEmbed()
                                    .setTitle(`정보 삭제가 취소되었어요.`)
                                    .setColor(config.color.error);
                                interaction.editReply({
                                    embeds: [cancelled],
                                    components: [],
                                    ephemeral: true,
                                });
                                return;
                            }
                            const deleting = new MessageEmbed()
                                .setTitle(`정보 삭제중...`)
                                .setColor(config.color.delete)
                                .setDescription(
                                    "너무 오래걸린다면 관리자에게 문의하세요."
                                );
                            interaction.editReply({
                                embeds: [deleting],
                                components: [],
                                ephemeral: true,
                            });
                            mongo().then(async (mongoose) => {
                                try {
                                    await schoolSchema.findOneAndDelete({
                                        _id: userId,
                                    });
                                } finally {
                                    mongoose.connection.close();
                                    const deleted = new MessageEmbed()
                                        .setTitle(
                                            `${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`
                                        )
                                        .setColor(config.color.success)
                                        .setDescription(
                                            "서비스를 이용해주셔서 감사합니다."
                                        );
                                    interaction.editReply({
                                        embeds: [deleted],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            });
                        }
                    });
                }
            });
        }
        if (command === "DELETE" && which == "users") {
            const userId = interaction.user.id;
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    var validate = result.users.length;
                    if (validate == 0) {
                        const error = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 사용자 등록 정보를 찾을 수 없어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `DB에서 유저 식별 ID에 등록된 사용자를 찾지 못했어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `\`/사용자등록 이름:<이름> 생년월일:<생년월일> 비밀번호:<비밀번호> \` 명령어로 학교를 등록하세요.`,
                                    inline: false,
                                }
                            );
                        interaction.editReply({
                            embeds: [error],
                            components: [],
                            ephemeral: true,
                        });
                        return;
                    }
                    if (validate == 1) {
                        var userInfo0 = [
                            result.users[0].name,
                            result.users[0].encName.substr(0, 14) + "...",
                            result.users[0].encBirth.substr(0, 14) + "...",
                            result.users[0].password.substr(0, 14) + "...",
                        ];
                    }
                    if (validate == 2) {
                        var userInfo0 = [
                            result.users[0].name,
                            result.users[0].encName.substr(0, 14) + "...",
                            result.users[0].encBirth.substr(0, 14) + "...",
                            result.users[0].password.substr(0, 14) + "...",
                        ];
                        var userInfo1 = [
                            result.users[1].name,
                            result.users[1].encName.substr(0, 14) + "...",
                            result.users[1].encBirth.substr(0, 14) + "...",
                            result.users[1].password.substr(0, 14) + "...",
                        ];
                    }
                    if (validate == 3) {
                        var userInfo0 = [
                            result.users[0].name,
                            result.users[0].encName.substr(0, 14) + "...",
                            result.users[0].encBirth.substr(0, 14) + "...",
                            result.users[0].password.substr(0, 14) + "...",
                        ];
                        var userInfo1 = [
                            result.users[1].name,
                            result.users[1].encName.substr(0, 14) + "...",
                            result.users[1].encBirth.substr(0, 14) + "...",
                            result.users[1].password.substr(0, 14) + "...",
                        ];
                        var userInfo2 = [
                            result.users[2].name,
                            result.users[2].encName.substr(0, 14) + "...",
                            result.users[2].encBirth.substr(0, 14) + "...",
                            result.users[2].password.substr(0, 14) + "...",
                        ];
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 정보를 찾을 수 없어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 정보를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                inline: false,
                            }
                        )
                        .setFooter(`${e}`);
                    interaction.editReply({
                        embeds: [error],
                        components: [],
                        ephemeral: true,
                    });
                    return;
                } finally {
                    mongoose.connection.close();
                    if (validate == 1) {
                        const check = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.delete} 정말 사용자 정보를 삭제할까요?`
                            )
                            .setColor(config.color.delete)
                            .addFields({
                                name: `사용자 1`,
                                value: `\`\`\`{
    name: ${userInfo0[0]},
    encName: ${userInfo0[1]},
    encBirth: ${userInfo0[2]},
    password: ${userInfo0[3]}
}\`\`\``,
                                inline: false,
                            });
                        const choose = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("0")
                                    .setLabel("예")
                                    .setStyle("DANGER")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("1")
                                    .setLabel("아니요")
                                    .setStyle("SECONDARY")
                            );
                        interaction.editReply({
                            embeds: [check],
                            components: [choose],
                            ephemeral: true,
                        });
                        const collector =
                            interaction.channel.createMessageComponentCollector(
                                {
                                    max: 1,
                                }
                            );
                        collector.on("end", async (ButtonInteraction) => {
                            {
                                var rawanswer =
                                    ButtonInteraction.first().customId;
                                if (rawanswer === "0") {
                                    mongo().then(async (mongoose) => {
                                        try {
                                            await schoolSchema.updateOne(
                                                {
                                                    _id: userId,
                                                },
                                                {
                                                    $pull: {
                                                        users: {
                                                            name: result
                                                                .users[0].name,
                                                        },
                                                    },
                                                }
                                            );
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            mongoose.connection.close();
                                            const deleted = new MessageEmbed()
                                                .setTitle(
                                                    `${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`
                                                )
                                                .setColor(config.color.success)
                                                .setDescription(
                                                    "서비스를 이용해주셔서 감사합니다."
                                                );
                                            interaction.editReply({
                                                embeds: [deleted],
                                                components: [],
                                                ephemeral: true,
                                            });
                                            return;
                                        }
                                    });
                                } else {
                                    const cancelled = new MessageEmbed()
                                        .setTitle(`정보 삭제가 취소되었어요.`)
                                        .setColor(config.color.error);
                                    interaction.editReply({
                                        embeds: [cancelled],
                                        components: [],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            }
                        });
                        return;
                    }
                    if (validate == 2) {
                        const info = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.delete} 정말 사용자 정보를 삭제할까요?`
                            )
                            .setColor(config.color.delete)
                            .addFields(
                                {
                                    name: `사용자 1`,
                                    value: `\`\`\`{
    name: ${userInfo0[0]},
    encName: ${userInfo0[1]},
    encBirth: ${userInfo0[2]},
    password: ${userInfo0[4]}
}\`\`\``,
                                    inline: false,
                                },
                                {
                                    name: `사용자 2`,
                                    value: `\`\`\`{
    name: ${userInfo1[0]},
    encName: ${userInfo1[1]},
    encBirth: ${userInfo1[2]},
    password: ${userInfo1[3]}
}\`\`\``,
                                    inline: false,
                                }
                            );
                        const choose = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("0")
                                    .setLabel("예")
                                    .setStyle("DANGER")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("1")
                                    .setLabel("아니요")
                                    .setStyle("SECONDARY")
                            );
                        interaction.editReply({
                            embeds: [info],
                            components: [choose],
                            ephemeral: true,
                        });
                        const collector =
                            interaction.channel.createMessageComponentCollector(
                                {
                                    max: 1,
                                }
                            );
                        collector.on("end", async (ButtonInteraction) => {
                            {
                                var rawanswer =
                                    ButtonInteraction.first().customId;
                                if (rawanswer === "0") {
                                    mongo().then(async (mongoose) => {
                                        try {
                                            await schoolSchema.updateOne(
                                                {
                                                    _id: userId,
                                                },
                                                {
                                                    $pull: {
                                                        users: {
                                                            name: result
                                                                .users[0].name,
                                                        },
                                                    },
                                                }
                                            );
                                            await schoolSchema.updateOne(
                                                {
                                                    _id: userId,
                                                },
                                                {
                                                    $pull: {
                                                        users: {
                                                            name: result
                                                                .users[1].name,
                                                        },
                                                    },
                                                }
                                            );
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            mongoose.connection.close();
                                            const deleted = new MessageEmbed()
                                                .setTitle(
                                                    `${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`
                                                )
                                                .setColor(config.color.success)
                                                .setDescription(
                                                    "서비스를 이용해주셔서 감사합니다."
                                                );
                                            interaction.editReply({
                                                embeds: [deleted],
                                                components: [],
                                                ephemeral: true,
                                            });
                                            return;
                                        }
                                    });
                                } else {
                                    const cancelled = new MessageEmbed()
                                        .setTitle(`정보 삭제가 취소되었어요.`)
                                        .setColor(config.color.error);
                                    interaction.editReply({
                                        embeds: [cancelled],
                                        components: [],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            }
                        });
                        return;
                    }
                    if (validate == 3) {
                        const info = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.delete} 정말 사용자 정보를 삭제할까요?`
                            )
                            .setColor(config.color.delete)
                            .addFields(
                                {
                                    name: `사용자 1`,
                                    value: `\`\`\`{
    name: ${userInfo0[0]},
    encName: ${userInfo0[1]},
    encBirth: ${userInfo0[2]},
    password: ${userInfo0[3]}
}\`\`\``,
                                    inline: false,
                                },
                                {
                                    name: `사용자 2`,
                                    value: `\`\`\`{
    name: ${userInfo1[0]},
    encName: ${userInfo1[1]},
    encBirth: ${userInfo1[2]},
    password: ${userInfo1[3]}
}\`\`\``,
                                    inline: false,
                                },
                                {
                                    name: `사용자 3`,
                                    value: `\`\`\`{
    name: ${userInfo2[0]},
    encName: ${userInfo2[1]},
    encBirth: ${userInfo2[2]},
    password: ${userInfo2[3]}
}\`\`\``,
                                    inline: false,
                                }
                            );
                        const choose = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("0")
                                    .setLabel("예")
                                    .setStyle("DANGER")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("1")
                                    .setLabel("아니요")
                                    .setStyle("SECONDARY")
                            );
                        interaction.editReply({
                            embeds: [info],
                            components: [choose],
                            ephemeral: true,
                        });
                        const collector =
                            interaction.channel.createMessageComponentCollector(
                                {
                                    max: 1,
                                }
                            );
                        collector.on("end", async (ButtonInteraction) => {
                            {
                                var rawanswer =
                                    ButtonInteraction.first().customId;
                                if (rawanswer === "0") {
                                    mongo().then(async (mongoose) => {
                                        try {
                                            await schoolSchema.updateOne(
                                                {
                                                    _id: userId,
                                                },
                                                {
                                                    $pull: {
                                                        users: {
                                                            name: result
                                                                .users[0].name,
                                                        },
                                                    },
                                                }
                                            );
                                            await schoolSchema.updateOne(
                                                {
                                                    _id: userId,
                                                },
                                                {
                                                    $pull: {
                                                        users: {
                                                            name: result
                                                                .users[1].name,
                                                        },
                                                    },
                                                }
                                            );
                                            await schoolSchema.updateOne(
                                                {
                                                    _id: userId,
                                                },
                                                {
                                                    $pull: {
                                                        users: {
                                                            name: result
                                                                .users[2].name,
                                                        },
                                                    },
                                                }
                                            );
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            mongoose.connection.close();
                                            const deleted = new MessageEmbed()
                                                .setTitle(
                                                    `${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`
                                                )
                                                .setColor(config.color.success)
                                                .setDescription(
                                                    "서비스를 이용해주셔서 감사합니다."
                                                );
                                            interaction.editReply({
                                                embeds: [deleted],
                                                components: [],
                                                ephemeral: true,
                                            });
                                            return;
                                        }
                                    });
                                } else {
                                    const cancelled = new MessageEmbed()
                                        .setTitle(`정보 삭제가 취소되었어요.`)
                                        .setColor(config.color.error);
                                    interaction.editReply({
                                        embeds: [cancelled],
                                        components: [],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            }
                        });
                        return;
                    }
                }
            });
        }
        if (command === "DELETE" && which == "schedule") {
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    try {
                        var validate = result.schedule.type;
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 스케줄 등록 정보를 찾을 수 없어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `DB에서 유저 식별 ID에 등록된 스케줄을 찾지 못했어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `먼저 \`/스케줄등록 채널:<채널ID> \` 명령어로 스케줄을 등록하세요.`,
                                    inline: false,
                                }
                            )
                            .setFooter(`${e}`);
                        interaction.editReply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        mongoose.connection.close();
                        return;
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(
                            `${config.emojis.x} 스케줄 등록 정보를 찾을 수 없어요!`
                        )
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 스케줄을 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `먼저 \`/스케줄등록 채널:<채널ID> \` 명령어로 스케줄을 등록하세요.`,
                                inline: false,
                            }
                        )
                        .setFooter(`${e}`);
                    interaction.editReply({
                        embeds: [error],
                        ephemeral: true,
                    });
                    mongoose.connection.close();
                    return;
                } finally {
                    if (!validate) {
                        mongoose.connection.close();
                        return;
                    }
                    var timeTable = [
                        "🕡 오전 06:20 ~ 06:40",
                        "🕖 오전 06:50 ~ 07:10",
                        "🕢 오전 07:20 ~ 07:40",
                    ];
                    var rawTimeTable = ["A", "B", "C"];

                    var kindsTable = [
                        "오늘 급식 + 자가진단 알림",
                        "자가진단 알림",
                        "오늘 급식 알림",
                    ];

                    var rawKindsTable = ["A", "B", "C"];
                    mongoose.connection.close();
                    const info = new MessageEmbed()
                        .setTitle(
                            `${config.emojis.delete} 정말 스케줄 정보를 삭제할까요?`
                        )
                        .setColor(config.color.delete)
                        .addFields({
                            name: `삭제되는 정보:`,
                            value: `\`\`\`_id: ${userId},
schedule: {
    type: ${result.schedule.type}, (${
                                timeTable[
                                    rawTimeTable.indexOf(result.schedule.type)
                                ]
                            })
    kinds: ${result.schedule.kinds}, (${
                                kindsTable[
                                    rawKindsTable.indexOf(result.schedule.kinds)
                                ]
                            })
    channelId: <#${result.schedule.channelId}>,
    paused: ${result.schedule.paused}
}\`\`\``,
                            inline: false,
                        });
                    const choose = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId("0")
                                .setLabel("예")
                                .setStyle("DANGER")
                        )
                        .addComponents(
                            new MessageButton()
                                .setCustomId("1")
                                .setLabel("아니요")
                                .setStyle("SECONDARY")
                        );
                    interaction.editReply({
                        embeds: [info],
                        components: [choose],
                        ephemeral: true,
                    });
                    const collector =
                        interaction.channel.createMessageComponentCollector({
                            max: 1,
                        });
                    collector.on("end", async (ButtonInteraction) => {
                        {
                            var rawanswer = ButtonInteraction.first().customId;
                        }
                        if (rawanswer === "0") {
                            mongo().then(async (mongoose) => {
                                try {
                                    await schoolSchema.updateOne(
                                        {
                                            _id: userId,
                                        },
                                        {
                                            $unset: {
                                                schedule: {
                                                    type: result.schedule.type,
                                                },
                                            },
                                        }
                                    );
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                    mongoose.connection.close();
                                    const deleted = new MessageEmbed()
                                        .setTitle(
                                            `${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`
                                        )
                                        .setColor(config.color.success)
                                        .setDescription(
                                            "서비스를 이용해주셔서 감사합니다."
                                        );
                                    interaction.editReply({
                                        embeds: [deleted],
                                        components: [],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            });
                        } else {
                            const cancelled = new MessageEmbed()
                                .setTitle(`정보 삭제가 취소되었어요.`)
                                .setColor(config.color.error);
                            interaction.editReply({
                                embeds: [cancelled],
                                components: [],
                                ephemeral: true,
                            });
                            return;
                        }
                    });
                }
            });
        }
    },
};
