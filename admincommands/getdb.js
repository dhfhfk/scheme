const { Message, MessageEmbed } = require("discord.js");
const request = require("request");
const mongo = require("../mongo");
const schoolSchema = require("../schemas/school-schema");
const config = require("../config.json");
const hcs = require("../hcs/dist");
const JSEncrypt = require("jsencrypt");

var maskingName = function (strName) {
    if (strName.length > 2) {
        var originName = strName.split("");
        originName.forEach(function (name, i) {
            if (i === 0 || i === originName.length - 1) return;
            originName[i] = "*";
        });
        var joinName = originName.join();
        return joinName.replace(/,/g, "");
    } else {
        var pattern = /.$/;
        return strName.replace(pattern, "*");
    }
};

function randomInt(n) {
    let str = "";
    for (let i = 0; i < n; i++) {
        str += Math.floor(Math.random() * 10);
    }
    return str;
}

function randomLetter() {
    var letters = ["A", "B", "C"];
    var letter = letters[Math.floor(Math.random() * letters.length)];
    return letter;
}

module.exports = {
    name: "getdb",
    description: "[관리자] 유저의 등록된 데이터베이스 조회",
    options: [
        {
            name: "user_id",
            description: "데이터를 가져올 특정 유저의 ID",
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
        const userId = args[0];
        await mongo().then(async (mongoose) => {
            try {
                var result = await schoolSchema.findOne({
                    _id: userId,
                });
                if (!result) {
                    mongoose.connection.close();
                    return interaction.reply({
                        content: "데이터 찾을 수 없음",
                        ephemeral: false,
                    });
                }
            } finally {
                mongoose.connection.close();
                const userInfo = client.users.fetch(userId);
                var timeTable = ["🕡 오전 06:30 ~ 06:50", "🕖 오전 07:00 ~ 07:20", "🕢 오전 07:30 ~ 07:50"];
                var rawTimeTable = ["A", "B", "C"];

                var kindsTable = ["오늘 급식 + 자가진단 알림", "자가진단 알림", "오늘 급식 알림"];

                var rawKindsTable = ["A", "B", "C"];
                userInfo.then(function (data) {
                    const info = new MessageEmbed().setTitle(`${data.username}사용자의 DB 정보 조회 결과`).setColor(config.color.primary);
                    if (result.school) {
                        const embed = {
                            name: `학교 정보`,
                            value: `학교명: \`${result.school.name}\`
                            자가진단 교육청 주소: \`${result.school.endpoint}\`
                            시도교육청코드: \`${result.school.sc}\`
                            표준학교코드: \`${result.school.sd}\`
                            기관코드: \`${result.school.org}\``,
                        };
                        info.fields.push(embed);
                    }
                    if (result.schedule) {
                        const embed = {
                            name: `스케줄 정보`,
                            value: `시간대: \`${timeTable[rawTimeTable.indexOf(result.schedule.type)]}\`
                            전송 정보: \`${kindsTable[rawKindsTable.indexOf(result.schedule.kinds)]} 받기\`
                            전송 채널: <#${result.schedule.channelId}>
                            일시정지 여부: \`${result.schedule.paused}\``,
                        };
                        info.fields.push(embed);
                    }
                    if (result.users[0]) {
                        const embed = {
                            name: `사용자 정보`,
                            value: `이름: \`${result.users[0].name}\`
                        암호화된 이름: \`${result.users[0].encName.substr(0, 14) + "..."}\`
                        암호화된 생년월일: \`${result.users[0].encBirth.substr(0, 14) + "..."}\`
                        암호화된 비밀번호: \`${result.users[0].password.substr(0, 14) + "..."}\`
                        자가진단 교육청 주소: \`${result.users[0].endpoint}\``,
                        };
                        info.fields.push(embed);
                    }
                    interaction.reply({
                        embeds: [info],
                        ephemeral: false,
                    });
                });
            }
        });
    },
};
// module.exports = {
//     name: "검색",
//     description: "검색",
//     /**
//      * @param {Client} client
//      * @param {Message} message
//      * @param {String[]} args
//      */
//     run: async (client, interaction, args, message) => {
//         mongo().then(async (mongoose) => {
//             try {
//                 var result = await schoolSchema.find({
//                     "schedule.type": "A",
//                 });
//             } finally {
//                 mongoose.connection.close();
//                 console.log(result);
//             }
//         });
//     },
// };
