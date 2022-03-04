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
exports.secondLogin = void 0;
const request_1 = __importDefault(require("./request"));
const buildRaon_1 = __importDefault(require("./raon/buildRaon"));
function secondLogin(endpoint, token, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            deviceUuid: "",
            makeSession: true,
            password: yield (0, buildRaon_1.default)(password)
        };
        const response = yield (0, request_1.default)('/v2/validatePassword', 'POST', data, endpoint, token);
        if (response.token) {
            return {
                success: true, token: response.token
            };
        }
        if (response.message == "비밀번호를 다시한번더 입력해주세요") {
            return {
                success: false,
                failCount: null,
                remainingMinutes: null,
                message: "가상키보드 오류"
            };
        }
        let message = null;
        if (response.statusCode == 252) {
            switch (response.errorCode) {
                case 1e3:
                    message = "비밀번호를 5회 틀리셔서 5분후 재시도 하실 수 있습니다.";
                    break;
                case 1001:
                    if (!response.data.canInitPassword) {
                        message = "사용자 비밀번호가 맞지 않습니다. 본인이나 가족이 이미 설정한 비밀번호를 입력하여 주시기 바랍니다.";
                    }
                    break;
                case 1003:
                    message = "비밀번호가 초기화 되었습니다. 다시 로그인하세요";
            }
        }
        else if (response.statusCode == 255) {
            switch (response.errorCode) {
                case 1004:
                    message = "입력시간이 초과되어 다시 비밀번호를 입력하시기 바랍니다.";
            }
        }
        return {
            success: false,
            failCount: response.data.failCnt ? Number(response.data.failCnt) : 5,
            remainingMinutes: response.data.remainMinutes ? Number(response.data.remainMinutes) : 0,
            message
        };
    });
}
exports.secondLogin = secondLogin;
