/** 학교 정보 */
export interface School {
    /** 학교명 */
    name: string;
    /** 학교명(영문) */
    nameEn: string;
    /** 관할 시/도 */
    city: string;
    /** 학교 주소 */
    address: string;
    /** 관할 시/도 엔드포인트 */
    endpoint: string;
    /** 학교식별번호 */
    schoolCode: string;
}
/**
 * 학교를 검색합니다.
 * @param schoolName 학교명
 * @returns {Promise<School[]>}
 */
export declare function searchSchool(schoolName: string): Promise<School[]>;
