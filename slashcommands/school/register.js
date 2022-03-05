const { Client, Message, MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
const request = require("request");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const hcs = require("../../hcs");

const cancelled = new MessageEmbed().setTitle(`학교 등록이 취소되었어요.`).setColor(config.color.error);

async function saveDB(userID, school) {
    let error = false;
    const response = {
        err: false,
        user: userID,
        schoolName: school.name,
    };
    mongo().then(async (mongoose) => {
        try {
            await schoolSchema.findOneAndUpdate(
                {
                    _id: userID,
                },
                {
                    _id: userID,
                    school: {
                        school,
                    },
                },
                {
                    new: true,
                    upsert: true,
                }
            );
        } catch (e) {
            error = true;
            response.err = error;
        } finally {
            await mongoose.connection.close();
            return "done";
        }
    });
}

function findSchool(schoolName) {
    const options = {
        uri: "http://open.neis.go.kr/hub/schoolInfo",
        qs: {
            KEY: config.services.neis_key,
            Type: "json",
            pIndex: 1,
            pSize: 5,
            SCHUL_NM: schoolName,
        },
    };
    return new Promise((resolve) => {
        request(options, function (error, response, body) {
            if (error) throw error;
            resolve(JSON.parse(body));
        });
    });
}

module.exports = {
    name: "학교등록",
    description: "학교를 등록해요.",
    options: [
        {
            name: "학교명",
            description: "무슨 학교를 등록할까요?",
            type: "STRING",
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
        const randomKey = Math.random().toString(16).slice(2);
        findSchool(args[0]).then(async (data) => {
            if (data.RESULT) {
                return await interaction.editReply({
                    embeds: [
                        {
                            color: config.color.error,
                            title: `${config.emojis.x} 학교 검색결과가 없어요.`,
                            fields: [
                                {
                                    name: `상세정보:`,
                                    value: `\`${args[0]}\` 키워드에 맞는 학교를 찾을 수 없어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `__**올바른 학교이름**__을 입력하거나 **다시 시도**하세요. 모바일 환경이라면 한글 입력이 제대로 지원되지 않을 수 있어요.`,
                                    inline: false,
                                },
                                {
                                    name: `입력된 값:`,
                                    value: `\`${args[0]}\``,
                                    inline: false,
                                },
                            ],
                        },
                    ],
                });
            }
            const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
            const schoolList = data.schoolInfo[1].row.map((school, index) => {
                return {
                    name: `${school.SCHUL_NM}`,
                    value: `> ${school.ORG_RDNMA}`,
                };
            });
            if (schoolList.length <= 1) {
                const hcsSchool = await hcs.searchSchool(schoolList[0].name);
                const schoolInfo = {
                    name: data.schoolInfo[1].row[0].SCHUL_NM,
                    endpoint: hcsSchool[0].endpoint,
                    sc: data.schoolInfo[1].row[0].ATPT_OFCDC_SC_CODE,
                    sd: data.schoolInfo[1].row[0].SD_SCHUL_CODE,
                    org: hcsSchool[0].schoolCode,
                };
                await mongo().then(async (mongoose) => {
                    try {
                        await schoolSchema.findOneAndUpdate(
                            {
                                _id: interaction.user.id,
                            },
                            {
                                _id: interaction.user.id,
                                school: schoolInfo,
                            },
                            {
                                new: true,
                                upsert: true,
                            }
                        );
                    } catch (e) {
                        console.error(e);
                    } finally {
                        await mongoose.connection.close();
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} ${interaction.user.nickname || interaction.user.username}님의 학교를 ${schoolInfo.name}로 등록했어요.`)
                            .setDescription(
                                `이제 자가진단 사용자를 등록하거나 자동 급식 알림 스케줄을 등록할 수 있어요! 
(\`/사용자등록\` \`/스케줄등록\`)`
                            )
                            .setColor(config.color.success)
                            .addFields(
                                {
                                    name: `Q1. 등록된 학교를 변경하려면?`,
                                    value: `\`/학교등록\` 명령어를 다시 사용하면 기존의 학교에 덮어씌울 수 있습니다.`,
                                },
                                {
                                    name: `Q2. 개인 정보를 삭제하려면?`,
                                    value: `\`/설정\` 명령어로 개인 정보를 조회하거나 삭제할 수 있습니다..`,
                                }
                            );
                        return await interaction.editReply({
                            embeds: [registered],
                            components: [],
                        });
                    }
                });
            } else {
                await interaction.editReply({
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageSelectMenu()
                                .setCustomId("schoolSelectMenu" + randomKey)
                                .setPlaceholder("학교 검색결과")
                                .addOptions(
                                    schoolList.map((t, index) => {
                                        return {
                                            label: `${emojis[index]} ${t.name}`,
                                            value: String(index),
                                            description: `${t.name} 선택`,
                                        };
                                    })
                                ),
                        ]),
                    ],
                    embeds: [
                        {
                            color: config.color.primary,
                            title: `아래 선택 메뉴에서 자신의 학교를 선택해주세요.`,
                            fields: [
                                schoolList.map((t, index) => {
                                    return {
                                        name: `${emojis[index]} ${t.name}`,
                                        value: t.value,
                                    };
                                }),
                            ],
                        },
                    ],
                });
                const filter = (i) => {
                    i.deferUpdate();
                    return i.customId === `schoolSelectMenu${randomKey}`;
                };
                const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: "SELECT_MENU", time: 300000, max: 1 });
                collector.on("collect", async (i) => {
                    const hcsSchool = await hcs.searchSchool(schoolList[i.values[0]].name);
                    schoolInfo = {
                        name: data.schoolInfo[1].row[i.values[0]].SCHUL_NM,
                        endpoint: hcsSchool[0].endpoint,
                        sc: data.schoolInfo[1].row[i.values[0]].ATPT_OFCDC_SC_CODE,
                        sd: data.schoolInfo[1].row[i.values[0]].SD_SCHUL_CODE,
                        org: hcsSchool[0].schoolCode,
                    };
                    mongo().then(async (mongoose) => {
                        try {
                            await schoolSchema.findOneAndUpdate(
                                {
                                    _id: interaction.user.id,
                                },
                                {
                                    _id: interaction.user.id,
                                    school: schoolInfo,
                                },
                                {
                                    new: true,
                                    upsert: true,
                                }
                            );
                        } catch (e) {
                            console.error(e);
                        } finally {
                            await mongoose.connection.close();
                            var registered = new MessageEmbed()
                                .setTitle(`${config.emojis.done} ${interaction.user.nickname || interaction.user.username}님의 학교를 ${schoolInfo.name}로 등록했어요.`)
                                .setDescription(
                                    `이제 자가진단 사용자를 등록하거나 자동 급식 알림 스케줄을 등록할 수 있어요! 
(\`/사용자등록\` \`/스케줄등록\`)`
                                )
                                .setColor(config.color.success)
                                .addFields(
                                    {
                                        name: `Q1. 등록된 학교를 변경하려면?`,
                                        value: `\`/학교등록\` 명령어를 다시 사용하면 기존의 학교에 덮어씌울 수 있습니다.`,
                                    },
                                    {
                                        name: `Q2. 개인 정보를 삭제하려면?`,
                                        value: `\`/설정\` 명령어로 개인 정보를 조회하거나 삭제할 수 있습니다..`,
                                    }
                                );
                            return await interaction.editReply({
                                embeds: [registered],
                                components: [],
                            });
                        }
                    });
                });
            }
        });
    },
};
