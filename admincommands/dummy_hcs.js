const { Message } = require("discord.js");
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
    name: "dummy_hcs",
    description: "[관리자] 해당 계정에 더미 사용자 등록",
    options: [
        {
            name: "이름",
            description: "이름을 입력해주세요. (입력 예: 홍길동)",
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
        const userId = interaction.user.id;
        const rawName = interaction.options.getString("이름");
        const maskedName = maskingName(rawName);
        mongo().then(async (mongoose) => {
            try {
                var result = await schoolSchema.findOne({
                    _id: userId,
                });
                const random = Math.random().toString(36).substr(2, 31);

                await schoolSchema.findOneAndUpdate(
                    {
                        _id: userId,
                        "users.name": { $ne: maskedName },
                    },
                    {
                        $push: {
                            users: {
                                name: maskedName,
                                encName: `예시: ${random}`,
                                encBirth: `예시: ${random}`,
                                token: `Bearer ${random}`,
                                password: `U2FsdGVkX19wgAYmDHvF2RGpwHqdBQPOo+9+yKw60+A=`,
                                endpoint: "test.eduro.go.kr",
                            },
                        },
                    },
                    { new: true, upsert: true }
                );
            } catch (e) {
                console.log(e);
            } finally {
                mongoose.connection.close();
                interaction.reply({
                    content: `${rawName}의 더미데이터 생성 후 해당 ID에 데이터 Update 완료.`,
                    ephemeral: true,
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
