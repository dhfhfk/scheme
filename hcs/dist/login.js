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
const request_1 = __importDefault(require("./request"));
const encrypt_1 = __importDefault(require("./encrypt"));
function login(endpoint, schoolCode, name, birthday) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            birthday: birthday,
            loginType: "school",
            name: name,
            orgCode: schoolCode,
            stdntPNo: null,
        };
        const response = yield (0, request_1.default)("/v2/findUser", "POST", data, endpoint);
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
