# 이미지 Worker와 Rust/WASM 비교

2026-10-17. **이미지 Worker는 적용하고, Rust는 실험 빌드로 보관한다.** 일반 `yarn build`는 Rust 설치나 WASM 파일을 요구하지 않는다. 별도 백엔드는 필요 없으며 기존 정적 HTTP 호스팅을 사용한다. 원본 측정값은 [worker-wasm-results.json](worker-wasm-results.json)에 있다.

이 문서는 최초 Worker 도입 결과다. 타일 캐시와 불필요한 대기 제거를 적용한 최신 비교는 [이미지 출력 추가 최적화](IMAGE_EXPORT_PERFORMANCE.md)를 참고한다.

## 적용 범위

- [exportImage.js](../src/utils/exportImage.js)가 출력 시작 시 세 레이어를 독립적인 `Uint32Array`로 복사한다. 버퍼와 `ImageBitmap`을 Worker로 이전하고 [imageExport.worker.js](../src/workers/imageExport.worker.js)가 출력 크기의 OffscreenCanvas에 합성·인코딩한다.
- PNG 투명 배경, JPG 배경색·품질 95%, WebP 품질 95%, 배율과 기존 출력 한도를 유지한다. 출력 중 그리기는 가능하며 이미지에는 시작 시점의 타일만 포함한다.
- 축소 시 Chromium의 HTMLImageElement와 ImageBitmap 샘플링 차이를 피하기 위해 작은 원본 아틀라스를 타일 단위로 먼저 축소한다. 이 준비 단계는 메인 스레드에서 약 8ms마다 양보한다. 전체 맵 캔버스는 메인 스레드에 만들지 않는다.
- 완료·오류·취소 시 Worker를 종료하고 이미지 자원을 해제한다. 필수 API가 없으면 기존처럼 메인 스레드에서 나누어 출력한다. 실행 중 Worker 오류는 실패로 알린다.
- [OffscreenCanvas 문서](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)의 Worker 렌더링 기능을 사용하며 새 런타임 의존성은 추가하지 않았다.

## 이미지 출력: 속도와 응답성

Windows / Ryzen 7 7700 / 논리 CPU 16개 / RAM 약 31GiB / Node 22.22.2 / Playwright CLI Chromium / 1920×1080. 프로덕션 빌드 `d0ae56e0b990c8ec`, CPU·네트워크 제한 없음. 256×256 혼합 타일·3개 레이어를 50% PNG(4096×4096)로 출력했다. 준비 1회 후 기존/Worker 순서를 교차하며 각각 5회 측정했다.

기존 구현은 `933521a`의 출력·타일 합성 코드를 [legacyImageExport.js](../experiments/legacyImageExport.js)에 보존했다. 총 시간에는 맵 복사, 아틀라스 준비, Worker 생성·전송, 합성, 인코딩, Blob 반환이 포함된다. 파일 다운로드·디스크 기록은 제외한다. 타일 자산은 미리 로드한다.

| 측정 | 기존 메인 스레드 | Worker |
| --- | --- | --- |
| 총 출력 시간 5회, ms | 320.2 / 303.5 / 298.0 / 314.8 / 307.8 | 308.7 / 318.0 / 315.7 / 316.9 / 313.9 |
| 총 시간 중앙값 | 307.8ms | 315.7ms (**2.6% 증가**) |
| 회차별 최대 타이머 지연 범위 | 62.9–90.0ms | 1.0–1.8ms |
| 회차별 최대 rAF 간격 범위 | 64.3–89.4ms | 7.2–10.7ms |
| 50ms 이상 메인 스레드 Long Task | 5건, 68–94ms | 0건 |

타이머 지연은 8ms interval의 실제 간격에서 8ms를 뺀 값이다. rAF 간격은 연속 콜백 간격이며 GPU 표시 완료·실제 입력 지연을 뜻하지 않는다. Long Tasks는 출력 구간과 관측 전달을 위한 직후 60ms에 수집한다. Worker 내부 작업 시간은 메인 스레드 Long Task에 포함되지 않는다.

**출력 시간 단축은 확인되지 않았지만 UI 응답성 개선은 뚜렷해 Worker를 채택했다.** 별도 UI 검사에서 출력 도중 브러시 입력이 반영되고 출력 스냅샷은 유지되는 것도 확인했다.

## Rust 시제품과 채택 판단

[Rust 커널](../rust/tile-kernel/src/lib.rs)은 연결 영역 채우기와 오토타일 ID 계산만 구현한다. 외부 crate와 wasm-bindgen 없이 선형 메모리의 `u32` 버퍼를 사용한다. [JS 어댑터](../experiments/wasmKernel.js)는 할당·입력 복사, 계산, 출력 복사를 계측하고 매번 버퍼를 해제한다. UI·저장·그리기·이력은 JS에 남긴다.

독립 비교는 3회 준비 후 5회, JS/WASM 교차 순서다. **아래 시간에는 데이터 변환·복사·할당·해제·계산·변경 셀 적용·이력 pack이 포함된다.** fixture 생성과 결과 비교, 화면 렌더링은 제외한다. 첫 WASM fetch·컴파일·인스턴스 생성 9.2ms는 별도로 기록했다.

