const client = require("../index");

client.on("ready", () =>
    console.log(
        `${client.user.tag}에 로그인 성공, ${client.guilds.cache.size}개의 서버 활동중`
    )
);
client.on("ready", () =>
    client.user.setPresence({
        activities: [{ name: "/도움말", type: "WATCHING" }],
        status: "online",
    })
);
