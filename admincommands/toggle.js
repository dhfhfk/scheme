const { Client, Message } = require("discord.js");
const mongo = require("../mongo");
const schoolSchema = require("../schemas/school-schema");
const config = require("../config.json");

var timeTable = ["π‘ μ€μ  06:30 ~ 06:50", "π μ€μ  07:00 ~ 07:20", "π’ μ€μ  07:30 ~ 07:50"];
var rawTimeTable = ["A", "B", "C"];

var kindsTable = ["μ€λ κΈμ + μκ°μ§λ¨ μλ¦Ό", "μκ°μ§λ¨ μλ¦Ό", "μ€λ κΈμ μλ¦Ό"];

var rawKindsTable = ["A", "B", "C"];

module.exports = {
    name: "toggle_schedule",
    description: "[κ΄λ¦¬μ] νΉμ  μ μ μ μ€μΌμ€ μΌμμ μ§ || λ©μμ§ μ μ‘",
    options: [
        {
            name: "user_id",
            description: "μ€μΌμ€μ μΌμμ μ§ν  μ μ μ ID",
            type: "STRING",
            required: true,
        },
        {
            name: "message",
            description: "μλ¦Ό λ©μμ§ μ μ‘",
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
                        console.log(`[π·] (${userId}, ${userName}) PAUSE schedule BY (κ΄λ¦¬μ)`);
                        const paused = {
                            color: config.color.primary,
                            title: `κ΄λ¦¬μμ μν΄ μ€μΌμ€μ΄ μΌμμ μ§ λμμ΄μ.`,
                            description: `\`/μ€μΌμ€ν κΈ\` λͺλ Ήμ΄λ₯Ό μ¬μ©νλ©΄ μΌμμ μ§λ₯Ό ν΄μ ν  μ μμ΄μ.`,
                            author: {
                                name: client.users.cache.get(userId).username,
                                icon_url: client.users.cache.get(userId).displayAvatarURL(),
                            },
                        };
                        if (args[1]) {
                            paused.fields = [
                                {
                                    name: `κ΄λ¦¬μ λ©μμ§`,
                                    value: args[1],
                                },
                            ];
                        }
                        client.channels.cache.get(channelId).send({
                            content: `<@${userId}> κ΄λ¦¬μμ μν΄ μ€μΌμ€ μΌμμ μ§`,
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
                        console.log(`[π·] (${userId}, ${userName}) UNPAUSE schedule BY (κ΄λ¦¬μ)`);
                        const unpaused = {
                            color: config.color.primary,
                            title: `κ΄λ¦¬μμ μν΄ μ€μΌμ€μ΄ μΌμμ μ§κ° ν΄μ  λμμ΄μ.`,
                            description: `μ΄μ  λ€μ μ€μΌμ€λΆν° μλ¦Όμ λ°μ μ μμ΄μ.`,
                            author: {
                                name: client.users.cache.get(userId).username,
                                icon_url: client.users.cache.get(userId).displayAvatarURL(),
                            },
                        };
                        unpaused.fields = [
                            {
                                name: `μ€μΌμ€ λ±λ‘ μ λ³΄`,
                                value: `${timeTable[rawTimeTable.indexOf(result.schedule.type)]} λΆ μ¬μ΄μ <#${result.schedule.channelId}> μ±λλ‘ ${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]}μ μ μ‘ν  κ±°μμ.`,
                            },
                        ];
                        if (args[1]) {
                            const embed = {
                                name: `κ΄λ¦¬μ λ©μμ§`,
                                value: args[1],
                            };
                            unpaused.fields.push(embed);
                        }
                        client.channels.cache.get(channelId).send({
                            content: `<@${userId}> κ΄λ¦¬μμ μν΄ μ€μΌμ€ μΌμμ μ§`,
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
