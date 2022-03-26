/** 약관 동의 결과 */
export interface UpdateAgreementResult {
    /** 성공 여부 */
    success: boolean;
}
/**
 * 개인정보처리방침에 동의합니다.
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 1차 로그인 토큰
 * @returns {Promise<UpdateAgreementResult>}
 */
export declare function updateAgreement(endpoint: string, token: string): Promise<UpdateAgreementResult>;
