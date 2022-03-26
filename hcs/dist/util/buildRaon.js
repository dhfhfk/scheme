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
const hmac_sha256_1 = __importDefault(require("crypto-js/hmac-sha256"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importDefault(require("crypto"));
const encryptWithPublicKey_1 = __importDefault(require("./encryptWithPublicKey"));
const seedEncrypt_1 = __importDefault(require("./seedEncrypt"));
const fetchHcs_1 = require("./fetchHcs");
const delimiter = "$";
const baseUrl = "https://hcs.eduro.go.kr/transkeyServlet";
const keysXY = [
    [125, 27], [165, 27], [165, 67], [165, 107],
    [165, 147], [125, 147], [85, 147], [45, 147],
    [45, 107], [45, 67], [45, 27], [85, 27]
];
function fetchRaon(url, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = body ? { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } } : {};
        return (0, node_fetch_1.default)(url, Object.assign({ agent: fetchHcs_1.defaultAgent, body }, options)).then(r => r.text());
    });
}
function buildRaon(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const getInitTime = yield fetchRaon(baseUrl + "?op=getInitTime");
        const initTime = getInitTime.match(/var initTime='(.*)';/)[1];
        const genSessionKey = crypto_1.default.randomBytes(16).toString("hex");
        const sessionKey = genSessionKey.split("").map(char => Number("0x0" + char));
        const encSessionKey = (0, encryptWithPublicKey_1.default)(genSessionKey);
        const keyIndex = yield fetchRaon(baseUrl, `op=getKeyIndex&name=password&keyboardType=number&initTime=${initTime}`);
        const dummy = yield fetchRaon(baseUrl, `op=getDummy&keyboardType=number&fieldType=password&keyIndex=${keyIndex}&talkBack=true`);
        const keys = dummy.split(",");
        let enc = password.split("").map(n => {
            const [x, y] = keysXY[keys.indexOf(n)];
            return delimiter + (0, seedEncrypt_1.default)(`${x} ${y}`, sessionKey, initTime);
        }).join("");
        // 128
        for (let j = 4; j < 128; j++) {
            enc += delimiter + (0, seedEncrypt_1.default)("# 0 0", sessionKey, initTime);
        }
        const hmac = (0, hmac_sha256_1.default)(enc, genSessionKey).toString();
        return JSON.stringify({
            raon: [{
                    id: "password",
                    enc,
                    hmac,
                    keyboardType: "number",
                    keyIndex,
                    fieldType: "password",
                    seedKey: encSessionKey
                }]
        });
    });
}
exports.default = buildRaon;
