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
exports.defaultAgent = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fetch_cookie_1 = __importDefault(require("fetch-cookie"));
const https_1 = require("https");
const url_1 = require("url");
const fetch = (0, fetch_cookie_1.default)(node_fetch_1.default);
exports.defaultAgent = new https_1.Agent({
    rejectUnauthorized: false,
});
const defaultHeaders = {
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-GB,en;q=0.9,ko-KR;q=0.8,ko;q=0.7,ja-JP;q=0.6,ja;q=0.5,zh-TW;q=0.4,zh;q=0.3,en-US;q=0.2",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Pragma: "no-cache",
    Referer: "https://hcs.eduro.go.kr/",
    "X-Forwarded-For": "hcs.eduro.go.kr",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
    "X-Requested-With": "XMLHttpRequest",
};
function fetchHcs(path = "/", method = "GET", data = {}, endpoint = "hcs.eduro.go.kr", token) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = method === "GET" ? "?" + new url_1.URLSearchParams(data).toString() : "";
        const url = "https://" + endpoint + path + query;
        const response = yield fetch(url, {
            method: method,
            agent: exports.defaultAgent,
            headers: Object.assign({ "Content-Type": `application/${method === "GET" ? "x-www-form-urlencoded" : "json"};charset=UTF-8`, Authorization: token }, defaultHeaders),
            body: method === "POST" ? JSON.stringify(data) : undefined,
        });
        let value = yield response.text();
        try {
            value = JSON.parse(value);
        } catch (ignored) {}
        return value;
    });
}
exports.default = fetchHcs;
