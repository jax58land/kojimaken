// DOM要素の取得
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const retryButtonClear = document.getElementById("retryButtonClear");
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");
const battleScreen = document.getElementById("battleScreen");
const gameDiv = document.getElementById("game");
const gameOverScreen = document.getElementById("gameOverScreen");
const clearScreen = document.getElementById("clearScreen");
const playerHPElement = document.getElementById("playerHP");
const enemyHPElement = document.getElementById("enemyHP");
const battleLog = document.getElementById("battleEvents");
const playerImage = document.getElementById("playerImage");
const enemyImage = document.getElementById("enemyImage");
const playerNameElement = document.getElementById("playerName");
const enemyNameElement = document.getElementById("enemyName");
const bgm = document.getElementById("bgm");

// 移動用ボタンの取得
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

// キャンバス設定
gameCanvas.width = 600;
gameCanvas.height = 600;

// ゲーム状態
let player = {
  x: 3,
  y: 3,
  hp: 100,
  ap: 10,
  dungeonImg: "kozzy1.png",
  battleImg: "kozzy2.png",
};

let currentEnemy = null;

const enemies = [
  { x: 1, y: 1, hp: 50, defeated: false, dungeonImg: "kento1.png", battleImg: "kento2.png", name: "長尾謙杜" },
  { x: 5, y: 5, hp: 50, defeated: false, dungeonImg: "sumi1.png", battleImg: "sumi2.png", name: "角紳太郎" },
];

const boss = {
  x: null,
  y: null,
  hp: 100,
  defeated: false,
  dungeonImg: "jesee1.png",
  battleImg: "jesee2.png",
  name: "ミスターズドン",
};

// プレイヤーのスキル
const playerSkills = [
  { name: "考えてる時に時に急かしてくる奴、黙れ", damage: () => Math.floor(Math.random() * 15) + 10 },
  { name: "偶然を運命にしたらいいやんけ", damage: () => Math.floor(Math.random() * 20) + 5 },
  { name: "生きてる理由なんて「死にたくない」それだけで十分や", damage: () => Math.floor(Math.random() * 25) + 5 },
  { name: "富士山を近くで見てみ？めっちゃでかいで。", damage: () => Math.floor(Math.random() * 10) + 15 },
  { name: "これぜーんぶうそ〜", damage: () => 50, isUltimate: true }, // 必殺技
];

// イベントリスナー
startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", resetGame);
retryButtonClear.addEventListener("click", resetGame);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") movePlayer(0, -1);
  if (e.key === "ArrowDown") movePlayer(0, 1);
  if (e.key === "ArrowLeft") movePlayer(-1, 0);
  if (e.key === "ArrowRight") movePlayer(1, 0);
});

// 移動用ボタンのイベントリスナー（タッチ対応）
upButton.addEventListener("click", () => movePlayer(0, -1));
downButton.addEventListener("click", () => movePlayer(0, 1));
leftButton.addEventListener("click", () => movePlayer(-1, 0));
rightButton.addEventListener("click", () => movePlayer(1, 0));

upButton.addEventListener("touchstart", () => movePlayer(0, -1));
downButton.addEventListener("touchstart", () => movePlayer(0, 1));
leftButton.addEventListener("touchstart", () => movePlayer(-1, 0));
rightButton.addEventListener("touchstart", () => movePlayer(1, 0));

// 必殺技ボタンの表示条件を確認
function checkUltimateSkill() {
  const ultimateSkill = playerSkills.find((skill) => skill.isUltimate);
  const actionsContainer = document.getElementById("playerActions");
  const ultimateButtonExists = Array.from(actionsContainer.children).some(
    (child) => child.textContent === ultimateSkill.name
  );

  if (player.hp <= 20 && !ultimateButtonExists) {
    const button = document.createElement("button");
    button.classList.add("actionButton");
    button.textContent = ultimateSkill.name;
    button.addEventListener("click", () => playerAttack(playerSkills.indexOf(ultimateSkill)));
    actionsContainer.appendChild(button);
  }
}

// ゲーム開始
function startGame() {
  document.getElementById("startScreen").style.display = "none";
  gameDiv.style.display = "block";

  // BGM再生
  if (bgm.paused) {
    bgm.volume = 0.2; // 音量を1/5に設定
    bgm.play().catch((error) => {
      console.error("BGMの再生に失敗しました:", error);
    });
  }

  drawGrid();
}

// ゲームリセット
function resetGame() {
  location.reload();
}

// グリッド描画
function drawGrid() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // プレイヤー描画
  drawCharacter(player.x, player.y, player.dungeonImg);

  // 敵キャラ描画
  enemies.forEach((enemy) => {
    if (!enemy.defeated) {
      drawCharacter(enemy.x, enemy.y, enemy.dungeonImg);
    }
  });

  // 魔王描画
  if (!boss.defeated && boss.x !== null && boss.y !== null) {
    drawCharacter(boss.x, boss.y, boss.dungeonImg);
  }
}

// キャラクター描画
function drawCharacter(x, y, imgSrc) {
  const img = new Image();
  img.src = imgSrc;
  img.onload = () => ctx.drawImage(img, x * 100, y * 100, 80, 80);
}

