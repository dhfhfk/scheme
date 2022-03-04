const { MessageEmbed } = require("discord.js");
const hcs = require("../hcs/dist");
const config = require("../config.json");
const CryptoJS = require("crypto-js");

function decrypt2(message) {
    const bytes = CryptoJS.AES.decrypt(message, config.services.secret_key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

module.exports.doHcs = doHcs;

async function doHcs(user, RAT, test = false) {
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
    if (RAT) {
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
    if (test) {
        console.log("자가진단 테스트 프로세스 완료");
        return user.name;
    }
    const hcsresult = await hcs.registerSurvey(user.endpoint, token, survey);
    if (!hcsresult || !hcsresult.registeredAt) {
        const error = new MessageEmbed()
            .setTitle(`${config.emojis.x} 자가진단 설문 전송 실패`)
            .setColor(config.color.error)
            .addFields(
                {
                    name: `상세정보:`,
                    value: `__**자가진단 시스템 로직이 변경**__되어 관리자의 수정이 필요합니다!`,
                    inline: false,
                },
                {
                    name: `해결 방법:`,
                    value: `시간이 남으면 신세 한탄하며 고칠거예요. 어짜피 고생은 내가하죠?`,
                    inline: false,
                }
            )
            .setFooter(String("Is hcs logic changed? f"));
        return error;
    }
    console.log(hcsresult);
    return user.name;
}
