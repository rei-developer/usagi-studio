# Worker 이미지 출력 추가 최적화

2026-10-17. 기존 Worker(`1870f26`)와 비교해 **UI 응답성을 유지하면서 PNG·JPG·WebP 출력 시간을 줄였다.** 형식·품질·배율·출력 한도는 유지한다. 원본은 [image-export-results.json](image-export-results.json), 이전 Worker 도입 결과는 [WORKER_WASM.md](WORKER_WASM.md)에 있다.

## 병목과 적용한 변경

처음 단계별 진단에서 256×256 혼합 맵의 PNG 중앙값은 315.6ms였다. 스냅샷 복사 약 0.1ms, 자산 준비 4.1ms, 합성 153.1ms, 인코딩 구간 143.1ms였으며 합성 시간에 타이머 대기 약 34.6ms가 포함됐다. WebP 인코딩 구간은 약 1,416ms로 가장 컸다. 이 진단값은 아래 최종 교차 측정과 별도 실행이다.

- **Worker의 타이머 대기를 제거했다.** 진행 알림은 계속 보내고 취소는 메인 스레드에서 Worker를 종료한다. 메인 스레드 fallback은 기존 8ms 양보를 유지한다.
- **자주 쓰는 타일의 잘라낸 이미지를 재사용한다.** 매 셀마다 원본 아틀라스를 자르는 대신 출력 크기의 OffscreenCanvas에 한 번 그려 둔다. 최초 256개 ID만 캐시하고 이후 새로운 ID는 기존 직접 그리기를 사용한다. 출력마다 캐시를 만들고 완료·오류 시 캔버스 크기를 0으로 초기화하며 Worker도 종료한다.
- 캐시의 픽셀 버퍼 상한은 **100%에서 1MiB, 50%에서 256KiB**다. 캔버스 객체·드라이버 관리 비용까지 포함한 전체 메모리 상한은 아니다. 캐시가 다음 출력이나 다른 맵으로 남지 않는다.
- 스냅샷·자산 준비·Worker 왕복·합성·인코딩 시간과 캐시 바이트 수를 내부 비교 도구에서 읽을 수 있게 했다. 일반 UI에는 계측 항목을 노출하지 않는다.

타이머 제거만으로는 총 시간 개선이 안정적이지 않았다. 소프트웨어 합성과 CPU 아틀라스 변환도 실험했지만 무작위 반투명 레이어에서 픽셀 차이가 있어 제외했다. 최종 구현은 기존 Canvas 합성 경로를 유지한다. 자산 준비 비용이 작아 지속 Worker나 맵 간 자산 캐시는 추가하지 않았다.

## 최종 결과

Windows / Ryzen 7 7700 / RAM 약 31GiB / Node 22.22.2 / 프로덕션 Chromium / 1920×1080. 256×256 타일·3개 혼합 레이어를 50%(4096×4096)로 출력했다. 빌드 `6ee1f479298b08f1`. 동일 브라우저에서 이전/개선 코드를 번갈아 실행하며 형식별 준비 1회 후 **각각 5회** 측정했다. 이전 코드는 Git에서 추출한 실제 `1870f26` Worker다.

| 형식 | 이전 중앙값 | 개선 중앙값 | 감소 |
| --- | ---: | ---: | ---: |
| PNG | 386.6ms | 334.0ms | **13.6%** |
| JPG | 501.2ms | 451.2ms | **10.0%** |
| WebP | 1,869.4ms | 1,808.3ms | **3.3%** |

세 형식 모두 각 교차 쌍의 5회에서 개선 코드가 빨랐다. 사전 PNG 교차 실행도 403.4→368.3ms였다. 절대 시간은 실행 시점에 따라 달랐으므로 지난 문서의 단독 수치와 속도비를 계산하지 않는다. 작은 맵·임의 타일 구성에서 같은 개선율을 보장하지 않는다.

| UI 관측: 각 형식 5회 전체의 최대값 | 이전 | 개선 |
| --- | ---: | ---: |
| 8ms 타이머 초과 지연 | 10.1ms | 9.4ms |
| 연속 rAF 콜백 간격 | 17.9ms | 17.8ms |
| 50ms 이상 메인 스레드 Long Task | 0건 | 0건 |

총 시간은 fixture 생성·스냅샷·자산 준비·Worker 시작과 전송·합성·인코딩·Blob 반환을 포함한다. 파일 다운로드와 디스크 기록은 제외한다. 자산은 미리 로드하지만 각 출력의 Worker와 타일 캐시는 새로 생성한다. `drawMs`는 Canvas 명령 제출까지이며 `encodeMs`에는 지연된 렌더링 처리·픽셀 읽기도 포함될 수 있다. GPU 시간과 순수 코덱 시간으로 분리했다고 해석하지 않는다.

타이머/rAF는 UI 응답성의 대리 지표이며 실제 표시 FPS·입력 지연 측정은 아니다. Long Tasks 관측 방식은 이전 보고서와 같다. 출력 중 실제 브러시 입력·시작 시점 스냅샷 유지도 UI로 검사했다.

## 검증

lint·프로덕션 빌드 통과, 빌드 경고 0건. 관련 브라우저 검사 **73개** 통과:

- 기존 출력 픽셀·모든 배율·취소 후 재출력 9개.
- 무작위 3개 레이어에서 PNG/JPG/WebP × 4배율의 **이전 Worker 대비 픽셀 일치 및 256타일 캐시 한도** 12개.
- Worker 종료·출력 중 편집·취소·fallback·실패 처리 7개.
- 이미지 UI 22개, 프로덕션 편집 8개, 대형 맵 15개.

무작위 검사의 25%·12.5% 축소에서는 기존 Worker와 Worker 도입 전 메인 스레드 출력 사이에도 샘플링 차이가 있었다. 이번 변경은 실제 이전 Worker의 결과를 그대로 보존한다. 대표 fixture는 이전 메인 스레드와도 모든 배율이 일치한다. 관련 없는 저장·Rust 커널 구현은 변경하지 않았다.

## 재현

이미지 비교에는 Rust 설치가 필요 없다. Git 이력의 `1870f26`이 로컬에 있어야 한다. 테스트 전용 브라우저를 사용한다.

```sh
yarn lint
yarn build
node scripts/build-performance-harness.cjs --before
node scripts/build-performance-harness.cjs
python -m http.server 8082 --bind 127.0.0.1 --directory dist
```

별도 터미널:

```sh
npx --yes @playwright/cli -s=image-bench open http://127.0.0.1:8082/
npx --yes @playwright/cli -s=image-bench run-code --filename scripts/export-performance.pw
npx --yes @playwright/cli -s=image-bench run-code --filename scripts/worker-pixels.pw
npx --yes @playwright/cli -s=image-bench run-code --filename scripts/worker-export-smoke.pw
npx --yes @playwright/cli -s=image-bench run-code --filename scripts/image-export-smoke.pw
npx --yes @playwright/cli -s=image-bench close
```

성능 측정은 다른 테스트와 동시에 실행하지 않는다. 비교 도구는 `dist/`에 추가되므로 배포 전 `yarn build`로 다시 생성한다. 브라우저 코덱, 특히 WebP 인코딩은 여전히 주요 비용이다. 품질을 낮추거나 새 인코더 의존성을 도입하지 않았다. 모바일·Firefox·Safari·GPU 및 브라우저 전체 메모리는 이번에도 측정하지 않았다.
