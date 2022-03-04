const { Client, Message, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");

var timeTable = ["🕡 오전 06:30 ~ 06:50", "🕖 오전 07:00 ~ 07:20", "🕢 오전 07:30 ~ 07:50"];
var rawTimeTable = ["A", "B", "C"];

var kindsTable = ["오늘 급식 + 자가진단 알림", "자가진단 알림", "오늘 급식 알림"];
var rawKindsTable = ["A", "B", "C"];

module.exports = {
    name: "설정",
    description: "봇 데이터베이스에 저장된 개인 정보를 조회하거나 삭제를 요청해요.",
    options: [
        {
            name: "조회",
            description: "개인 정보를 조회해요.",
            type: "SUB_COMMAND",
        },
        {
            name: "삭제",
            description: "개인 정보 삭제를 요청해요.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "종류",
                    description: "어떤 데이터를 삭제 요청할까요?",
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
        let command = interaction.options.getSubcommand();
        console.log(`[📄] (${userId}, ${userName}) ${command}`);
        if (command === "조회") {
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    try {
                        var validate = result.school.name;
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(`${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`)
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
                        .setTitle(`${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`)
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
                    var timeTable = ["🕡 오전 06:30 ~ 06:50", "🕖 오전 07:00 ~ 07:20", "🕢 오전 07:30 ~ 07:50"];
                    var rawTimeTable = ["A", "B", "C"];

                    var kindsTable = ["오늘 급식 + 자가진단 알림", "자가진단 알림", "오늘 급식 알림"];

                    var rawKindsTable = ["A", "B", "C"];
                    const info = new MessageEmbed().setTitle(`${interaction.user.username} 님의 정보`).setColor(config.color.primary);
                    if (result.school) {
                        const embed = {
                            name: `학교 정보`,
                            value: `학교명: \`${result.school.name}\`
자가진단 교육청 주소: \`${result.school.endpoint}\`
시도교육청코드: \`${result.school.sc}\`
표준학교코드: \`${result.school.sd}\`
기관코드: \`${result.school.org}\``,
                        };
                        info.fields.push(embed);
                    }
                    if (result.schedule) {
                        const embed = {
                            name: `스케줄 정보`,
                            value: `시간대: \`${timeTable[rawTimeTable.indexOf(result.schedule.type)]}\`
전송 정보: \`${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]} 받기\`
전송 채널: <#${result.schedule.channelId}>
일시정지 여부: \`${result.schedule.paused ? "예" : "아니오"}\``,
                        };
                        info.fields.push(embed);
                    }
                    if (result.users[0]) {
                        result.users.forEach(function (user, index) {
                            const embed = {
                                name: `사용자 ${index + 1} 정보`,
                                value: `이름: \`${user.name}\`
암호화된 이름: \`${user.encName.substr(0, 14) + "..."}\`
암호화된 생년월일: \`${user.encBirth.substr(0, 14) + "..."}\`
암호화된 비밀번호: \`${user.password.substr(0, 14) + "..."}\`
자가진단 교육청 주소: \`${user.endpoint}\``,
                            };
                            info.fields.push(embed);
                        });
                    }
                    interaction.editReply({
                        embeds: [info],
                        ephemeral: true,
                    });
                }
            });
        } else {
            const which = interaction.options.getString("종류");
            console.log(`[📄] (${userId}, ${userName}) ${command} ${which}`);
            if (which == "all") {
                await mongo().then(async (mongoose) => {
                    try {
                        var result = await schoolSchema.findOne({
                            _id: userId,
                        });
                        try {
                            var validate = result.school.name;
                        } catch (e) {
                            const error = new MessageEmbed()
                                .setTitle(`${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`)
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
                        var userInfo = [userId, result.school.name, result.school.endpoint, result.school.sc, result.school.sd, result.school.org];
                    } finally {
                        if (!validate) {
                            mongoose.connection.close();
                        }
                        try {
                            var validate = userInfo[0];
                        } catch (e) {
                            const error = new MessageEmbed()
                                .setTitle(`${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`)
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
                        const check = new MessageEmbed().setTitle(`${config.emojis.delete} 정말 모든 정보를 삭제할까요?`).setColor(config.color.delete);
                        if (result.school) {
                            const embed = {
                                name: `학교 정보`,
                                value: `학교명: \`${result.school.name}\`
자가진단 교육청 주소: \`${result.school.endpoint}\`
시도교육청코드: \`${result.school.sc}\`
표준학교코드: \`${result.school.sd}\`
기관코드: \`${result.school.org}\``,
                            };
                            check.fields.push(embed);
                        }
                        if (result.schedule) {
                            const embed = {
                                name: `스케줄 정보`,
                                value: `시간대: \`${timeTable[rawTimeTable.indexOf(result.schedule.type)]}\`
전송 정보: \`${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]} 받기\`
전송 채널: <#${result.schedule.channelId}>
일시정지 여부: \`${result.schedule.paused ? "예" : "아니오"}\``,
                            };
                            check.fields.push(embed);
                        }
                        if (result.users[0]) {
                            const embed = {
                                name: `사용자 정보`,
                                value: `이름: \`${result.users[0].name}\`
암호화된 이름: \`${result.users[0].encName.substr(0, 14) + "..."}\`
암호화된 생년월일: \`${result.users[0].encBirth.substr(0, 14) + "..."}\`
암호화된 비밀번호: \`${result.users[0].password.substr(0, 14) + "..."}\`
자가진단 교육청 주소: \`${result.users[0].endpoint}\``,
                            };
                            check.fields.push(embed);
                        }
                        const choose = new MessageActionRow()
                            .addComponents(new MessageButton().setCustomId("0").setLabel("네. 삭제합니다.").setStyle("DANGER"))
                            .addComponents(new MessageButton().setCustomId("1").setLabel("아니요").setStyle("SECONDARY"));
                        interaction.editReply({
                            embeds: [check],
                            components: [choose],
                            ephemeral: true,
                        });
                        const collector = interaction.channel.createMessageComponentCollector({
                            max: 1,
                        });
                        collector.on("end", async (ButtonInteraction) => {
                            {
                                var rawanswer = ButtonInteraction.first().customId;
                                if (rawanswer == "1") {
                                    const cancelled = new MessageEmbed().setTitle(`정보 삭제가 취소되었어요.`).setColor(config.color.error);
                                    interaction.editReply({
                                        embeds: [cancelled],
                                        components: [],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                                const deleting = new MessageEmbed().setTitle(`정보 삭제 중...`).setColor(config.color.delete).setDescription("너무 오래걸린다면 관리자에게 문의하세요.");
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
                                        const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`).setColor(config.color.success).setDescription("서비스를 이용해주셔서 감사합니다.");
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
            if (which == "users") {
                const userId = interaction.user.id;
                await mongo().then(async (mongoose) => {
                    try {
                        var result = await schoolSchema.findOne({
                            _id: userId,
                        });
                        var validate = result.users.length;
                        if (validate == 0) {
                            const error = new MessageEmbed().setTitle(`${config.emojis.x} 사용자 등록 정보를 찾을 수 없어요!`).setColor(config.color.error).addFields(
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
                            var userInfo0 = [result.users[0].name, result.users[0].encName.substr(0, 14) + "...", result.users[0].encBirth.substr(0, 14) + "...", result.users[0].password.substr(0, 14) + "...", result.users[0].endpoint];
                        }
                        if (validate == 2) {
                            var userInfo0 = [result.users[0].name, result.users[0].encName.substr(0, 14) + "...", result.users[0].encBirth.substr(0, 14) + "...", result.users[0].password.substr(0, 14) + "...", result.users[0].endpoint];
                            var userInfo1 = [result.users[1].name, result.users[1].encName.substr(0, 14) + "...", result.users[1].encBirth.substr(0, 14) + "...", result.users[1].password.substr(0, 14) + "...", result.users[1].endpoint];
                        }
                        if (validate == 3) {
                            var userInfo0 = [result.users[0].name, result.users[0].encName.substr(0, 14) + "...", result.users[0].encBirth.substr(0, 14) + "...", result.users[0].password.substr(0, 14) + "...", result.users[0].endpoint];
                            var userInfo1 = [result.users[1].name, result.users[1].encName.substr(0, 14) + "...", result.users[1].encBirth.substr(0, 14) + "...", result.users[1].password.substr(0, 14) + "...", result.users[1].endpoint];
                            var userInfo2 = [result.users[2].name, result.users[2].encName.substr(0, 14) + "...", result.users[2].encBirth.substr(0, 14) + "...", result.users[2].password.substr(0, 14) + "...", result.users[2].endpoint];
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
                                .setTitle(`${config.emojis.delete} 정말 사용자 정보를 삭제할까요?`)
                                .setColor(config.color.delete)
                                .addFields({
                                    name: `사용자 1`,
                                    value: `이름: \`${userInfo0[0]}\`
암호화된 이름: \`${userInfo0[1]}\`
암호화된 생년월일: \`${userInfo0[2]}\`
암호화된 비밀번호: \`${userInfo0[3]}\`
자가진단 교육청 주소: \`${userInfo0[4]}\``,
                                    inline: false,
                                });
                            const choose = new MessageActionRow()
                                .addComponents(new MessageButton().setCustomId("0").setLabel("네. 삭제합니다.").setStyle("DANGER"))
                                .addComponents(new MessageButton().setCustomId("1").setLabel("아니요").setStyle("SECONDARY"));
                            interaction.editReply({
                                embeds: [check],
                                components: [choose],
                                ephemeral: true,
                            });
                            const collector = interaction.channel.createMessageComponentCollector({
                                max: 1,
                            });
                            collector.on("end", async (ButtonInteraction) => {
                                {
                                    var rawanswer = ButtonInteraction.first().customId;
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
                                                                name: result.users[0].name,
                                                            },
                                                        },
                                                    }
                                                );
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                mongoose.connection.close();
                                                const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`).setColor(config.color.success).setDescription("서비스를 이용해주셔서 감사합니다.");
                                                interaction.editReply({
                                                    embeds: [deleted],
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                                return;
                                            }
                                        });
                                    } else {
                                        const cancelled = new MessageEmbed().setTitle(`정보 삭제가 취소되었어요.`).setColor(config.color.error);
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
                                .setTitle(`${config.emojis.delete} 정말 사용자 정보를 삭제할까요?`)
                                .setColor(config.color.delete)
                                .addFields(
                                    {
                                        name: `사용자 1`,
                                        value: `이름: \`${userInfo0[0]}\`
암호화된 이름: \`${userInfo0[1]}\`
암호화된 생년월일: \`${userInfo0[2]}\`
암호화된 비밀번호: \`${userInfo0[3]}\`
자가진단 교육청 주소: \`${userInfo0[4]}\``,
                                        inline: false,
                                    },
                                    {
                                        name: `사용자 2`,
                                        value: `이름: \`${userInfo0[0]}\`
암호화된 이름: \`${userInfo1[1]}\`
암호화된 생년월일: \`${userInfo1[2]}\`
암호화된 비밀번호: \`${userInfo1[3]}\`
자가진단 교육청 주소: \`${userInfo1[4]}\``,
                                        inline: false,
                                    }
                                );
                            const choose = new MessageActionRow()
                                .addComponents(new MessageButton().setCustomId("0").setLabel("네. 삭제합니다.").setStyle("DANGER"))
                                .addComponents(new MessageButton().setCustomId("1").setLabel("아니요").setStyle("SECONDARY"));
                            interaction.editReply({
                                embeds: [info],
                                components: [choose],
                                ephemeral: true,
                            });
                            const collector = interaction.channel.createMessageComponentCollector({
                                max: 1,
                            });
                            collector.on("end", async (ButtonInteraction) => {
                                {
                                    var rawanswer = ButtonInteraction.first().customId;
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
                                                                name: result.users[0].name,
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
                                                                name: result.users[1].name,
                                                            },
                                                        },
                                                    }
                                                );
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                mongoose.connection.close();
                                                const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`).setColor(config.color.success).setDescription("서비스를 이용해주셔서 감사합니다.");
                                                interaction.editReply({
                                                    embeds: [deleted],
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                                return;
                                            }
                                        });
                                    } else {
                                        const cancelled = new MessageEmbed().setTitle(`정보 삭제가 취소되었어요.`).setColor(config.color.error);
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
                                .setTitle(`${config.emojis.delete} 정말 사용자 정보를 삭제할까요?`)
                                .setColor(config.color.delete)
                                .addFields(
                                    {
                                        name: `사용자 1`,
                                        value: `이름: \`${userInfo0[0]}\`
암호화된 이름: \`${userInfo0[1]}\`
암호화된 생년월일: \`${userInfo0[2]}\`
암호화된 비밀번호: \`${userInfo0[3]}\`
자가진단 교육청 주소: \`${userInfo0[4]}\``,
                                        inline: false,
                                    },
                                    {
                                        name: `사용자 2`,
                                        value: `이름: \`${userInfo0[0]}\`
암호화된 이름: \`${userInfo1[1]}\`
암호화된 생년월일: \`${userInfo1[2]}\`
암호화된 비밀번호: \`${userInfo1[3]}\`
자가진단 교육청 주소: \`${userInfo1[4]}\``,
                                        inline: false,
                                    },
                                    {
                                        name: `사용자 3`,
                                        value: `이름: \`${userInfo0[0]}\`
암호화된 이름: \`${userInfo2[1]}\`
암호화된 생년월일: \`${userInfo2[2]}\`
암호화된 비밀번호: \`${userInfo2[3]}\`
자가진단 교육청 주소: \`${userInfo2[4]}\``,
                                        inline: false,
                                    }
                                );
                            const choose = new MessageActionRow()
                                .addComponents(new MessageButton().setCustomId("0").setLabel("네. 삭제합니다.").setStyle("DANGER"))
                                .addComponents(new MessageButton().setCustomId("1").setLabel("아니요").setStyle("SECONDARY"));
                            interaction.editReply({
                                embeds: [info],
                                components: [choose],
                                ephemeral: true,
                            });
                            const collector = interaction.channel.createMessageComponentCollector({
                                max: 1,
                            });
                            collector.on("end", async (ButtonInteraction) => {
                                {
                                    var rawanswer = ButtonInteraction.first().customId;
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
                                                                name: result.users[0].name,
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
                                                                name: result.users[1].name,
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
                                                                name: result.users[2].name,
                                                            },
                                                        },
                                                    }
                                                );
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                mongoose.connection.close();
                                                const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`).setColor(config.color.success).setDescription("서비스를 이용해주셔서 감사합니다.");
                                                interaction.editReply({
                                                    embeds: [deleted],
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                                return;
                                            }
                                        });
                                    } else {
                                        const cancelled = new MessageEmbed().setTitle(`정보 삭제가 취소되었어요.`).setColor(config.color.error);
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
            if (which == "schedule") {
                await mongo().then(async (mongoose) => {
                    try {
                        var result = await schoolSchema.findOne({
                            _id: userId,
                        });
                        try {
                            var validate = result.schedule.type;
                        } catch (e) {
                            const error = new MessageEmbed()
                                .setTitle(`${config.emojis.x} 스케줄 등록 정보를 찾을 수 없어요!`)
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
                            .setTitle(`${config.emojis.x} 스케줄 등록 정보를 찾을 수 없어요!`)
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
                        var timeTable = ["🕡 오전 06:20 ~ 06:40", "🕖 오전 06:50 ~ 07:10", "🕢 오전 07:20 ~ 07:40"];
                        var rawTimeTable = ["A", "B", "C"];

                        var kindsTable = ["오늘 급식 + 자가진단 알림", "자가진단 알림", "오늘 급식 알림"];

                        var rawKindsTable = ["A", "B", "C"];
                        mongoose.connection.close();
                        const info = new MessageEmbed()
                            .setTitle(`${config.emojis.delete} 정말 스케줄 정보를 삭제할까요?`)
                            .setColor(config.color.delete)
                            .addFields({
                                name: `스케줄 정보`,
                                value: `시간대: \`${timeTable[rawTimeTable.indexOf(result.schedule.type)]}\`
전송 정보: \`${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]}\`
전송 채널: <#${result.schedule.channelId}>
일시정지 여부: \`${result.schedule.paused ? "예" : "아니오"}\``,
                                inline: false,
                            });
                        const choose = new MessageActionRow()
                            .addComponents(new MessageButton().setCustomId("0").setLabel("네. 삭제합니다.").setStyle("DANGER"))
                            .addComponents(new MessageButton().setCustomId("1").setLabel("아니요").setStyle("SECONDARY"));
                        interaction.editReply({
                            embeds: [info],
                            components: [choose],
                            ephemeral: true,
                        });
                        const collector = interaction.channel.createMessageComponentCollector({
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
                                        const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} 정보가 정상적으로 삭제되었어요.`).setColor(config.color.success).setDescription("서비스를 이용해주셔서 감사합니다.");
                                        interaction.editReply({
                                            embeds: [deleted],
                                            components: [],
                                            ephemeral: true,
                                        });
                                        return;
                                    }
                                });
                            } else {
                                const cancelled = new MessageEmbed().setTitle(`정보 삭제가 취소되었어요.`).setColor(config.color.error);
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
        }
    },
};
