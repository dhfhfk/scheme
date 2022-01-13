"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userInfo = void 0;
const request_1 = __importDefault(require("./request"));
/**
 * 학생 정보를 가져옵니다.
 *
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 로그인 세션 토큰
 */
function userInfo(endpoint, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, request_1.default)('/v2/selectUserGroup', 'POST', {}, endpoint, token);
        const list = [];
        for (const user of response) {
            const data = {
                orgCode: user['orgCode'],
                userPNo: user['userPNo']
            };
            const userinfo = yield (0, request_1.default)('/v2/getUserInfo', 'POST', data, endpoint, user['token']);
            list.push({
                registerRequired: userinfo['registerDtm'] === undefined,
                registeredAt: userinfo['registerDtm'],
                registeredAtYMD: userinfo['registerYmd'],
                schoolName: userinfo['orgName'],
                schoolCode: userinfo['orgCode'],
                isHealthy: userinfo['isHealthy'],
                name: userinfo['userNameEncpt'],
                UID: userinfo['userPNo'],
                token: userinfo['token']
            });
        }
        return list;
    });
}
exports.userInfo = userInfo;
