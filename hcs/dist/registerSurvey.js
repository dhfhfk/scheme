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
exports.registerSurvey = exports.CovidQuickTestResult = void 0;
const fetchHcs_1 = __importDefault(require("./util/fetchHcs"));
const userInfo_1 = require("./userInfo");
const retrieveClientVersion_1 = __importDefault(require("./util/retrieveClientVersion"));
var CovidQuickTestResult;
(function (CovidQuickTestResult) {
    /** 검사하지 않음 (0) */
    CovidQuickTestResult[CovidQuickTestResult["NONE"] = 0] = "NONE";
    /** 음성 (1) */
    CovidQuickTestResult[CovidQuickTestResult["NEGATIVE"] = 1] = "NEGATIVE";
    /** 양성 (2) */
    CovidQuickTestResult[CovidQuickTestResult["POSITIVE"] = 2] = "POSITIVE";
})(CovidQuickTestResult = exports.CovidQuickTestResult || (exports.CovidQuickTestResult = {}));
/**
 * 설문을 제출합니다.
 * @param endpoint 관할 시/도 엔드포인트
 * @param secondToken 2차 로그인 토큰
 * @param survey 설문 내용
 * @returns {Promise<SurveyResult>}
 */
function registerSurvey(endpoint, secondToken, survey = {
    Q1: false,
    Q2: CovidQuickTestResult.NONE,
    Q3: false
}) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield (0, userInfo_1.userInfo)(endpoint, secondToken);
        const clientVersion = yield (0, retrieveClientVersion_1.default)();
        const data = {
            clientVersion,
            deviceUuid: '',
            rspns00: (!survey.Q1 && survey.Q2 !== CovidQuickTestResult.NONE && !survey.Q3) ? 'Y' : 'N',
            rspns01: survey.Q1 ? '2' : '1',
            rspns02: survey.Q3 ? '0' : '1',
            rspns03: survey.Q2 == CovidQuickTestResult.NONE ? '1' : null,
            rspns04: null,
            rspns05: null,
            rspns06: null,
            rspns07: survey.Q2 != CovidQuickTestResult.NONE ? (survey.Q2 == CovidQuickTestResult.NEGATIVE ? '0' : '1') : null,
            rspns08: null,
            rspns09: null,
            rspns10: null,
            rspns11: null,
            rspns12: null,
            rspns13: null,
            rspns14: null,
            rspns15: null,
            upperToken: user[0].token,
            upperUserNameEncpt: user[0].name
        };
        const response = yield (0, fetchHcs_1.default)('/registerServey', 'POST', data, endpoint, user[0].token);
        if (response.isError) {
            return {
                success: false,
                message: response.message
            };
        }
        return {
            success: true,
            registeredAt: response['registerDtm']
        };
    });
}
exports.registerSurvey = registerSurvey;
