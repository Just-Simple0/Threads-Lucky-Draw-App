// script.js

// DOM 요소 참조
const namesFileInput = document.getElementById("namesFile");
const preferredNamesFileInput = document.getElementById("preferredNamesFile");
const loadCandidatesBtn = document.getElementById("loadCandidatesBtn");
const drawBtn = document.getElementById("drawBtn");
const winnerP = document.getElementById("winner");
const weightP = document.getElementById("weight");
const candidateListDiv = document.getElementById("candidateList"); // 명단 목록을 표시할 div
const winnerCountInput = document.getElementById("winnerCount");

// 파일 이름 표시를 위한 요소 참조
const namesFileNameDisplay = document.getElementById("namesFileNameDisplay");
const preferredNamesFileNameDisplay = document.getElementById(
  "preferredNamesFileNameDisplay"
);

// 전역 변수
let candidates = []; // {name, preferred (boolean)}

// 파일 입력 변경 이벤트 리스너 (파일 이름 표시용)
namesFileInput.addEventListener("change", (event) => {
  namesFileNameDisplay.textContent = event.target.files[0]
    ? event.target.files[0].name
    : "선택된 파일 없음";
});

preferredNamesFileInput.addEventListener("change", (event) => {
  preferredNamesFileNameDisplay.textContent = event.target.files[0]
    ? event.target.files[0].name
    : "선택된 파일 없음";
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

    // 뽑기 시작 버튼 활성화 및 가중치 정보 표시
    drawBtn.disabled = false;

    const totalCandidatesCount = candidates.length;
    const preferredCandidatesCount = candidates.filter(
      (c) => c.preferred
    ).length;

    let weightFactor = 1;
    if (preferredCandidatesCount > 0) {
      weightFactor =
        preferredCandidatesCount >= totalCandidatesCount / 5
          ? 5
          : Math.max(
              1,
              Math.floor(totalCandidatesCount / preferredCandidatesCount)
            );
    }

    winnerP.textContent = "명단을 불러왔습니다. '뽑기 시작' 버튼을 눌러주세요.";
    weightP.textContent = `현재 가중치 비율 : 💙맞팔 ${weightFactor}배 / 일반 1배`;
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

  list.forEach((candidate) => {
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

function animateRoulette(
  finalName,
  allCandidates,
  durationMs = 3000,
  roundLabel = ""
) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("rouletteOverlay");
    const nameEl = document.getElementById("rouletteName");
    const hintEl = document.querySelector(".roulette-hint");

    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");

    // 현재 몇 번째 추첨인지 안내 (예: "1번째 당첨자 추첨 중...")
    if (roundLabel) {
      hintEl.textContent = roundLabel;
    }

    const namesPool = allCandidates.map((c) => c.name);
    const total = Math.max(1500, durationMs);
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    let lastIndex = -1;

    const spinOnce = () => {
      sound.tick();
      let idx;
      do {
        idx = Math.floor(Math.random() * namesPool.length);
      } while (namesPool.length > 1 && idx === lastIndex);
      lastIndex = idx;
      nameEl.textContent = namesPool[idx] || "…";
    };

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / total);
      const eased = easeOut(t);
      const interval = 32 + (200 - 32) * eased;

      spinOnce();

      if (elapsed < total) {
        setTimeout(() => requestAnimationFrame(tick), interval);
      } else {
        // 결과 고정
        nameEl.textContent = finalName;
        sound.win();
        launchConfetti();

        // 당첨자 이름을 확인하고 축하할 시간을 준 뒤 다음으로 넘어감
        setTimeout(() => {
          overlay.classList.add("hidden");
          overlay.setAttribute("aria-hidden", "true");
          resolve(); // 애니메이션 완료를 알림
        }, 1200);
      }
    }
    requestAnimationFrame(tick);
  });
}

// === Sound Engine (Web Audio API) ===
class Sound {
  constructor() {
    this.ctx = null;
    this.active = false;
    this.tickOsc = null;
    this.lastTickAt = 0;
  }
  _ensure() {
    if (!this.ctx)
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // 짧은 '틱' 사운드
  tick(volume = 0.06, freq = 880, dur = 0.03) {
    const now = performance.now();
    // 너무 촘촘하면 소리 겹쳐서 지저분 → 최소 간격 40ms
    if (now - this.lastTickAt < 40) return;
    this.lastTickAt = now;

    this._ensure();
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }
  // 당첨 팬페어 (간단한 코드: 도-솔-도)
  win() {
    this._ensure();
    const ctx = this.ctx;
    const notes = [523.25, 784, 1046.5]; // C5, G5, C6
    const now = ctx.currentTime;
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.28);
      o.connect(g).connect(ctx.destination);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 0.3);
    });
  }
}
const sound = new Sound();

