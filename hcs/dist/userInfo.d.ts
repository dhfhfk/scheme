/** 학생 정보 */
export interface UserInfo {
    /** 비밀번호 등록 필요 */
    registerRequired: boolean;
    /** 등록일자 */
    registeredAt: string;
    /** 등록년월일 */
    registeredAtYMD: string;
    /** 학교명 */
    schoolName: string;
    /** 학교식별코드 */
    schoolCode: string;
    /** 설문 정상 여부 */
    isHealthy: boolean;
    /** 학생명 */
    name: string;
    /** 학생식별코드 */
    UID: string;
    /** 로그인 세션 토큰 */
    token: string;
}
/**
 * 학생 정보를 가져옵니다.
 *
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 로그인 세션 토큰
 */
export declare function userInfo(endpoint: string, token: string): Promise<UserInfo[]>;
