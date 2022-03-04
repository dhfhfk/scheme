export declare enum CovidQuickTestResult {
    /** 검사하지 않음 */
    NONE = 0,
    /** 음성 */
    NEGATIVE = 1,
    /** 양성 */
    POSITIVE = 2
}
/** 설문 내용 */
export interface SurveyData {
    /**
     * 1. 학생 본인이 코로나19 감염에 의심되는 아래의 임상증상*이 있나요?
     * (주요 임상증상) 발열(37.5℃), 기침, 호흡곤란, 오한, 근육통, 두통, 인후통, 후각·미각소실
     */
    Q1: boolean;
    /**
     * 2. 학생은 오늘 신속항원검사(자가진단)를 실시했나요?
     */
    Q2: CovidQuickTestResult;
    /**
     * 3.학생 본인 또는 동거인이 PCR 검사를 받고 그 결과를 기다리고 있나요?
     */
    Q3: boolean;
    /**
     * 4. 학생 본인이 보건소로부터 밀접접촉자로 통보받아 현재 자가격리 중인가요?
     */
    Q4: boolean;
    /**
     * 5. 학생의 동거인 중 재택치료자가 있어 공동격리인으로 지정되어 현재 자가격리 중인가요?
     */
    Q5: boolean;
}
/** 설문 결과 */
export interface SurveyResult {
    /** 설문 시각 */
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
