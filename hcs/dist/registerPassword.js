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
exports.registerPassword = void 0;
const fetchHcs_1 = __importDefault(require("./util/fetchHcs"));
const encrypt_1 = __importDefault(require("./util/encrypt"));
/**
 * 비밀번호를 설정합니다.
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 1차 로그인 토큰
 * @param password 비밀번호
 * @returns {Promise<RegisterPasswordResult>}
 */
function registerPassword(endpoint, token, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            deviceUuid: "",
            password: (0, encrypt_1.default)(password)
        };
        const response = yield (0, fetchHcs_1.default)("/v2/registerPassword", "POST", data, endpoint, token);
        return { success: response };
    });
}
exports.registerPassword = registerPassword;