| 작업 | JS 중앙값 | WASM 중앙값 |
| --- | --- | --- |
| 50×50 단색 채우기 | 0.2ms | 0.2ms |
| 256×256 빈 영역 채우기 | 4.3ms | 4.3ms |
| 256×256 오토타일 영역 채우기 탐색·적용 | 3.9ms | 3.3ms |
| 256×256 밀집 오토타일 ID 계산·적용 | 7.6ms | 3.5ms |
| 512×512 밀집 오토타일 ID 계산·적용 | 38.1ms | 22.8ms |

짧은 0.0–0.1ms 측정은 브라우저 타이머 해상도 영향을 받으므로 속도비를 계산하지 않는다. 512×512는 한계 실험이며 지원 보장 범위가 아니다.

실제 편집기에도 큰 오토타일 갱신만 교체한 [별도 빌드](../scripts/build-wasm-experiment.cjs)를 만들었다. 256×256 전체 오토타일 그룹 변경을 JS/WASM/WASM/JS 순서로 각각 준비 3회+측정 5회 수행했다. 포인터 이벤트 처리에 들어가는 JS 채우기, 변경 적용, 이웃 집합 생성, WASM 복사·계산, 캐시 무효화, 이력 pack을 포함하며 다음 렌더 프레임은 제외한다. 최종 10개 표본 중앙값은 **JS 19.3ms / WASM 17.1ms**, 약 2.2ms 개선이다. 이전 교차 실행은 20.9ms / 19.1ms였고 WASM 최대값이 더 컸다. 두 실행의 원본을 함께 보관한다.

밀집 오토타일 커널의 이득은 확인했지만 일반 채우기는 이득이 작고, 실제 편집에서 얻는 절대 시간은 약 2ms로 표본·환경에 민감하다. 이미 목표 시간 안이므로 **일반 배포는 JS를 유지**한다. Rust를 다시 채택하려면 다른 맵·PC에서도 전체 편집 지연과 긴 지연 구간의 반복 개선을 확인한다. 실험 빌드는 4,096셀 이상·256×256 이하 오토타일 배치에만 WASM을 사용하고 로딩 실패 시 JS로 돌아간다. Rust 채우기는 독립 비교에만 사용한다.

## 재현

일반 앱은 기존 `yarn build`로 충분하다. 실험에는 Rust와 `wasm32-unknown-unknown` 표적이 필요하다. 검증한 Rust는 1.94.0이다.

```sh
rustup target add wasm32-unknown-unknown
node scripts/build-wasm.cjs
cargo test --manifest-path rust/tile-kernel/Cargo.toml --offline
node scripts/wasm-check.mjs
yarn build
node scripts/build-performance-harness.cjs
python -m http.server 8082 --bind 127.0.0.1 --directory dist
```

별도 터미널:

```sh
npx --yes @playwright/cli -s=worker-bench open http://127.0.0.1:8082/
npx --yes @playwright/cli -s=worker-bench run-code --filename scripts/worker-wasm-benchmark.pw
npx --yes @playwright/cli -s=worker-bench run-code --filename scripts/worker-export-smoke.pw
npx --yes @playwright/cli -s=worker-bench close
```

실제 편집기 비교는 따로 실행한다:

```sh
node scripts/build-wasm-experiment.cjs
python -m http.server 8083 --bind 127.0.0.1 --directory output/wasm-editor
# 별도 터미널
npx --yes @playwright/cli -s=wasm-editor open http://127.0.0.1:8083/
npx --yes @playwright/cli -s=wasm-editor run-code --filename scripts/wasm-editor-smoke.pw
npx --yes @playwright/cli -s=wasm-editor close
```

벤치마크를 동시에 실행하지 않는다. 전용 브라우저 세션을 사용하며 편집기 비교는 IndexedDB를 임시 변경하고 복원한다. 비교 도구는 `dist/`에 실험 파일을 추가하므로 **배포 전 `yarn build`를 다시 실행**한다. `output/`, `dist/`, Rust `target/`과 WASM 바이너리는 커밋하지 않는다.

## 검증과 한계

- 기존 브라우저 439개 검사와 Worker UI 7개, 출력 비교·취소 9개, 실험 편집기 23개 검사 통과.
- PNG/JPG/WebP 디코딩 픽셀, PNG 모든 배율 및 4096×4096 축소 결과가 기존 구현과 일치. 출력 중 편집, 취소 후 재출력, 미지원 API fallback, Worker 실패·해제를 확인했다.
- Rust native 검사, WASM 256개 이웃 조합·100개 무작위 맵·반복 할당 메모리 안정성, 기존 Node 알고리즘·이력·캐시·맵 파일 검사 통과. lint와 일반/실험 빌드 경고 0건.
- 모바일·Firefox·Safari·GPU 및 브라우저 전체 메모리·배포 서버에서는 검증하지 않았다. 50ms 미만 응답을 모든 장치에서 보장하지 않으며 fallback 경로에는 메인 스레드 인코딩 지연이 남는다.
