const { Client, Message, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const request = require("request");
const mongo = require("../../mongo");
const schoolSchema = require("../../schemas/school-schema");
const config = require("../../config.json");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const hcs = require("../../hcs");

const cancelled = new MessageEmbed().setTitle(`학교 등록이 취소되었어요.`).setColor(config.color.error);

function schoolfind(rawSchoolName) {
    let url = encodeURI(`http://open.neis.go.kr/hub/schoolInfo?KEY=${config.services.neis_key}&Type=json&pIndex=1&pSize=5&SCHUL_NM=${rawSchoolName}`);
    return new Promise((resolve) => {
        request(url, function (error, response, body) {
            if (error) throw error;
            resolve(body);
        });
    });
}

function parse(rawresult, rawSchoolName) {
    var resultObj = JSON.parse(rawresult);
    try {
        let total_count = resultObj.schoolInfo[0].head[0].list_total_count;

        if (total_count > 5) {
            // 검색 결과 5개 초과
            const embed = new MessageEmbed()
                .setTitle(`${config.emojis.x} 검색 결과가 너무 많아요.`)
                .setColor(config.color.error)
                .addFields(
                    {
                        name: `상세정보:`,
                        value: `검색 결과가 5개 초과예요.`,
                        inline: false,
                    },
                    {
                        name: `해결 방법:`,
                        value: `더 자세한 학교 이름을 입력해 다시 시도하세요.`,
                        inline: false,
                    },
                    {
                        name: `입력된 값:`,
                        value: `\`${rawSchoolName}\``,
                        inline: false,
                    }
                )
                .setFooter(`RangeError: list_total_count must be less than 5.`);
            return embed;
        } else {
            var arrayschool = new Array();
            var arrayaddress = new Array();
            var arraysc = new Array();
            var arraysd = new Array();
            arrayschool.push(total_count);
            for (var i = 0; i < total_count; i++) {
                let list = resultObj.schoolInfo[1].row[i].SCHUL_NM;
                arrayschool.push(list);
            }
            for (var i = 0; i < total_count; i++) {
                let list = resultObj.schoolInfo[1].row[i].ORG_RDNMA;
                arrayaddress.push(list);
            }
            for (var i = 0; i < total_count; i++) {
                let list = resultObj.schoolInfo[1].row[i].ATPT_OFCDC_SC_CODE;
                arraysc.push(list);
            }
            for (var i = 0; i < total_count; i++) {
                let list = resultObj.schoolInfo[1].row[i].SD_SCHUL_CODE;
                arraysd.push(list);
            }
            return {
                // 여러 변수 return
                arrayschool: arrayschool,
                arrayaddress: arrayaddress,
                arraysc: arraysc,
                arraysd: arraysd,
            };
        }
    } catch (e) {
        // 오류로 인해 학교 검색 실패
        const embed = new MessageEmbed()
            .setTitle(`${config.emojis.x} 학교를 검색하지 못했어요.`)
            .setColor(config.color.error)
            .addFields(
                {
                    name: `상세정보:`,
                    value: `학교 검색 결과가 없거나 검색을 실패했어요.`,
                    inline: false,
                },
                {
                    name: `해결 방법:`,
                    value: `올바른 학교이름을 입력하거나 다시 시도하세요.`,
                    inline: false,
                },
                {
                    name: `입력된 값:`,
                    value: `\`${rawSchoolName}\``,
                    inline: false,
                }
            )
            .setFooter(`${e}`);
        console.error(`[⚠️] 학교 정보가 없거나 검색 실패: ${e}`);
        return embed;
    }
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
        const userId = interaction.user.id;
        const userName = interaction.user.username;
        const guildId = interaction.guildId;
        const rawSchoolName = interaction.options.getString("학교명");
        console.log(`[🔍] (${userId}, ${userName}) SEARCH ${rawSchoolName}`);
        await interaction.deferReply({ ephemeral: true });
        schoolfind(rawSchoolName).then(async function (rawresult) {
            var arrays = parse(rawresult, rawSchoolName);
            var school = arrays.arrayschool;
            if (Array.isArray(school)) {
                // Array형이면 처리후 출력
                var arrays = parse(rawresult, rawSchoolName);
                var school = arrays.arrayschool;
                var address = arrays.arrayaddress;
                var sc = arrays.arraysc;
                var sd = arrays.arraysd;
                count = school[0];
                school.shift();
                if (count === 1) {
                    const schoolName = `${school[0]}`;
                    const schoolSc = `${sc[0]}`;
                    const schoolSd = `${sd[0]}`;
                    const schools = await hcs.searchSchool(schoolName);
                    const school2 = schools[0];
                    const schoolEndpoint = school2.endpoint;
                    const schoolCode = school2.schoolCode;
                    mongo().then(async (mongoose) => {
                        try {
                            await schoolSchema.findOneAndUpdate(
                                {
                                    _id: userId,
                                },
                                {
                                    _id: userId,
                                    school: {
                                        name: schoolName,
                                        endpoint: schoolEndpoint,
                                        sc: schoolSc,
                                        sd: schoolSd,
                                        org: schoolCode,
                                    },
                                },
                                {
                                    new: true,
                                    upsert: true,
                                }
                            );
                        } catch (e) {
                            console.error(e);
                        } finally {
                            mongoose.connection.close();
                            console.log(`[✅] (${userId}, ${userName}) REGISTER ${schoolName} school`);
                            var registered = new MessageEmbed()
                                .setTitle(`${config.emojis.done} 학교가 정상적으로 등록되었어요.`)
                                .setDescription(
                                    `이제 자가진단 사용자를 등록하거나 자동 급식 알림 스케줄을 등록할 수 있어요! 
(\`/사용자등록\` \`/스케줄등록\`)`
                                )
                                .setColor(config.color.success)
                                .addFields(
                                    {
                                        name: `등록된 학교`,
                                        value: `${schoolName}`,
                                        inline: true,
                                    },
                                    {
                                        name: `유저 식별 ID`,
                                        value: `${userId}`,
                                        inline: true,
                                    },
                                    {
                                        name: `Q1. 등록된 학교를 변경하려면?`,
                                        value: `\`/학교등록\` 명령어를 다시 사용하면 기존의 학교에 덮어씌울 수 있습니다.`,
                                    },
                                    {
                                        name: `Q2. 개인 정보를 삭제하려면?`,
                                        value: `\`/설정 명령:조회\` 명령어로 개인 정보를 조회할 수 있고 \`/설정 명령:삭제\` 명령어로 개인 정보를 삭제할 수 있습니다.`,
                                    }
                                );
                            interaction.editReply({
                                embeds: [registered],
                                ephemeral: true,
                            });
                            return;
                        }
                    });
                } else if (count === 2) {
                    const embed = new MessageEmbed()
                        .setTitle(`🔍 \`${count}\` 개의 검색 결과를 찾았어요.`)
                        .setColor(config.color.primary)
                        .setDescription("등록하고싶은 학교의 번호를 하단의 버튼에서 선택하세요.")
                        .addFields({ name: `1. ${school[0]}`, value: `${address[0]}` }, { name: `2. ${school[1]}`, value: `${address[1]}` });
                    const choose = new MessageActionRow()
                        .addComponents(new MessageButton().setCustomId("0").setLabel("1").setStyle("PRIMARY"))
                        .addComponents(new MessageButton().setCustomId("1").setLabel("2").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("6").setLabel("취소").setStyle("DANGER"));
                    interaction.editReply({
                        embeds: [embed],
                        components: [choose],
                        ephemeral: true,
                    });
                    const collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });

                    collector.on("end", async (ButtonInteraction) => {
                        {
                            let rawanswer = ButtonInteraction.first().customId;
                            if (rawanswer === "6") {
                                interaction.editReply({
                                    embeds: [cancelled],
                                    components: [],
                                    ephemeral: true,
                                });
                                return;
                            }
                            const userId = interaction.user.id;
                            const schoolName = `${school[rawanswer]}`;
                            const schoolSc = `${sc[rawanswer]}`;
                            const schoolSd = `${sd[rawanswer]}`;
                            const guildId = interaction.guildId;
                            const schools = await hcs.searchSchool(schoolName);
                            const school2 = schools[0];
                            const schoolEndpoint = school2.endpoint;
                            const schoolCode = school2.schoolCode;
                            const registering = new MessageEmbed()
                                .setTitle(`학교 등록 중...`)
                                .setColor(config.color.primary)
                                .addFields(
                                    {
                                        name: `등록된 학교`,
                                        value: `${schoolName}`,
                                        inline: true,
                                    },
                                    {
                                        name: `유저 식별 ID`,
                                        value: `${userId}`,
                                        inline: true,
                                    }
                                );
                            interaction.editReply({
                                embeds: [registering],
                                components: [],
                                ephemeral: true,
                            });
                            mongo().then(async (mongoose) => {
                                try {
                                    await schoolSchema.findOneAndUpdate(
                                        {
                                            _id: userId,
                                        },
                                        {
                                            _id: userId,
                                            school: {
                                                name: schoolName,
                                                endpoint: schoolEndpoint,
                                                sc: schoolSc,
                                                sd: schoolSd,
                                                org: schoolCode,
                                            },
                                        },
                                        {
                                            new: true,
                                            upsert: true,
                                        }
                                    );
                                } finally {
                                    mongoose.connection.close();
                                    console.log(`[✅] (${userId}, ${userName}) REGISTER ${schoolName} school`);
                                    var registered = new MessageEmbed()
                                        .setTitle(`${config.emojis.done} 학교가 정상적으로 등록되었어요.`)
                                        .setColor(config.color.success)
                                        .addFields(
                                            {
                                                name: `등록된 학교`,
                                                value: `${schoolName}`,
                                                inline: true,
                                            },
                                            {
                                                name: `유저 식별 ID`,
                                                value: `${userId}`,
                                                inline: true,
                                            },
                                            {
                                                name: `Q1. 등록된 학교를 변경하려면?`,
                                                value: `\`/학교등록\` 명령어를 다시 사용하면 기존의 학교에 덮어씌울 수 있어요.`,
                                            },
                                            {
                                                name: `Q2. 다른 서버에서도 사용하려면?`,
                                                value: `지금 등록한 학교 정보는 다시 등록할 필요 없이 다른 서버에서도 사용할 수 있어요. 스케줄도 하나만 등록할 수 있어요.`,
                                            },
                                            {
                                                name: `Q3. 개인 정보를 삭제하려면?`,
                                                value: `\`/설정 명령:조회\` 명령어로 개인 정보를 조회할 수 있고 \`/설정 명령:삭제\` 명령어로 개인 정보를 삭제할 수 있습니다.`,
                                            }
                                        );
                                    interaction.editReply({
                                        embeds: [registered],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            });
                        }
                    });
                } else if (count === 3) {
                    const embed = new MessageEmbed()
                        .setTitle(`🔍 \`${count}\` 개의 검색 결과를 찾았어요.`)
                        .setColor(config.color.primary)
                        .setDescription("등록하고싶은 학교의 번호를 하단의 버튼에서 선택하세요.")
                        .addFields({ name: `1. ${school[0]}`, value: `${address[0]}` }, { name: `2. ${school[1]}`, value: `${address[1]}` }, { name: `3. ${school[2]}`, value: `${address[2]}` });
                    const choose = new MessageActionRow()
                        .addComponents(new MessageButton().setCustomId("0").setLabel("1").setStyle("PRIMARY"))
                        .addComponents(new MessageButton().setCustomId("1").setLabel("2").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("2").setLabel("3").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("6").setLabel("취소").setStyle("DANGER"));
                    interaction.editReply({
                        embeds: [embed],
                        components: [choose],
                        ephemeral: true,
                    });
                    const collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });

                    collector.on("end", async (ButtonInteraction) => {
                        {
                            let rawanswer = ButtonInteraction.first().customId;
                            if (rawanswer === "6") {
                                interaction.editReply({
                                    embeds: [cancelled],
                                    components: [],
                                    ephemeral: true,
                                });
                                return;
                            }
                            const userId = interaction.user.id;
                            const schoolName = `${school[rawanswer]}`;
                            const schoolSc = `${sc[rawanswer]}`;
                            const schoolSd = `${sd[rawanswer]}`;
                            const guildId = interaction.guildId;
                            const schools = await hcs.searchSchool(schoolName);
                            const school2 = schools[0];
                            const schoolEndpoint = school2.endpoint;
                            const schoolCode = school2.schoolCode;
                            const registering = new MessageEmbed()
                                .setTitle(`학교 등록 중...`)
                                .setColor(config.color.primary)
                                .addFields(
                                    {
                                        name: `등록된 학교`,
                                        value: `${schoolName}`,
                                        inline: true,
                                    },
                                    {
                                        name: `유저 식별 ID`,
                                        value: `${userId}`,
                                        inline: true,
                                    }
                                );
                            interaction.editReply({
                                embeds: [registering],
                                components: [],
                                ephemeral: true,
                            });
                            mongo().then(async (mongoose) => {
                                try {
                                    await schoolSchema.findOneAndUpdate(
                                        {
                                            _id: userId,
                                        },
                                        {
                                            _id: userId,
                                            school: {
                                                name: schoolName,
                                                endpoint: schoolEndpoint,
                                                sc: schoolSc,
                                                sd: schoolSd,
                                                org: schoolCode,
                                            },
                                        },
                                        {
                                            new: true,
                                            upsert: true,
                                        }
                                    );
                                } finally {
                                    mongoose.connection.close();
                                    console.log(`[✅] (${userId}, ${userName}) REGISTER ${schoolName} school`);
                                    var registered = new MessageEmbed()
                                        .setTitle(`${config.emojis.done} 학교가 정상적으로 등록되었어요.`)
                                        .setColor(config.color.success)
                                        .addFields(
                                            {
                                                name: `등록된 학교`,
                                                value: `${schoolName}`,
                                                inline: true,
                                            },
                                            {
                                                name: `유저 식별 ID`,
                                                value: `${userId}`,
                                                inline: true,
                                            },
                                            {
                                                name: `Q1. 등록된 학교를 변경하려면?`,
                                                value: `\`/학교등록\` 명령어를 다시 사용하면 기존의 학교에 덮어씌울 수 있어요.`,
                                            },
                                            {
                                                name: `Q2. 다른 서버에서도 사용하려면?`,
                                                value: `지금 등록한 학교 정보는 다시 등록할 필요 없이 다른 서버에서도 사용할 수 있어요. 스케줄도 하나만 등록할 수 있어요.`,
                                            },
                                            {
                                                name: `Q3. 개인 정보를 삭제하려면?`,
                                                value: `\`/설정 명령:조회\` 명령어로 개인 정보를 조회할 수 있고 \`/설정 명령:삭제\` 명령어로 개인 정보를 삭제할 수 있습니다.`,
                                            }
                                        );
                                    interaction.editReply({
                                        embeds: [registered],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            });
                        }
                    });
                } else if (count === 4) {
                    const embed = new MessageEmbed()
                        .setTitle(`🔍 \`${count}\` 개의 검색 결과를 찾았어요.`)
                        .setColor(config.color.primary)
                        .setDescription("등록하고싶은 학교의 번호를 하단의 버튼에서 선택하세요.")
                        .addFields(
                            { name: `1. ${school[0]}`, value: `${address[0]}` },
                            { name: `2. ${school[1]}`, value: `${address[1]}` },
                            { name: `3. ${school[2]}`, value: `${address[2]}` },
                            { name: `4. ${school[3]}`, value: `${address[3]}` }
                        );
                    const choose = new MessageActionRow()
                        .addComponents(new MessageButton().setCustomId("0").setLabel("1").setStyle("PRIMARY"))
                        .addComponents(new MessageButton().setCustomId("1").setLabel("2").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("2").setLabel("3").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("3").setLabel("4").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("6").setLabel("취소").setStyle("DANGER"));
                    interaction.editReply({
                        embeds: [embed],
                        components: [choose],
                        ephemeral: true,
                    });
                    const collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });

                    collector.on("end", async (ButtonInteraction) => {
                        {
                            let rawanswer = ButtonInteraction.first().customId;
                            if (rawanswer === "6") {
                                interaction.editReply({
                                    embeds: [cancelled],
                                    components: [],
                                    ephemeral: true,
                                });
                                return;
                            }
                            const userId = interaction.user.id;
                            const schoolName = `${school[rawanswer]}`;
                            const schoolSc = `${sc[rawanswer]}`;
                            const schoolSd = `${sd[rawanswer]}`;
                            const guildId = interaction.guildId;
                            const schools = await hcs.searchSchool(schoolName);
                            const school2 = schools[0];
                            const schoolEndpoint = school2.endpoint;
                            const schoolCode = school2.schoolCode;
                            const registering = new MessageEmbed()
                                .setTitle(`학교 등록 중...`)
                                .setColor(config.color.primary)
                                .addFields(
                                    {
                                        name: `등록된 학교`,
                                        value: `${schoolName}`,
                                        inline: true,
                                    },
                                    {
                                        name: `유저 식별 ID`,
                                        value: `${userId}`,
                                        inline: true,
                                    }
                                );
                            interaction.editReply({
                                embeds: [registering],
                                components: [],
                                ephemeral: true,
                            });
                            mongo().then(async (mongoose) => {
                                try {
                                    await schoolSchema.findOneAndUpdate(
                                        {
                                            _id: userId,
                                        },
                                        {
                                            _id: userId,
                                            school: {
                                                name: schoolName,
                                                endpoint: schoolEndpoint,
                                                sc: schoolSc,
                                                sd: schoolSd,
                                                org: schoolCode,
                                            },
                                        },
                                        {
                                            new: true,
                                            upsert: true,
                                        }
                                    );
                                } finally {
                                    mongoose.connection.close();
                                    console.log(`[✅] (${userId}, ${userName}) REGISTER ${schoolName} school`);
                                    var registered = new MessageEmbed()
                                        .setTitle(`${config.emojis.done} 학교가 정상적으로 등록되었어요.`)
                                        .setColor(config.color.success)
                                        .addFields(
                                            {
                                                name: `등록된 학교`,
                                                value: `${schoolName}`,
                                                inline: true,
                                            },
                                            {
                                                name: `유저 식별 ID`,
                                                value: `${userId}`,
                                                inline: true,
                                            },
                                            {
                                                name: `Q1. 등록된 학교를 변경하려면?`,
                                                value: `\`/학교등록\` 명령어를 다시 사용하면 기존의 학교에 덮어씌울 수 있어요.`,
                                            },
                                            {
                                                name: `Q2. 다른 서버에서도 사용하려면?`,
                                                value: `지금 등록한 학교 정보는 다시 등록할 필요 없이 다른 서버에서도 사용할 수 있어요. 스케줄도 하나만 등록할 수 있어요.`,
                                            },
                                            {
                                                name: `Q3. 개인 정보를 삭제하려면?`,
                                                value: `\`/설정 명령:조회\` 명령어로 개인 정보를 조회할 수 있고 \`/설정 명령:삭제\` 명령어로 개인 정보를 삭제할 수 있습니다.`,
                                            }
                                        );
                                    interaction.editReply({
                                        embeds: [registered],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            });
                        }
                    });
                } else if (count === 5) {
                    const embed = new MessageEmbed()
                        .setTitle(`🔍 \`${count}\` 개의 검색 결과를 찾았어요.`)
                        .setColor(config.color.primary)
                        .setDescription("등록하고싶은 학교의 번호를 하단의 버튼에서 선택하세요.")
                        .addFields(
                            { name: `1. ${school[0]}`, value: `${address[0]}` },
                            { name: `2. ${school[1]}`, value: `${address[1]}` },
                            { name: `3. ${school[2]}`, value: `${address[2]}` },
                            { name: `4. ${school[3]}`, value: `${address[3]}` },
                            { name: `5. ${school[4]}`, value: `${address[4]}` }
                        );
                    const choose = new MessageActionRow()
                        .addComponents(new MessageButton().setCustomId("0").setLabel("1").setStyle("PRIMARY"))
                        .addComponents(new MessageButton().setCustomId("1").setLabel("2").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("2").setLabel("3").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("3").setLabel("4").setStyle("SECONDARY"))
                        .addComponents(new MessageButton().setCustomId("4").setLabel("5").setStyle("SECONDARY"));
                    const cancel = new MessageActionRow().addComponents(new MessageButton().setCustomId("6").setLabel("취소").setStyle("DANGER"));

                    interaction.editReply({
                        embeds: [embed],
                        components: [choose, cancel],
                        ephemeral: true,
                    });
                    const collector = interaction.channel.createMessageComponentCollector({
                        max: 1,
                    });

                    collector.on("end", async (ButtonInteraction) => {
                        {
                            let rawanswer = ButtonInteraction.first().customId;
                            if (rawanswer === "6") {
                                interaction.editReply({
                                    embeds: [cancelled],
                                    components: [],
                                    ephemeral: true,
                                });
                                return;
                            }
                            const userId = interaction.user.id;
                            const schoolName = `${school[rawanswer]}`;
                            const schoolSc = `${sc[rawanswer]}`;
                            const schoolSd = `${sd[rawanswer]}`;
                            const guildId = interaction.guildId;
                            const schools = await hcs.searchSchool(schoolName);
                            const school2 = schools[0];
                            const schoolEndpoint = school2.endpoint;
                            const schoolCode = school2.schoolCode;
                            const registering = new MessageEmbed()
                                .setTitle(`학교 등록 중...`)
                                .setColor(config.color.primary)
                                .addFields(
                                    {
                                        name: `등록된 학교`,
                                        value: `${schoolName}`,
                                        inline: true,
                                    },
                                    {
                                        name: `유저 식별 ID`,
                                        value: `${userId}`,
                                        inline: true,
                                    }
                                );
                            interaction.editReply({
                                embeds: [registering],
                                components: [],
                                ephemeral: true,
                            });
                            mongo().then(async (mongoose) => {
                                try {
                                    await schoolSchema.findOneAndUpdate(
                                        {
                                            _id: userId,
                                        },
                                        {
                                            _id: userId,
                                            school: {
                                                name: schoolName,
                                                endpoint: schoolEndpoint,
                                                sc: schoolSc,
                                                sd: schoolSd,
                                                org: schoolCode,
                                            },
                                        },
                                        {
                                            new: true,
                                            upsert: true,
                                        }
                                    );
                                } finally {
                                    mongoose.connection.close();
                                    console.log(`[✅] (${userId}, ${userName}) REGISTER ${schoolName} school`);
                                    var registered = new MessageEmbed()
                                        .setTitle(`${config.emojis.done} 학교가 정상적으로 등록되었어요.`)
                                        .setColor(config.color.success)
                                        .addFields(
                                            {
                                                name: `등록된 학교`,
                                                value: `${schoolName}`,
                                                inline: true,
                                            },
                                            {
                                                name: `유저 식별 ID`,
                                                value: `${userId}`,
                                                inline: true,
                                            },
                                            {
                                                name: `Q1. 등록된 학교를 변경하려면?`,
                                                value: `\`/학교등록\` 명령어를 다시 사용하면 기존의 학교에 덮어씌울 수 있어요.`,
                                            },
                                            {
                                                name: `Q2. 다른 서버에서도 사용하려면?`,
                                                value: `지금 등록한 학교 정보는 다시 등록할 필요 없이 다른 서버에서도 사용할 수 있어요. 스케줄도 하나만 등록할 수 있어요.`,
                                            },
                                            {
                                                name: `Q3. 개인 정보를 삭제하려면?`,
                                                value: `\`/설정 명령:조회\` 명령어로 개인 정보를 조회할 수 있고 \`/설정 명령:삭제\` 명령어로 개인 정보를 삭제할 수 있습니다.`,
                                            }
                                        );
                                    interaction.editReply({
                                        embeds: [registered],
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            });
                        }
                    });
                }
            } else {
                // Array형이 아니라면 그냥 출력
                var message = parse(rawresult, rawSchoolName);
                interaction.editReply({ embeds: [message], ephemeral: true });
            }
        });
    },
};
