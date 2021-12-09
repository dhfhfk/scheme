const { Client, Message, MessageEmbed } = require("discord.js");
const request = require("request");
const { guilds } = require("../..");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

function getmeal(schoolInfo, date1) {
    var options = {
        uri: "http://open.neis.go.kr/hub/mealServiceDietInfo",
        qs: {
            KEY: config.services.neis_key,
            Type: "json",
            pIndex: 1,
            pSize: 3,
            ATPT_OFCDC_SC_CODE: schoolInfo[1],
            SD_SCHUL_CODE: schoolInfo[2],
            MLSV_YMD: date1,
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
    const resultObj = JSON.parse(data);
    try {
        let result = resultObj.mealServiceDietInfo[1].row[0].DDISH_NM;
        let cal = resultObj.mealServiceDietInfo[1].row[0].CAL_INFO;
        return {
            result: result,
            cal: cal,
        };
    } catch (e) {
        //! 오류로 인해 급식 검색 실패시
        console.warn(`[⚠️] 급식 정보가 없거나 검색 실패: ${e}`);
        const embed = new MessageEmbed()
            .setTitle(`🏫 ${schoolName}`)
            .setColor(config.color.info)
            .setDescription("급식 정보가 없어요.")
            .setFooter(`${date2}`);
        interaction.editReply({
            embeds: [embed],
            ephemeral: false,
        });
        return;
    }
}

module.exports = {
    name: "급식",
    description: "등록된 학교의 급식을 조회해요.",
    options: [
        {
            name: "날짜",
            description: '예를 들어, 2021년 6월 2일은 "20210602"로 입력하세요.',
            type: "INTEGER",
            required: false,
        },
    ],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const userName = interaction.user.username;
        await mongo().then(async (mongoose) => {
            try {
                const result = await schoolSchema.findOne({
                    _id: userId,
                });
                try {
                    var schoolName = result.school.name;
                } catch (e) {
                    const embed = new MessageEmbed()
                        .setTitle(
                            `${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`
                        )
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
                    interaction.editReply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                    return;
                }
                const mealdate = String(interaction.options.getInteger("날짜"));
                if (mealdate !== "null") {
                    if (mealdate.length != 8) {
                        const embed = new MessageEmbed()
                            .setTitle(
                                `${config.emojis.x} 날짜 입력 형식이 잘못 되었어요!`
                            )
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `입력된 값이 \`8\`자리 숫자가 아닌 \`${mealdate.length}\`자리 숫자로 입력되었어요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `예를 들어, \`2021월 6월 2일\`의 급식을 조회하고 싶다면 \"\`20210602\`\" 형태로 입력하세요.`,
                                    inline: false,
                                },
                                {
                                    name: `입력된 값:`,
                                    value: `\`${mealdate}\``,
                                    inline: false,
                                }
                            )
                            .setFooter(`RangeError: date must be 8.`);
                        interaction.editReply({
                            embeds: [embed],
                            ephemeral: true,
                        });
                        return;
                    } else {
                        var date1 = mealdate;
                        let year = date1.substring(0, 4);
                        let month = date1.substring(4, 6);
                        let day = date1.substring(6, 8);
                        const weeks = new Array(
                            "일",
                            "월",
                            "화",
                            "수",
                            "목",
                            "금",
                            "토"
                        );
                        const weekLabel =
                            weeks[new Date(`${year}-${month}-${day}`).getDay()];
                        var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                    }
                } else {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = ("0" + (today.getMonth() + 1)).slice(-2);
                    const day = ("0" + today.getDate()).slice(-2);
                    const weeks = new Array(
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토"
                    );
                    const week = today.getDay();
                    const weekLabel = weeks[week];
                    var date1 = year + month + day;
                    var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                }
                schoolInfo = [
                    result.school.name,
                    result.school.sc,
                    result.school.sd,
                ];
                console.log(
                    `[🔍] (${userId}, ${userName}) GET ${schoolName} meal on ${date1}`
                );
                getmeal(schoolInfo, date1).then(function (data) {
                    try {
                        data = JSON.parse(data);
                        const dishCount =
                            data.mealServiceDietInfo[0].head[0]
                                .list_total_count;
                        var mealInfos = new Array();
                        for (var i = 0; i < dishCount; i++) {
                            let mealNameList =
                                data.mealServiceDietInfo[1].row[i].MMEAL_SC_NM;
                            let mealList =
                                data.mealServiceDietInfo[1].row[i].DDISH_NM;
                            mealList = mealList.replace(/<br\/>/g, "\n"); //? <br/> 줄바꿈
                            mealList = mealList.replace(
                                /\*|[0-9]()+|g|\./g,
                                ""
                            ); //? 알레르기 정보와 필요 없는 정보 제거
                            let calList =
                                data.mealServiceDietInfo[1].row[i].CAL_INFO;
                            let mealInfo = {
                                name: mealNameList,
                                meal: mealList,
                                cal: calList,
                            };
                            mealInfos.push(mealInfo);
                        }
                        const breakfast = mealInfos.find(
                            (v) => v.name === "조식"
                        );
                        const lunch = mealInfos.find((v) => v.name === "중식");
                        const dinner = mealInfos.find((v) => v.name === "석식");
                        const mealInfoEmbed = {
                            color: config.color.info,
                            title: `🏫 ${schoolInfo[0]}`,
                            footer: { text: date2 },
                        };
                        if (dishCount == 1) {
                            if (breakfast) {
                                mealInfoEmbed.fields = [
                                    {
                                        name: `조식 ${breakfast.cal}`,
                                        value: `${breakfast.meal}`,
                                    },
                                ];
                            }
                            if (lunch) {
                                mealInfoEmbed.fields = [
                                    {
                                        name: `중식 ${lunch.cal}`,
                                        value: `${lunch.meal}`,
                                    },
                                ];
                            }
                            if (dinner) {
                                mealInfoEmbed.fields = [
                                    {
                                        name: `석식 ${dinner.cal}`,
                                        value: `${dinner.meal}`,
                                    },
                                ];
                            }
                        }
                        if (dishCount == 2) {
                            if (!breakfast) {
                                mealInfoEmbed.fields = [
                                    {
                                        name: `중식 ${lunch.cal}`,
                                        value: `${lunch.meal}`,
                                    },
                                    {
                                        name: `석식 ${dinner.cal}`,
                                        value: `${dinner.meal}`,
                                    },
                                ];
                            }
                            if (!lunch) {
                                mealInfoEmbed.fields = [
                                    {
                                        name: `조식 ${breakfast.cal}`,
                                        value: `${breakfast.meal}`,
                                    },
                                    {
                                        name: `석식 ${dinner.cal}`,
                                        value: `${dinner.meal}`,
                                    },
                                ];
                            }
                            if (!dinner) {
                                mealInfoEmbed.fields = [
                                    {
                                        name: `조식 ${breakfast.cal}`,
                                        value: `${breakfast.meal}`,
                                    },
                                    {
                                        name: `중식 ${lunch.cal}`,
                                        value: `${lunch.meal}`,
                                    },
                                ];
                            }
                        }
                        if (breakfast && lunch && dinner) {
                            mealInfoEmbed.fields = [
                                {
                                    name: `조식 ${breakfast.cal}`,
                                    value: `${breakfast.meal}`,
                                },
                                {
                                    name: `중식 ${lunch.cal}`,
                                    value: `${lunch.meal}`,
                                },
                                {
                                    name: `석식 ${dinner.cal}`,
                                    value: `${dinner.meal}`,
                                },
                            ];
                        }

                        interaction.editReply({ embeds: [mealInfoEmbed] });
                    } catch (e) {
                        const embed = new MessageEmbed()
                            .setTitle(`🏫 ${schoolName}`)
                            .setColor(config.color.info)
                            .setDescription("급식 정보가 없어요.")
                            .setFooter(`${date2}`);
                        interaction.editReply({
                            embeds: [embed],
                            ephemeral: false,
                        });
                    }
                });
            } finally {
                mongoose.connection.close();
            }
        });
    },
};
