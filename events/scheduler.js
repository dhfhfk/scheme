const client = require("../index");
const mongo = require("../mongo");
const schedule = require("node-schedule");
const schoolSchema = require("../schemas/school-schema");
const { MessageEmbed } = require("discord.js");
const CryptoJS = require("crypto-js");
const config = require("../config.json");
const request = require("request");
const { doHcs } = require("../handler/hcs");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
                            embeds: [registered],
                        });
                    });
                    const worksB = resultAB.map(async (work) => {
                        const users = await Promise.all(
                            work.users.map((user) => {
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
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
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
                            embeds: [registered],
                        });
                    });
                    const worksB = resultBB.map(async (work) => {
                        const users = await Promise.all(
                            work.users.map((user) => {
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
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
    const jobC = schedule.scheduleJob(`30 7 * * 1-5`, async function () {
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
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
                            embeds: [registered],
                        });
                    });
                    const worksB = resultCB.map(async (work) => {
                        const users = await Promise.all(
                            work.users.map((user) => {
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
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

client.on("ready", async () => {
    const jobTEST = schedule.scheduleJob(`55 46 17 * * 1-5`, async function () {
        mongo().then(async (mongoose) => {
            try {
                var resultCA = await schoolSchema.find({
                    "schedule.type": "TEST",
                    "schedule.kinds": "A",
                    "schedule.paused": false,
                });
                var resultCB = await schoolSchema.find({
                    "schedule.type": "TEST",
                    "schedule.kinds": "B",
                    "schedule.paused": false,
                });
                var resultCC = await schoolSchema.find({
                    "schedule.type": "TEST",
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
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT, true);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
                            embeds: [registered],
                        });
                    });
                    const worksB = resultCB.map(async (work) => {
                        const users = await Promise.all(
                            work.users.map((user) => {
                                let RAT = false;
                                const today = new Date();
                                const week = today.getDay();
                                if ((week == 1 || week == 4) && user.org == "G100000214") {
                                    console.log("RAT = TRUE, 음성으로 제출");
                                    RAT = true;
                                }
                                return doHcs(user, RAT, true);
                            })
                        );
                        const registeredUsers = users.map((user) => {
                            if (!user.success) {
                                return {
                                    name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                    value: `${user.message}`,
                                    inline: false,
                                };
                            }
                            return {
                                name: `${user.user} 사용자 ${user.success ? config.emojis.done : config.emojis.x}`,
                                value: `${user.message}\n자가진단키트 결과: ${user.RAT ? "음성" : "미검사"}`,
                                inline: false,
                            };
                        });
                        const registered = {
                            color: config.color.primary,
                            title: `건강상태 자가진단 참여 결과예요.`,
                            fields: [registeredUsers],
                            timestamp: new Date(),
                            footer: {
                                text: client.users.cache.get(String(work._id)).username,
                                icon_url: client.users.cache.get(String(work._id)).displayAvatarURL(),
                            },
                        };
                        client.channels.cache.get(work.schedule.channelId).send({
                            content: `<@${work._id}> 자가진단 결과를 확인해주세요!`,
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
