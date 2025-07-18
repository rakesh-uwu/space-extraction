class UIManager {
  constructor() {
    this.elements = {
      gameTime: document.getElementById("gameTime"),
      score: document.getElementById("score"),
      currentLevel: document.getElementById("currentLevel"),
      levelProgress: document.getElementById("levelProgress"),
      playerHealth: document.getElementById("playerHealth"),
      playerLives: document.getElementById("playerLives"),
      bestTime: document.getElementById("bestTime"),
      distanceToExit: document.getElementById("distanceToExit"),
      collisionWarning: document.getElementById("collisionWarning"),
      gameOverScreen: document.getElementById("gameOverScreen"),
      successScreen: document.getElementById("successScreen"),
      pauseScreen: document.getElementById("pauseScreen"),
      levelSelectContent: document.querySelector("#levelSelect .level-content"),
      levelSelectionPanel: document.getElementById("levelSelectionPanel"),
      levelPanelTitle: document.getElementById("levelPanelTitle"),
      levelButtonsGrid: document.querySelector(".level-buttons-grid"),
      backFromLevelSelectBtn: document.getElementById("backFromLevelSelect"),
    }
    this.currentDifficulty = "normal" 
    this.setupEventListeners()
  }
  setupEventListeners() {
    document.getElementById("restartBtn").addEventListener("click", () => {
      this.hideGameOver()
      window.game.restart()
    })
    document.getElementById("mainMenuBtn").addEventListener("click", () => {
      this.hideGameOver()
      window.game.showScreen("mainMenu")
    })
    document.getElementById("nextMazeSuccessBtn").addEventListener("click", () => {
      this.hideSuccess()
      window.game.nextLevel()
    })
    document.getElementById("retryMazeBtn").addEventListener("click", () => {
      this.hideSuccess()
      window.game.restart()
    })
    document.getElementById("mainMenuSuccessBtn").addEventListener("click", () => {
      this.hideSuccess()
      window.game.showScreen("mainMenu")
    })
    document.getElementById("resumeBtn").addEventListener("click", () => {
      this.hidePause()
      window.game.resume()
    })
    document.getElementById("restartPauseBtn").addEventListener("click", () => {
      this.hidePause()
      window.game.restart()
    })
    document.getElementById("mainMenuPauseBtn").addEventListener("click", () => {
      this.hidePause()
      window.game.showScreen("mainMenu")
    })
    this.elements.backFromLevelSelectBtn.addEventListener("click", () => {
      this.hideLevelSelectionPanel()
    })
    this.elements.levelButtonsGrid.querySelectorAll(".level-num-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const level = Number.parseInt(e.target.dataset.level)
        window.game.startGame(this.currentDifficulty, level)
      })
    })
  }
  updateHUD(gameTime, score, level, bestTime, distanceToExit, nearObstacle, playerHealth, playerLives) {
    this.elements.gameTime.textContent = this.formatTime(gameTime)
    this.elements.score.textContent = score.toLocaleString()
    this.elements.currentLevel.textContent = level
    this.elements.bestTime.textContent = bestTime > 0 ? this.formatTime(bestTime) : "--:--"
    if (window.game) {
      this.elements.levelProgress.textContent = `${level} / ${window.game.maxLevel}`
    }
    this.elements.playerHealth.textContent = playerHealth
    this.elements.playerLives.textContent = playerLives
    this.elements.distanceToExit.textContent = `Distance to Exit: ${Math.floor(distanceToExit)}m`
    if (nearObstacle) {
      this.elements.collisionWarning.textContent = "⚠️ COLLISION WARNING"
      this.elements.collisionWarning.style.color = "#ff0000"
    } else {
      this.elements.collisionWarning.textContent = "Navigation Clear"
      this.elements.collisionWarning.style.color = "#00ff00"
    }
  }
  updateMinimap(ctx, player, obstacles, startPoint, exitPoint) {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, 150, 120)
    ctx.strokeStyle = "#00ffff"
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, 150, 120) 
    const scaleX = 150 / 1200
    const scaleY = 120 / 800
    for (const obstacle of obstacles) {
      const colors = {
        asteroid: "#888888",
        planet: obstacle.color,
        structure: "#666666",
        energy_field: "#ff00ff",
        moving_asteroid: "#ff6666",
        laser_grid: obstacle.active ? "#ff0000" : "#ff000030",
      }
      ctx.fillStyle = colors[obstacle.type] || "#888888"
      ctx.beginPath()
      if (obstacle.type === "laser_grid") {
        ctx.lineWidth = Math.max(1, obstacle.thickness * scaleX * 0.5)
        ctx.strokeStyle = colors[obstacle.type]
        if (obstacle.orientation === "horizontal") {
          ctx.moveTo((obstacle.x - obstacle.length / 2) * scaleX, obstacle.y * scaleY)
          ctx.lineTo((obstacle.x + obstacle.length / 2) * scaleX, obstacle.y * scaleY)
        } else {
          ctx.moveTo(obstacle.x * scaleX, (obstacle.y - obstacle.length / 2) * scaleY)
          ctx.lineTo(obstacle.x * scaleX, (obstacle.y + obstacle.length / 2) * scaleY)
        }
        ctx.stroke()
      } else {
        ctx.arc(obstacle.x * scaleX, obstacle.y * scaleY, Math.max(1, obstacle.size * scaleX * 0.5), 0, Math.PI * 2)
        ctx.fill()
      }
    }
    if (window.game && window.game.enemyManager) {
      for (const enemy of window.game.enemyManager.getEnemies()) {
        ctx.fillStyle = enemy.getTypeStats().color
        ctx.beginPath()
        ctx.arc(enemy.x * scaleX, enemy.y * scaleY, Math.max(1, enemy.size * scaleX * 0.5), 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.fillStyle = "#00ff00"
    ctx.beginPath()
    ctx.arc(startPoint.x * scaleX, startPoint.y * scaleY, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#ffff00"
    ctx.beginPath()
    ctx.arc(exitPoint.x * scaleX, exitPoint.y * scaleY, 3, 0, Math.PI * 2)
    ctx.fill()
    if (player.isAlive()) {
      ctx.fillStyle = "#00ffff"
      ctx.beginPath()
      ctx.arc(player.x * scaleX, player.y * scaleY, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  showGameOver(gameTime, score, level, difficulty, isNewRecord) {
    this.elements.gameOverScreen.classList.remove("hidden")
    document.getElementById("finalTime").textContent = this.formatTime(gameTime)
    document.getElementById("finalScore").textContent = score.toLocaleString()
    document.getElementById("finalLevel").textContent = level
    document.getElementById("finalDifficulty").textContent = difficulty
    const newRecordRow = document.getElementById("newRecordRow")
    if (isNewRecord) {
      newRecordRow.style.display = "flex"
    } else {
      newRecordRow.style.display = "none"
    }
  }
  hideGameOver() {
    this.elements.gameOverScreen.classList.add("hidden")
  }
  showSuccess(gameTime, score, timeBonus, isPerfectRun) {
    this.elements.successScreen.classList.remove("hidden")
    document.getElementById("successTime").textContent = this.formatTime(gameTime)
    document.getElementById("successScore").textContent = score.toLocaleString()
    document.getElementById("timeBonus").textContent = timeBonus.toLocaleString()
    const perfectRunRow = document.getElementById("perfectRunRow")
    if (isPerfectRun) {
      perfectRunRow.style.display = "flex"
    } else {
      perfectRunRow.style.display = "none"
    }
  }
  hideSuccess() {
    this.elements.successScreen.classList.add("hidden")
  }
  showPause(gameTime, score) {
    this.elements.pauseScreen.classList.remove("hidden")

    document.getElementById("pauseTime").textContent = this.formatTime(gameTime)
    document.getElementById("pauseScore").textContent = score.toLocaleString()
  }
  hidePause() {
    this.elements.pauseScreen.classList.add("hidden")
  }
  showLoading(progress, message) {
    const loadingScreen = document.getElementById("loadingScreen")
    const progressBar = document.getElementById("loadingProgress")
    const loadingMessage = document.getElementById("loadingMessage")
    loadingScreen.classList.remove("hidden")
    progressBar.style.width = `${progress}%`
    loadingMessage.textContent = message
  }
  hideLoading() {
    document.getElementById("loadingScreen").classList.add("hidden")
  }
  showLevelSelectionPanel(difficulty) {
    this.currentDifficulty = difficulty
    this.elements.levelSelectContent.classList.add("hidden")
    this.elements.levelSelectionPanel.classList.remove("hidden")
    this.elements.levelPanelTitle.textContent = `SELECT EXTRACTION ZONE (${difficulty.toUpperCase()})`
    this.elements.levelButtonsGrid.querySelectorAll(".level-num-btn").forEach((btn) => {
      btn.classList.remove("selected")
      if (Number.parseInt(btn.dataset.level) === window.game.currentLevel && window.game.difficulty === difficulty) {
        btn.classList.add("selected")
      }
    })
  }
  hideLevelSelectionPanel() {
    this.elements.levelSelectionPanel.classList.add("hidden")
    this.elements.levelSelectContent.classList.remove("hidden")
  }
}
window.UIManager = UIManager