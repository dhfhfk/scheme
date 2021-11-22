const client = require("../index");
const mongo = require("../mongo");
const schedule = require("node-schedule");
const schoolSchema = require("../schemas/school-schema");
const { Client, Message, MessageEmbed } = require("discord.js");
const progress = require("cli-progress");
const hcs = require("hcs.js");
const CryptoJS = require("crypto-js");
const config = require("../config.json");
const request = require("request");

var secretKey = "79SDFGN4THU9BJK9X890HJL2399VU";

function getRawMeal(schoolInfo, date1) {
    const options = {
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
    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (error) return reject(error);
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMeal(rawMeal) {
    try {
        let meal = rawMeal.mealServiceDietInfo[1].row[0].DDISH_NM;
        let cal = rawMeal.mealServiceDietInfo[1].row[0].CAL_INFO;
        return {
            meal: meal,
            cal: cal,
        };
    } catch (e) {
        console.warn(`[⚠️] 급식 정보가 없거나 검색 실패: ${e}`);
        const result = `급식 정보가 없어요.`;
        return result;
    }
}

var survey = {
    Q1: false,
    Q2: false,
    Q3: false,
    Q4: false,
};
function decrypt2(message) {
    const bytes = CryptoJS.AES.decrypt(message, secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
async function doHcs(userInfo) {
    //* const userInfo = [
    //*     result[i].users[0].name,
    //*     result[i].users[0].encName,
    //*     result[i].users[0].encBirth,
    //*     decrypt2(result[i].users[0].password),
    //*     result[i].users[0].endpoint,
    //*     result[i].school.org,
    //*     result[i].schedule.channelId,
    //* ];
    try {
        const login = await hcs.login(
            userInfo[4],
            userInfo[5],
            userInfo[1],
            userInfo[2]
        );
        if (!login.success) {
            console.log("1차 로그인 실패");
            const error = new MessageEmbed()
                .setTitle(`<:red_x:902151708765999104> 로그인에 실패했습니다.`)
                .setAuthor(
                    client.users.cache.get(String(userInfo[7])).username,
                    client.users.cache
                        .get(String(userInfo[7]))
                        .displayAvatarURL()
                )
                .setColor(config.color.error)
                .addFields(
                    {
                        name: `상세정보:`,
                        value: `입력된 값이 올바르지 않습니다.`,
                        inline: false,
                    },
                    {
                        name: `해결 방법:`,
                        value: `
            1. 성명을 제대로 입력했는지 확인하세요.
            2. 생년월일을 제대로 입력했는지 확인하세요.
            3. 학교가 제대로 등록되어있는지 확인하세요.`,
                        inline: false,
                    }
                )
                .setFooter(`로그인 실패`);
            try {
                client.channels.cache
                    .get(userInfo[6])
                    .send({ embeds: [error] });
            } catch (e) {
                try {
                    client.users.cache
                        .get(String(userInfo[7]))
                        .send({ content: "스케줄 채널 설정이 잘못되었어요!" });
                } catch (e) {
                    console.log(
                        userInfo[7] + "의",
                        userInfo[6] + "채널을 찾을 수 없음"
                    );
                }
            }
            return;
        }
        if (login.agreementRequired) {
            const error = new MessageEmbed()
                .setTitle(
                    `<:red_x:902151708765999104> 자가진단 개인정보 처리 방침 안내`
                )
                .setAuthor(
                    client.users.cache.get(String(userInfo[7])).username,
                    client.users.cache
                        .get(String(userInfo[7]))
                        .displayAvatarURL()
                )
                .setColor(config.color.error)
                .addFields(
                    {
                        name: `상세정보:`,
                        value: `자가진단 개인정보 처리 방침에 동의해야합니다.`,
                        inline: false,
                    },
                    {
                        name: `해결 방법:`,
                        value: `공식 자가진단 앱/웹에 접속해 개인정보 처리 방침에 동의해주세요.`,
                        inline: false,
                    }
                )
                .setFooter(`개인정보 처리 방침 동의 필요`);
            try {
                client.channels.cache.get(userInfo[6]).send({
                    content: `<@${String(userInfo[7])}>`,
                    embeds: [error],
                });
            } catch (e) {
                try {
                    client.users.cache
                        .get(String(userInfo[7]))
                        .send({ content: "스케줄 채널 설정이 잘못되었어요!" });
                } catch (e) {
                    console.log(
                        userInfo[7] + "의",
                        userInfo[6] + "채널을 찾을 수 없음"
                    );
                }
            }
            return;
            // await hcs.updateAgreement(school.endpoint, login.token)
        }
        const secondLogin = await hcs.secondLogin(
            userInfo[4],
            login.token,
            userInfo[3]
        );
        if (secondLogin.success == false) {
            console.log("2차 로그인 실패");
            const fail = secondLogin;
            if (fail.message) {
                console.log(`[!?] ${fail.message}`);
                const error = new MessageEmbed()
                    .setTitle(
                        `<:red_x:902151708765999104> 내부 오류로 인한 로그인 실패`
                    )
                    .setAuthor(
                        client.users.cache.get(String(userInfo[7])).username,
                        client.users.cache
                            .get(String(userInfo[7]))
                            .displayAvatarURL()
                    )
                    .setColor(config.color.error)
                    .addFields(
                        {
                            name: `상세정보:`,
                            value: `알 수 없는 내부 오류로 인해 로그인에 실패했습니다.`,
                            inline: false,
                        },
                        {
                            name: `해결 방법:`,
                            value: `잠시 기다린 후 \`/자가진단 \`명령어를 이용하세요. 그래도 해결되지 않는다면 \`/문의 <내용>\`에 아래의 코드를 적어 관리자에게 문의하세요.`,
                            inline: false,
                        }
                    )
                    .setFooter(fail.message);
                try {
                    client.channels.cache.get(userInfo[6]).send({
                        content: `<@${String(userInfo[7])}>`,
                        embeds: [error],
                    });
                } catch (e) {
                    try {
                        client.users.cache.get(String(userInfo[7])).send({
                            content: "스케줄 채널 설정이 잘못되었어요!",
                        });
                    } catch (e) {
                        console.log(
                            userInfo[7] + "의",
                            userInfo[6] + "채널을 찾을 수 없음"
                        );
                    }
                }
                return;
            }
            if (fail.remainingMinutes) {
                console.log(
                    `비밀번호 로그인 \`${fail.remainingMinutes}\`분 제한`
                );
                const failed = new MessageEmbed()
                    .setTitle(
                        `<:red_x:902151708765999104> 비밀번호 로그인 \`${fail.remainingMinutes}\`분 제한`
                    )
                    .setAuthor(
                        client.users.cache.get(String(userInfo[7])).username,
                        client.users.cache
                            .get(String(userInfo[7]))
                            .displayAvatarURL()
                    )
                    .setColor(config.color.error)
                    .addFields(
                        {
                            name: `상세정보:`,
                            value: `로그인을 5회 이상 실패해 로그인에 제한을 받았습니다.`,
                            inline: false,
                        },
                        {
                            name: `해결 방법:`,
                            value: `\`${fail.remainingMinutes}\`분 동안 비밀번호를 제대로 입력했는지 곰곰이 확인하세요.`,
                            inline: false,
                        }
                    );
                try {
                    client.channels.cache.get(userInfo[6]).send({
                        content: `<@${String(userInfo[7])}>`,
                        embeds: [failed],
                    });
                } catch (e) {
                    try {
                        client.users.cache.get(String(userInfo[7])).send({
                            content: "스케줄 채널 설정이 잘못되었어요!",
                        });
                    } catch (e) {
                        console.log(
                            userInfo[7] + "의",
                            userInfo[6] + "채널을 찾을 수 없음"
                        );
                    }
                }
                return;
            }
            const wrongPass = new MessageEmbed()
                .setTitle(
                    `<:red_x:902151708765999104> 비밀번호 로그인 \`${fail.failCount}\`회 실패`
                )
                .setAuthor(
                    client.users.cache.get(String(userInfo[7])).username,
                    client.users.cache
                        .get(String(userInfo[7]))
                        .displayAvatarURL()
                )
                .setDescription(
                    "5회 이상 실패시 약 5분동안 로그인에 제한을 받습니다."
                )
                .setColor(config.color.error)
                .addFields(
                    {
                        name: `상세정보:`,
                        value: `로그인 비밀번호가 올바르지 않습니다.`,
                        inline: false,
                    },
                    {
                        name: `해결 방법:`,
                        value: `비밀번호를 제대로 입력했는지 확인하세요.`,
                        inline: false,
                    }
                );
            try {
                client.channels.cache.get(userInfo[6]).send({
                    content: `<@${String(userInfo[7])}>`,
                    embeds: [wrongPass],
                });
            } catch (e) {
                try {
                    client.users.cache
                        .get(String(userInfo[7]))
                        .send({ content: "스케줄 채널 설정이 잘못되었어요!" });
                } catch (e) {
                    console.log(
                        userInfo[7] + "의",
                        userInfo[6] + "채널을 찾을 수 없음"
                    );
                }
            }
            return;
        }
        token = secondLogin.token;
        var hcsresult = await hcs.registerSurvey(userInfo[4], token, survey);
    } catch (e) {
        console.log("에러", e);
        const error = new MessageEmbed()
            .setTitle(
                `<:red_x:902151708765999104> 내부 오류로 인한 로그인 실패`
            )
            .setAuthor(
                client.users.cache.get(String(userInfo[7])).username,
                client.users.cache.get(String(userInfo[7])).displayAvatarURL()
            )
            .setColor(config.color.error)
            .addFields(
                {
                    name: `상세정보:`,
                    value: `알 수 없는 내부 오류로 인해 로그인에 실패했습니다.`,
                    inline: false,
                },
                {
                    name: `해결 방법:`,
                    value: `잠시 기다린 후 \`/자가진단 \`명령어를 이용하세요. 그래도 해결되지 않는다면 \`/문의 <내용>\`에 아래의 코드를 적어 관리자에게 문의하세요.`,
                    inline: false,
                }
            )
            .setFooter(e);
        try {
            client.channels.cache.get(userInfo[6]).send({
                content: `<@${String(userInfo[7])}>`,
                embeds: [error],
            });
        } catch (e) {
            try {
                client.users.cache
                    .get(userInfo[7])
                    .send({ content: "스케줄 채널 설정이 잘못되었어요!" });
            } catch (e) {
                console.log(
                    userInfo[7] + "의",
                    userInfo[6] + "채널을 찾을 수 없음"
                );
            }
        }
        return;
    }
    var registered = new MessageEmbed()
        .setTitle(
            `<:green_check:902151708380123137> 오늘의 자가진단에 정상적으로 참여했어요.`
        )
        .setColor(config.color.success)
        .addFields({
            name: `참여자`,
            value: `${userInfo[0]}`,
            inline: true,
        })
        .setTimestamp()
        .setFooter(
            client.users.cache.get(String(userInfo[7])).username,
            client.users.cache.get(String(userInfo[7])).displayAvatarURL()
        );
    try {
        client.channels.cache.get(userInfo[6]).send({
            content: `<@${String(userInfo[7])}>`,
            embeds: [registered],
        });
    } catch (e) {
        try {
            client.users.cache
                .get(userInfo[7])
                .send({ content: "스케줄 채널 설정이 잘못되었어요!" });
        } catch (e) {
            console.log(
                userInfo[7] + "의",
                userInfo[6] + "채널을 찾을 수 없음"
            );
        }
    }
    return;
}

client.on("ready", async () => {
    await mongo().then((mongoose) => {
        try {
            console.log("MongoDB 연결 시도중...");
        } finally {
            mongoose.connection.close();
            console.log("MongoDB 연결 성공");
        }
    });
    console.log("스케줄 감시 시작됨");
    const jobA = schedule.scheduleJob(`30 6 * * 1-5`, async function () {
        const wait = Math.floor(Math.random() * (10 - 0)) + 0;
        client.user.setPresence({
            activities: [
                { name: `6시 ${30 + wait}분까지 대기`, type: "PLAYING" },
            ],
            status: "idle",
        });
        console.log(
            `[🕡 A] ${wait}분 후에 A그룹 스케줄을 시작합니다 ··········`
        );
        await sleep(wait * 60000);
        mongo().then(async (mongoose) => {
            try {
                var resultAA = await schoolSchema.find({
                    "schedule.type": "A",
                    "schedule.kinds": "A",
                    "schedule.paused": false,
                });
                var resultAB = await schoolSchema.find({
                    "schedule.type": "A",
                    "schedule.kinds": "B",
                    "schedule.paused": false,
                });
                var resultAC = await schoolSchema.find({
                    "schedule.type": "A",
                    "schedule.kinds": "C",
                    "schedule.paused": false,
                });
            } finally {
                mongoose.connection.close();
                const barA = new progress.MultiBar(
                    {
                        clearOnComplete: false,
                        hideCursor: true,
                    },
                    progress.Presets.shades_grey
                );
                const aa = barA.create(resultAA.length, 0);
                const ab = barA.create(resultAB.length, 0);
                const ac = barA.create(resultAC.length, 0);
                for (
                    let i = 0, pending = Promise.resolve();
                    i < resultAA.length;
                    i++
                ) {
                    var userInfo = [
                        resultAA[i].users[0].name,
                        resultAA[i].users[0].encName,
                        resultAA[i].users[0].encBirth,
                        decrypt2(resultAA[i].users[0].password),
                        resultAA[i].users[0].endpoint,
                        resultAA[i].school.org,
                        resultAA[i].schedule.channelId,
                        resultAA[i]._id,
                    ];
                    var schoolInfo = [
                        resultAA[i].school.name,
                        resultAA[i].school.sc,
                        resultAA[i].school.sd,
                        resultAA[i].schedule.channelId,
                        resultAA[i]._id,
                    ];
                    doHcs(userInfo);
                    var today = new Date();
                    var year = today.getFullYear();
                    var month = ("0" + (today.getMonth() + 1)).slice(-2);
                    var day = ("0" + today.getDate()).slice(-2);
                    var weeks = new Array(
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토"
                    );
                    var week = today.getDay();
                    var weekLabel = weeks[week];
                    var date1 = year + month + day;
                    var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                    let options = {
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
                    pending = pending
                        .then(() => {
                            return new Promise((resolve) => {
                                request(
                                    options,
                                    function (error, response, body) {
                                        if (error) return reject(error);
                                        try {
                                            resolve(JSON.parse(body));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    }
                                );
                            });
                        })
                        .then((data) => {
                            try {
                                const dishCount =
                                    data.mealServiceDietInfo[0].head[0]
                                        .list_total_count;
                                var mealInfos = new Array();
                                for (var i = 0; i < dishCount; i++) {
                                    let mealNameList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .MMEAL_SC_NM;
                                    let mealList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .DDISH_NM;
                                    mealList = mealList.replace(
                                        /<br\/>/g,
                                        "\n"
                                    ); //? <br/> 줄바꿈
                                    mealList = mealList.replace(
                                        /\*|[0-9]()+|g|\./g,
                                        ""
                                    ); //? 알레르기 정보와 필요 없는 정보 제거
                                    let calList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .CAL_INFO;
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
                                const lunch = mealInfos.find(
                                    (v) => v.name === "중식"
                                );
                                const dinner = mealInfos.find(
                                    (v) => v.name === "석식"
                                );
                                const todayMeal = {
                                    color: 0x1aa7ff,
                                    title: `🏫 ${schoolInfo[0]} 오늘 급식`,
                                    footer: { text: date2 },
                                };
                                if (dishCount == 1) {
                                    if (breakfast) {
                                        todayMeal.fields = [
                                            {
                                                name: `조식 ${breakfast.cal}`,
                                                value: `${breakfast.meal}`,
                                            },
                                        ];
                                    }
                                    if (lunch) {
                                        todayMeal.fields = [
                                            {
                                                name: `중식 ${lunch.cal}`,
                                                value: `${lunch.meal}`,
                                            },
                                        ];
                                    }
                                    if (dinner) {
                                        todayMeal.fields = [
                                            {
                                                name: `석식 ${dinner.cal}`,
                                                value: `${dinner.meal}`,
                                            },
                                        ];
                                    }
                                }
                                if (dishCount == 2) {
                                    if (!breakfast) {
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                    todayMeal.fields = [
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

                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            } catch (e) {
                                console.warn(
                                    `[⚠️] 급식 정보가 없거나 검색 실패: ${e}`
                                );
                                const todayMeal = new MessageEmbed()
                                    .setTitle(`🏫 ${schoolInfo[0]} 오늘 급식`)
                                    .setColor(config.color.info)
                                    .setDescription("급식 정보가 없어요.")
                                    .setFooter(`${date2}`);
                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            }
                        });

                    aa.increment();
                }
                for (var i = 0; i < resultAB.length; i++) {
                    const userInfo = [
                        resultAB[i].users[0].name,
                        resultAB[i].users[0].encName,
                        resultAB[i].users[0].encBirth,
                        decrypt2(resultAB[i].users[0].password),
                        resultAB[i].users[0].endpoint,
                        resultAB[i].school.org,
                        resultAB[i].schedule.channelId,
                        resultAB[i]._id,
                    ];
                    try {
                        doHcs(userInfo);
                    } catch (e) {
                        console.log(e);
                    }
                    ab.increment();
                }
                for (
                    let i = 0, pending = Promise.resolve();
                    i < resultAC.length;
                    i++
                ) {
                    const schoolInfo = [
                        resultAC[i].school.name,
                        resultAC[i].school.sc,
                        resultAC[i].school.sd,
                        resultAC[i].schedule.channelId,
                        resultAC[i]._id,
                    ];
                    var today = new Date();
                    var year = today.getFullYear();
                    var month = ("0" + (today.getMonth() + 1)).slice(-2);
                    var day = ("0" + today.getDate()).slice(-2);
                    var weeks = new Array(
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토"
                    );
                    var week = today.getDay();
                    var weekLabel = weeks[week];
                    var date1 = year + month + day;
                    var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                    let options = {
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
                    pending = pending
                        .then(() => {
                            return new Promise((resolve) => {
                                request(
                                    options,
                                    function (error, response, body) {
                                        if (error) return reject(error);
                                        try {
                                            resolve(JSON.parse(body));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    }
                                );
                            });
                        })
                        .then((data) => {
                            try {
                                const dishCount =
                                    data.mealServiceDietInfo[0].head[0]
                                        .list_total_count;
                                var mealInfos = new Array();
                                for (var i = 0; i < dishCount; i++) {
                                    let mealNameList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .MMEAL_SC_NM;
                                    let mealList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .DDISH_NM;
                                    mealList = mealList.replace(
                                        /<br\/>/g,
                                        "\n"
                                    ); //? <br/> 줄바꿈
                                    mealList = mealList.replace(
                                        /\*|[0-9]()+|g|\./g,
                                        ""
                                    ); //? 알레르기 정보와 필요 없는 정보 제거
                                    let calList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .CAL_INFO;
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
                                const lunch = mealInfos.find(
                                    (v) => v.name === "중식"
                                );
                                const dinner = mealInfos.find(
                                    (v) => v.name === "석식"
                                );
                                const todayMeal = {
                                    color: 0x1aa7ff,
                                    title: `🏫 ${schoolInfo[0]} 오늘 급식`,
                                    footer: { text: date2 },
                                };
                                if (dishCount == 1) {
                                    if (breakfast) {
                                        todayMeal.fields = [
                                            {
                                                name: `조식 ${breakfast.cal}`,
                                                value: `${breakfast.meal}`,
                                            },
                                        ];
                                    }
                                    if (lunch) {
                                        todayMeal.fields = [
                                            {
                                                name: `중식 ${lunch.cal}`,
                                                value: `${lunch.meal}`,
                                            },
                                        ];
                                    }
                                    if (dinner) {
                                        todayMeal.fields = [
                                            {
                                                name: `석식 ${dinner.cal}`,
                                                value: `${dinner.meal}`,
                                            },
                                        ];
                                    }
                                }
                                if (dishCount == 2) {
                                    if (!breakfast) {
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                    todayMeal.fields = [
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

                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            } catch (e) {
                                console.warn(
                                    `[⚠️] 급식 정보가 없거나 검색 실패: ${e}`
                                );
                                const todayMeal = new MessageEmbed()
                                    .setTitle(`🏫 ${schoolInfo[0]} 오늘 급식`)
                                    .setColor(config.color.info)
                                    .setDescription("급식 정보가 없어요.")
                                    .setFooter(`${date2}`);
                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            }
                        });
                    ac.increment();
                }
            }
        });
        client.user.setPresence({
            activities: [{ name: "/도움말", type: "WATCHING" }],
            status: "online",
        });
    });
});

client.on("ready", async () => {
    const jobB = schedule.scheduleJob(`0 7 * * 1-5`, async function () {
        const wait = Math.floor(Math.random() * (10 - 0)) + 0;
        client.user.setPresence({
            activities: [{ name: `7시 ${wait}분까지 대기`, type: "PLAYING" }],
            status: "idle",
        });
        console.log(
            `[🕖 B] ${wait}분 후에 B그룹 스케줄을 시작합니다 ··········`
        );
        await sleep(wait * 60000);
        mongo().then(async (mongoose) => {
            try {
                var resultBA = await schoolSchema.find({
                    "schedule.type": "B",
                    "schedule.kinds": "A",
                    "schedule.paused": false,
                });
                var resultBB = await schoolSchema.find({
                    "schedule.type": "B",
                    "schedule.kinds": "B",
                    "schedule.paused": false,
                });
                var resultBC = await schoolSchema.find({
                    "schedule.type": "B",
                    "schedule.kinds": "C",
                    "schedule.paused": false,
                });
            } finally {
                mongoose.connection.close();
                const barB = new progress.MultiBar(
                    {
                        clearOnComplete: false,
                        hideCursor: true,
                    },
                    progress.Presets.shades_grey
                );
                const ba = barB.create(resultBA.length, 0);
                const bb = barB.create(resultBB.length, 0);
                const bc = barB.create(resultBC.length, 0);
                for (
                    let i = 0, pending = Promise.resolve();
                    i < resultBA.length;
                    i++
                ) {
                    let userInfo = [
                        resultBA[i].users[0].name,
                        resultBA[i].users[0].encName,
                        resultBA[i].users[0].encBirth,
                        decrypt2(resultBA[i].users[0].password),
                        resultBA[i].users[0].endpoint,
                        resultBA[i].school.org,
                        resultBA[i].schedule.channelId,
                        resultBA[i]._id,
                    ];
                    let schoolInfo = [
                        resultBA[i].school.name,
                        resultBA[i].school.sc,
                        resultBA[i].school.sd,
                        resultBA[i].schedule.channelId,
                        resultBA[i]._id,
                    ];
                    doHcs(userInfo);
                    var today = new Date();
                    var year = today.getFullYear();
                    var month = ("0" + (today.getMonth() + 1)).slice(-2);
                    var day = ("0" + today.getDate()).slice(-2);
                    var weeks = new Array(
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토"
                    );
                    var week = today.getDay();
                    var weekLabel = weeks[week];
                    var date1 = year + month + day;
                    var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                    let options = {
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
                    pending = pending
                        .then(() => {
                            return new Promise((resolve) => {
                                request(
                                    options,
                                    function (error, response, body) {
                                        if (error) return reject(error);
                                        try {
                                            resolve(JSON.parse(body));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    }
                                );
                            });
                        })
                        .then((data) => {
                            try {
                                const dishCount =
                                    data.mealServiceDietInfo[0].head[0]
                                        .list_total_count;
                                var mealInfos = new Array();
                                for (var i = 0; i < dishCount; i++) {
                                    let mealNameList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .MMEAL_SC_NM;
                                    let mealList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .DDISH_NM;
                                    mealList = mealList.replace(
                                        /<br\/>/g,
                                        "\n"
                                    ); //? <br/> 줄바꿈
                                    mealList = mealList.replace(
                                        /\*|[0-9]()+|g|\./g,
                                        ""
                                    ); //? 알레르기 정보와 필요 없는 정보 제거
                                    let calList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .CAL_INFO;
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
                                const lunch = mealInfos.find(
                                    (v) => v.name === "중식"
                                );
                                const dinner = mealInfos.find(
                                    (v) => v.name === "석식"
                                );
                                const todayMeal = {
                                    color: 0x1aa7ff,
                                    title: `🏫 ${schoolInfo[0]} 오늘 급식`,
                                    footer: { text: date2 },
                                };
                                if (dishCount == 1) {
                                    if (breakfast) {
                                        todayMeal.fields = [
                                            {
                                                name: `조식 ${breakfast.cal}`,
                                                value: `${breakfast.meal}`,
                                            },
                                        ];
                                    }
                                    if (lunch) {
                                        todayMeal.fields = [
                                            {
                                                name: `중식 ${lunch.cal}`,
                                                value: `${lunch.meal}`,
                                            },
                                        ];
                                    }
                                    if (dinner) {
                                        todayMeal.fields = [
                                            {
                                                name: `석식 ${dinner.cal}`,
                                                value: `${dinner.meal}`,
                                            },
                                        ];
                                    }
                                }
                                if (dishCount == 2) {
                                    if (!breakfast) {
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                    todayMeal.fields = [
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

                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            } catch (e) {
                                console.warn(
                                    `[⚠️] 급식 정보가 없거나 검색 실패: ${e}`
                                );
                                const todayMeal = new MessageEmbed()
                                    .setTitle(`🏫 ${schoolInfo[0]} 오늘 급식`)
                                    .setColor(config.color.info)
                                    .setDescription("급식 정보가 없어요.")
                                    .setFooter(`${date2}`);
                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            }
                        });

                    ba.increment();
                }
                for (var i = 0; i < resultBB.length; i++) {
                    const userInfo = [
                        resultBB[i].users[0].name,
                        resultBB[i].users[0].encName,
                        resultBB[i].users[0].encBirth,
                        decrypt2(resultBB[i].users[0].password),
                        resultBB[i].users[0].endpoint,
                        resultBB[i].school.org,
                        resultBB[i].schedule.channelId,
                        resultBB[i]._id,
                    ];
                    try {
                        doHcs(userInfo);
                    } catch (e) {
                        console.log(e);
                    }
                    bb.increment();
                }
                for (
                    var i = 0, pending = Promise.resolve();
                    i < resultBC.length;
                    i++
                ) {
                    const schoolInfo = [
                        resultBC[i].school.name,
                        resultBC[i].school.sc,
                        resultBC[i].school.sd,
                        resultBC[i].schedule.channelId,
                        resultBC[i]._id,
                    ];
                    var today = new Date();
                    var year = today.getFullYear();
                    var month = ("0" + (today.getMonth() + 1)).slice(-2);
                    var day = ("0" + today.getDate()).slice(-2);
                    var weeks = new Array(
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토"
                    );
                    var week = today.getDay();
                    var weekLabel = weeks[week];
                    var date1 = year + month + day;
                    var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                    let options = {
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
                    pending = pending
                        .then(() => {
                            return new Promise((resolve) => {
                                request(
                                    options,
                                    function (error, response, body) {
                                        if (error) return reject(error);
                                        try {
                                            resolve(JSON.parse(body));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    }
                                );
                            });
                        })
                        .then((data) => {
                            try {
                                let dishCount =
                                    data.mealServiceDietInfo[0].head[0]
                                        .list_total_count;
                                let mealInfos = new Array();
                                for (var i = 0; i < dishCount; i++) {
                                    let mealNameList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .MMEAL_SC_NM;
                                    let mealList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .DDISH_NM;
                                    mealList = mealList.replace(
                                        /<br\/>/g,
                                        "\n"
                                    ); //? <br/> 줄바꿈
                                    mealList = mealList.replace(
                                        /\*|[0-9]()+|g|\./g,
                                        ""
                                    ); //? 알레르기 정보와 필요 없는 정보 제거
                                    let calList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .CAL_INFO;
                                    let mealInfo = {
                                        name: mealNameList,
                                        meal: mealList,
                                        cal: calList,
                                    };
                                    mealInfos.push(mealInfo);
                                }
                                let breakfast = mealInfos.find(
                                    (v) => v.name === "조식"
                                );
                                let lunch = mealInfos.find(
                                    (v) => v.name === "중식"
                                );
                                let dinner = mealInfos.find(
                                    (v) => v.name === "석식"
                                );
                                let todayMeal = {
                                    color: 0x1aa7ff,
                                    title: `🏫 ${schoolInfo[0]} 오늘 급식`,
                                    footer: { text: date2 },
                                };
                                if (dishCount == 1) {
                                    if (breakfast) {
                                        todayMeal.fields = [
                                            {
                                                name: `조식 ${breakfast.cal}`,
                                                value: `${breakfast.meal}`,
                                            },
                                        ];
                                    }
                                    if (lunch) {
                                        todayMeal.fields = [
                                            {
                                                name: `중식 ${lunch.cal}`,
                                                value: `${lunch.meal}`,
                                            },
                                        ];
                                    }
                                    if (dinner) {
                                        todayMeal.fields = [
                                            {
                                                name: `석식 ${dinner.cal}`,
                                                value: `${dinner.meal}`,
                                            },
                                        ];
                                    }
                                }
                                if (dishCount == 2) {
                                    if (!breakfast) {
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                    todayMeal.fields = [
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

                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            } catch (e) {
                                console.warn(
                                    `[⚠️] 급식 정보가 없거나 검색 실패: ${e}`
                                );
                                const todayMeal = new MessageEmbed()
                                    .setTitle(`🏫 ${schoolInfo[0]} 오늘 급식`)
                                    .setColor(config.color.info)
                                    .setDescription("급식 정보가 없어요.")
                                    .setFooter(`${date2}`);
                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            }
                        });
                    bc.increment();
                }
            }
        });
        client.user.setPresence({
            activities: [{ name: "/도움말", type: "WATCHING" }],
            status: "online",
        });
    });
});

client.on("ready", async () => {
    const jobC = schedule.scheduleJob(`10 51 19 * * 1-5`, async function () {
        const wait = Math.floor(Math.random() * (10 - 0)) + 0;
        client.user.setPresence({
            activities: [
                { name: `7시 ${30 + wait}분까지 대기`, type: "PLAYING" },
            ],
            status: "idle",
        });
        console.log(
            `[🕢 B] ${wait}분 후에 C그룹 스케줄을 시작합니다 ··········`
        );
        await sleep(wait * 60000);
        mongo().then(async (mongoose) => {
            try {
                var resultCA = await schoolSchema.find({
                    "schedule.type": "C",
                    "schedule.kinds": "A",
                    "schedule.paused": false,
                });
                var resultCB = await schoolSchema.find({
                    "schedule.type": "C",
                    "schedule.kinds": "B",
                    "schedule.paused": false,
                });
                var resultCC = await schoolSchema.find({
                    "schedule.type": "C",
                    "schedule.kinds": "C",
                    "schedule.paused": false,
                });
            } finally {
                mongoose.connection.close();
                const barC = new progress.MultiBar(
                    {
                        clearOnComplete: false,
                        hideCursor: true,
                    },
                    progress.Presets.shades_grey
                );
                const ca = barC.create(resultCA.length, 0);
                const cb = barC.create(resultCB.length, 0);
                const cc = barC.create(resultCC.length, 0);
                for (
                    let i = 0, pending = Promise.resolve();
                    i < resultCA.length;
                    i++
                ) {
                    let userInfo = [
                        resultCA[i].users[0].name,
                        resultCA[i].users[0].encName,
                        resultCA[i].users[0].encBirth,
                        decrypt2(resultCA[i].users[0].password),
                        resultCA[i].users[0].endpoint,
                        resultCA[i].school.org,
                        resultCA[i].schedule.channelId,
                        resultCA[i]._id,
                    ];
                    let schoolInfo = [
                        resultCA[i].school.name,
                        resultCA[i].school.sc,
                        resultCA[i].school.sd,
                        resultCA[i].schedule.channelId,
                        resultCA[i]._id,
                    ];
                    doHcs(userInfo);
                    var today = new Date();
                    var year = today.getFullYear();
                    var month = ("0" + (today.getMonth() + 1)).slice(-2);
                    var day = ("0" + today.getDate()).slice(-2);
                    var weeks = new Array(
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토"
                    );
                    var week = today.getDay();
                    var weekLabel = weeks[week];
                    var date1 = year + month + day;
                    var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                    let options = {
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
                    pending = pending
                        .then(() => {
                            return new Promise((resolve) => {
                                request(
                                    options,
                                    function (error, response, body) {
                                        if (error) return reject(error);
                                        try {
                                            resolve(JSON.parse(body));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    }
                                );
                            });
                        })
                        .then((data) => {
                            try {
                                const dishCount =
                                    data.mealServiceDietInfo[0].head[0]
                                        .list_total_count;
                                var mealInfos = new Array();
                                for (var i = 0; i < dishCount; i++) {
                                    let mealNameList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .MMEAL_SC_NM;
                                    let mealList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .DDISH_NM;
                                    mealList = mealList.replace(
                                        /<br\/>/g,
                                        "\n"
                                    ); //? <br/> 줄바꿈
                                    mealList = mealList.replace(
                                        /\*|[0-9]()+|g|\./g,
                                        ""
                                    ); //? 알레르기 정보와 필요 없는 정보 제거
                                    let calList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .CAL_INFO;
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
                                const lunch = mealInfos.find(
                                    (v) => v.name === "중식"
                                );
                                const dinner = mealInfos.find(
                                    (v) => v.name === "석식"
                                );
                                const todayMeal = {
                                    color: 0x1aa7ff,
                                    title: `🏫 ${schoolInfo[0]} 오늘 급식`,
                                    footer: { text: date2 },
                                };
                                if (dishCount == 1) {
                                    if (breakfast) {
                                        todayMeal.fields = [
                                            {
                                                name: `조식 ${breakfast.cal}`,
                                                value: `${breakfast.meal}`,
                                            },
                                        ];
                                    }
                                    if (lunch) {
                                        todayMeal.fields = [
                                            {
                                                name: `중식 ${lunch.cal}`,
                                                value: `${lunch.meal}`,
                                            },
                                        ];
                                    }
                                    if (dinner) {
                                        todayMeal.fields = [
                                            {
                                                name: `석식 ${dinner.cal}`,
                                                value: `${dinner.meal}`,
                                            },
                                        ];
                                    }
                                }
                                if (dishCount == 2) {
                                    if (!breakfast) {
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                    todayMeal.fields = [
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

                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            } catch (e) {
                                console.warn(
                                    `[⚠️] 급식 정보가 없거나 검색 실패: ${e}`
                                );
                                const todayMeal = new MessageEmbed()
                                    .setTitle(`🏫 ${schoolInfo[0]} 오늘 급식`)
                                    .setColor(config.color.info)
                                    .setDescription("급식 정보가 없어요.")
                                    .setFooter(`${date2}`);
                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            }
                        });

                    ca.increment();
                }
                for (var i = 0; i < resultCB.length; i++) {
                    const userInfo = [
                        resultCB[i].users[0].name,
                        resultCB[i].users[0].encName,
                        resultCB[i].users[0].encBirth,
                        decrypt2(resultCB[i].users[0].password),
                        resultCB[i].users[0].endpoint,
                        resultCB[i].school.org,
                        resultCB[i].schedule.channelId,
                        resultCB[i]._id,
                    ];
                    try {
                        doHcs(userInfo);
                    } catch (e) {
                        console.log(e);
                    }
                    cb.increment();
                }
                for (
                    var i = 0, pending = Promise.resolve();
                    i < resultCC.length;
                    i++
                ) {
                    const schoolInfo = [
                        resultCC[i].school.name,
                        resultCC[i].school.sc,
                        resultCC[i].school.sd,
                        resultCC[i].schedule.channelId,
                        resultCC[i]._id,
                    ];
                    var today = new Date();
                    var year = today.getFullYear();
                    var month = ("0" + (today.getMonth() + 1)).slice(-2);
                    var day = ("0" + today.getDate()).slice(-2);
                    var weeks = new Array(
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토"
                    );
                    var week = today.getDay();
                    var weekLabel = weeks[week];
                    var date1 = year + month + day;
                    var date2 = `${year}년 ${month}월 ${day}일 (${weekLabel})`;
                    let options = {
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
                    pending = pending
                        .then(() => {
                            return new Promise((resolve) => {
                                request(
                                    options,
                                    function (error, response, body) {
                                        if (error) return reject(error);
                                        try {
                                            resolve(JSON.parse(body));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    }
                                );
                            });
                        })
                        .then((data) => {
                            try {
                                const dishCount =
                                    data.mealServiceDietInfo[0].head[0]
                                        .list_total_count;
                                var mealInfos = new Array();
                                for (var i = 0; i < dishCount; i++) {
                                    let mealNameList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .MMEAL_SC_NM;
                                    let mealList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .DDISH_NM;
                                    mealList = mealList.replace(
                                        /<br\/>/g,
                                        "\n"
                                    ); //? <br/> 줄바꿈
                                    mealList = mealList.replace(
                                        /\*|[0-9]()+|g|\./g,
                                        ""
                                    ); //? 알레르기 정보와 필요 없는 정보 제거
                                    let calList =
                                        data.mealServiceDietInfo[1].row[i]
                                            .CAL_INFO;
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
                                const lunch = mealInfos.find(
                                    (v) => v.name === "중식"
                                );
                                const dinner = mealInfos.find(
                                    (v) => v.name === "석식"
                                );
                                const todayMeal = {
                                    color: 0x1aa7ff,
                                    title: `🏫 ${schoolInfo[0]} 오늘 급식`,
                                    footer: { text: date2 },
                                };
                                if (dishCount == 1) {
                                    if (breakfast) {
                                        todayMeal.fields = [
                                            {
                                                name: `조식 ${breakfast.cal}`,
                                                value: `${breakfast.meal}`,
                                            },
                                        ];
                                    }
                                    if (lunch) {
                                        todayMeal.fields = [
                                            {
                                                name: `중식 ${lunch.cal}`,
                                                value: `${lunch.meal}`,
                                            },
                                        ];
                                    }
                                    if (dinner) {
                                        todayMeal.fields = [
                                            {
                                                name: `석식 ${dinner.cal}`,
                                                value: `${dinner.meal}`,
                                            },
                                        ];
                                    }
                                }
                                if (dishCount == 2) {
                                    if (!breakfast) {
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                        todayMeal.fields = [
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
                                    todayMeal.fields = [
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

                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            } catch (e) {
                                console.warn(
                                    `[⚠️] 급식 정보가 없거나 검색 실패: ${e}`
                                );
                                const todayMeal = new MessageEmbed()
                                    .setTitle(`🏫 ${schoolInfo[0]} 오늘 급식`)
                                    .setColor(config.color.info)
                                    .setDescription("급식 정보가 없어요.")
                                    .setFooter(`${date2}`);
                                try {
                                    client.channels.cache
                                        .get(schoolInfo[3])
                                        .send({
                                            content: `<@${String(
                                                schoolInfo[4]
                                            )}>`,
                                            embeds: [todayMeal],
                                        });
                                } catch (e) {
                                    try {
                                        client.users.cache
                                            .get(`${String(schoolInfo[4])}`)
                                            .send({
                                                content:
                                                    "스케줄 채널 설정이 잘못되었어요!",
                                            });
                                    } catch (e) {
                                        console.log(
                                            schoolInfo[4] + "의",
                                            schoolInfo[3] +
                                                "채널을 찾을 수 없음"
                                        );
                                    }
                                }
                            }
                        });
                    cc.increment();
                }
            }
        });
        client.user.setPresence({
            activities: [{ name: "/도움말", type: "WATCHING" }],
            status: "online",
        });
    });
});
