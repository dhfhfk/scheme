const { Client, Message } = require("discord.js");
const mongo = require("../mongo");
const schoolSchema = require("../schemas/school-schema");
const config = require("../config.json");

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
    name: "toggle_schedule",
    description: "[관리자] 특정 유저의 스케줄 일시정지 || 메시지 전송",
    options: [
        {
            name: "user_id",
            description: "스케줄을 일시정지할 유저의 ID",
            type: "STRING",
            required: true,
        },
        {
            name: "message",
            description: "알림 메시지 전송",
            type: "STRING",
            required: false,
        },
    ],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        await interaction.deferReply({ ephemeral: true });
        const userId = args[0];
        const userName = client.users.cache.get(userId).username;
        await mongo().then(async (mongoose) => {
            try {
                var result = await schoolSchema.findOne({
                    _id: userId,
                });
                try {
                    var validate = result.schedule.type;
                } catch (e) {
                    mongoose.connection.close();
                    interaction.reply({
                        content: `Schedule not found.`,
                        ephemeral: true,
                    });
                    return;
                }
            } finally {
                mongoose.connection.close();
            }
            const channelId = result.schedule.channelId;
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
                        console.log(
                            `[👷] (${userId}, ${userName}) PAUSE schedule BY (관리자)`
                        );
                        const paused = {
                            color: config.color.primary,
                            title: `관리자에 의해 스케줄이 일시정지 되었어요.`,
                            description: `다시 명령어를 사용하면 일시정지를 해제할 수 있어요.`,
                            author: {
                                name: client.users.cache.get(userId).username,
                                icon_url: client.users.cache
                                    .get(userId)
                                    .displayAvatarURL(),
                            },
                        };
                        if (args[1]) {
                            paused.fields = [
                                {
                                    name: `관리자 메시지`,
                                    value: args[1],
                                },
                            ];
                        }
                        client.channels.cache.get(channelId).send({
                            embeds: [paused],
                        });
                        interaction.editReply({
                            content: "done",
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
                        console.log(
                            `[👷] (${userId}, ${userName}) UNPAUSE schedule BY (관리자)`
                        );
                        const unpaused = {
                            color: config.color.primary,
                            title: `관리자에 의해 스케줄이 일시정지가 해제 되었어요.`,
                            description: `이제 다음 스케줄부터 알림을 받을 수 있어요.`,
                            author: {
                                name: client.users.cache.get(userId).username,
                                icon_url: client.users.cache
                                    .get(userId)
                                    .displayAvatarURL(),
                            },
                        };
                        unpaused.fields = [
                            {
                                name: `스케줄 등록 정보`,
                                value: `${
                                    timeTable[
                                        rawTimeTable.indexOf(
                                            result.schedule.type
                                        )
                                    ]
                                } 분 사이에 <#${
                                    result.schedule.channelId
                                }> 채널로 ${
                                    kindsTable[
                                        rawKindsTable.indexOf(
                                            result.schedule.kinds
                                        )
                                    ]
                                }을 전송할 거예요.`,
                            },
                        ];
                        if (args[1]) {
                            unpaused.fields = [
                                {
                                    name: `관리자 메시지`,
                                    value: args[1],
                                },
                            ];
                        }
                        client.channels.cache.get(channelId).send({
                            embeds: [unpaused],
                        });
                        interaction.editReply({
                            content: "done",
                        });
                        return;
                    }
                });
            }
        });
    },
};
