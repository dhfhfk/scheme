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
exports.registerSurvey = void 0;
const request_1 = __importDefault(require("./request"));
const userInfo_1 = require("./userInfo");
/**
 * 설문을 진행합니다
 *
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 설문 토큰 (로그인 토큰이 아닙니다!)
 * @param survey 설문 내용
 */
function registerSurvey(endpoint, token, survey = {
    Q1: false,
    Q2: false,
    Q3: false,
    Q4: false
}) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield (0, userInfo_1.userInfo)(endpoint, token);
        const data = {
            deviceUuid: '',
            rspns00: (!survey.Q1 && !survey.Q2 && !survey.Q3 && !survey.Q4) ? 'Y' : 'N',
            rspns01: survey.Q1 ? '2' : '1',
            rspns02: survey.Q2 ? '0' : '1',
            rspns03: null,
            rspns04: null,
            rspns05: null,
            rspns06: null,
            rspns07: null,
            rspns08: survey.Q3 ? '1' : '0',
            rspns09: survey.Q4 ? '1' : '0',
            rspns10: null,
            rspns11: null,
            rspns12: null,
            rspns13: null,
            rspns14: null,
            rspns15: null,
            upperToken: user[0].token,
            upperUserNameEncpt: user[0].name
        };
        const response = yield (0, request_1.default)('/registerServey', 'POST', data, endpoint, user[0].token);
        return {
            registeredAt: response['registerDtm']
        };
    });
}
exports.registerSurvey = registerSurvey;
