export declare type SecondLoginResult = SecondLoginResultSuccess | SecondLoginResultFailure;
export interface SecondLoginResultSuccess {
    /**
     * 성공 여부와 에 따라 제공되는 데이터가 다릅니다.
     *
     * @example if (result.success) {
     *      // 로그인 성공 데이터
     *    } else {
     *      // 로그인 실패 데이터
     *    }
     * */
    success: true;
    /** 설문 토큰 */
    token: string;
}
export interface SecondLoginResultFailure {
    /**
     * 성공 여부, 참/거짓에 따라 제공되는 데이터가 다릅니다.
     *
     * @example if (result.success) {
     *      // 로그인 실패 데이터
     *    } else {
     *      // 로그인 성공 데이터
     *    }
     * */
    success: false;
    /** 로그인 실패 횟수 */
    failCount?: number;
    /** 남은 시간 */
    remainingMinutes?: number;
    message: string;
}
export declare function secondLogin(endpoint: string, token: string, password: string): Promise<SecondLoginResult>;
