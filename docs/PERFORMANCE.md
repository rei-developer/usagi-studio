# 대형 맵 성능 검증

2026-10-17 기준. 256×256 타일·3개 레이어의 편집·저장을 검증했다. 512×512는 한계 측정이며 지원 보장 범위가 아니다. 수치 원본은 [performance-results.json](performance-results.json)에 있다.

## 환경과 방법

- Windows, AMD Ryzen 7 7700, 논리 CPU 16개, RAM 약 31GiB, Node 22.22.2.
- Playwright CLI Chromium, 프로덕션 빌드 `b3780da7a535f133`, 화면 1920×1080. CPU·네트워크 제한 없음.
- 준비 실행 후 5회 반복. 채우기·브러시는 실제 포인터 입력을 사용한다. 스크롤은 브라우저의 스크롤 영역을 이동한다.
- `large-map-smoke.pw`의 프레임 시간은 입력 이벤트 시작부터 해당 렌더링 뒤 animation frame 콜백까지다. GPU 표시 완료나 모니터의 실제 FPS 측정은 아니다.
- 추가 fixture 검사의 스크롤 값은 이동 후 두 animation frame을 기다린 시간의 회차별 최대값으로, 위 p95와 측정 방식이 다르다.
- Long Tasks 관측은 준비 완료 후 편집·스크롤·축소·저장·출력 시나리오에 적용했다. 초기 모듈 로딩·fixture 주입 비용은 포함하지 않는다.

## 결과

| 검사 | 5회 결과, ms | 기준 |
|---|---|---|
| 256×256 단색 채우기 | 19.1 / 24.7 / 17.4 / 15.0 / 13.5 | 500 이하 |
| 256×256 브러시 프레임 p95 | 3.4 / 3.7 / 3.4 / 3.6 / 3.7 | 33 이하 |
| 256×256 스크롤 프레임 p95 | 1.3 / 0.1 / 0.1 / 0.1 / 0.1 | 33 이하 |
| 256×256 오토타일 영역 채우기 | 32.3 / 21.2 / 19.6 / 20.4 / 17.7 | 500 이하 |

두 실제 샘플(50×20, 57×128), 오토타일 밀집 256×256, 혼합 레이어 256×256, 혼합 레이어 512×512의 스크롤·10% 축소 검사에서 런타임 오류 및 50ms 이상 Long Task가 관측되지 않았다. 512×512의 전체 편집·저장·출력을 보장하는 결과는 아니다.

단색 256×256 시나리오에서 보고된 JS 힙은 약 39.7MiB였다. 이는 측정 순간의 값이며 테스트 코드도 포함한다. 캔버스·GPU·디코딩된 이미지·브라우저 전체 메모리나 최고 메모리 사용량을 뜻하지 않는다.

기존 채우기 함수의 별도 Node 단회 측정은 16×16 33ms, 32×32 519ms, 50×50 3,088ms였다. 새 알고리즘 단독 준비 실행 후 측정은 256×256 약 0.6–3.1ms였다. 실행 조건과 포함 비용이 다르므로 브라우저 전체 속도 향상 배수로 해석하지 않는다.

## 적용한 개선과 한도

- 연결 영역은 방문 배열과 정수 큐로 한 번씩 탐색한다. 패턴 도형은 대상 좌표에서 패턴 타일을 직접 찾는다.
- 편집 이력은 맵·레이어·셀 인덱스와 변경 전후 ID를 기록한다. 합계 500개 또는 셀 데이터 64MiB를 넘으면 오래된 이력을 제거한다. 이 한도는 객체 관리 비용을 포함한 브라우저 메모리 한도가 아니다.
- 화면 캔버스는 뷰포트 크기다. 커서는 별도 캔버스이며, 32×32 타일 구역 캐시는 픽셀 버퍼 합계 64MiB의 LRU로 관리한다. 새 구역 생성은 약 8ms 단위로 다음 프레임에 이어서 처리한다.
- 오토타일 48가지 조합을 자산 로딩 시 아틀라스로 만들고 재사용한다. 줌 변경은 이미지 재로딩을 하지 않는다.
- 저장은 IndexedDB의 완료된 트랜잭션 이후 성공 처리한다. 기존 localStorage는 검증 후 이전하고 백업으로 남긴다. 새 저장본을 우선하며 실패 시 편집 내용과 기존 저장본을 보존한다.
- 이미지 출력은 최대 16,777,216픽셀·한 변 8,192픽셀이다. 100%·50%·25%·12.5% 중 안전한 최대 배율이 기본값이다. 256×256은 4096×4096으로 직접 출력하며 원본 크기의 임시 캔버스를 만들지 않는다.
- 출력 합성은 약 8ms마다 양보하고 취소할 수 있다. 브라우저 인코더가 이미 실행 중이면 콜백 완료 후 취소를 반영하며 파일은 다운로드하지 않는다.
- 초기 아이콘 컴포넌트와 webpack runtime을 분리해 초기 자산 합계를 약 145KiB로 줄였다. 필요한 코드의 전체 다운로드가 없어지는 것은 아니다. 최종 빌드 경고는 0개다.

## 회귀 검사와 재현

편집 36개, 오토타일 282개, 이력·큰 패턴·포인터 취소 9개, 저장·이전 17개, 이미지 22개, 프로덕션 8개, 대형 맵 15개 검사를 통과했다. 별도로 연결 영역·원형 판정·패턴 좌표, 이력의 바이트 한도, 캐시 LRU·해제 검사를 통과했다.

```sh
yarn lint
node scripts/algorithms-check.mjs
node scripts/history-check.mjs
node scripts/cache-check.mjs
yarn build
python -m http.server 8082 --bind 127.0.0.1 --directory dist
```

다른 터미널에서 테스트 전용 브라우저 세션을 연다. fixture 검사는 저장소를 임시 변경하고 완료 시 원래 저장본을 복원하므로 실제 작업 중인 브라우저에서 실행하지 않는다.

```sh
npx --yes @playwright/cli -s=usagi-perf-prod open http://127.0.0.1:8082/
npx --yes @playwright/cli -s=usagi-perf-prod run-code --filename scripts/large-map-smoke.pw
node scripts/prepare-performance-fixtures.mjs
npx --yes @playwright/cli -s=usagi-perf-prod run-code --filename output/fixture-performance.pw
npx --yes @playwright/cli -s=usagi-perf-prod run-code --filename scripts/file-smoke.pw
npx --yes @playwright/cli -s=usagi-perf-prod run-code --filename scripts/image-export-smoke.pw
npx --yes @playwright/cli -s=usagi-perf-prod run-code --filename scripts/production-smoke.pw
npx --yes @playwright/cli -s=usagi-perf-prod close
```

개발 서버에서는 README의 편집·오토타일 검사와 `scripts/history-browser-smoke.pw`를 실행한다. 큰 fixture는 기존 샘플과 생성 데이터를 사용하며, 비활성 Province 타일셋은 테스트 요청에만 제공한다. 배포 자산이나 샘플 원본을 바꾸지 않는다.

## 검증 경계

모바일·Firefox·Safari 및 GPU/브라우저 전체 메모리는 측정하지 않았다. 결과는 위 PC와 테스트 시나리오 기준이다. 큰 맵을 만드는 UI나 JSON 가져오기 기능을 추가한 작업은 아니며, 기존 JSON 파일 형식은 유지한다. Web Worker·프레임워크 교체·새 런타임 의존성은 도입하지 않았다.
