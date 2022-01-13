/** 설문 내용 */
export interface SurveyData {
    /** 학생 본인이 37.5도 이상 발열 또는 발열감이 있나요? */
    Q1: boolean;
    /** 학생에게 코로나19가 의심되는 임상증상이 있나요?
     * (기침, 호흡곤란, 오한, 근육통, 두통, 인후통, 후각·미각 소실 또는 폐렴 등)
     */
    Q2: boolean;
    /** 학생 본인 또는 동거인이 방역당국에 의해 현재 자가격리가 이루어지고 있나요? */
    Q3: boolean;
}
/** 설문 결과 */
export interface SurveyResult {
    /**  */
    registeredAt: string;
}
/**
 * 설문을 진행합니다
 *
 * @param endpoint 관할 시/도 엔드포인트
 * @param token 설문 토큰 (로그인 토큰이 아닙니다!)
 * @param survey 설문 내용
 */
export declare function registerSurvey(endpoint: string, token: string, survey?: SurveyData): Promise<SurveyResult>;
