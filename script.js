// script.js

// DOM 요소 참조
const namesFileInput = document.getElementById("namesFile");
const preferredNamesFileInput = document.getElementById("preferredNamesFile");
const loadCandidatesBtn = document.getElementById("loadCandidatesBtn");
const drawBtn = document.getElementById("drawBtn");
const winnerP = document.getElementById("winner");
const candidateListDiv = document.getElementById("candidateList"); // 명단 목록을 표시할 div

// 파일 이름 표시를 위한 요소 참조
const namesFileNameDisplay = document.getElementById("namesFileNameDisplay");
const preferredNamesFileNameDisplay = document.getElementById("preferredNamesFileNameDisplay");

// 전역 변수
let candidates = []; // {name, preferred (boolean)}

// 파일 입력 변경 이벤트 리스너 (파일 이름 표시용)
namesFileInput.addEventListener('change', (event) => {
    namesFileNameDisplay.textContent = event.target.files[0] ? event.target.files[0].name : '선택된 파일 없음';
});

preferredNamesFileInput.addEventListener('change', (event) => {
    preferredNamesFileNameDisplay.textContent = event.target.files[0] ? event.target.files[0].name : '선택된 파일 없음';
});

// 파일을 읽어 내용을 반환하는 비동기 함수
async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(""); // 파일이 없으면 빈 문자열 반환
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

// 명단 불러오기 버튼 클릭 이벤트 리스너
loadCandidatesBtn.addEventListener("click", async () => {
    const mainFile = namesFileInput.files[0];
    if (!mainFile) {
        alert("전체 명단 파일을 선택해주세요!");
        return;
    }

    try {
        // 전체 명단 파일 읽기
        const rawNames = await readFileContent(mainFile);
        const names = rawNames
            .split("\n")
            .map((name) => name.trim())
            .filter((name) => name !== "");

        if (names.length === 0) {
            alert("선택된 파일에 유효한 이름이 없습니다.");
            return;
        }

        // 스친 명단 파일 읽기 (선택 사항)
        const preferredFile = preferredNamesFileInput.files[0];
        let preferredNames = [];
        if (preferredFile) {
            const rawPreferredNames = await readFileContent(preferredFile);
            preferredNames = rawPreferredNames
                .split("\n")
                .map((name) => name.trim())
                .filter((name) => name !== "");
        }

        // 후보자 배열 생성: 이름과 스친 여부 포함
        candidates = names.map((name) => ({
            name,
            preferred: preferredNames.includes(name), // 스친 명단에 포함되면 true
        }));

        // 명단 목록 화면에 표시
        displayCandidateList(candidates);

        // 뽑기 시작 버튼 활성화 및 당첨자 텍스트 초기화
        drawBtn.disabled = false;
        winnerP.textContent = "명단을 불러왔습니다. '뽑기 시작' 버튼을 눌러주세요.";

    } catch (error) {
        alert("파일을 읽는 도중 오류가 발생했습니다: " + error.message);
        console.error("파일 읽기 오류:", error);
    }
});

// 명단 목록을 화면에 표시하는 함수
function displayCandidateList(list) {
    candidateListDiv.innerHTML = ""; // 기존 목록 초기화

    if (list.length === 0) {
        const p = document.createElement("p");
        p.textContent = "표시할 명단이 없습니다.";
        candidateListDiv.appendChild(p);
        return;
    }

    list.forEach(candidate => {
        const div = document.createElement("div");
        div.classList.add("candidate-item");
        
        // 이름 스팬을 먼저 추가
        const nameSpan = document.createElement("span");
        nameSpan.textContent = candidate.name;
        div.appendChild(nameSpan);

        // 스친 명단이면 하트 스팬을 이름 뒤에 추가 (오른쪽에 위치)
        if (candidate.preferred) {
            const span = document.createElement("span");
            span.classList.add("preferred-indicator");
            span.textContent = "💙"; // 파란색 하트 이모지
            div.appendChild(span);
        }
        
        candidateListDiv.appendChild(div);
    });
}


// ⭐⭐⭐ 가중치 기반으로 무작위 당첨자를 뽑는 함수 (수정됨) ⭐⭐⭐
function pickWeightedRandom(arr) {
    if (arr.length === 0) {
        return null;
    }

    const totalCandidatesCount = arr.length;
    const preferredCandidatesCount = arr.filter(c => c.preferred).length;

    // 스친 명단 인원 수가 0이거나 전체 명단 인원 수가 0이면 가중치 없이 1:1로 처리
    if (preferredCandidatesCount === 0 || totalCandidatesCount === 0) {
        const randomIndex = Math.floor(Math.random() * arr.length);
        return arr[randomIndex].name;
    }

    // 가중치 계산: (전체 명단 인원 수 / 스친 명단 인원 수)를 기준으로 가중치 비율을 정함
    // 최소 가중치 비율을 1로 설정하여 일반 후보보다 항상 높게 유지 (나누기 0 방지)
    const weightFactor = Math.max(1, Math.floor(totalCandidatesCount / preferredCandidatesCount));
    
    // 예를 들어, 전체 100명, 스친 10명 -> weightFactor = 10
    // 일반 후보 가중치 1
    // 스친 후보 가중치 10

    // 만약 스친 명단이 전체 명단보다 많거나 같으면 (비율이 1이하)
    // 최소한의 가중치 차이를 두기 위해 스친 후보에 2배의 가중치 부여 (원하면 이 값 조정 가능)
    const weightForPreferred = preferredCandidatesCount === 0 ? 1 : weightFactor; // 0으로 나누는 것 방지
    const weightForOthers = 1; // 일반 후보의 가중치

    const totalWeight = arr.reduce(
        (sum, c) => sum + (c.preferred ? weightForPreferred : weightForOthers),
        0
    );
    let random = Math.random() * totalWeight;

    for (const c of arr) {
        const w = c.preferred ? weightForPreferred : weightForOthers;
        if (random < w) {
            return c.name;
        }
        random -= w;
    }
    return null; // 모든 후보자를 순회했지만 당첨자를 찾지 못한 경우 (거의 발생하지 않음)
}

// 뽑기 시작 버튼 클릭 이벤트 리스너
drawBtn.addEventListener("click", () => {
    if (candidates.length === 0) {
        alert("먼저 명단을 불러오세요.");
        return;
    }

    // 당첨자 선정 (가중치 적용)
    const finalWinnerName = pickWeightedRandom(candidates);
    if (finalWinnerName) {
        winnerP.textContent = `🎉 당첨자: ${finalWinnerName}`;
    } else {
        winnerP.textContent = `당첨자를 뽑을 수 없습니다.`;
    }
});
