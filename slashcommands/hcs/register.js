const { Client, Message, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
const hcs = require("../../hcs");
const JSEncrypt = require("jsencrypt");
const CryptoJS = require("crypto-js");

const crypt = new JSEncrypt();
const privateKey =
    "30820122300d06092a864886f70d01010105000382010f003082010a0282010100f357429c22add0d547ee3e4e876f921a0114d1aaa2e6eeac6177a6a2e2565ce9593b78ea0ec1d8335a9f12356f08e99ea0c3455d849774d85f954ee68d63fc8d6526918210f28dc51aa333b0c4cdc6bf9b029d1c50b5aef5e626c9c8c9c16231c41eef530be91143627205bbbf99c2c261791d2df71e69fbc83cdc7e37c1b3df4ae71244a691c6d2a73eab7617c713e9c193484459f45adc6dd0cba1d54f1abef5b2c34dee43fc0c067ce1c140bc4f81b935c94b116cce404c5b438a0395906ff0133f5b1c6e3b2bb423c6c350376eb4939f44461164195acc51ef44a34d4100f6a837e3473e3ce2e16cedbe67ca48da301f64fc4240b878c9cc6b3d30c316b50203010001";
crypt.setPrivateKey(privateKey);

function encrypt(message) {
    return crypt.encrypt(message);
}

function encrypt2(message) {
    return CryptoJS.AES.encrypt(JSON.stringify(message), config.services.secret_key).toString();
}

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

module.exports = {
    name: "사용자등록",
    description: "등록된 학교를 기반으로 자가진단 사용자를 등록해요. 모든 정보는 암호화되어 저장됩니다.",
    options: [
        {
            name: "이름",
            description: "이름을 입력해주세요. (입력 예: 홍길동)",
            type: "STRING",
            required: true,
        },
        {
            name: "생년월일",
            description: "생년월일 6자리를 입력해주세요. (입력 예: 040602, yyMMDD)",
            type: "STRING",
            required: true,
        },
        {
            name: "비밀번호",
            description: "비밀번호 4자리를 입력해주세요. (정수 입력)",
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
        const user_id = interaction.user.id;
        await mongo().then(async (mongoose) => {
            try {
                const result = await schoolSchema.findOne({
                    _id: user_id,
                });
                try {
                    var users = result.users;
                    if (users.length >= config.services.user_limit) {
                        const error = new MessageEmbed()
                            .setTitle(`${config.emojis.x} 사용자를 더이상 등록할 수 없어요!`)
                            .setColor(config.color.error)
                            .addFields(
                                {
                                    name: `상세정보:`,
                                    value: `등록 가능한 사용자는 최대 \`${config.services.user_limit}\`명이에요.`,
                                    inline: false,
                                },
                                {
                                    name: `해결 방법:`,
                                    value: `\`/설정 명령:삭제 - 사용자 버튼\` 을 이용해 사용자를 삭제할 수 있어요.`,
                                    inline: false,
                                }
                            )
                            .setFooter(`RangeError: The maximum of users.length is ${config.services.user_limit}.`);
                        interaction.reply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        return;
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 학교 등록 정보를 찾을 수 없어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 학교를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `먼저 \`/학교등록 학교명:<학교명>\` 명령어로 학교를 등록하세요.`,
                                inline: false,
                            }
                        )
                        .setFooter(`${e}`);
                    interaction.reply({
                        embeds: [error],
                        ephemeral: true,
                    });
                    return;
                }
                userInfo = [result.school.name, result.school.endpoint, result.school.org];
                const userId = interaction.user.id;
                const userName = interaction.user.username;
                const guildId = interaction.guildId;
                const rawName = interaction.options.getString("이름");
                const name = encrypt(rawName);
                const rawBirth = interaction.options.getString("생년월일");
                const birth = encrypt(rawBirth);
                const rawPassword = interaction.options.getString("비밀번호");
                const encPassword = encrypt2(rawPassword);
                await interaction.deferReply({ ephemeral: true });
                if (rawBirth.length != 6) {
                    const birthError = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 생년월일 입력 형식이 잘못 되었어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `입력된 값이 \`6\`자리 숫자가 아닌 \`${rawBirth.length}\`자리 숫자로 입력되었어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `예를 들어, 생년월일이 \`2004년 6월 2일\`이라면 \"\`040602\`\" 형태로 입력하세요.`,
                                inline: false,
                            },
                            {
                                name: `입력된 값:`,
                                value: `\`${rawBirth}\``,
                                inline: false,
                            }
                        )
                        .setFooter(`RangeError: rawBirth must be 6.`);
                    interaction.editReply({
                        embeds: [birthError],
                        ephemeral: true,
                    });
                    return;
                }
                if (rawPassword.length != 4) {
                    const passError = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 비밀번호 입력 형식이 잘못 되었어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `입력된 값이 \`4\`자리 숫자가 아닌 \`${rawPassword.length}\`자리 숫자로 입력되었어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `올바른 비밀번호 4자리 숫자를 입력하세요.`,
                                inline: false,
                            },
                            {
                                name: `입력된 값:`,
                                value: `\`${rawPassword}\``,
                                inline: false,
                            }
                        )
                        .setFooter(`RangeError: rawPassword must be 4.`);
                    interaction.editReply({
                        embeds: [passError],
                        ephemeral: true,
                    });
                    return;
                }

                const login = await hcs.login(userInfo[1], userInfo[2], name, birth);
                let password = rawPassword;
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
3. 학교가 제대로 등록되어있는지 확인하세요.
4. 모바일 환경이라면 한글 입력이 제대로 지원되지 않을 수 있어요.`,
                                inline: false,
                            },
                            {
                                name: `입력된 값:`,
                                value: `
성명: \`${rawName}\`
생년월일: \`${rawBirth}\`
학교: \`${userInfo[0]}\``,
                                inline: false,
                            }
                        )
                        .setFooter(`로그인 실패`);
                    interaction.editReply({
                        embeds: [error],
                        ephemeral: true,
                    });
                    return;
                }
                if (login.agreementRequired) {
                    console.log("개인정보 처리 방침 동의");
                    const cancelled = new MessageEmbed().setTitle(`개인정보 처리 방침 동의가 취소되었어요.`).setColor(config.color.error);
                    const agreement = new MessageEmbed().setTitle(`개인정보 처리 방침 동의 안내`).setURL("https://hcs.eduro.go.kr/agreement").setDescription("개인정보 처리 방침에 동의하시나요?").setColor(config.color.primary).addFields({
                        name: `개인정보 처리 방침`,
                        value: `https://hcs.eduro.go.kr/agreement`,
                        inline: false,
                    });
                    const choose = new MessageActionRow()
                        .addComponents(new MessageButton().setCustomId("0").setLabel("네").setStyle("SUCCESS"))
                        .addComponents(new MessageButton().setCustomId("1").setLabel("아니요").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setURL("https://hcs.eduro.go.kr/agreement").setLabel("개인정보 처리 방침").setStyle("LINK"));
                    interaction.editReply({
                        embeds: [agreement],
                        components: [choose],
                        ephemeral: true,
                    });
                    const collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });
                    await collector.on("end", async (ButtonInteraction) => {
                        let rawanswer = ButtonInteraction.first().customId;
                        if (rawanswer === "1") {
                            interaction.editReply({
                                embeds: [cancelled],
                                components: [],
                                ephemeral: true,
                            });
                            return;
                        }
                        if (rawanswer === "0") {
                            await hcs.updateAgreement(userInfo[1], login.token);
                        }
                    });
                }
                const passwordExists = await hcs.passwordExists(userInfo[1], login.token);
                if (!passwordExists) {
                    await hcs.registerPassword(userInfo[1], login.token, password);
                }
                const secondLogin = await hcs.secondLogin(userInfo[1], login.token, password);
                if (secondLogin.success == false) {
                    const fail = secondLogin;

                    if (fail.message) {
                        console.error(`[⚠️] ${fail.message}`);
                        const error = new MessageEmbed()
                            .setTitle(`${config.emojis.x} 내부 오류로 인한 로그인 실패`)
                            .setColor(config.color.error)
                            .addFields({
                                name: `상세정보:`,
                                value: fail.message,
                                inline: false,
                            })
                            .setFooter(fail.message);
                        interaction.editReply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        return;
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
                                },
                                {
                                    name: `입력된 값:`,
                                    value: `\`${password}\``,
                                    inline: false,
                                }
                            );
                        interaction.editReply({
                            embeds: [failed],
                            ephemeral: true,
                        });
                        return;
                    }
                    const wrongpass = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 비밀번호 로그인 \`${fail.failCount}\`회 실패`)
                        .setDescription("5회 이상 실패시 약 5분동안 로그인에 제한을 받습니다.")
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
                            },
                            {
                                name: `입력된 값:`,
                                value: `\`${password}\``,
                                inline: false,
                            }
                        );
                    interaction.editReply({
                        embeds: [wrongpass],
                        ephemeral: true,
                    });
                    return;
                }
                const maskedName = maskingName(rawName);
                try {
                    await schoolSchema.findOneAndUpdate(
                        {
                            _id: userId,
                            "users.name": { $ne: maskedName },
                        },
                        {
                            $push: {
                                users: {
                                    name: maskedName,
                                    encName: name,
                                    encBirth: birth,
                                    password: encPassword,
                                    endpoint: userInfo[1],
                                    org: userInfo[2],
                                    schoolName: result.school.name,
                                },
                            },
                        },
                        { new: true, upsert: true }
                    );
                } finally {
                    await mongoose.connection.close();
                    var counts = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
                    var count = users.length;
                    console.log(`[✅] (${userId}, ${userName}) REGISTER ${maskedName} user`);
                    var registered = new MessageEmbed()
                        .setTitle(`${config.emojis.done} ${counts[count]} 번째 사용자가 등록되었어요.`)
                        .setDescription("이제 `/스케줄등록`이 가능하고 `/자가진단` 명령어로 수동 자가진단에 참여할 수 있어요.")
                        .setColor(config.color.success)
                        .addFields(
                            {
                                name: `Q1. 정보 유출의 위험성은 없나요?`,
                                value: `생년월일, 비밀번호, 성명은 자가진단 서버에서만 해독할 수 있는 RSA 암호화값으로 저장됩니다.`,
                            },
                            {
                                name: `Q2. 사용자 등록을 주기적으로 해야하나요?`,
                                value: `비밀번호 변경, 학년 변경, 자가진단 중 오류 발생 시에는 정보 삭제 후 다시 등록해야 합니다.`,
                            },
                            {
                                name: `Q3. 다른 사용자도 추가할 수 있나요?`,
                                value: `현재 디스코드 계정당 \`${config.services.user_limit}\`명의 사용자만 등록 가능합니다.`,
                            }
                        );
                    await interaction.editReply({
                        embeds: [registered],
                        ephemeral: true,
                    });
                    return;
                }
            } finally {
                mongoose.connection.close();
            }
        });
    },
};
