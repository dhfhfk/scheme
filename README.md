# Scheme | 2022-03-30 이후 해당 레파지토리는 유지보수되지 않습니다.

간편한 자가진단과 급식 조회

## 🔧 사용 및 설정법

Node.js >= 16.6.0, git, MongoDB 가 필요합니다.

```bash
# npm을 최신버전으로 업데이트합니다.
npm install npm -g

# 해당 리포지토리를 클론하거나 로컬로 다운로드합니다.
git clone https://github.com/dhfhfk/scheme.git
cd scheme

# 필수 모듈을 다운로드합니다.
npm install
```

[config.json](./config.example.json)을 알맞게 수정해야 합니다.

<details>
<summary>config.json에 대한 자세한 설명</summary>
<div markdown="1">

```json
{
    "bot": {
        "token": "디스코드 개발자 페이지에서 생성한 Bot의 Token입니다. "
        "guild_id": "관리자용 관리 명령어를 사용할 디스코드 서버의 ID입니다."
        "prefix": "현재 사용하지 않지만 나중을 위한 명령어 접두사입니다. (아무렇게나 입력하세요)"
    },
    "db": {
        "mongopath": "Mongodb 데이터베이스의 경로를 입력합니다. 예시) mongodb://localhost:27017/discordbot"
    },
    "services": {
        "neis_key": "open.neis.go.kr 에서 발급받은 api key입니다."
        "user_limit": "디스코드 사용자 한 명당 등록할 수 있는 자가진단 사용자 수 입니다. 일부 서비스는 아직 1명만 지원합니다."
        "secret_key": "사용자의 자가진단 비밀번호를 암호화하는 비밀키입니다. 보안 수준에 알맞는 랜덤 문자열로 입력하세요."
    },
    "color": {
        "error": "#da2723",
        "delete": "#ed4245",
        "success": "#3fbf4f",
        "primary": "#e68947"
    },
    "emojis": {
        "done": "<:green_done:918422764778577980>",
        "x": "<:red_x:918422764757598208>",
        "delete": "<:delete_forever:901147281485623376>"
    }
}
```

</div>
</details>

```bash
# 자신이 원하는 텍스트 에디터를 사용합니다.
nano config.example.json

# 수정 후 파일의 이름을 변경합니다.
mv config.example.json config.json

# 옵션1: 직접 실행합니다.
node .

# (추천) 옵션2: pm2에 등록합니다.
pm2 start ecosystem.config.js
```

## 데이터베이스 형식

사용자의 정보를 저장하기 위해 해당 봇은 Mongodb를 사용합니다. 저장 형식은 다음과 같습니다.

```json
{
    "_id": "디스코드 사용자의 Id",
    "school": {
        "name": "학교명",
        "endpoint": "자가진단 교육청 주소",
        "sc": "시도교육청코드",
        "sd": "표준 학교코드",
        "org": "기관코드"
    },
    "users": [
        {
            "name": "자가진단 사용자의 이름",
            "encName": "암호화된 사용자의 이름",
            "encBirth": "암호화된 사용자의 생년월일",
            "password": "암호화된 자가진단용 비밀번호",
            "endpoint": "자가진단 교육청 주소",
            "org": "기관코드"
        }
    ],
    "schedule": {
        "type": "스케줄 시간대 (A, B, C)",
        "kinds": "스케줄 타입 (A, B, C) ",
        "channelId": "스케줄 메시지를 전송할 채널 ID",
        "paused": "스케줄 일시정지 여부 Boolean"
    }
}
```

## ❗ 주의사항

-   해당 봇의 자동 자가진단 기능을 사용하여 발생하는 문제의 책임은 사용자에게 있습니다. 건강상의 문제가 있다면 반드시 직접 자가진단을 수행하시기 바랍니다.
-   토이프로젝트로 시작한 레파지토리로, 현재 비효율적인 코드를 고쳐가고 있습니다.
-   개발자의 한계상 아직 해결하지 못한 이슈가 꽤 많이 존재합니다. 오류 수정 PR은 환영입니다.
