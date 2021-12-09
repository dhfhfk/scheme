const {
    Client,
    Message,
    MessageEmbed,
    MessageActionRow,
    MessageSelectMenu,
    MessageButton,
} = require("discord.js");
const request = require("request");
const { guilds } = require("../..");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
const hcs = require("hcs.js");

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

module.exports = {
    name: "스케줄등록",
    description: "자가진단 / 급식 알림 스케줄을 등록해요.",
    options: [
        {
            name: "채널",
            description: "무슨 채널에 알림을 전송할까요?",
            type: "CHANNEL",
            required: true,
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
        var channelId = args[0];
        if (client.channels.cache.get(channelId).type !== "GUILD_TEXT") {
            const error = new MessageEmbed()
                .setTitle(`${config.emojis.x} 이 채널은 적합하지 않아요!`)
                .setColor(config.color.error)
                .addFields(
                    {
                        name: `상세정보:`,
                        value: `텍스트 채널을 지정하지 않았어요.`,
                        inline: false,
                    },
                    {
                        name: `해결 방법:`,
                        value: `채널을 선택할 때 텍스트 채널만 선택하세요.`,
                        inline: false,
                    }
                )
                .setFooter(`channels.type !== "GUILD_TEXT"`);
            interaction.editReply({
                embeds: [error],
                ephemeral: true,
            });
            return;
        }
        const user_id = interaction.user.id;
        await mongo().then(async (mongoose) => {
            try {
                var result = await schoolSchema.findOne({
                    _id: user_id,
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
            } finally {
                mongoose.connection.close();
            }

            const choose = new MessageEmbed()
                .setTitle(
                    `자가진단 수행 알림 / 급식 알림을 전송할 시간대를 선택해주세요.`
                )
                .setColor(config.color.info)
                .setDescription(
                    "등록하고싶은 시간대를 하단의 메뉴에서 선택하세요."
                )
                .addFields(
                    {
                        name: `🕡 A그룹`,
                        value: `오전 \`06:30 ~ 06:50\` 사이에 알림을 보내요.`,
                    },
                    {
                        name: `🕖 B그룹`,
                        value: `오전 \`07:00 ~ 07:20\` 사이에 알림을 보내요.`,
                    },
                    {
                        name: `🕢 C그룹`,
                        value: `오전 \`07:30 ~ 07:50\` 사이에 알림을 보내요.`,
                    }
                );
            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId("select")
                    .setPlaceholder("스케줄을 등록할 시간대")
                    .addOptions([
                        {
                            label: `A그룹 (오전 06:30 ~ 06:50)`,
                            description: `오전 06:30 ~ 06:50 사이에 알림을 보내요.`,
                            emoji: `🕡`,
                            value: "0",
                        },
                        {
                            label: `B그룹 (오전 07:00 ~ 07:20)`,
                            description: `오전 07:00 ~ 07:20 사이에 알림을 보내요.`,
                            emoji: `🕖`,
                            value: "1",
                        },
                        {
                            label: `C그룹 (오전 07:30 ~ 07:50)`,
                            description: `오전 07:30 ~ 07:50 사이에 알림을 보내요.`,
                            emoji: `🕢`,
                            value: "2",
                        },
                    ])
            );
            const cancel = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("0")
                    .setLabel("취소")
                    .setStyle("DANGER")
            );

            interaction.editReply({
                embeds: [choose],
                components: [row, cancel],
                ephemeral: true,
            });
            var collector = interaction.channel.createMessageComponentCollector(
                {
                    max: 1,
                }
            );
            var collector2 =
                interaction.channel.createMessageComponentCollector({
                    max: 1,
                });
            collector.on("end", async (ButtonInteraction) => {
                var answer = ButtonInteraction.first().customId;
                if (answer == "0") {
                    const cancelled = new MessageEmbed()
                        .setTitle(`스케줄 등록이 취소되었어요.`)
                        .setColor(config.color.error);
                    interaction.editReply({
                        embeds: [cancelled],
                        components: [],
                    });
                    return;
                }
                collector2.on("end", async (SelectMenuInteraction) => {
                    var time = SelectMenuInteraction.first().values;
                    if (!result.users || result.users.length == 0) {
                        mongo().then(async (mongoose) => {
                            try {
                                await schoolSchema.findOneAndUpdate(
                                    {
                                        _id: userId,
                                    },
                                    {
                                        schedule: {
                                            type: rawTimeTable[time],
                                            kinds: rawKindsTable[2],
                                            channelId: channelId,
                                            paused: false,
                                        },
                                    },
                                    { upsert: true }
                                );
                            } finally {
                                mongoose.connection.close();
                                console.log(
                                    `[✅] (${userId}, ${userName}) REGISTER ${rawTimeTable[time]}${rawKindsTable[2]} schedule`
                                );
                            }
                        });
                        var registered = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.done} 스케줄이 정상적으로 등록되었어요.`
                            )
                            .setDescription("아래 정보들을 확인해 보세요.")
                            .setColor(config.color.success)
                            .addFields(
                                {
                                    name: `스케줄 등록 정보`,
                                    value: `${timeTable[time]} 시간 사이에 <#${channelId}> 채널로 오늘 급식 알림을 전송할 거예요.`,
                                    inline: true,
                                },
                                {
                                    name: `Q1. 왜 정해진 시간이 아닌 특정 시간 사이에 전송되나요?`,
                                    value: `자가진단 수행에 랜덤성을 추가하기 위함입니다. 정확한 시간은 각 날마다의 봇 상태메시지를 확인하세요.`,
                                    inline: false,
                                },
                                {
                                    name: `Q2. 자가진단 스케줄은 남기고 알림을 끌 수 없나요?`,
                                    value: `자가진단 서비스는 관련 이슈가 있을 때마다 알림을 보내야 합니다. 알림을 끄려면 채널알림 설정을 통해 꺼주세요.`,
                                    inline: false,
                                },
                                {
                                    name: `Q3. 알림은 어떤 형식으로 전송되나요?`,
                                    value: `선택한 채널에 누구나 볼 수 있는 메시지로 전송합니다. 학교 정보, 사용자 정보를 숨기고싶다면 따로 개인 서버를 개설해 설정하세요.`,
                                    inline: false,
                                },
                                {
                                    name: `Q4. 개인 정보를 삭제하려면?`,
                                    value: `\`/정보 명령:조회\` 명령어로 개인 정보를 조회할 수 있고 \`/정보 명령:삭제\` 명령어로 개인 정보를 삭제할 수 있습니다.`,
                                }
                            );
                        interaction.editReply({
                            embeds: [registered],
                            components: [],
                            ephemeral: true,
                        });
                        return;
                    }
                    const choose = new MessageEmbed()
                        .setTitle(`어떤 정보를 전송할까요?`)
                        .setColor(config.color.info)
                        .setDescription(
                            "받고싶은 메뉴를 하단의 메뉴에서 선택하세요."
                        )
                        .addFields(
                            {
                                name: `오늘 급식 + 자가진단 알림`,
                                value: `오늘 급식과 자가진단 수행 완료 알림을 받아요.`,
                            },
                            {
                                name: `자가진단 알림`,
                                value: `자가진단 수행 완료 알림만 받아요.`,
                            },
                            {
                                name: `오늘 급식 알림`,
                                value: `오늘 급식 알림만 받아요.`,
                            }
                        );
                    const chooseInfo = new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId("select")
                            .setPlaceholder("전송받을 정보")
                            .addOptions([
                                {
                                    label: `오늘 급식 + 자가진단 알림`,
                                    description: `오늘 급식과 자가진단 수행 완료 알림을 받아요.`,
                                    value: "0",
                                },
                                {
                                    label: `자가진단 알림`,
                                    description: `자가진단 수행 완료 알림만 받아요.`,
                                    value: "1",
                                },
                                {
                                    label: `오늘 급식 알림`,
                                    description: `오늘 급식 알림만 받아요.`,
                                    value: "2",
                                },
                            ])
                    );
                    const cancel = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId("0")
                            .setLabel("취소")
                            .setStyle("DANGER")
                    );
                    interaction.editReply({
                        embeds: [choose],
                        components: [chooseInfo, cancel],
                        ephemeral: true,
                    });
                    var collector3 =
                        interaction.channel.createMessageComponentCollector({
                            max: 1,
                        });
                    var collector4 =
                        interaction.channel.createMessageComponentCollector({
                            max: 1,
                        });
                    collector3.on("end", async (ButtonInteraction) => {
                        var answer = ButtonInteraction.first().customId;
                        if (answer == "0") {
                            const cancelled = new MessageEmbed()
                                .setTitle(`스케줄 등록이 취소되었어요.`)
                                .setColor(config.color.error);
                            interaction.editReply({
                                embeds: [cancelled],
                                components: [],
                            });
                            return;
                        }
                    });
                    collector4.on("end", async (SelectMenuInteraction) => {
                        var kinds = SelectMenuInteraction.first().values;
                        if (!kinds) {
                            const cancelled = new MessageEmbed()
                                .setTitle(`스케줄 등록이 취소되었어요.`)
                                .setColor(config.color.error);
                            await interaction.editReply({
                                embeds: [cancelled],
                                components: [],
                            });
                            return;
                        }
                        mongo().then(async (mongoose) => {
                            try {
                                await schoolSchema.findOneAndUpdate(
                                    {
                                        _id: userId,
                                    },
                                    {
                                        schedule: {
                                            type: rawTimeTable[time],
                                            kinds: rawKindsTable[kinds],
                                            channelId: channelId,
                                            paused: false,
                                        },
                                    },
                                    { upsert: true }
                                );
                            } finally {
                                mongoose.connection.close();
                                console.log(
                                    `[✅] (${userId}, ${userName}) REGISTER ${rawTimeTable[time]}${rawKindsTable[kinds]} schedule`
                                );
                            }
                        });
                        var registered = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.done} 스케줄이 정상적으로 등록되었어요.`
                            )
                            .setDescription("아래 정보들을 확인해 보세요.")
                            .setColor(config.color.success)
                            .addFields(
                                {
                                    name: `스케줄 등록 정보`,
                                    value: `${timeTable[time]} 시간 사이에 <#${channelId}> 채널로 ${kindsTable[kinds]}을 전송할 거예요.`,
                                    inline: true,
                                },
                                {
                                    name: `Q1. 왜 정해진 시간이 아닌 특정 시간 사이에 전송되나요?`,
                                    value: `자가진단 수행에 랜덤성을 추가하기 위함입니다. 정확한 시간은 각 날마다의 봇 상태메시지를 확인하세요.`,
                                    inline: false,
                                },
                                {
                                    name: `Q2. 자가진단 스케줄은 남기고 알림을 끌 수 없나요?`,
                                    value: `자가진단 서비스는 관련 이슈가 있을 때마다 알림을 보내야 합니다. 알림을 끄려면 채널알림 설정을 통해 꺼주세요.`,
                                    inline: false,
                                },
                                {
                                    name: `Q3. 알림은 어떤 형식으로 전송되나요?`,
                                    value: `선택한 채널에 누구나 볼 수 있는 메시지로 전송합니다. 학교 정보, 사용자 정보를 숨기고싶다면 따로 개인 서버를 개설해 설정하세요.`,
                                    inline: false,
                                },
                                {
                                    name: `Q4. 개인 정보를 삭제하려면?`,
                                    value: `\`/정보 명령:조회\` 명령어로 개인 정보를 조회할 수 있고 \`/정보 명령:삭제\` 명령어로 개인 정보를 삭제할 수 있습니다.`,
                                }
                            );
                        await interaction.editReply({
                            embeds: [registered],
                            components: [],
                            ephemeral: true,
                        });
                        return;
                    });
                });
                return;
            });
        });
    },
};
