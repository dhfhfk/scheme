const { Client, Message, MessageEmbed } = require("discord.js");
const config = require("../../config.json");

module.exports = {
    name: "도움말",
    description: "봇 명령어와 사용 방법을 알려줘요.",
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, interaction, args, message) => {
        const userId = interaction.user.id;
        const info = new MessageEmbed()
            .setTitle(`도움말`)
            .setAuthor({ name: client.user.username, iconURL: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.webp` })
            .setDescription("채팅창에 `/`를 입력해보세요. [선택 인수] <필수 인수>")
            .setColor(config.color.primary)
            .addFields(
                {
                    name: `/학교등록 <학교명>`,
                    value: `**학교를 등록**해요. 모든 서비스를 이용하려면 먼저 학교를 등록해야해요.`,
                    inline: false,
                },
                {
                    name: `/급식 [날짜]`,
                    value: `**등록된 학교**의 급식을 조회해요. 날짜 인수가 없다면 오늘 급식을 조회해요.`,
                    inline: false,
                },
                {
                    name: `/사용자등록 <이름> <생년월일> <비밀번호>`,
                    value: `**등록된 학교**를 기반으로 **자가진단 사용자**를 등록해요.`,
                    inline: false,
                },
                {
                    name: `/자가진단`,
                    value: `**등록된 사용자**를 기반으로 **자가진단**에 참여해요.`,
                    inline: false,
                },
                {
                    name: `/스케줄등록 <채널>`,
                    value: `**등록된 정보**를 기반으로 정해진 시간에 자가진단에 **자동**으로 참여하거나 급식 정보를 보내는 스케줄을 등록해요.`,
                    inline: false,
                },
                {
                    name: `/스케줄토글`,
                    value: `스케줄의 일시정지 여부를 전환할 수 있어요.`,
                    inline: false,
                },
                {
                    name: `/설정 <명령>`,
                    value: `등록된 정보를 \`명령: 조회\`로 **조회**하거나 \`명령: 삭제\`로 **삭제**할 수 있어요.`,
                    inline: false,
                },
                {
                    name: `/정보`,
                    value: `봇의 초대 링크와 각종 정보를 확인할 수 있어요.`,
                    inline: false,
                }
            );
        interaction.reply({
            embeds: [info],
            ephemeral: false,
        });
    },
};
