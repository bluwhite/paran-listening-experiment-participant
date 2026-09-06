# 파란 청취 실험 도구 — 참가자용

이 저장소는 **파란 청취 실험 도구의 참가자 전용 GitHub Pages**입니다.

## 포함 기능

- 참가자 번호 입력
- 실험 프로젝트 열기
- 프로젝트의 `*_experiment.json` 읽기
- 로컬 음성 파일 확인
- 새 실험 시작 시 문제 순서 무작위화
- 첫 음성 듣기
- 문제 다시 듣기
- 하나 전으로 올라가기
- 응답 선택 즉시 다음 음성 재생
- 인식 불가 응답
- 진행 상태 자동 저장
- 이어서 하기
- 처음부터 다시 시작 시 새 랜덤 순서
- 실험 완료 후 결과 JSON 저장

## 포함하지 않는 기능

- 실험 설계
- 정답
- master.json 처리
- 결과 통계
- Excel 분석

참가자 웹페이지에는 **정답 정보가 포함되지 않습니다.**

## 프로젝트 폴더 예

```text
vot_2026/
├─ vot_2026_experiment.json
├─ F01.wav
├─ F02.wav
├─ F03.wav
└─ ...
```

참가자는 웹페이지에서 이 프로젝트 폴더를 엽니다.

## GitHub Pages 설정

저장소 이름 예:

`paran-listening-experiment-participant`

GitHub에서:

- Settings → Pages
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

배포 후 주소 예:

`https://사용자명.github.io/paran-listening-experiment-participant/`

## 개인정보/파일 처리

음성 파일은 참가자의 컴퓨터에서 로컬로 읽습니다.
음성 파일 자체는 GitHub Pages나 별도 서버로 업로드되지 않습니다.
참가자가 설계자에게 전달하는 것은 실험 완료 후 생성되는 결과 JSON입니다.

## v0.7 아이콘 적용

- 브라우저 탭 favicon
- 모바일 홈 화면용 Apple Touch Icon
- PWA/Web App 아이콘 192px / 512px
- 프로그램 상단 로고
- `site.webmanifest` 포함

