/** 비밀번호 설정 결과 */
export interface RegisterPasswordResult {
    success: boolean;
}
/**
 * 비밀번호를 설정합니다.
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 1차 로그인 토큰
 * @param password 비밀번호
 * @returns {Promise<RegisterPasswordResult>}
 */
export declare function registerPassword(endpoint: string, token: string, password: string): Promise<RegisterPasswordResult>;
