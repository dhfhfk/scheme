const { Client, Message, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");

var timeTable = ["π‘ μ€μ  06:30 ~ 06:50", "π μ€μ  07:00 ~ 07:20", "π’ μ€μ  07:30 ~ 07:50"];
var rawTimeTable = ["A", "B", "C"];

var kindsTable = ["μ€λ κΈμ + μκ°μ§λ¨ μλ¦Ό", "μκ°μ§λ¨ μλ¦Ό", "μ€λ κΈμ μλ¦Ό"];

var rawKindsTable = ["A", "B", "C"];

module.exports = {
    name: "μ€μΌμ€λ±λ‘",
    description: "μκ°μ§λ¨ / κΈμ μλ¦Ό μ€μΌμ€μ λ±λ‘ν΄μ.",
    options: [
        {
            name: "μ±λ",
            description: "λ¬΄μ¨ μ±λμ μλ¦Όμ μ μ‘ν κΉμ?",
            type: "CHANNEL",
            channelTypes: ["GUILD_TEXT"],
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
        // if (client.channels.cache.get(channelId).type !== "GUILD_TEXT") {
        //     const error = new MessageEmbed()
        //         .setTitle(`${config.emojis.x} μ΄ μ±λμ μ ν©νμ§ μμμ!`)
        //         .setColor(config.color.error)
        //         .addFields(
        //             {
        //                 name: `μμΈμ λ³΄:`,
        //                 value: `νμ€νΈ μ±λμ μ§μ νμ§ μμμ΄μ.`,
        //                 inline: false,
        //             },
        //             {
        //                 name: `ν΄κ²° λ°©λ²:`,
        //                 value: `μ±λμ μ νν  λ νμ€νΈ μ±λλ§ μ ννμΈμ.`,
        //                 inline: false,
        //             }
        //         )
        //         .setFooter(`channels.type !== "GUILD_TEXT"`);
        //     interaction.editReply({
        //         embeds: [error],
        //         ephemeral: true,
        //     });
        //     return;
        // }
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
                        .setTitle(`${config.emojis.x} νκ΅ λ±λ‘ μ λ³΄λ₯Ό μ°Ύμ μ μμ΄μ!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `μμΈμ λ³΄:`,
                                value: `DBμμ μ μ  μλ³ IDμ λ±λ‘λ νκ΅λ₯Ό μ°Ύμ§ λͺ»νμ΄μ.`,
                                inline: false,
                            },
                            {
                                name: `ν΄κ²° λ°©λ²:`,
                                value: `λ¨Όμ  \`/νκ΅λ±λ‘ νκ΅λͺ:<νκ΅λͺ>\` λͺλ Ήμ΄λ‘ νκ΅λ₯Ό λ±λ‘νμΈμ.`,
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

            const choose = new MessageEmbed().setTitle(`μκ°μ§λ¨ μν μλ¦Ό / κΈμ μλ¦Όμ μ μ‘ν  μκ°λλ₯Ό μ νν΄μ£ΌμΈμ.`).setColor(config.color.primary).setDescription("λ±λ‘νκ³ μΆμ μκ°λλ₯Ό νλ¨μ λ©λ΄μμ μ ννμΈμ.").addFields(
                {
                    name: `π‘ Aκ·Έλ£Ή`,
                    value: `μ€μ  \`06:30 ~ 06:50\` μ¬μ΄μ μλ¦Όμ λ³΄λ΄μ.`,
                },
                {
                    name: `π Bκ·Έλ£Ή`,
                    value: `μ€μ  \`07:00 ~ 07:20\` μ¬μ΄μ μλ¦Όμ λ³΄λ΄μ.`,
                },
                {
                    name: `π’ Cκ·Έλ£Ή`,
                    value: `μ€μ  \`07:30 ~ 07:50\` μ¬μ΄μ μλ¦Όμ λ³΄λ΄μ.`,
                }
            );
            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId("select")
                    .setPlaceholder("μ€μΌμ€μ λ±λ‘ν  μκ°λ")
                    .addOptions([
                        {
                            label: `Aκ·Έλ£Ή (μ€μ  06:30 ~ 06:50)`,
                            description: `μ€μ  06:30 ~ 06:50 μ¬μ΄μ μλ¦Όμ λ³΄λ΄μ.`,
                            emoji: `π‘`,
                            value: "0",
                        },
                        {
                            label: `Bκ·Έλ£Ή (μ€μ  07:00 ~ 07:20)`,
                            description: `μ€μ  07:00 ~ 07:20 μ¬μ΄μ μλ¦Όμ λ³΄λ΄μ.`,
                            emoji: `π`,
                            value: "1",
                        },
                        {
                            label: `Cκ·Έλ£Ή (μ€μ  07:30 ~ 07:50)`,
                            description: `μ€μ  07:30 ~ 07:50 μ¬μ΄μ μλ¦Όμ λ³΄λ΄μ.`,
                            emoji: `π’`,
                            value: "2",
                        },
                    ])
            );
            const cancel = new MessageActionRow().addComponents(new MessageButton().setCustomId("0").setLabel("μ·¨μ").setStyle("DANGER"));

            interaction.editReply({
                embeds: [choose],
                components: [row, cancel],
                ephemeral: true,
            });
            var collector = interaction.channel.createMessageComponentCollector({
                max: 1,
            });
            var collector2 = interaction.channel.createMessageComponentCollector({
                max: 1,
            });
            collector.on("end", async (ButtonInteraction) => {
                var answer = ButtonInteraction.first().customId;
                if (answer == "0") {
                    const cancelled = new MessageEmbed().setTitle(`μ€μΌμ€ λ±λ‘μ΄ μ·¨μλμμ΄μ.`).setColor(config.color.error);
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
                                console.log(`[β] (${userId}, ${userName}) REGISTER ${rawTimeTable[time]}${rawKindsTable[2]} schedule`);
                            }
                        });
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} μ€μΌμ€μ΄ μ μμ μΌλ‘ λ±λ‘λμμ΄μ.`)
                            .setDescription("μλ μ λ³΄λ€μ νμΈν΄ λ³΄μΈμ.")
                            .setColor(config.color.success)
                            .addFields(
                                {
                                    name: `μ€μΌμ€ λ±λ‘ μ λ³΄`,
                                    value: `${timeTable[time]} λΆ μ¬μ΄μ <#${channelId}> μ±λλ‘ μ€λ κΈμ μλ¦Όμ μ μ‘ν  κ±°μμ.`,
                                    inline: true,
                                },
                                {
                                    name: `Q1. μ μ ν΄μ§ μκ°μ΄ μλ νΉμ  μκ° μ¬μ΄μ μ μ‘λλμ?`,
                                    value: `μκ°μ§λ¨ μνμ λλ€μ±μ μΆκ°νκΈ° μν¨μλλ€. μ νν μκ°μ κ° λ λ§λ€μ λ΄ μνλ©μμ§λ₯Ό νμΈνμΈμ.`,
                                    inline: false,
                                },
                                {
                                    name: `Q2. μκ°μ§λ¨ μ€μΌμ€μ λ¨κΈ°κ³  μλ¦Όμ λ μ μλμ?`,
                                    value: `μκ°μ§λ¨ μλΉμ€λ κ΄λ ¨ μ΄μκ° μμ λλ§λ€ μλ¦Όμ λ³΄λ΄μΌ ν©λλ€. μλ¦Όμ λλ €λ©΄ μ±λμλ¦Ό μ€μ μ ν΅ν΄ κΊΌμ£ΌμΈμ.`,
                                    inline: false,
                                },
                                {
                                    name: `Q3. μλ¦Όμ μ΄λ€ νμμΌλ‘ μ μ‘λλμ?`,
                                    value: `μ νν μ±λμ λκ΅¬λ λ³Ό μ μλ λ©μμ§λ‘ μ μ‘ν©λλ€. νκ΅ μ λ³΄, μ¬μ©μ μ λ³΄λ₯Ό μ¨κΈ°κ³ μΆλ€λ©΄ λ°λ‘ κ°μΈ μλ²λ₯Ό κ°μ€ν΄ μ€μ νμΈμ.`,
                                    inline: false,
                                },
                                {
                                    name: `Q4. κ°μΈ μ λ³΄λ₯Ό μ­μ νλ €λ©΄?`,
                                    value: `\`/μ λ³΄ λͺλ Ή:μ‘°ν\` λͺλ Ήμ΄λ‘ κ°μΈ μ λ³΄λ₯Ό μ‘°νν  μ μκ³  \`/μ λ³΄ λͺλ Ή:μ­μ \` λͺλ Ήμ΄λ‘ κ°μΈ μ λ³΄λ₯Ό μ­μ ν  μ μμ΅λλ€.`,
                                }
                            );
                        interaction.editReply({
                            embeds: [registered],
                            components: [],
                            ephemeral: true,
                        });
                        return;
                    }
                    const choose = new MessageEmbed().setTitle(`μ΄λ€ μ λ³΄λ₯Ό μ μ‘ν κΉμ?`).setColor(config.color.primary).setDescription("λ°κ³ μΆμ λ©λ΄λ₯Ό νλ¨μ λ©λ΄μμ μ ννμΈμ.").addFields(
                        {
                            name: `μ€λ κΈμ + μκ°μ§λ¨ μλ¦Ό`,
                            value: `μ€λ κΈμκ³Ό μκ°μ§λ¨ μν μλ£ μλ¦Όμ λ°μμ.`,
                        },
                        {
                            name: `μκ°μ§λ¨ μλ¦Ό`,
                            value: `μκ°μ§λ¨ μν μλ£ μλ¦Όλ§ λ°μμ.`,
                        },
                        {
                            name: `μ€λ κΈμ μλ¦Ό`,
                            value: `μ€λ κΈμ μλ¦Όλ§ λ°μμ.`,
                        }
                    );
                    const chooseInfo = new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId("select")
                            .setPlaceholder("μ μ‘λ°μ μ λ³΄")
                            .addOptions([
                                {
                                    label: `μ€λ κΈμ + μκ°μ§λ¨ μλ¦Ό`,
                                    description: `μ€λ κΈμκ³Ό μκ°μ§λ¨ μν μλ£ μλ¦Όμ λ°μμ.`,
                                    value: "0",
                                },
                                {
                                    label: `μκ°μ§λ¨ μλ¦Ό`,
                                    description: `μκ°μ§λ¨ μν μλ£ μλ¦Όλ§ λ°μμ.`,
                                    value: "1",
                                },
                                {
                                    label: `μ€λ κΈμ μλ¦Ό`,
                                    description: `μ€λ κΈμ μλ¦Όλ§ λ°μμ.`,
                                    value: "2",
                                },
                            ])
                    );
                    const cancel = new MessageActionRow().addComponents(new MessageButton().setCustomId("0").setLabel("μ·¨μ").setStyle("DANGER"));
                    interaction.editReply({
                        embeds: [choose],
                        components: [chooseInfo, cancel],
                        ephemeral: true,
                    });
                    var collector3 = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });
                    var collector4 = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });
                    collector3.on("end", async (ButtonInteraction) => {
                        var answer = ButtonInteraction.first().customId;
                        if (answer == "0") {
                            const cancelled = new MessageEmbed().setTitle(`μ€μΌμ€ λ±λ‘μ΄ μ·¨μλμμ΄μ.`).setColor(config.color.error);
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
                            const cancelled = new MessageEmbed().setTitle(`μ€μΌμ€ λ±λ‘μ΄ μ·¨μλμμ΄μ.`).setColor(config.color.error);
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
                                console.log(`[β] (${userId}, ${userName}) REGISTER ${rawTimeTable[time]}${rawKindsTable[kinds]} schedule`);
                            }
                        });
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} μ€μΌμ€μ΄ μ μμ μΌλ‘ λ±λ‘λμμ΄μ.`)
                            .setDescription("μλ μ λ³΄λ€μ νμΈν΄ λ³΄μΈμ.")
                            .setColor(config.color.success)
                            .addFields(
                                {
                                    name: `μ€μΌμ€ λ±λ‘ μ λ³΄`,
                                    value: `${timeTable[time]} λΆ μ¬μ΄μ <#${channelId}> μ±λλ‘ ${kindsTable[kinds]}μ μ μ‘ν  κ±°μμ.`,
                                    inline: true,
                                },
                                {
                                    name: `Q1. μ μ ν΄μ§ μκ°μ΄ μλ νΉμ  μκ° μ¬μ΄μ μ μ‘λλμ?`,
                                    value: `μκ°μ§λ¨ μνμ λλ€μ±μ μΆκ°νκΈ° μν¨μλλ€. μ νν μκ°μ κ° λ λ§λ€μ λ΄ μνλ©μμ§λ₯Ό νμΈνμΈμ.`,
                                    inline: false,
                                },
                                {
                                    name: `Q2. μκ°μ§λ¨ μ€μΌμ€μ λ¨κΈ°κ³  μλ¦Όμ λ μ μλμ?`,
                                    value: `μκ°μ§λ¨ μλΉμ€λ κ΄λ ¨ μ΄μκ° μμ λλ§λ€ μλ¦Όμ λ³΄λ΄μΌ ν©λλ€. μλ¦Όμ λλ €λ©΄ μ±λμλ¦Ό μ€μ μ ν΅ν΄ κΊΌμ£ΌμΈμ.`,
                                    inline: false,
                                },
                                {
                                    name: `Q3. μλ¦Όμ μ΄λ€ νμμΌλ‘ μ μ‘λλμ?`,
                                    value: `μ νν μ±λμ λκ΅¬λ λ³Ό μ μλ λ©μμ§λ‘ μ μ‘ν©λλ€. νκ΅ μ λ³΄, μ¬μ©μ μ λ³΄λ₯Ό μ¨κΈ°κ³ μΆλ€λ©΄ λ°λ‘ κ°μΈ μλ²λ₯Ό κ°μ€ν΄ μ€μ νμΈμ.`,
                                    inline: false,
                                },
                                {
                                    name: `Q4. κ°μΈ μ λ³΄λ₯Ό μ­μ νλ €λ©΄?`,
                                    value: `\`/μ λ³΄ λͺλ Ή:μ‘°ν\` λͺλ Ήμ΄λ‘ κ°μΈ μ λ³΄λ₯Ό μ‘°νν  μ μκ³  \`/μ λ³΄ λͺλ Ή:μ­μ \` λͺλ Ήμ΄λ‘ κ°μΈ μ λ³΄λ₯Ό μ­μ ν  μ μμ΅λλ€.`,
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