// プレイヤー移動
function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  if (newX < 0 || newX > 5 || newY < 0 || newY > 5) return;

  player.x = newX;
  player.y = newY;

  const encounter = checkEncounter();
  if (encounter) {
    startBattle(encounter);
  } else {
    drawGrid();
  }
}

// 移動用ボタンのイベントリスナー（タッチとクリック対応）
function setupMovementButtons() {
  const handleMove = (dx, dy) => movePlayer(dx, dy);

  const bindButton = (button, dx, dy) => {
    button.addEventListener("click", () => handleMove(dx, dy));
    button.addEventListener("touchstart", (e) => {
      e.preventDefault(); // タッチイベントのデフォルト動作を防止
      handleMove(dx, dy);
    });
  };

  bindButton(upButton, 0, -1);
  bindButton(downButton, 0, 1);
  bindButton(leftButton, -1, 0);
  bindButton(rightButton, 1, 0);
}

// ボタンのイベントリスナーを設定
setupMovementButtons();


// 敵または魔王との遭遇チェック
function checkEncounter() {
  const enemy = enemies.find((e) => e.x === player.x && e.y === player.y && !e.defeated);
  if (enemy) return enemy;

  if (!boss.defeated && boss.x === player.x && boss.y === player.y) return boss;

  return null;
}

// バトル開始
function startBattle(enemy) {
  currentEnemy = enemy;
  battleScreen.style.display = "block";
  gameDiv.style.display = "none";

  playerImage.src = player.battleImg;
  enemyImage.src = enemy.battleImg;
  playerHPElement.textContent = player.hp;
  enemyHPElement.textContent = currentEnemy.hp;
  playerNameElement.textContent = "小島健";
  enemyNameElement.textContent = enemy.name;

  resetBattleLog();
  updateBattleLog(`${enemy.name}が現れた！`, "red");
  createSkillButtons();
}

// バトルログリセット
function resetBattleLog() {
  battleLog.innerHTML = "";
}

// スキルボタン作成
function createSkillButtons() {
  const actionsContainer = document.getElementById("playerActions");
  actionsContainer.innerHTML = "";

  playerSkills.forEach((skill, index) => {
    if (skill.isUltimate && player.hp > 50) return;
    const button = document.createElement("button");
    button.classList.add("actionButton");
    button.textContent = skill.name;
    button.addEventListener("click", () => playerAttack(index));
    actionsContainer.appendChild(button);
  });
}

// バトルログ更新
function updateBattleLog(message, color) {
  const logMessage = document.createElement("p");
  logMessage.textContent = message;
  logMessage.style.color = color;
  battleLog.appendChild(logMessage);
}

// プレイヤー攻撃
function playerAttack(index) {
  const skill = playerSkills[index];
  const damage = skill.damage();
  currentEnemy.hp = Math.max(0, currentEnemy.hp - damage);
  updateBattleLog(`こじけんの「${skill.name}」！${currentEnemy.name}に${damage}ダメージ！`, "black");
  flashImage(enemyImage);
  updateBattleScreen();

  if (currentEnemy.hp <= 0) {
    currentEnemy.defeated = true;
    handleBattleWin();
  } else {
    enemyAttack();
  }
}

// 敵の攻撃
function enemyAttack() {
  const damage = Math.floor(Math.random() * 15) + 5;
  player.hp = Math.max(0, player.hp - damage);
  updateBattleLog(`${currentEnemy.name}の攻撃！こじけんに${damage}ダメージ！`, "red");
  flashImage(playerImage);
  updateBattleScreen();

  if (player.hp <= 0) {
    handleGameOver();
  } else {
    checkUltimateSkill();
  }
}

// キャラクター画像点滅
function flashImage(imageElement) {
  imageElement.classList.add("damage");
  setTimeout(() => imageElement.classList.remove("damage"), 300);
}

// バトル画面更新
function updateBattleScreen() {
  playerHPElement.textContent = player.hp;
  enemyHPElement.textContent = currentEnemy.hp;
}

// バトル勝利処理
function handleBattleWin() {
  updateBattleLog(`${currentEnemy.name}を倒した！`, "black");
  setTimeout(() => {
    battleScreen.style.display = "none";

    if (enemies.every((e) => e.defeated) && boss.x === null) {
      boss.x = 3;
      boss.y = 5;
      updateBattleLog("ミスターズドンが出現した！", "red");
    }

    if (currentEnemy === boss) {
      handleGameClear();
    } else {
      gameDiv.style.display = "block";
    }

    drawGrid();
  }, 1500);
}

// ゲームオーバー処理
function handleGameOver() {
  updateBattleLog("ゲームオーバー！", "red");
  setTimeout(() => {
    battleScreen.style.display = "none";
    gameOverScreen.style.display = "flex";
  }, 1500);
}

// ゲームクリア処理
function handleGameClear() {
  updateBattleLog("ゲームクリア！", "black");
  setTimeout(() => {
    battleScreen.style.display = "none";
    clearScreen.style.display = "flex";
  }, 1500);
}
