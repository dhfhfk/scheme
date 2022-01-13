/**
 * 로그인 결과
 */
export declare type LoginResult = LoginResultSuccess | LoginResultFailure;
/**
 * 로그인 성공 결과
 */
export interface LoginResultSuccess {
    /**
     * 성공 여부, 참/거짓에 따라 제공되는 데이터가 다릅니다.
     *
     * @example if (result.success) {
     *      // 로그인 성공 데이터
     *    } else {
     *      // 로그인 실패 데이터
     *    }
     * */
    success: true;
    /** 동의 필요 여부 */
    agreementRequired: boolean;
    /** 학교명 */
    schoolName: string;
    /** 학생명 */
    name: string;
    /** 생년월일 */
    birthday: string;
    /** 로그인 세션 토큰 */
    token: string;
}
/**
 * 로그인 실패 결과
 */
export interface LoginResultFailure {
    /**
     * 성공 여부, 참/거짓에 따라 제공되는 데이터가 다릅니다.
     *
     * @example if (result.success) {
     *      // 로그인 성공 데이터
     *    } else {
     *      // 로그인 실패 데이터
     *    }
     * */
    success: false;
    /** 실패 사유 */
    message: string;
}
export declare function login(endpoint: string, schoolCode: string, name: string, birthday: string): Promise<LoginResult>;
