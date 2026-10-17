<p align="center">
  <img src="public/logo.png" alt="Usagi Studio 로고" width="120" height="120" />
</p>

# Usagi Studio

**작은 타일로 만드는 나만의 세계 — 브라우저 기반 타일맵 에디터**

[![Status: Prototype](https://img.shields.io/badge/status-prototype-E8A0B5?style=flat-square)](#현재-구현-범위)
[![Package version: 1.0.0](https://img.shields.io/badge/package-v1.0.0-5F5476?style=flat-square)](package.json)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](package.json)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=flat-square&logo=javascript&logoColor=222222)](src/main.js)
[![Sass](https://img.shields.io/badge/styles-Sass-CC6699?style=flat-square&logo=sass&logoColor=white)](src/assets/style.scss)

[![Node.js 22.18+](https://img.shields.io/badge/Node.js-22.18%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](#준비-사항)
[![Yarn Classic](https://img.shields.io/badge/Yarn-Classic-2C8EBB?style=flat-square&logo=yarn&logoColor=white)](yarn.lock)
[![ESLint 10](https://img.shields.io/badge/ESLint-10-4B32C3?style=flat-square&logo=eslint&logoColor=white)](eslint.config.mjs)
[![Browser checks: Playwright CLI](https://img.shields.io/badge/browser_checks-Playwright_CLI-2EAD33?style=flat-square)](#검증)

[빠른 시작](#빠른-시작) · [기본 조작](#기본-조작) · [검증](#검증) · [프로젝트 구조](#프로젝트-구조) · [기여 안내](#개발자와-기여)

---

브라우저에서 32×32 픽셀 타일과 오토타일로 맵을 편집하는 **Vue 3 기반 타일맵 에디터**입니다. 타일 팔레트, 3개 레이어, 그리기 도구와 실행 취소 기능을 갖추고 있으며, 포함된 병원 샘플 맵으로 바로 사용해 볼 수 있습니다.

> **개발 중인 프로토타입입니다.** 편집 내용은 브라우저 메모리에만 유지됩니다. 저장·내보내기는 미구현이며, 새로고침하면 변경 내용이 사라집니다.

## 주요 기능

- **타일 선택**: 단일 타일과 직사각형 묶음 선택, 맵 우클릭으로 타일 가져오기
- **그리기**: 브러시, 사각형, 원형, 연결 영역 채우기와 오토타일 연결 처리
- **레이어**: 독립적인 3개 타일 레이어와 편집이 차단된 미리보기·이벤트 레이어
- **확대/축소**: 10–100% 줌, 슬라이더와 초기화 버튼
- **실행 취소/다시 실행**: 도구 모음과 키보드 단축키, 레이어 전환 후에도 원래 맵 상태 복원

별도 백엔드나 계정 설정 없이 타일 배치와 도구 동작을 실험할 수 있습니다. Vue 컴포넌트, Canvas 렌더링, Vuex 편집 상태가 분리되어 있어 에디터 기능을 확장하기에도 적합합니다.

### 현재 구현 범위

선택 영역을 지정할 수 있지만 **영역 이동은 미구현**입니다. 잘라내기·복사·붙여넣기·삭제, 맵 가져오기·내보내기·저장에도 빈 처리 함수가 남아 있습니다. Database 팝업은 샘플 UI이며, 완성된 데이터 관리 기능이 아닙니다. 관리자·에셋·음원·통계·환경설정 메뉴도 아직 동작하지 않습니다.

## 빠른 시작

### 준비 사항

- **Node.js 22.18 이상** — 검증 환경: Node.js 22.22.2
- **Yarn Classic 1.x** — 검증 환경: Yarn 1.22.22
- 데스크톱 브라우저 — 편집 회귀 검증은 Chromium에서 수행했습니다.
- 선택 사항: 프로덕션 미리보기 예제에 사용하는 Python 3

설치 시 패키지 레지스트리에 접근할 수 있어야 합니다. 앱 실행에 API 키나 환경 변수는 필요하지 않습니다. Google Fonts를 외부에서 불러오며, 연결되지 않으면 대체 글꼴을 사용합니다.

```sh
git clone https://github.com/rei-developer/usagi-studio.git
cd usagi-studio
yarn install --frozen-lockfile
yarn serve
```

터미널에 표시된 로컬 주소를 엽니다. 기본 실행 시 `Map001.json`의 **병원 맵(50×20 타일)**이 로드됩니다. 포트를 지정하려면 다음과 같이 실행합니다.

```sh
yarn serve --host 127.0.0.1 --port 8081
```

### 기본 조작

1. 왼쪽 팔레트에서 타일을 클릭하거나 드래그해 여러 타일을 선택합니다. 맨 위 줄은 오토타일 팔레트입니다.
2. 상단에서 `Layer 1`, `Layer 2`, `Layer 3` 중 편집할 레이어를 고릅니다.
3. 브러시·사각형·원형·채우기 도구를 선택하고 맵을 클릭하거나 드래그합니다. 아이콘에 마우스를 올리면 설명이 표시됩니다.
4. 맵에서 타일을 우클릭하면 해당 타일을 선택해 다시 그릴 수 있습니다.
5. 오른쪽 아래 줌 슬라이더와 버튼으로 표시 배율을 조절합니다.

| 동작 | 조작 |
| --- | --- |
| 실행 취소 | 도구 모음 또는 `Ctrl+Z` / `⌘Z` |
| 다시 실행 | 도구 모음 또는 `Ctrl+Shift+Z` / `⌘⇧Z` |
| 팔레트 선택 이동 | 방향키 |
| 줌 초기화 | 오른쪽 아래 과녁 아이콘 |

## 개발과 빌드

| 명령 | 설명 |
| --- | --- |
| `yarn install --frozen-lockfile` | `yarn.lock`에 고정된 의존성 설치 |
| `yarn serve` | 개발 서버와 핫 리로드 실행 |
| `yarn lint` | ESLint·Prettier 검사 및 자동 수정 |
| `yarn build` | 최적화된 정적 파일을 `dist/`에 생성 |

`yarn lint`는 파일을 수정하므로 실행 후 diff를 확인하세요. 빌드 도구는 Vue CLI 5 / Webpack이며, 에디터와 아이콘 정의를 지연 로딩합니다. Webpack 기본 크기 경고는 활성화되어 있습니다.

프로덕션 빌드는 `file://`로 열지 말고 HTTP 서버로 제공합니다. 예를 들어 Python 3이 설치되어 있다면:

```sh
yarn build
python -m http.server 8082 --bind 127.0.0.1 --directory dist
```

브라우저에서 `http://127.0.0.1:8082/`를 엽니다. 현재 이미지 경로는 `/tilesets/`, `/autotiles/` 등 도메인 루트를 기준으로 합니다. 하위 경로에 배포하려면 이미지 URL과 라우터 기본 경로를 함께 검토해야 합니다.

## 검증

### 개발 서버 편집 회귀 검사

`yarn serve --host 127.0.0.1 --port 8081`을 실행한 상태에서 별도 터미널을 엽니다.

```sh
npx --yes @playwright/cli -s=usagi-editor open http://127.0.0.1:8081/
npx --yes @playwright/cli -s=usagi-editor run-code --filename scripts/editor-smoke.pw
npx --yes @playwright/cli -s=usagi-editor close
```

[editor-smoke.pw](scripts/editor-smoke.pw)는 실제 마우스·키보드 입력 후 Vue 개발 상태를 읽어 타일 선택, 도형·채우기, 오토타일, 레이어, 줌, 히스토리 복원을 검사합니다. 프로덕션 빌드에서는 해당 개발 상태를 제공하지 않으므로 이 스크립트를 사용하지 않습니다.

### 프로덕션 검사

위의 HTTP 서버로 `dist/`를 제공한 상태에서 실행합니다.

```sh
npx --yes @playwright/cli -s=usagi-production open http://127.0.0.1:8082/
npx --yes @playwright/cli -s=usagi-production run-code --filename scripts/production-smoke.pw
npx --yes @playwright/cli -s=usagi-production close
```

[production-smoke.pw](scripts/production-smoke.pw)는 Vue 내부 상태에 의존하지 않고 캔버스 픽셀 복원, 줌 크기, Database 팝업과 콘솔 오류를 검사합니다. `.pw` 파일은 Playwright CLI에서 실행하는 JavaScript 함수입니다. 첫 실행에는 CLI 다운로드와 사용 가능한 브라우저가 필요합니다. 두 스크립트의 스크린샷은 Git에서 제외된 `output/playwright/`에 저장됩니다.

2026-10-17 로컬 검증에서는 개발 검사 **36개**, 프로덕션 검사 **8개**와 lint·빌드가 통과했으며 빌드 경고는 0건이었습니다. 이는 당시 실행 결과이며 CI 상태나 다른 브라우저의 검증을 의미하지 않습니다. 별도의 `yarn test` 명령이나 커버리지 기준은 없습니다.

## 프로젝트 구조

```text
src/
  main.js             # 앱 초기화와 전역 컴포넌트 등록
  icons.js            # 에디터 아이콘 등록
  views/              # 메인 화면과 MapEditor 조합
  components/         # 맵·팔레트 Canvas, 도구 모음
    common/           # 버튼, 입력, 다이얼로그 등 공통 UI
    popups/           # 오토타일·정보·데이터베이스 팝업
  store/              # 선택 상태, 로딩, 실행 취소/다시 실행
  router/             # 라우팅과 화면 지연 로딩
  utils/              # 타일 크기, 오토타일 매핑, 도구 상수
  assets/             # SCSS, 샘플 맵, 보존용 원본 이미지
public/               # 실행 시 제공되는 로고·타일셋·오토타일
scripts/              # 개발/프로덕션 브라우저 회귀 검사
```

핵심 동작은 [MapView.vue](src/components/MapView.vue), [TilesetView.vue](src/components/TilesetView.vue), [Vuex store](src/store/index.js)에 있습니다. 설정은 [package.json](package.json), [vue.config.js](vue.config.js), [eslint.config.mjs](eslint.config.mjs)를 참고하세요.

### 샘플과 에셋

- 기본 맵: [Map001.json](src/assets/maps/Map001.json). 로딩 위치는 [MapEditor.vue](src/views/MapEditor.vue)의 `created()`입니다.
- [Map079.json](src/assets/maps/Map079.json)은 비활성 샘플입니다. 활성화하려면 맵 ID와 JSON 로딩 경로를 변경하고 [원본 타일셋](src/assets/tilesets/Province%20de%20Vigo.png)을 `public/tilesets/`에 복사해야 합니다.
- [배포용 로고](public/logo.png)는 200×200이며, [600×600 원본](src/assets/originals/logo.png)은 별도로 보존합니다. 참조되지 않는 소스 에셋은 빌드 결과에 포함되지 않습니다.
- 실행 취소는 전체 맵 스냅샷을 보관합니다. 대형 맵에서 긴 편집 세션을 지원하려면 히스토리 메모리 사용량을 검토하세요.

## 도움말과 문제 제보

먼저 위의 실행·검증 절차와 [저장소 기여 지침](AGENTS.md)을 확인하세요. 코드와 변경 제안은 [GitHub 저장소](https://github.com/rei-developer/usagi-studio)에서 관리합니다.

문제를 제보할 때는 Node.js·Yarn·브라우저 버전, 실행 명령, 재현 단계, 기대 결과와 실제 결과를 포함하세요. 편집 문제에는 사용한 도구·레이어·줌 배율과 콘솔 오류 또는 스크린샷도 첨부하면 좋습니다. 별도의 지원 채널이나 응답 일정은 명시되어 있지 않습니다.

## 개발자와 기여

앱의 [정보 화면](src/components/popups/InfoPopup.vue)은 개발자를 **데란, 마니아**로 표기하며, Git 이력의 주요 작성자는 **INYEOB**입니다. 저장소 소유 계정은 **rei-developer**입니다.

기여 전 [AGENTS.md](AGENTS.md)를 읽어 주세요. 변경은 작고 명확하게 유지하고, PR에는 목적·검증 결과·관련 이슈를 포함하세요. UI나 편집 동작 변경에는 스크린샷 또는 짧은 녹화를 첨부하고 해당 브라우저 검사를 실행하세요. 원본 에셋과 샘플 데이터는 보존하며, 생성된 `dist/`, `node_modules/`, 테스트 출력은 커밋하지 않습니다.

## 라이선스

현재 저장소에는 `LICENSE` 파일이 없습니다. 코드와 포함된 이미지의 이용·재배포 조건을 임의로 가정하지 말고 저장소 관리자에게 확인하세요.
