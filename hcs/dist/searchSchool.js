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
exports.searchSchool = void 0;
const fetchHcs_1 = __importDefault(require("./util/fetchHcs"));
/**
 * 학교를 검색합니다.
 * @param schoolName 학교명
 * @returns {Promise<School[]>}
 */
function searchSchool(schoolName) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, fetchHcs_1.default)("/v2/searchSchool", "GET", { orgName: schoolName });
        const schoolList = Object(response["schulList"]);
        return schoolList.map(school => {
            return {
                name: school["kraOrgNm"],
                nameEn: school["engOrgNm"],
                city: school["lctnScNm"],
                address: school["addres"],
                endpoint: school["atptOfcdcConctUrl"],
                schoolCode: school["orgCode"],
                searchKey: response.key
            };
        });
    });
}
exports.searchSchool = searchSchool;
