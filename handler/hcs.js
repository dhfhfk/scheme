const { MessageEmbed } = require("discord.js");
const hcs = require("../hcs/dist");
const config = require("../config.json");
const CryptoJS = require("crypto-js");

function decrypt2(message) {
    const bytes = CryptoJS.AES.decrypt(message, config.services.secret_key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

module.exports.doHcs = doHcs;
module.exports.getUserInfo = getUserInfo;

async function doHcs(user, RAT = false, test = false) {
    const survey = {
        /**
         * 1. 학생 본인이 코로나19 감염에 의심되는 아래의 임상증상*이 있나요?
         * (주요 임상증상) 발열(37.5℃), 기침, 호흡곤란, 오한, 근육통, 두통, 인후통, 후각·미각소실
         */
        Q1: false,

        /**
         * 2. 학생은 오늘 신속항원검사(자가진단)를 실시했나요?
         */
        Q2: RAT ? 1 : 0,

        /**
         * 3.학생 본인 또는 동거인이 PCR 검사를 받고 그 결과를 기다리고 있나요?
         */
        Q3: false,
    };
    const response = {
        success: true,
        message: "",
        RAT: RAT,
        user: user.name,
    };
    const schools = await hcs.searchSchool(user.schoolName)
    const login = await hcs.login(
        user.endpoint,
        user.org,
        user.encName,
        user.encBirth,
        schools[0].searchKey
    );
    if (!login.success) {
        console.error("1차 로그인", login);
        response.success = false;
        response.message = `1차 로그인 실패: ${login.message}`;
        return response;
    }
    let secondToken;
    const secondLogin = await hcs.secondLogin(
        user.endpoint,
        login.token,
        decrypt2(user.password)
    );
    if (secondLogin.success == false) {
        const fail = secondLogin;
        console.error("2차 로그인", fail);
        if (fail.message) {
            response.success = false;
            response.message = `2차 로그인 실패: ${fail.message}`;
            return response;
        }
        if (fail.remainingMinutes) {
            response.success = false;
            response.message = `비밀번호 로그인 \`${fail.remainingMinutes}\`분 제한`;
            return response;
        }
        response.success = false;
        response.message = `비밀번호 로그인 \`${fail.failCount}\`회 실패`;
        return response;
    }
    secondToken = secondLogin.token;
    if (test) {
        const userInfo = await hcs.userInfo(user.endpoint, secondToken);
        console.log(userInfo);
        response.message = `⚙️ 자가진단 테스트 프로세스 완료, 설문을 전송하지 않음.`;
        return response;
    }
    const result = await hcs.registerSurvey(user.endpoint, secondToken, survey);
    if (!result.success) {
        response.success = false;
        response.message = `설문 응답 없음: ${result.message}`;
        return response;
    }
    response.message = `정상적으로 처리되었습니다.`;
    return response;
}

async function getUserInfo(user) {
    const login = await hcs.login(
        user.endpoint,
        user.org,
        user.encName,
        user.encBirth
    );
    if (!login.success) {
        console.error("1차 로그인", login);
        return login;
    }
    const userInfo = await hcs.userInfo(user.endpoint, login.token);
    return userInfo;
}
