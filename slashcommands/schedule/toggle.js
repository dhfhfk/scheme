const { Client, Message, MessageEmbed } = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");

var timeTable = ["ð¡ ì¤ì  06:30 ~ 06:50", "ð ì¤ì  07:00 ~ 07:20", "ð¢ ì¤ì  07:30 ~ 07:50"];
var rawTimeTable = ["A", "B", "C"];

var kindsTable = ["ì¤ë ê¸ì + ìê°ì§ë¨ ìë¦¼", "ìê°ì§ë¨ ìë¦¼", "ì¤ë ê¸ì ìë¦¼"];
var rawKindsTable = ["A", "B", "C"];

module.exports = {
    name: "ì¤ì¼ì¤í ê¸",
    description: "ìê°ì§ë¨ / ê¸ì ìë¦¼ ì¤ì¼ì¤ ì ì§ ì¬ë¶ë¥¼ í ê¸í´ì.",
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
                        .setTitle(`${config.emojis.x} ì¤ì¼ì¤ ë±ë¡ ì ë³´ë¥¼ ì°¾ì ì ìì´ì!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `ìì¸ì ë³´:`,
                                value: `DBìì ì ì  ìë³ IDì ë±ë¡ë ì¤ì¼ì¤ì ì°¾ì§ ëª»íì´ì.`,
                                inline: false,
                            },
                            {
                                name: `í´ê²° ë°©ë²:`,
                                value: `ë¨¼ì  \`/ì¤ì¼ì¤ë±ë¡ ì±ë:<ì±ëID> \` ëªë ¹ì´ë¡ ì¤ì¼ì¤ì ë±ë¡íì¸ì.`,
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
                        console.log(`[â] (${userId}, ${userName}) PAUSE schedule`);
                        var paused = new MessageEmbed().setTitle(`${config.emojis.done} ì¤ì¼ì¤ì´ __**ì¼ìì ì§**__ ëìì´ì.`).setDescription(`ë¤ì ëªë ¹ì´ë¥¼ ì¬ì©íë©´ ì¼ìì ì§ë¥¼ í´ì í  ì ìì´ì.`).setColor(config.color.success);
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
                        console.log(`[â] (${userId}, ${userName}) UNPAUSE schedule`);
                        var unpaused = new MessageEmbed()
                            .setTitle(`${config.emojis.done} ì¤ì¼ì¤ __**ì¼ìì ì§ê° í´ì **__ëìì´ì.`)
                            .setDescription(`ìëì ì¤ì¼ì¤ ë±ë¡ ì ë³´ë¥¼ íì¸í´ë³´ì¸ì.`)
                            .addFields({
                                name: `ì¤ì¼ì¤ ë±ë¡ ì ë³´`,
                                value: `${timeTable[rawTimeTable.indexOf(result.schedule.type)]} ë¶ ì¬ì´ì <#${result.schedule.channelId}> ì±ëë¡ ${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]}ì ì ì¡í  ê±°ìì.`,
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
