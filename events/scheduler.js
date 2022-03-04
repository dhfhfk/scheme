const client = require("../index");
const mongo = require("../mongo");
const schedule = require("node-schedule");
const schoolSchema = require("../schemas/school-schema");
const { MessageEmbed } = require("discord.js");
const hcs = require("../hcs");
const CryptoJS = require("crypto-js");
const config = require("../config.json");
const request = require("request");

var secretKey = "79SDFGN4THU9BJK9X890HJL2399VU";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function decrypt2(message) {
    const bytes = CryptoJS.AES.decrypt(message, secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

async function getRawMeal(options) {
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

async function getMeal(schoolInfo) {
    var today = new Date();
    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);
    var weeks = new Array("일", "월", "화", "수", "목", "금", "토");
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
            ATPT_OFCDC_SC_CODE: schoolInfo.school.sc,
            SD_SCHUL_CODE: schoolInfo.school.sd,
            MLSV_YMD: date1,
        },
    };
    const data = await getRawMeal(options);
    try {
        const dishCount = data.mealServiceDietInfo[0].head[0].list_total_count;
        var mealInfos = new Array();
        for (var i = 0; i < dishCount; i++) {
            let mealNameList = data.mealServiceDietInfo[1].row[i].MMEAL_SC_NM;
            let mealList = data.mealServiceDietInfo[1].row[i].DDISH_NM;
            mealList = mealList.replace(/<br\/>/g, "\n"); //? <br/> 줄바꿈
            mealList = mealList.replace(/\*|[0-9]()+|g|\./g, ""); //? 알레르기 정보와 필요 없는 정보 제거
            let calList = data.mealServiceDietInfo[1].row[i].CAL_INFO;
            let mealInfo = {
                name: mealNameList,
                meal: mealList,
                cal: calList,
            };
            mealInfos.push(mealInfo);
        }
        const breakfast = mealInfos.find((v) => v.name === "조식");
        const lunch = mealInfos.find((v) => v.name === "중식");
        const dinner = mealInfos.find((v) => v.name === "석식");
        const todayMeal = {
            color: config.color.primary,
            title: `🏫 ${schoolInfo.school.name} 오늘 급식`,
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
            return todayMeal;
        } catch (e) {
            try {
                return "스케줄 채널 설정이 잘못되었어요!";
            } catch (e) {
                console.error(schoolInfo._id + "의", schoolInfo.schedule.channelId + "채널을 찾을 수 없음");
            }
        }
    } catch (e) {
        console.warn(`[⚠️] 급식 정보가 없거나 검색 실패: ${e}`);
        const todayMeal = new MessageEmbed().setTitle(`🏫 ${schoolInfo.school.name} 오늘 급식`).setColor(config.color.primary).setDescription("급식 정보가 없어요.").setFooter(`${date2}`);
        try {
            return todayMeal;
        } catch (e) {
            try {
                return "스케줄 채널 설정이 잘못되었어요!";
            } catch (e) {
                console.error(schoolInfo._id + "의", schoolInfo.schedule.channelId + "채널을 찾을 수 없음");
            }
        }
    }
}

