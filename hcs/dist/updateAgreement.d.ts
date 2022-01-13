/** 약관 동의 결과 */
export interface UpdateAgreementResult {
    /** 성공 여부 */
    success: boolean;
}
/**
 * 개인정보 처리 방침 동의
 *
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 로그인 세션 토큰
 */
export declare function updateAgreement(endpoint: string, token: string): Promise<UpdateAgreementResult>;