// === Confetti (vanilla canvas) ===
function launchConfetti({ duration = 2200, particleCount = 180 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "1000";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // 파티클 초기화
  const colors = [
    "#f87171",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
    "#a78bfa",
    "#f472b6",
  ];
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);

  const particles = Array.from({ length: particleCount }, () => {
    const angle = rand(-Math.PI, 0); // 위로 튀게
    const speed = rand(3.2, 6.5);
    return {
      x: (canvas.width / dpr) * 0.5 + rand(-40, 40),
      y: canvas.height / dpr + rand(0, 20),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      g: rand(0.06, 0.12),
      w: rand(6, 12),
      h: rand(8, 16),
      r: rand(0, TAU),
      vr: rand(-0.2, 0.2),
      color: colors[(Math.random() * colors.length) | 0],
      alpha: 1,
      decay: rand(0.002, 0.005),
    };
  });

  let start = null;
  function frame(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      // 업데이트
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.r += p.vr;
      p.alpha = Math.max(0, p.alpha - p.decay);

      // 드로우 (회전 사각형)
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    // 종료 조건: 시간 경과 또는 모두 소멸
    const alive = particles.some(
      (p) => p.alpha > 0 && p.y < canvas.height / dpr + 50
    );
    if (elapsed < duration && alive) {
      requestAnimationFrame(frame);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    window.removeEventListener("resize", resize);
    canvas.remove();
  }

  requestAnimationFrame(frame);
}

// ⭐⭐⭐ 가중치 기반으로 무작위 당첨자를 뽑는 함수 (수정됨) ⭐⭐⭐
function pickWeightedRandom(arr) {
  if (arr.length === 0) {
    return null;
  }

  const totalCandidatesCount = arr.length;
  const preferredCandidatesCount = arr.filter((c) => c.preferred).length;

  // 스친 명단 인원 수가 0이거나 전체 명단 인원 수가 0이면 가중치 없이 1:1로 처리
  if (preferredCandidatesCount === 0 || totalCandidatesCount === 0) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex].name;
  }

  // 가중치 계산:
  // 1) 스친이 '과반(>= 50%)'이면 최소 5배 부여
  // 2) 그 외에는 (전체 / 스친) 비율을 적용하며, 하한은 1
  const weightFactor =
    preferredCandidatesCount >= totalCandidatesCount / 5
      ? 5
      : Math.max(
          1,
          Math.floor(totalCandidatesCount / preferredCandidatesCount)
        );

  // 일반 후보는 1, 스친 후보는 위에서 계산한 비율(또는 2배)
  const weightForPreferred = weightFactor;
  const weightForOthers = 1;

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

// 뽑기 시작 버튼 클릭 이벤트 리스너 (룰렛 애니메이션 포함)
drawBtn.addEventListener("click", async () => {
  if (candidates.length === 0) {
    alert("먼저 명단을 불러오세요.");
    return;
  }

  const count = parseInt(winnerCountInput.value) || 1;
  if (count > candidates.length) {
    alert(`후보자(${candidates.length}명)보다 많은 인원을 뽑을 수 없습니다.`);
    return;
  }

  drawBtn.disabled = true;
  winnerP.textContent = "추첨을 시작합니다...";

  let remainingCandidates = [...candidates]; // 원본 보존을 위해 복사
  let finalWinners = [];

  // 입력한 인원수만큼 반복문 실행
  for (let i = 0; i < count; i++) {
    const winnerName = pickWeightedRandom(remainingCandidates);

    if (winnerName) {
      // 룰렛 애니메이션이 끝날 때까지 대기
      await animateRoulette(
        winnerName,
        remainingCandidates,
        2500,
        `${i + 1}번째 당첨자 추첨 중...`
      );

      finalWinners.push(winnerName);

      // 중복 방지를 위해 당첨자를 명단에서 제외
      remainingCandidates = remainingCandidates.filter(
        (c) => c.name !== winnerName
      );

      // 화면에 현재까지의 당첨자 명단 표시
      winnerP.textContent = `🎉 당첨자: ${finalWinners.join(", ")}`;

      // 팝 애니메이션 재적용
      winnerP.classList.remove("pop");
      void winnerP.offsetWidth;
      winnerP.classList.add("pop");
    }
  }

  drawBtn.disabled = false;
});