async function doHcs(user, sd) {
    const today = new Date();
    let RAT = false;
    const week = today.getDay();
    const survey = {
        /**
         * 1. 학생 본인이 코로나19 감염에 의심되는 아래의 임상증상*이 있나요?
         * (주요 임상증상) 발열(37.5℃), 기침, 호흡곤란, 오한, 근육통, 두통, 인후통, 후각·미각소실
         */
        Q1: false,

        /**
         * 2. 학생은 오늘 신속항원검사(자가진단)를 실시했나요?
         */
        Q2: 0,

        /**
         * 3.학생 본인 또는 동거인이 PCR 검사를 받고 그 결과를 기다리고 있나요?
         */
        Q3: false,
    };
    if ((week == 1 || week == 3) && sd == "7430059") {
        console.log("RAT = TRUE, 음성으로 제출");
        RAT = true;
        survey.Q2 = 1;
    }
    try {
        var login = await hcs.login(user.endpoint, user.org, user.encName, user.encBirth);
        if (!login.success) {
            const error = new MessageEmbed()
                .setTitle(`${config.emojis.x} 로그인에 실패했습니다.`)
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
            return error;
        }
    } catch (e) {
        console.error(`[⚠️] 1차 로그인 중 오류 발생: ${e}`);
        const error = new MessageEmbed()
            .setTitle(`${config.emojis.x} 내부 오류로 인한 로그인 실패`)
            .setColor(config.color.error)
            .addFields(
                {
                    name: `상세정보:`,
                    value: `알 수 없는 내부 오류로 인해 로그인에 실패했습니다.`,
                    inline: false,
                },
                {
                    name: `해결 방법:`,
                    value: `잠시 기다린 후 다시 시도하세요. 그래도 해결되지 않는다면 \`/문의 <내용>\`에 아래의 코드를 적어 관리자에게 문의하세요.`,
                    inline: false,
                }
            )
            .setFooter(String(e));
        return error;
    }
    try {
        var secondLogin = await hcs.secondLogin(user.endpoint, login.token, decrypt2(user.password));
        if (secondLogin.success == false) {
            const fail = secondLogin;
            if (fail.message) {
                console.error(`[⚠️] ${fail.message}`);
                const error = new MessageEmbed()
                    .setTitle(`${config.emojis.x} 내부 오류로 인한 로그인 실패`)
                    .setColor(config.color.error)
                    .addFields(
                        {
                            name: `상세정보:`,
                            value: `알 수 없는 내부 오류로 인해 로그인에 실패했습니다.`,
                            inline: false,
                        },
                        {
                            name: `해결 방법:`,
                            value: `잠시 기다린 후 다시 시도하세요. 그래도 해결되지 않는다면 \`/문의 <내용>\`에 아래의 코드를 적어 관리자에게 문의하세요.`,
                            inline: false,
                        }
                    )
                    .setFooter(fail.message);
                return error;
            }
            if (fail.remainingMinutes) {
                const failed = new MessageEmbed()
                    .setTitle(`${config.emojis.x} 비밀번호 로그인 \`${fail.remainingMinutes}\`분 제한`)
                    .setColor(config.color.error)
                    .addFields(
                        {
                            name: `상세정보:`,
                            value: `로그인을 5회 이상 실패해 로그인에 제한을 받았습니다.`,
                            inline: false,
                        },
                        {
                            name: `해결 방법:`,
                            value: `\`${fail.remainingMinutes}\`분 동안 비밀번호를 제대로 입력했는지 확인하세요.`,
                            inline: false,
                        }
                    );
                return failed;
            }
            const wrongpass = new MessageEmbed().setTitle(`${config.emojis.x} 비밀번호 로그인 \`${fail.failCount}\`회 실패`).setDescription("5회 이상 실패시 약 5분동안 로그인에 제한을 받습니다.").setColor(config.color.error).addFields(
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
            return wrongpass;
        }
        token = secondLogin.token;
    } catch (e) {
        console.error("2차 로그인 중 오류 발생");
        console.error(e);
        const error = new MessageEmbed()
            .setTitle(`${config.emojis.x} 내부 오류로 인한 로그인 실패`)
            .setColor(config.color.error)
            .addFields(
                {
                    name: `상세정보:`,
                    value: `알 수 없는 내부 오류로 인해 로그인에 실패했습니다.`,
                    inline: false,
                },
                {
                    name: `해결 방법:`,
                    value: `잠시 기다린 후 다시 시도하세요. 그래도 해결되지 않는다면 \`/문의 <내용>\`에 아래의 코드를 적어 관리자에게 문의하세요.`,
                    inline: false,
                }
            )
            .setFooter(String(e));
        return error;
    }
    const hcsresult = await hcs.registerSurvey(user.endpoint, token, survey);
    if (!hcsresult.registeredAt) {
        return "왜 안됨?`";
    }
    return user.name;
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
            activities: [{ name: `6시 ${30 + wait}분까지 대기`, type: "PLAYING" }],
            status: "idle",
        });
        console.log(`[🕡 A] ${wait}분 후에 A그룹 스케줄을 시작합니다 ··········`);
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
                try {
                    const worksA = resultAA.map(async (work) => {
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}>`,
                            embeds: [await getMeal(work)],
                        });
                        const users = await Promise.all(
                            work.users.map((user) => {
                                return doHcs(user, work.school.sd);
                            })
                        );
                        if (users.type == "rich" || users[0].type == "rich") {
                            return client.channels.cache.get(work.schedule.channelId).send({
                                embeds: [users || users[0]],
                            });
                        }
                        const response = String(users.join(", ")).replace(/\*/g, "\\*");
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} 자가진단에 정상적으로 참여했어요.`)
                            .setColor(config.color.success)
                            .addFields({
                                name: `참여자`,
                                value: `${response}`,
                                inline: true,
                            })
                            .setTimestamp()
                            .setFooter(client.users.cache.get(String(work._id)).username, client.users.cache.get(String(work._id)).displayAvatarURL());
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 성공!`,
                            embeds: [registered],
                        });
                    });
                    const worksB = resultAB.map(async (work) => {
                        const users = await Promise.all(
                            work.users.map((user) => {
                                return doHcs(user, work.school.sd);
                            })
                        );
                        if (users.type == "rich" || users[0].type == "rich") {
                            return client.channels.cache.get(work.schedule.channelId).send({
                                content: `<@${work._id}> 자가진단 중 오류 발생`,
                                embeds: [users || users[0]],
                            });
                        }
                        const response = String(users.join(", ")).replace(/\*/g, "\\*");
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} 자가진단에 정상적으로 참여했어요.`)
                            .setColor(config.color.success)
                            .addFields({
                                name: `참여자`,
                                value: `${response}`,
                                inline: true,
                            })
                            .setTimestamp()
                            .setFooter(client.users.cache.get(String(work._id)).username, client.users.cache.get(String(work._id)).displayAvatarURL());
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 성공!`,
                            embeds: [registered],
                        });
                    });
                    const worksC = resultAC.map(async (work) => {
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}>`,
                            embeds: [await getMeal(work)],
                        });
                    });
                } catch (e) {
                    console.log(e);
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
        console.log(`[🕖 B] ${wait}분 후에 B그룹 스케줄을 시작합니다 ··········`);
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
                try {
                    const worksA = resultBA.map(async (work) => {
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}>`,
                            embeds: [await getMeal(work)],
                        });
                        const users = await Promise.all(
                            work.users.map((user) => {
                                return doHcs(user, work.school.sd);
                            })
                        );
                        if (users.type == "rich" || users[0].type == "rich") {
                            return client.channels.cache.get(work.schedule.channelId).send({
                                embeds: [users || users[0]],
                            });
                        }
                        const response = String(users.join(", ")).replace(/\*/g, "\\*");
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} 자가진단에 정상적으로 참여했어요.`)
                            .setColor(config.color.success)
                            .addFields({
                                name: `참여자`,
                                value: `${response}`,
                                inline: true,
                            })
                            .setTimestamp()
                            .setFooter(client.users.cache.get(String(work._id)).username, client.users.cache.get(String(work._id)).displayAvatarURL());
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 성공!`,
                            embeds: [registered],
                        });
                    });
                    const worksB = resultBB.map(async (work) => {
                        const users = await Promise.all(
                            work.users.map((user) => {
                                return doHcs(user, work.school.sd);
                            })
                        );
                        if (users.type == "rich" || users[0].type == "rich") {
                            return client.channels.cache.get(work.schedule.channelId).send({
                                content: `<@${work._id}> 자가진단 중 오류 발생`,
                                embeds: [users || users[0]],
                            });
                        }
                        const response = String(users.join(", ")).replace(/\*/g, "\\*");
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} 자가진단에 정상적으로 참여했어요.`)
                            .setColor(config.color.success)
                            .addFields({
                                name: `참여자`,
                                value: `${response}`,
                                inline: true,
                            })
                            .setTimestamp()
                            .setFooter(client.users.cache.get(String(work._id)).username, client.users.cache.get(String(work._id)).displayAvatarURL());
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 성공!`,
                            embeds: [registered],
                        });
                    });
                    const worksC = resultBC.map(async (work) => {
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}>`,
                            embeds: [await getMeal(work)],
                        });
                    });
                } catch (e) {
                    console.log(e);
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
    const jobC = schedule.scheduleJob(`30 07 * * 1-5`, async function () {
        const wait = Math.floor(Math.random() * (10 - 0)) + 0;
        client.user.setPresence({
            activities: [{ name: `7시 ${30 + wait}분까지 대기`, type: "PLAYING" }],
            status: "idle",
        });
        console.log(`[🕢 C] ${wait}분 후에 C그룹 스케줄을 시작합니다 ··········`);
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
                try {
                    const worksA = resultCA.map(async (work) => {
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}>`,
                            embeds: [await getMeal(work)],
                        });
                        const users = await Promise.all(
                            work.users.map((user) => {
                                return doHcs(user, work.school.sd);
                            })
                        );
                        if (users.type == "rich" || users[0].type == "rich") {
                            console.log(users || users[0]);
                            return client.channels.cache.get(work.schedule.channelId).send({
                                embeds: [users || users[0]],
                            });
                        }
                        const response = String(users.join(", ")).replace(/\*/g, "\\*");
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} 자가진단에 정상적으로 참여했어요.`)
                            .setColor(config.color.success)
                            .addFields({
                                name: `참여자`,
                                value: `${response}`,
                                inline: true,
                            })
                            .setTimestamp()
                            .setFooter(client.users.cache.get(String(work._id)).username, client.users.cache.get(String(work._id)).displayAvatarURL());
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 성공!`,
                            embeds: [registered],
                        });
                    });
                    const worksB = resultCB.map(async (work) => {
                        const users = await Promise.all(
                            work.users.map((user) => {
                                return doHcs(user, work.school.sd);
                            })
                        );
                        if (users.type == "rich" || users[0].type == "rich") {
                            return client.channels.cache.get(work.schedule.channelId).send({
                                content: `<@${work._id}> 자가진단 중 오류 발생`,
                                embeds: [users || users[0]],
                            });
                        }
                        const response = String(users.join(", ")).replace(/\*/g, "\\*");
                        var registered = new MessageEmbed()
                            .setTitle(`${config.emojis.done} 자가진단에 정상적으로 참여했어요.`)
                            .setColor(config.color.success)
                            .addFields({
                                name: `참여자`,
                                value: `${response}`,
                                inline: true,
                            })
                            .setTimestamp()
                            .setFooter(client.users.cache.get(String(work._id)).username, client.users.cache.get(String(work._id)).displayAvatarURL());
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 성공!`,
                            embeds: [registered],
                        });
                    });
                    const worksC = resultCC.map(async (work) => {
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}>`,
                            embeds: [await getMeal(work)],
                        });
                    });
                } catch (e) {
                    console.log(e);
                }
            }
        });
        client.user.setPresence({
            activities: [{ name: "/도움말", type: "WATCHING" }],
            status: "online",
        });
    });
});
