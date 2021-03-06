const { Client, Message, MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");

var timeTable = ["๐ก ์ค์  06:30 ~ 06:50", "๐ ์ค์  07:00 ~ 07:20", "๐ข ์ค์  07:30 ~ 07:50"];
var rawTimeTable = ["A", "B", "C"];

var kindsTable = ["์ค๋ ๊ธ์ + ์๊ฐ์ง๋จ ์๋ฆผ", "์๊ฐ์ง๋จ ์๋ฆผ", "์ค๋ ๊ธ์ ์๋ฆผ"];
var rawKindsTable = ["A", "B", "C"];

module.exports = {
    name: "์ค์ ",
    description: "๋ด ๋ฐ์ดํฐ๋ฒ ์ด์ค์ ์ ์ฅ๋ ๊ฐ์ธ ์ ๋ณด๋ฅผ ์กฐํํ๊ฑฐ๋ ์ญ์ ๋ฅผ ์์ฒญํด์.",
    options: [
        {
            name: "์กฐํ",
            description: "๊ฐ์ธ ์ ๋ณด๋ฅผ ์กฐํํด์.",
            type: "SUB_COMMAND",
        },
        {
            name: "์ญ์ ",
            description: "๊ฐ์ธ ์ ๋ณด ์ญ์ ๋ฅผ ์์ฒญํด์.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "์ข๋ฅ",
                    description: "์ด๋ค ๋ฐ์ดํฐ๋ฅผ ์ญ์  ์์ฒญํ ๊น์?",
                    type: "STRING",
                    required: true,
                    choices: [
                        {
                            name: "๋ชจ๋",
                            value: "all",
                        },
                        {
                            name: "์ฌ์ฉ์",
                            value: "users",
                        },
                        {
                            name: "์ค์ผ์ค",
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
        const randomKey = Math.random().toString(16).slice(2);
        const userId = interaction.user.id;
        const userName = interaction.user.username;
        let command = interaction.options.getSubcommand();
        if (command === "์กฐํ") {
            await mongo().then(async (mongoose) => {
                try {
                    var result = await schoolSchema.findOne({
                        _id: userId,
                    });
                    try {
                        var validate = result.school.name;
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(`${config.emojis.x} ํ๊ต ๋ฑ๋ก ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`)
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `์์ธ์ ๋ณด:`,
                                    value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ํ๊ต๋ฅผ ์ฐพ์ง ๋ชปํ์ด์.`,
                                    inline: false,
                                },
                                {
                                    name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                    value: `๋จผ์  \`/ํ๊ต๋ฑ๋ก ํ๊ต๋ช:<ํ๊ต๋ช>\` ๋ช๋ น์ด๋ก ํ๊ต๋ฅผ ๋ฑ๋กํ์ธ์.`,
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
                        .setTitle(`${config.emojis.x} ํ๊ต ๋ฑ๋ก ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `์์ธ์ ๋ณด:`,
                                value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ํ๊ต๋ฅผ ์ฐพ์ง ๋ชปํ์ด์.`,
                                inline: false,
                            },
                            {
                                name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                value: `๋จผ์  \`/ํ๊ต๋ฑ๋ก ํ๊ต๋ช:<ํ๊ต๋ช>\` ๋ช๋ น์ด๋ก ํ๊ต๋ฅผ ๋ฑ๋กํ์ธ์.`,
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
                    var timeTable = ["๐ก ์ค์  06:30 ~ 06:50", "๐ ์ค์  07:00 ~ 07:20", "๐ข ์ค์  07:30 ~ 07:50"];
                    var rawTimeTable = ["A", "B", "C"];

                    var kindsTable = ["์ค๋ ๊ธ์ + ์๊ฐ์ง๋จ ์๋ฆผ", "์๊ฐ์ง๋จ ์๋ฆผ", "์ค๋ ๊ธ์ ์๋ฆผ"];

                    var rawKindsTable = ["A", "B", "C"];
                    const info = new MessageEmbed().setTitle(`${interaction.user.username} ๋์ ์ ๋ณด`).setColor(config.color.primary);
                    if (result.school) {
                        const embed = {
                            name: `ํ๊ต ์ ๋ณด`,
                            value: `ํ๊ต๋ช: \`${result.school.name}\`
์๊ฐ์ง๋จ ๊ต์ก์ฒญ ์ฃผ์: \`${result.school.endpoint}\`
์๋๊ต์ก์ฒญ์ฝ๋: \`${result.school.sc}\`
ํ์คํ๊ต์ฝ๋: \`${result.school.sd}\`
๊ธฐ๊ด์ฝ๋: \`${result.school.org}\``,
                        };
                        info.fields.push(embed);
                    }
                    if (result.schedule) {
                        const embed = {
                            name: `์ค์ผ์ค ์ ๋ณด`,
                            value: `์๊ฐ๋: \`${timeTable[rawTimeTable.indexOf(result.schedule.type)]}\`
์ ์ก ์ ๋ณด: \`${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]} ๋ฐ๊ธฐ\`
์ ์ก ์ฑ๋: <#${result.schedule.channelId}>
์ผ์์ ์ง ์ฌ๋ถ: \`${result.schedule.paused ? "์" : "์๋์ค"}\``,
                        };
                        info.fields.push(embed);
                    }
                    if (result.users[0]) {
                        result.users.forEach(function (user, index) {
                            const embed = {
                                name: `์ฌ์ฉ์ ${index + 1} ์ ๋ณด`,
                                value: `์ด๋ฆ: \`${user.name}\`
์ํธํ๋ ์ด๋ฆ: \`${user.encName.substr(0, 14) + "..."}\`
์ํธํ๋ ์๋์์ผ: \`${user.encBirth.substr(0, 14) + "..."}\`
์ํธํ๋ ๋น๋ฐ๋ฒํธ: \`${user.password.substr(0, 14) + "..."}\`
์๊ฐ์ง๋จ ๊ต์ก์ฒญ ์ฃผ์: \`${user.endpoint}\``,
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
            const which = interaction.options.getString("์ข๋ฅ");
            console.log(`[๐] (${userId}, ${userName}) ${command} ${which}`);
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
                                .setTitle(`${config.emojis.x} ํ๊ต ๋ฑ๋ก ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`)
                                .setColor(config.color.error)
                                .addFields(
                                    {
                                        name: `์์ธ์ ๋ณด:`,
                                        value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ํ๊ต๋ฅผ ์ฐพ์ง ๋ชปํ์ด์.`,
                                        inline: false,
                                    },
                                    {
                                        name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                        value: `๋จผ์  \`/ํ๊ต๋ฑ๋ก ํ๊ต๋ช:<ํ๊ต๋ช>\` ๋ช๋ น์ด๋ก ํ๊ต๋ฅผ ๋ฑ๋กํ์ธ์.`,
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
                                .setTitle(`${config.emojis.x} ํ๊ต ๋ฑ๋ก ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`)
                                .setColor(config.color.error)
                                .addFields(
                                    {
                                        name: `์์ธ์ ๋ณด:`,
                                        value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ํ๊ต๋ฅผ ์ฐพ์ง ๋ชปํ์ด์.`,
                                        inline: false,
                                    },
                                    {
                                        name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                        value: `๋จผ์  \`/ํ๊ต๋ฑ๋ก ํ๊ต๋ช:<ํ๊ต๋ช>\` ๋ช๋ น์ด๋ก ํ๊ต๋ฅผ ๋ฑ๋กํ์ธ์.`,
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
                        const check = new MessageEmbed().setTitle(`${config.emojis.delete} ์ ๋ง ๋ชจ๋  ์ ๋ณด๋ฅผ ์ญ์ ํ ๊น์?`).setColor(config.color.delete);
                        if (result.school) {
                            const embed = {
                                name: `ํ๊ต ์ ๋ณด`,
                                value: `ํ๊ต๋ช: \`${result.school.name}\`
์๊ฐ์ง๋จ ๊ต์ก์ฒญ ์ฃผ์: \`${result.school.endpoint}\`
์๋๊ต์ก์ฒญ์ฝ๋: \`${result.school.sc}\`
ํ์คํ๊ต์ฝ๋: \`${result.school.sd}\`
๊ธฐ๊ด์ฝ๋: \`${result.school.org}\``,
                            };
                            check.fields.push(embed);
                        }
                        if (result.schedule) {
                            const embed = {
                                name: `์ค์ผ์ค ์ ๋ณด`,
                                value: `์๊ฐ๋: \`${timeTable[rawTimeTable.indexOf(result.schedule.type)]}\`
์ ์ก ์ ๋ณด: \`${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]} ๋ฐ๊ธฐ\`
์ ์ก ์ฑ๋: <#${result.schedule.channelId}>
์ผ์์ ์ง ์ฌ๋ถ: \`${result.schedule.paused ? "์" : "์๋์ค"}\``,
                            };
                            check.fields.push(embed);
                        }
                        if (result.users[0]) {
                            result.users.forEach(function (user, index) {
                                const embed = {
                                    name: `์ฌ์ฉ์ ${index + 1} ์ ๋ณด`,
                                    value: `์ด๋ฆ: \`${user.name}\`
    ์ํธํ๋ ์ด๋ฆ: \`${user.encName.substr(0, 14) + "..."}\`
    ์ํธํ๋ ์๋์์ผ: \`${user.encBirth.substr(0, 14) + "..."}\`
    ์ํธํ๋ ๋น๋ฐ๋ฒํธ: \`${user.password.substr(0, 14) + "..."}\`
    ์๊ฐ์ง๋จ ๊ต์ก์ฒญ ์ฃผ์: \`${user.endpoint}\``,
                                };
                                check.fields.push(embed);
                            });
                        }
                        const choose = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("0" + randomKey)
                                    .setLabel("๋ค. ์ญ์ ํฉ๋๋ค.")
                                    .setStyle("DANGER")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("1" + randomKey)
                                    .setLabel("์๋์")
                                    .setStyle("SECONDARY")
                            );
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
                                if (rawanswer == "1" + randomKey) {
                                    const cancelled = new MessageEmbed().setTitle(`์ ๋ณด ์ญ์ ๊ฐ ์ทจ์๋์์ด์.`).setColor(config.color.error);
                                    interaction.editReply({
                                        embeds: [cancelled],
                                        components: [],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                                const deleting = new MessageEmbed().setTitle(`์ ๋ณด ์ญ์  ์ค...`).setColor(config.color.delete).setDescription("๋๋ฌด ์ค๋๊ฑธ๋ฆฐ๋ค๋ฉด ๊ด๋ฆฌ์์๊ฒ ๋ฌธ์ํ์ธ์.");
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
                                        const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} ์ ๋ณด๊ฐ ์ ์์ ์ผ๋ก ์ญ์ ๋์์ด์.`).setColor(config.color.success).setDescription("์๋น์ค๋ฅผ ์ด์ฉํด์ฃผ์์ ๊ฐ์ฌํฉ๋๋ค.");
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
                            const error = new MessageEmbed().setTitle(`${config.emojis.x} ์ฌ์ฉ์ ๋ฑ๋ก ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`).setColor(config.color.error).addFields(
                                {
                                    name: `์์ธ์ ๋ณด:`,
                                    value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ์ฌ์ฉ์๋ฅผ ์ฐพ์ง ๋ชปํ์ด์.`,
                                    inline: false,
                                },
                                {
                                    name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                    value: `\`/์ฌ์ฉ์๋ฑ๋ก ์ด๋ฆ:<์ด๋ฆ> ์๋์์ผ:<์๋์์ผ> ๋น๋ฐ๋ฒํธ:<๋น๋ฐ๋ฒํธ> \` ๋ช๋ น์ด๋ก ํ๊ต๋ฅผ ๋ฑ๋กํ์ธ์.`,
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
                    } catch (e) {
                        const error = new MessageEmbed()
                            .setTitle(`${config.emojis.x} ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`)
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `์์ธ์ ๋ณด:`,
                                    value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ์ ๋ณด๋ฅผ ์ฐพ์ง ๋ชปํ์ด์.`,
                                    inline: false,
                                },
                                {
                                    name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                    value: `๋จผ์  \`/ํ๊ต๋ฑ๋ก ํ๊ต๋ช:<ํ๊ต๋ช>\` ๋ช๋ น์ด๋ก ํ๊ต๋ฅผ ๋ฑ๋กํ์ธ์.`,
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
                        if (result.users.length > 1) {
                            const chooseEmbed = result.users.map((user, index) => {
                                return {
                                    name: `์ฌ์ฉ์ ${index + 1}`,
                                    value: `\`${user.name}\` ์ฌ์ฉ์ ์ ๋ณด๋ฅผ ์ ๊ฑฐํด์.`,
                                    inline: false,
                                };
                            });
                            const chooseMenu = result.users.map((user, index) => {
                                return {
                                    label: `์ฌ์ฉ์ ${index + 1}`,
                                    description: `\`${user.name}\` ์ฌ์ฉ์ ์ ๋ณด๋ฅผ ์ ๊ฑฐํด์.`,
                                    value: String(index) + randomKey,
                                };
                            });
                            const choose = {
                                title: `์ด๋ค ์ฌ์ฉ์์ ์ ๋ณด๋ฅผ ์ ๊ฑฐํ ๊น์?`,
                                description: "์๋์ ์ ํ ๋ฉ๋ด์์ ์ ํํ์ธ์.",
                                color: config.color.primary,
                                fields: [
                                    {
                                        name: `๋ชจ๋  ์ฌ์ฉ์`,
                                        value: `๋ชจ๋  ์ฌ์ฉ์ ์ ๋ณด๋ฅผ ์ ๊ฑฐํด์.`,
                                        inline: false,
                                    },
                                    chooseEmbed,
                                ],
                            };
                            const row = new MessageActionRow().addComponents(
                                new MessageSelectMenu()
                                    .setCustomId("select" + randomKey)
                                    .setPlaceholder("์ด๋ค ์ฌ์ฉ์ ์ ๋ณด๋ฅผ ์ ๊ฑฐํ ๊น์?")
                                    .addOptions([
                                        {
                                            label: `๋ชจ๋  ์ฌ์ฉ์`,
                                            description: `๋ชจ๋  ์ฌ์ฉ์ ์ ๋ณด๋ฅผ ์ ๊ฑฐํด์.`,
                                            value: "all" + randomKey,
                                        },
                                        chooseMenu,
                                    ])
                            );
                            interaction.editReply({
                                embeds: [choose],
                                components: [row],
                                ephemeral: true,
                            });

                            const collector = interaction.channel.createMessageComponentCollector({
                                max: 1,
                            });
                            collector.on("end", async (SelectMenuInteraction) => {
                                let rawanswer = SelectMenuInteraction.first().values;
                                let response;
                                try {
                                    if (rawanswer[0] == "all" + randomKey) {
                                        await mongo().then(async (mongoose) => {
                                            try {
                                                result.users.forEach(async (user, index) => {
                                                    await schoolSchema.updateOne(
                                                        {
                                                            _id: userId,
                                                        },
                                                        {
                                                            $pull: {
                                                                users: {
                                                                    name: result.users[index].name,
                                                                },
                                                            },
                                                        }
                                                    );
                                                });
                                            } catch (e) {}
                                        });
                                    } else {
                                        mongo().then(async (mongoose) => {
                                            try {
                                                const reg = new RegExp(randomKey, "g");
                                                await schoolSchema.updateOne(
                                                    {
                                                        _id: userId,
                                                    },
                                                    {
                                                        $pull: {
                                                            users: {
                                                                name: result.users[rawanswer[0].replace(reg, "")].name,
                                                            },
                                                        },
                                                    }
                                                );
                                            } finally {
                                                await mongoose.connection.close();
                                            }
                                        });
                                    }
                                    const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} ์ ๋ณด๊ฐ ์ ์์ ์ผ๋ก ์ญ์ ๋์์ด์.`).setColor(config.color.success).setDescription("์๋น์ค๋ฅผ ์ด์ฉํด์ฃผ์์ ๊ฐ์ฌํฉ๋๋ค.");
                                    return await interaction.editReply({
                                        embeds: [deleted],
                                        components: [],
                                        ephemeral: true,
                                    });
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                }
                            });
                            return;
                        } else if (result.users.length == 1) {
                            const check = new MessageEmbed()
                                .setTitle(`${config.emojis.delete} ์ ๋ง ์ฌ์ฉ์ ์ ๋ณด๋ฅผ ์ญ์ ํ ๊น์?`)
                                .setColor(config.color.delete)
                                .addFields({
                                    name: `์ฌ์ฉ์ 1`,
                                    value: `${result.users[0].name} ์ฌ์ฉ์๋ฅผ ์ญ์ ํด์.`,
                                    inline: false,
                                });
                            const choose = new MessageActionRow()
                                .addComponents(new MessageButton().setCustomId("0").setLabel("๋ค. ์ญ์ ํฉ๋๋ค.").setStyle("DANGER"))
                                .addComponents(new MessageButton().setCustomId("1").setLabel("์๋์").setStyle("SECONDARY"));
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
                                                const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} ์ ๋ณด๊ฐ ์ ์์ ์ผ๋ก ์ญ์ ๋์์ด์.`).setColor(config.color.success).setDescription("์๋น์ค๋ฅผ ์ด์ฉํด์ฃผ์์ ๊ฐ์ฌํฉ๋๋ค.");
                                                interaction.editReply({
                                                    embeds: [deleted],
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                                return;
                                            }
                                        });
                                    } else {
                                        const cancelled = new MessageEmbed().setTitle(`์ ๋ณด ์ญ์ ๊ฐ ์ทจ์๋์์ด์.`).setColor(config.color.error);
                                        interaction.editReply({
                                            embeds: [cancelled],
                                            components: [],
                                            ephemeral: true,
                                        });
                                        return;
                                    }
                                }
                            });
                        }
                        return;
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
                                .setTitle(`${config.emojis.x} ์ค์ผ์ค ๋ฑ๋ก ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`)
                                .setColor(config.color.error)
                                .addFields(
                                    {
                                        name: `์์ธ์ ๋ณด:`,
                                        value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ์ค์ผ์ค์ ์ฐพ์ง ๋ชปํ์ด์.`,
                                        inline: false,
                                    },
                                    {
                                        name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                        value: `๋จผ์  \`/์ค์ผ์ค๋ฑ๋ก ์ฑ๋:<์ฑ๋ID> \` ๋ช๋ น์ด๋ก ์ค์ผ์ค์ ๋ฑ๋กํ์ธ์.`,
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
                            .setTitle(`${config.emojis.x} ์ค์ผ์ค ๋ฑ๋ก ์ ๋ณด๋ฅผ ์ฐพ์ ์ ์์ด์!`)
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `์์ธ์ ๋ณด:`,
                                    value: `DB์์ ์ ์  ์๋ณ ID์ ๋ฑ๋ก๋ ์ค์ผ์ค์ ์ฐพ์ง ๋ชปํ์ด์.`,
                                    inline: false,
                                },
                                {
                                    name: `ํด๊ฒฐ ๋ฐฉ๋ฒ:`,
                                    value: `๋จผ์  \`/์ค์ผ์ค๋ฑ๋ก ์ฑ๋:<์ฑ๋ID> \` ๋ช๋ น์ด๋ก ์ค์ผ์ค์ ๋ฑ๋กํ์ธ์.`,
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
                        var timeTable = ["๐ก ์ค์  06:20 ~ 06:40", "๐ ์ค์  06:50 ~ 07:10", "๐ข ์ค์  07:20 ~ 07:40"];
                        var rawTimeTable = ["A", "B", "C"];

                        var kindsTable = ["์ค๋ ๊ธ์ + ์๊ฐ์ง๋จ ์๋ฆผ", "์๊ฐ์ง๋จ ์๋ฆผ", "์ค๋ ๊ธ์ ์๋ฆผ"];

                        var rawKindsTable = ["A", "B", "C"];
                        mongoose.connection.close();
                        const info = new MessageEmbed()
                            .setTitle(`${config.emojis.delete} ์ ๋ง ์ค์ผ์ค ์ ๋ณด๋ฅผ ์ญ์ ํ ๊น์?`)
                            .setColor(config.color.delete)
                            .addFields({
                                name: `์ค์ผ์ค ์ ๋ณด`,
                                value: `์๊ฐ๋: \`${timeTable[rawTimeTable.indexOf(result.schedule.type)]}\`
์ ์ก ์ ๋ณด: \`${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]}\`
์ ์ก ์ฑ๋: <#${result.schedule.channelId}>
์ผ์์ ์ง ์ฌ๋ถ: \`${result.schedule.paused ? "์" : "์๋์ค"}\``,
                                inline: false,
                            });
                        const choose = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("0" + randomKey)
                                    .setLabel("๋ค. ์ญ์ ํฉ๋๋ค.")
                                    .setStyle("DANGER")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("1" + randomKey)
                                    .setLabel("์๋์")
                                    .setStyle("SECONDARY")
                            );
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
                            if (rawanswer === "0" + randomKey) {
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
                                        const deleted = new MessageEmbed().setTitle(`${config.emojis.delete} ์ ๋ณด๊ฐ ์ ์์ ์ผ๋ก ์ญ์ ๋์์ด์.`).setColor(config.color.success).setDescription("์๋น์ค๋ฅผ ์ด์ฉํด์ฃผ์์ ๊ฐ์ฌํฉ๋๋ค.");
                                        interaction.editReply({
                                            embeds: [deleted],
                                            components: [],
                                            ephemeral: true,
                                        });
                                        return;
                                    }
                                });
                            } else {
                                const cancelled = new MessageEmbed().setTitle(`์ ๋ณด ์ญ์ ๊ฐ ์ทจ์๋์์ด์.`).setColor(config.color.error);
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
