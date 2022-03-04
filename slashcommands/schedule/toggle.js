const { Client, Message, MessageEmbed } = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");

var timeTable = ["🕡 오전 06:30 ~ 06:50", "🕖 오전 07:00 ~ 07:20", "🕢 오전 07:30 ~ 07:50"];
var rawTimeTable = ["A", "B", "C"];

var kindsTable = ["오늘 급식 + 자가진단 알림", "자가진단 알림", "오늘 급식 알림"];
var rawKindsTable = ["A", "B", "C"];

module.exports = {
    name: "스케줄토글",
    description: "자가진단 / 급식 알림 스케줄 정지 여부를 토글해요.",
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        await interaction.deferReply({ ephemeral: false });
        const userId = interaction.user.id;
        const userName = interaction.user.username;
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
                        ephemeral: false,
                    });
                    mongoose.connection.close();
                    return;
                }
            } finally {
                mongoose.connection.close();
            }
            if (result.schedule.paused == false) {
                mongo().then(async (mongoose) => {
                    try {
                        await schoolSchema.findOneAndUpdate(
                            {
                                _id: userId,
                            },
                            {
                                $set: {
                                    "schedule.paused": true,
                                },
                            },
                            { upsert: true }
                        );
                    } finally {
                        mongoose.connection.close();
                        console.log(`[✅] (${userId}, ${userName}) PAUSE schedule`);
                        var paused = new MessageEmbed().setTitle(`${config.emojis.done} 스케줄이 _**일시정지**__ 되었어요.`).setDescription(`다시 명령어를 사용하면 일시정지를 해제할 수 있어요.`).setColor(config.color.success);
                        interaction.editReply({
                            embeds: [paused],
                            ephemeral: false,
                        });
                        return;
                    }
                });
            } else {
                mongo().then(async (mongoose) => {
                    try {
                        await schoolSchema.findOneAndUpdate(
                            {
                                _id: userId,
                            },
                            {
                                $set: {
                                    "schedule.paused": false,
                                },
                            },
                            { upsert: true }
                        );
                    } finally {
                        mongoose.connection.close();
                        console.log(`[✅] (${userId}, ${userName}) UNPAUSE schedule`);
                        var unpaused = new MessageEmbed()
                            .setTitle(`${config.emojis.done} 스케줄 __**일시정지가 해제**__되었어요.`)
                            .setDescription(`아래의 스케줄 등록 정보를 확인해보세요.`)
                            .addFields({
                                name: `스케줄 등록 정보`,
                                value: `${timeTable[rawTimeTable.indexOf(result.schedule.type)]} 분 사이에 <#${result.schedule.channelId}> 채널로 ${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]}을 전송할 거예요.`,
                                inline: true,
                            })
                            .setColor(config.color.success);
                        interaction.editReply({
                            embeds: [unpaused],
                            ephemeral: false,
                        });
                        return;
                    }
                });
            }
        });
    },
};
