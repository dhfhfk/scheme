/**
 * 비밀번호 설정 여부를 확인합니다.
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 1차 로그인 토큰
 * @returns {boolean}
 */
export declare function passwordExists(endpoint: string, token: string): Promise<boolean>;
