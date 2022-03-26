"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const fetchHcs_1 = __importDefault(require("./util/fetchHcs"));
const encrypt_1 = __importDefault(require("./util/encrypt"));
/**
 * 1차 로그인을 진행합니다.
 * @param endpoint 관할 시/도 엔드포인트
 * @param schoolCode 학교식별번호
 * @param name 학생명
 * @param birthday 생년월일
 * @returns {Promise<LoginResult>}
 */
function login(endpoint, schoolCode, name, birthday, searchKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            birthday: birthday,
            loginType: "school",
            name: name,
            orgCode: schoolCode,
            stdntPNo: null,
            searchKey: searchKey
        };
        const response = yield (0, fetchHcs_1.default)("/v2/findUser", "POST", data, endpoint);
        return response["isError"]
            ? {
                  success: false,
                  message: response["message"],
              }
            : {
                  success: true,
                  agreementRequired: response["pInfAgrmYn"] === "N",
                  schoolName: response["orgName"],
                  name: name,
                  birthday: birthday,
                  token: response["token"],
              };
    });
}
exports.login = login;
