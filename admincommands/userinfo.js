const { Client, Message, MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const mongo = require("../mongo");
const schoolSchema = require("../schemas/school-schema");
const config = require("../config.json");
const hcs = require("../hcs");
const CryptoJS = require("crypto-js");

var secretKey = "79SDFGN4THU9BJK9X890HJL2399VU";

function decrypt2(message) {
    const bytes = CryptoJS.AES.decrypt(message, secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

function randomInt(min, max) {
    //min ~ max 사이의 임의의 정수 반환
    return Math.floor(Math.random() * (max - min)) + min;
}

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

module.exports = {
    name: "get_userinfo",
    description: "[관리자] 특정 유저의 자가진단 userinfo 가져오기",
    options: [
        {
            name: "user_id",
            description: "userinfo를 가져올 특정 유저의 ID",
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
            } finally {
                mongoose.connection.close();
                try {
                    var users = result.users;
                    if (users.length == "0") {
                        const error = new MessageEmbed().setTitle(`${config.emojis.x} 사용자 등록 정보를 찾을 수 없어요!`).setColor(config.color.error).addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 사용자를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `\`/사용자등록 이름:<이름> 생년월일:<생년월일> 비밀번호:<비밀번호> \` 명령어로 사용자를 등록하세요. `,
                                inline: false,
                            }
                        );
                        interaction.reply({
                            embeds: [error],
                            ephemeral: true,
                        });
                        return;
                    }
                } catch (e) {
                    const error = new MessageEmbed()
                        .setTitle(`${config.emojis.x} 사용자 등록 정보를 찾을 수 없어요!`)
                        .setColor(config.color.error)
                        .addFields(
                            {
                                name: `상세정보:`,
                                value: `DB에서 유저 식별 ID에 등록된 사용자를 찾지 못했어요.`,
                                inline: false,
                            },
                            {
                                name: `해결 방법:`,
                                value: `\`/사용자등록 이름:<이름> 생년월일:<생년월일> 비밀번호:<비밀번호> \` 명령어로 사용자를 등록하세요. `,
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
                await interaction.deferReply({ ephemeral: true });
                var tokens = new Array();
                var maskedNames = new Array();
                var endpoints = new Array();
                var org = result.school.org;
                var births = new Array();
                var names = new Array();
                var encPasswords = new Array();
                var passwords = new Array();
                var totalCount = result.users.length;
                for (var i = 0; i < totalCount; i++) {
                    let list = result.users[i].endpoint;
                    endpoints.push(list);
                }
                for (var i = 0; i < totalCount; i++) {
                    let list = result.users[i].token;
                    tokens.push(list);
                }
                for (var i = 0; i < totalCount; i++) {
                    let list = result.users[i].name;
                    maskedNames.push(list);
                }
                for (var i = 0; i < totalCount; i++) {
                    let list = result.users[i].encBirth;
                    births.push(list);
                }
                for (var i = 0; i < totalCount; i++) {
                    let list = result.users[i].encName;
                    names.push(list);
                }
                for (var i = 0; i < totalCount; i++) {
                    let list = result.users[i].password;
                    encPasswords.push(list);
                }
                for (var i = 0; i < totalCount; i++) {
                    let list = decrypt2(encPasswords[i]);
                    passwords.push(list);
                }
                if (totalCount == 1) {
                    try {
                        const login = await hcs.login(endpoints[0], org, names[0], births[0]);
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
                            interaction.editReply({
                                embeds: [error],
                                ephemeral: true,
                            });
                            return;
                        }
                        if (login.agreementRequired) {
                            console.log("자가진단 개인정보 처리 방침 동의");
                            const error = new MessageEmbed()
                                .setTitle(`${config.emojis.x} 자가진단 개인정보 처리 방침 안내`)
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
                            interaction.editReply({
                                embeds: [error],
                                ephemeral: true,
                            });
                            return;
                            // await hcs.updateAgreement(school.endpoint, login.token)
                        }
                        const secondLogin = await hcs.secondLogin(endpoints[0], login.token, passwords[0]);
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
                                    }
                                );
                            interaction.editReply({
                                embeds: [wrongpass],
                                ephemeral: true,
                            });
                            return;
                        }
                        const userInfo = await hcs.userInfo(endpoints[0], secondLogin.token);
                        if (userInfo) {
                            interaction.editReply({
                                content: JSON.stringify(userInfo, null, 2),
                                ephemeral: true,
                            });
                            return;
                        }
                    } catch (e) {
                        console.error(`[⚠️] ${e}`);
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
                        interaction.editReply({
                            embeds: [error],
                            components: [],
                            ephemeral: true,
                        });
                        return;
                    }
                }
                if (totalCount == 2) {
                    var choose = new MessageEmbed()
                        .setTitle(`어떤 사용자의 자가진단을 참여할까요?`)
                        .setDescription("아래의 선택 메뉴에서 선택하세요.")
                        .setColor(config.color.primary)
                        .addFields(
                            {
                                name: `<:user_1:908624656276287518> 사용자 1`,
                                value: `\`${maskedNames[0]}\` 사용자로 자가진단에 참여해요.`,
                                inline: false,
                            },
                            {
                                name: `<:user_2:908624655965888512> 사용자 2`,
                                value: `\`${maskedNames[1]}\` 사용자로 자가진단에 참여해요.`,
                                inline: false,
                            }
                        );
                    const row = new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId("select")
                            .setPlaceholder("어떤 사용자의 자가진단을 참여할까요?")
                            .addOptions([
                                {
                                    label: `사용자 1 (${maskedNames[0]})`,
                                    description: `${maskedNames[0]} 사용자로 자가진단에 참여해요.`,
                                    emoji: `<:user_1:908624656276287518>`,
                                    value: "0",
                                },
                                {
                                    label: `사용자 2 (${maskedNames[1]})`,
                                    description: `${maskedNames[1]} 사용자로 자가진단에 참여해요.`,
                                    emoji: `<:user_2:908624655965888512>`,
                                    value: "1",
                                },
                            ])
                    );
                    interaction.editReply({
                        embeds: [choose],
                        components: [row],
                        ephemeral: true,
                    });

                    var collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });
                    collector.on("end", async (SelectMenuInteraction) => {
                        let rawanswer = SelectMenuInteraction.first().values;
                        try {
                            const login = await hcs.login(endpoints[rawanswer], org, names[rawanswer], births[rawanswer]);
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
                                interaction.editReply({
                                    embeds: [error],
                                    ephemeral: true,
                                });
                                return;
                            }
                            if (login.agreementRequired) {
                                console.log("자가진단 개인정보 처리 방침 동의");
                                const error = new MessageEmbed()
                                    .setTitle(`${config.emojis.x} 자가진단 개인정보 처리 방침 안내`)
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
                                interaction.editReply({
                                    embeds: [error],
                                    ephemeral: true,
                                });
                                return;
                                // await hcs.updateAgreement(school.endpoint, login.token)
                            }
                            const secondLogin = await hcs.secondLogin(endpoints[rawanswer], login.token, passwords[rawanswer]);
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
                                        }
                                    );
                                interaction.editReply({
                                    embeds: [wrongpass],
                                    ephemeral: true,
                                });
                                return;
                            }
                            const userInfo = await hcs.userInfo(endpoints[rawanswer], secondLogin.token);
                            interaction.editReply({
                                content: JSON.stringify(userInfo, null, 2),
                                ephemeral: true,
                            });
                            return;
                        } catch (e) {
                            console.error(`[⚠️] ${e}`);
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
                                .setFooter(`${e}`);
                            interaction.editReply({
                                embeds: [error],
                                components: [],
                                ephemeral: true,
                            });
                            return;
                        }
                    });
                    return;
                }
                if (totalCount == 3) {
                    var choose = new MessageEmbed()
                        .setTitle(`어떤 사용자의 자가진단을 참여할까요?`)
                        .setDescription("아래의 선택 메뉴에서 선택하세요.")
                        .setColor(config.color.primary)
                        .addFields(
                            {
                                name: `<:user_1:908624656276287518> 사용자 1`,
                                value: `\`${maskedNames[0]}\` 사용자로 자가진단에 참여해요.`,
                                inline: false,
                            },
                            {
                                name: `<:user_2:908624655965888512> 사용자 2`,
                                value: `\`${maskedNames[1]}\` 사용자로 자가진단에 참여해요.`,
                                inline: false,
                            },
                            {
                                name: `<:user_3:908624655735222323> 사용자 3`,
                                value: `\`${maskedNames[2]}\` 사용자로 자가진단에 참여해요.`,
                                inline: false,
                            }
                        );
                    const row = new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId("select")
                            .setPlaceholder("어떤 사용자의 자가진단을 참여할까요?")
                            .addOptions([
                                {
                                    label: `사용자 1 (${maskedNames[0]})`,
                                    description: `${maskedNames[0]} 사용자로 자가진단에 참여해요.`,
                                    emoji: `<:user_1:908624656276287518>`,
                                    value: "0",
                                },
                                {
                                    label: `사용자 2 (${maskedNames[1]})`,
                                    description: `${maskedNames[1]} 사용자로 자가진단에 참여해요.`,
                                    emoji: `<:user_2:908624655965888512>`,
                                    value: "1",
                                },
                                {
                                    label: `사용자 3 (${maskedNames[2]})`,
                                    description: `${maskedNames[2]} 사용자로 자가진단에 참여해요.`,
                                    emoji: `<:user_3:908624655735222323>`,
                                    value: "2",
                                },
                            ])
                    );
                    interaction.editReply({
                        embeds: [choose],
                        components: [row],
                        ephemeral: true,
                    });

                    var collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });
                    collector.on("end", async (SelectMenuInteraction) => {
                        let rawanswer = SelectMenuInteraction.first().values;
                        try {
                            const login = await hcs.login(endpoints[rawanswer], org, names[rawanswer], births[rawanswer]);
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
                                interaction.editReply({
                                    embeds: [error],
                                    ephemeral: true,
                                });
                                return;
                            }
                            if (login.agreementRequired) {
                                console.log("자가진단 개인정보 처리 방침 동의");
                                const error = new MessageEmbed()
                                    .setTitle(`${config.emojis.x} 자가진단 개인정보 처리 방침 안내`)
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
                                interaction.editReply({
                                    embeds: [error],
                                    ephemeral: true,
                                });
                                return;
                                // await hcs.updateAgreement(school.endpoint, login.token)
                            }
                            const secondLogin = await hcs.secondLogin(endpoints[rawanswer], login.token, passwords[rawanswer]);
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
                                        }
                                    );
                                interaction.editReply({
                                    embeds: [wrongpass],
                                    ephemeral: true,
                                });
                                return;
                            }
                            const userInfo = await hcs.userInfo(endpoints[rawanswer], secondLogin.token);
                            interaction.editReply({
                                content: JSON.stringify(userInfo, null, 2),
                                ephemeral: true,
                            });
                            return;
                        } catch (e) {
                            console.error(`[⚠️] ${e}`);
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
                                .setFooter(`${e}`);
                            interaction.editReply({
                                embeds: [error],
                                components: [],
                                ephemeral: true,
                            });
                            return;
                        }
                    });
                    return;
                }
            }
        });
    },
};
