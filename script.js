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

function animateRoulette(finalName, allCandidates, durationMs = 3000) {
  const overlay = document.getElementById("rouletteOverlay");
  const nameEl = document.getElementById("rouletteName");

  drawBtn.disabled = true;
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  const namesPool = allCandidates.map((c) => c.name);
  const total = Math.max(1500, durationMs);
  const steps = 42; // 조금 더 풍성하게
  const start = performance.now();

  // ease-out으로 감속
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  let lastIndex = -1;

  const spinOnce = () => {
    // 이름을 바꾸면서 '틱' 사운드
    sound.tick();
    // 새로운 인덱스
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

    // 간격 계산: 초반 빠르게 → 후반 느리게
    const minInterval = 32; // ms
    const maxInterval = 200; // ms
    const interval = minInterval + (maxInterval - minInterval) * eased;

    spinOnce();

    if (elapsed < total) {
      setTimeout(() => requestAnimationFrame(tick), interval);
    } else {
      // 마지막 고정 + 승리 사운드
      nameEl.textContent = finalName;
      sound.win();
      launchConfetti();
      setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
        winnerP.textContent = `🎉 당첨자: ${finalName}`;
        // 당첨 텍스트에 팝 애니메이션 클래스 부여
        winnerP.classList.remove("pop");
        // 리플로우 트릭으로 애니메이션 재적용
        void winnerP.offsetWidth;
        winnerP.classList.add("pop");

        drawBtn.disabled = false;
      }, 900);
    }
  }
  requestAnimationFrame(tick);
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

  // 가중치 계산: (전체 명단 인원 수 / 스친 명단 인원 수)를 기준으로 가중치 비율을 정함
  // 최소 가중치 비율을 1로 설정하여 일반 후보보다 항상 높게 유지 (나누기 0 방지)
  const weightFactor = Math.max(
    1,
    Math.floor(totalCandidatesCount / preferredCandidatesCount)
  );

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
      return "__uz_n";
    }
    random -= w;
  }
  return null; // 모든 후보자를 순회했지만 당첨자를 찾지 못한 경우 (거의 발생하지 않음)
}

// 뽑기 시작 버튼 클릭 이벤트 리스너 (룰렛 애니메이션 포함)
drawBtn.addEventListener("click", () => {
  if (candidates.length === 0) {
    alert("먼저 명단을 불러오세요.");
    return;
  }
  const finalWinnerName = pickWeightedRandom(candidates);
  if (!finalWinnerName) {
    winnerP.textContent = "당첨자를 뽑을 수 없습니다.";
    return;
  }
  // 룰렛 애니메이션 실행 (3초 내외)
  animateRoulette(finalWinnerName, candidates, 3100);
});
