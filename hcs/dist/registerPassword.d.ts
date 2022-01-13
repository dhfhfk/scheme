/** 비밀번호 설정 결과 */
export interface RegisterPasswordResult {
    success: boolean;
}
/**
 * 비밀번호를 설정합니다.
 *
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 로그인 세션 토큰
 * @param password 비밀번호
 */
export declare function registerPassword(endpoint: string, token: string, password: string): Promise<RegisterPasswordResult>;
