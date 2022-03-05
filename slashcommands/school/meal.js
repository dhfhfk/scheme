const { Client, Message, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const request = require("request");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function getMeal(schoolInfo, today) {
    var options = {
        uri: "http://open.neis.go.kr/hub/mealServiceDietInfo",
        qs: {
            KEY: config.services.neis_key,
            Type: "json",
            pIndex: 1,
            pSize: 3,
            ATPT_OFCDC_SC_CODE: schoolInfo.SC,
            SD_SCHUL_CODE: schoolInfo.SD,
            MLSV_YMD: today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + ("0" + today.getDate()).slice(-2),
        },
    };
    return new Promise((resolve) => {
        request(options, function (error, response, body) {
            if (error) throw error;
            resolve(body);
        });
    });
}

function parse(data) {
    try {
        data = JSON.parse(data);
        const dishCount = data.mealServiceDietInfo[0].head[0].list_total_count;
        var mealInfos = new Array();
        for (var i = 0; i < dishCount; i++) {
            let mealNameList = data.mealServiceDietInfo[1].row[i].MMEAL_SC_NM;
            let mealList = data.mealServiceDietInfo[1].row[i].DDISH_NM;
            mealList = mealList.replace(/<br\/>/g, "\n"); //? <br/> 줄바꿈
            mealList = mealList.replace(/\*|[0-9]()+|g|\./g, ""); //? 알레르기 정보와 필요 없는 정보 제거
            let calList = data.mealServiceDietInfo[1].row[i].CAL_INFO;
            let mealInfo = {
                type: mealNameList,
                meal: mealList,
                cal: calList,
            };
            mealInfos.push(mealInfo);
        }
        // const breakfast = mealInfos.find((v) => v.name === "조식");
        // const lunch = mealInfos.find((v) => v.name === "중식");
        // const dinner = mealInfos.find((v) => v.name === "석식");

        return mealInfos;
    } catch (e) {}
}

module.exports = {
    name: "급식",
    description: "등록된 학교의 급식을 조회해요.",
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        await interaction.deferReply();
        const userId = await interaction.user.id;
        const userName = await interaction.user.username;
        await mongo().then(async (mongoose) => {
            try {
                var result = await schoolSchema.findOne({
                    _id: userId,
                });
                try {
                    var schoolName = result.school.name;
                } catch (e) {
                    const embed = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `데이터베이스에서 유저 식별 ID에 등록된 학교를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                inline: false,
                            }
                        )
                        .setFooter(`${e}`);
                    await interaction.editReply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                    return;
                }
            } finally {
                mongoose.connection.close();
                const randomKey = Math.random().toString(16).slice(2);
                const pageController = new MessageActionRow()
                    .addComponents(new MessageButton().setCustomId(`today-${randomKey}`).setLabel("오늘").setStyle("PRIMARY"))
                    .addComponents(new MessageButton().setCustomId(`prev-${randomKey}`).setLabel("<").setStyle("SECONDARY"))
                    .addComponents(new MessageButton().setCustomId(`spec-${randomKey}`).setLabel("📅 입력").setStyle("SECONDARY"))
                    .addComponents(new MessageButton().setCustomId(`next-${randomKey}`).setLabel(">").setStyle("SECONDARY"));
                let today = new Date();
                const weeks = new Array("일", "월", "화", "수", "목", "금", "토");
                let date2 = `${today.getFullYear()}년 ${("0" + (today.getMonth() + 1)).slice(-2)}월 ${("0" + today.getDate()).slice(-2)}일 (${weeks[today.getDay()]})`;
                const school = {
                    name: result.school.name,
                    SC: result.school.sc,
                    SD: result.school.sd,
                };
                getMeal(school, today).then(async function (data) {
                    try {
                        var chooseEmbed = parse(data).map((meal) => {
                            return {
                                name: `${meal.type} ${meal.cal}`,
                                value: meal.meal,
                                inline: false,
                            };
                        });
                        await interaction.editReply({
                            embeds: [
                                {
                                    title: `🏫 ${school.name} 급식`,
                                    color: config.color.primary,
                                    fields: [chooseEmbed],
                                    footer: {
                                        text: date2,
                                    },
                                },
                            ],
                            components: [pageController],
                        });
                    } catch {
                        await interaction.editReply({
                            embeds: [
                                {
                                    title: `🏫 ${school.name} 급식`,
                                    description: "급식 정보가 없어요.",
                                    color: config.color.primary,
                                    footer: {
                                        text: date2,
                                    },
                                },
                            ],
                            components: [pageController],
                        });
                    }
                    const collector = interaction.channel.createMessageComponentCollector({ componentType: "BUTTON" });

                    collector.on("collect", async (i) => {
                        if (i.customId == `spec-${randomKey}`) {
                            i.reply({ ephemeral: false, content: `<@${i.user.id}> 급식을 조회할 날짜를 입력해주세요. 예) 2022년 3월 5일은 \`20220305\`로 입력하세요.` }).then(async () => {
                                setTimeout(() => i.deleteReply().catch(() => {}), 20000);
                            });
                            const filter = (m) => i.user.id == m.author.id;
                            const collector = interaction.channel.createMessageCollector({ filter, time: 20000 });
                            collector.on("collect", async (m) => {
                                await m.delete();
                                await i.deleteReply();
                                collector.stop();
                                if (m.content.length < 8 || m.content.length > 8) {
                                    collector.stop();
                                    return i.followUp({ ephemeral: true, content: `날짜 입력 형식이 잘못되었어요. 다시 버튼을 누르고 입력해주세요. 예) 2022년 3월 5일은 \`20220305\`로 입력하세요.`, ephemeral: false }).then(async (m) => {
                                        setTimeout(() => m.delete().catch(() => {}), 5000);
                                    });
                                }
                                const year = Number(m.content.substring(0, 4));
                                const month = Number(m.content.substring(4, 6));
                                const day = Number(m.content.substring(6, 8));
                                today = new Date(year, month - 1, day + 0);
                                date2 = `${today.getFullYear()}년 ${("0" + (today.getMonth() + 1)).slice(-2)}월 ${("0" + today.getDate()).slice(-2)}일 (${weeks[today.getDay()]})`;
                                getMeal(school, today).then(async function (data) {
                                    try {
                                        var chooseEmbed = parse(data).map((meal) => {
                                            return {
                                                name: `${meal.type} ${meal.cal}`,
                                                value: meal.meal,
                                                inline: false,
                                            };
                                        });
                                    } catch {
                                        return await interaction.editReply({
                                            embeds: [
                                                {
                                                    title: `🏫 ${school.name} 급식`,
                                                    description: "급식 정보가 없어요.",
                                                    color: config.color.primary,
                                                    footer: {
                                                        text: date2,
                                                    },
                                                },
                                            ],
                                        });
                                    }
                                    await interaction.editReply({
                                        embeds: [
                                            {
                                                title: `🏫 ${school.name} 급식`,
                                                color: config.color.primary,
                                                fields: [chooseEmbed],
                                                footer: {
                                                    text: date2,
                                                },
                                            },
                                        ],
                                        components: [pageController],
                                    });
                                });
                            });
                        }
                        if (i.customId == `next-${randomKey}`) {
                            await i.deferUpdate();
                            today.setDate(today.getDate() + 1);
                            date2 = `${today.getFullYear()}년 ${("0" + (today.getMonth() + 1)).slice(-2)}월 ${("0" + today.getDate()).slice(-2)}일 (${weeks[today.getDay()]})`;
                            getMeal(school, today).then(async function (data) {
                                try {
                                    var chooseEmbed = parse(data).map((meal) => {
                                        return {
                                            name: `${meal.type} ${meal.cal}`,
                                            value: meal.meal,
                                            inline: false,
                                        };
                                    });
                                } catch {
                                    return await interaction.editReply({
                                        embeds: [
                                            {
                                                title: `🏫 ${school.name} 급식`,
                                                description: "급식 정보가 없어요.",
                                                color: config.color.primary,
                                                footer: {
                                                    text: date2,
                                                },
                                            },
                                        ],
                                    });
                                }
                                await interaction.editReply({
                                    embeds: [
                                        {
                                            title: `🏫 ${school.name} 급식`,
                                            color: config.color.primary,
                                            fields: [chooseEmbed],
                                            footer: {
                                                text: date2,
                                            },
                                        },
                                    ],
                                    components: [pageController],
                                });
                            });
                        } else if (i.customId == `prev-${randomKey}`) {
                            await i.deferUpdate();
                            today.setDate(today.getDate() - 1);
                            date2 = `${today.getFullYear()}년 ${("0" + (today.getMonth() + 1)).slice(-2)}월 ${("0" + today.getDate()).slice(-2)}일 (${weeks[today.getDay()]})`;
                            getMeal(school, today).then(async function (data) {
                                try {
                                    var chooseEmbed = parse(data).map((meal) => {
                                        return {
                                            name: `${meal.type} ${meal.cal}`,
                                            value: meal.meal,
                                            inline: false,
                                        };
                                    });
                                } catch {
                                    return await interaction.editReply({
                                        embeds: [
                                            {
                                                title: `🏫 ${school.name} 급식`,
                                                description: "급식 정보가 없어요.",
                                                color: config.color.primary,
                                                footer: {
                                                    text: date2,
                                                },
                                            },
                                        ],
                                    });
                                }
                                await interaction.editReply({
                                    embeds: [
                                        {
                                            title: `🏫 ${school.name} 급식`,
                                            color: config.color.primary,
                                            fields: [chooseEmbed],
                                            footer: {
                                                text: date2,
                                            },
                                        },
                                    ],
                                    components: [pageController],
                                });
                            });
                        } else if (i.customId == `today-${randomKey}`) {
                            await i.deferUpdate();
                            today = new Date();
                            date2 = `${today.getFullYear()}년 ${("0" + (today.getMonth() + 1)).slice(-2)}월 ${("0" + today.getDate()).slice(-2)}일 (${weeks[today.getDay()]})`;
                            getMeal(school, today).then(async function (data) {
                                try {
                                    var chooseEmbed = parse(data).map((meal) => {
                                        return {
                                            name: `${meal.type} ${meal.cal}`,
                                            value: meal.meal,
                                            inline: false,
                                        };
                                    });
                                } catch {
                                    return await interaction.editReply({
                                        embeds: [
                                            {
                                                title: `🏫 ${school.name} 급식`,
                                                description: "급식 정보가 없어요.",
                                                color: config.color.primary,
                                                footer: {
                                                    text: date2,
                                                },
                                            },
                                        ],
                                    });
                                }
                                await interaction.editReply({
                                    embeds: [
                                        {
                                            title: `🏫 ${school.name} 급식`,
                                            color: config.color.primary,
                                            fields: [chooseEmbed],
                                            footer: {
                                                text: date2,
                                            },
                                        },
                                    ],
                                    components: [pageController],
                                });
                            });
                        }
                    });
                });
            }
        });
    },
};
