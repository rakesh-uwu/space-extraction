class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.minimapCanvas = document.getElementById("minimapCanvas")
    this.minimapCtx = this.minimapCanvas.getContext("2d")
    this.currentScreen = "mainMenu"
    this.difficulty = "normal"
    this.currentLevel = 1
    this.maxLevel = 15
    this.difficultySettings = {
      easy: {
        label: "ASTEROID EXTRACTION",
        color: "#00ff00",
        timeMultiplier: 1.5,
        scoreMultiplier: 0.8,
      },
      normal: {
        label: "PLANETARY EXTRACTION",
        color: "#ffff00",
        timeMultiplier: 1.0,
        scoreMultiplier: 1.0,
      },
      hard: {
        label: "STATION EXTRACTION",
        color: "#ff8000",
        timeMultiplier: 0.8,
        scoreMultiplier: 1.5,
      },
      nightmare: {
        label: "COSMIC EXTRACTION",
        color: "#ff0000",
        timeMultiplier: 0.6,
        scoreMultiplier: 2.0,
      },
    }
    this.player = new window.Player(80, 80)
    this.obstacleManager = new window.ObstacleManager()
    this.particleSystem = new window.ParticleSystem()
    this.enemyManager = new window.EnemyManager()
    this.projectileManager = new window.ProjectileManager()
    this.uiManager = new window.UIManager()
    this.mazeGenerator = null
    this.gameState = "playing"
    this.keys = {}
    this.lastTime = 0
    this.gameTime = 0
    this.score = 0
    this.startPoint = { x: 80, y: 80 }
    this.exitPoint = { x: 1120, y: 720 }
    this.bestTimes = {}
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 }
    this.notifications = []
    this.soundEnabled = true
    this.audioContext = null
    this.sounds = {}
    this.setupEventListeners()
    this.setupMenuSystem()
    this.initializeAudio()
    this.loadBestTimes()
    this.gameLoop()
    window.game = this
  }

  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.setupSoundEffects()
    } catch (e) {
      console.log("Audio not supported")
      this.soundEnabled = false
    }
  }
  setupSoundEffects() {
    this.sounds = {
      collision: this.createTone(200, 0.5, "sawtooth"),
      success: this.createTone(800, 1.0, "sine"),
      navigation: this.createTone(400, 0.1, "triangle"),
      warning: this.createTone(300, 0.2, "square"),
      shoot: this.createTone(600, 0.1, "square"),
      mining: this.createTone(150, 0.1, "triangle"),
      enemyHit: this.createTone(100, 0.1, "sawtooth"),
    }
  }
  createTone(frequency, duration, type = "sine") {
    return () => {
      if (!this.soundEnabled || !this.audioContext) return

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    }
  }
  playSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]()
    }
  }
  setupMenuSystem() {
    document.getElementById("playBtn").addEventListener("click", () => {
      this.startGame("normal", 1) 
    })
    document.getElementById("levelsBtn").addEventListener("click", () => {
      this.showScreen("levelSelect")
    })
    document.getElementById("instructionsBtn").addEventListener("click", () => {
      this.showScreen("instructionsScreen")
    })
    document.querySelectorAll(".level-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const difficulty = e.target.dataset.difficulty
        this.uiManager.showLevelSelectionPanel(difficulty) 
      })
    })
    document.getElementById("backToMenu").addEventListener("click", () => {
      this.showScreen("mainMenu")
    })
    document.getElementById("backFromInstructions").addEventListener("click", () => {
      this.showScreen("mainMenu")
    })
    document.getElementById("pauseGameBtn").addEventListener("click", () => {
      this.togglePause()
    })
    document.getElementById("restartGameBtn").addEventListener("click", () => {
      this.restart()
    })
    this.showScreen("mainMenu")
    this.startMenuAnimation()
  }
  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active")
    })
    this.uiManager.hideLevelSelectionPanel()
    this.uiManager.elements.levelSelectContent.classList.remove("hidden")
    document.getElementById(screenId).classList.add("active")
    this.currentScreen = screenId
    if (screenId !== "gameScreen") {
      this.startMenuAnimation()
    }
  }
  startGame(difficulty, level) {
    this.difficulty = difficulty
    this.currentLevel = level
    this.showScreen("gameScreen")
    this.uiManager.hideLevelSelectionPanel()
    const difficultyLabel = document.getElementById("difficultyLabel")
    const settings = this.difficultySettings[difficulty]
    difficultyLabel.textContent = settings.label
    difficultyLabel.style.color = settings.color
    this.generateMaze()
  }

  async generateMaze() {
    this.uiManager.showLoading(0, "PREPARING EXTRACTION ZONE...")
    await this.sleep(100)
    this.uiManager.showLoading(25, "Scanning extraction routes...")
    this.mazeGenerator = new window.MazeGenerator(1200, 800, this.difficulty)
    const mazeData = this.mazeGenerator.generate()
    await this.sleep(100)
    this.uiManager.showLoading(50, "Placing obstacles...")
    this.obstacleManager.setMazeElements(mazeData.obstacles, mazeData.dynamicObstacles)
    this.startPoint = mazeData.startPoint
    this.exitPoint = mazeData.exitPoint
    await this.sleep(100)
    this.uiManager.showLoading(75, "Positioning navigation systems...")
    this.player.reset(this.startPoint.x, this.startPoint.y)
    this.particleSystem.clear()
    this.enemyManager.clear()
    this.projectileManager.clear()
    await this.sleep(100)
    this.uiManager.showLoading(100, "Extraction zone ready!")
    await this.sleep(200)
    this.uiManager.hideLoading()
    this.gameTime = 0
    this.score = 0
    this.gameState = "playing"
    this.keys = {}
    this.notifications = []
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 }
    this.canvas.focus()
    this.addNotification(
      `Extraction Zone ${this.currentLevel} - ${this.difficultySettings[this.difficulty].label}`,
      "#00ffff",
      3000,
    )
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  startMenuAnimation() {
    this.animateMenuBackground()
  }
  animateMenuBackground() {
    const canvas =
      document.getElementById("menuCanvas") ||
      document.getElementById("levelCanvas") ||
      document.getElementById("instructionsCanvas")
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const animate = () => {
      if (this.currentScreen === "gameScreen") return
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      this.drawAnimatedStarfield(ctx, canvas.width, canvas.height)

      requestAnimationFrame(animate)
    }
    animate()
  }
  drawAnimatedStarfield(ctx, width, height) {
    ctx.fillStyle = "#ffffff"
    const time = Date.now() * 0.0005
    for (let i = 0; i < 200; i++) {
      const x = (i * 37 + time * 20) % width
      const y = (i * 73 + time * 10) % height
      const brightness = (Math.sin(time * 2 + i) + 1) * 0.5
      const size = Math.sin(time + i * 0.1) * 0.5 + 1
      ctx.globalAlpha = brightness * 0.8
      ctx.fillRect(x, y, size, size)
    }
    ctx.globalAlpha = 1
  }
  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true
      if (e.code === "KeyP" && this.currentScreen === "gameScreen") {
        this.togglePause()
      }
      if (e.code === "KeyR" && this.currentScreen === "gameScreen") {
        this.restart()
      }
      if (e.code === "KeyM") {
        this.toggleSound()
      }
      e.preventDefault()
    })
    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false
    })
    this.canvas.addEventListener("click", () => {
      this.canvas.focus()
    })
    this.canvas.tabIndex = 1
    this.canvas.focus()
  }
  toggleSound() {
    this.soundEnabled = !this.soundEnabled
    this.addNotification(
      `Sound ${this.soundEnabled ? "Enabled" : "Disabled"}`,
      this.soundEnabled ? "#00ff00" : "#ff0000",
      2000,
    )
  }
  gameLoop(currentTime = 0) {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016)
    this.lastTime = currentTime

    if (this.gameState === "playing" && this.currentScreen === "gameScreen") {
      this.update(deltaTime)
    }
    if (this.currentScreen === "gameScreen") {
      this.render()
    }
    requestAnimationFrame((time) => this.gameLoop(time))
  }
  update(deltaTime) {
    this.gameTime += deltaTime
    this.updateScreenShake(deltaTime)
    this.updateNotifications(deltaTime)
    this.player.handleInput(this.keys)
    this.player.update(deltaTime, this.obstacleManager, this.particleSystem)
    this.obstacleManager.update(deltaTime)
    this.particleSystem.update(deltaTime)
    this.enemyManager.update(deltaTime, this.player, this.projectileManager)
    this.projectileManager.update(deltaTime)
    const playerProjectiles = this.projectileManager.getProjectilesByOwner("player")
    const enemies = this.enemyManager.getEnemies()
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
      const projectile = playerProjectiles[i]
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j]
        const dx = projectile.x - enemy.x
        const dy = projectile.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < projectile.size + enemy.size) {
          const died = enemy.takeDamage(projectile.damage)
          this.projectileManager.removeProjectile(projectile)
          this.particleSystem.createExplosion(projectile.x, projectile.y, "#00ffff", 5) 
          this.playSound("enemyHit")
          if (died) {
            this.score += enemy.resources * 100 
            this.particleSystem.createExplosion(enemy.x, enemy.y, "#ff4444", 20) 
            this.addScreenShake(10, 0.3)
            this.addNotification(`Enemy Destroyed! +${enemy.resources * 100} Score`, "#ff4444", 1500)
          }
          break 
        }
      }
    }
    const enemyProjectiles = this.projectileManager.getProjectilesByOwner("enemy")
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      const projectile = enemyProjectiles[i]
      const dx = projectile.x - this.player.x
      const dy = projectile.y - this.player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < projectile.size + this.player.size) {
        const died = this.player.takeDamage(projectile.damage)
        this.projectileManager.removeProjectile(projectile)
        this.particleSystem.createExplosion(projectile.x, projectile.y, "#ff0000", 5)
        this.addScreenShake(5, 0.1)
        if (died) {
          this.gameOver()
          return 
        }
        break 
      }
    }
    if (this.player.isAlive()) {
      const distanceToExit = Math.sqrt(
        (this.player.x - this.exitPoint.x) ** 2 + (this.player.y - this.exitPoint.y) ** 2,
      )
      if (distanceToExit < 40) {
        this.levelComplete()
      }
      const nearObstacle = this.isNearObstacle()
      const speed = Math.sqrt(this.player.vx ** 2 + this.player.vy ** 2)
      const bestTime = this.getBestTime()
      this.uiManager.updateHUD(
        this.gameTime,
        this.score,
        this.currentLevel,
        bestTime,
        distanceToExit,
        nearObstacle,
        this.player.health,
        this.player.lives,
        speed,
      )
      this.uiManager.updateMinimap(
        this.minimapCtx,
        this.player,
        this.obstacleManager.getAllMazeElements(),
        this.startPoint,
        this.exitPoint,
      )
    } else {
      this.gameOver()
    }
  }
  isNearObstacle() {
    const obstacles = this.obstacleManager.getObstacles()
    for (const obstacle of obstacles) {
      const distance = Math.sqrt((this.player.x - obstacle.x) ** 2 + (this.player.y - obstacle.y) ** 2)
      if (distance < obstacle.size + 25) {
        return true
      }
    }
    return false
  }
  updateScreenShake(deltaTime) {
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity
      this.screenShake.intensity *= 0.95
    } else {
      this.screenShake.x = 0
      this.screenShake.y = 0
      this.screenShake.intensity = 0
    }
  }
  addScreenShake(intensity, duration) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity)
    this.screenShake.duration = Math.max(this.screenShake.duration, duration)
  }
  addNotification(text, color = "#00ffff", duration = 2000) {
    this.notifications.push({
      text: text,
      color: color,
      life: duration / 1000,
      maxLife: duration / 1000,
      y: 100 + this.notifications.length * 30,
    })
  }
  updateNotifications(deltaTime) {
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].life -= deltaTime
      if (this.notifications[i].life <= 0) {
        this.notifications.splice(i, 1)
        for (let j = i; j < this.notifications.length; j++) {
          this.notifications[j].y -= 30
        }
      }
    }
  }
  levelComplete() {
    this.gameState = "completed"
    this.playSound("success")
    const settings = this.difficultySettings[this.difficulty]
    const timeBonus = Math.max(0, Math.floor((60 - this.gameTime) * 100 * settings.timeMultiplier))
    const levelBonus = this.currentLevel * 500
    this.score = Math.floor((timeBonus + levelBonus) * settings.scoreMultiplier)
    const bestTime = this.getBestTime()
    const isNewRecord = bestTime === 0 || this.gameTime < bestTime
    if (isNewRecord) {
      this.setBestTime(this.gameTime)
    }
    this.particleSystem.createSuccessEffect(this.exitPoint.x, this.exitPoint.y)
    this.particleSystem.createSparkles(this.exitPoint.x, this.exitPoint.y, 20)
    const isPerfectRun = true 
    this.uiManager.showSuccess(this.gameTime, this.score, timeBonus, isPerfectRun)
  }

  gameOver() {
    this.gameState = "gameOver"
    const bestTime = this.getBestTime()
    const isNewRecord = bestTime === 0 || this.gameTime < bestTime
    if (isNewRecord) {
      this.setBestTime(this.gameTime)
    }
    this.uiManager.showGameOver(
      this.gameTime,
      this.score,
      this.currentLevel,
      this.difficultySettings[this.difficulty].label,
      isNewRecord,
    )
  }
  getBestTime() {
    const key = `${this.difficulty}_${this.currentLevel}`
    return this.bestTimes[key] || 0
  }
  setBestTime(time) {
    const key = `${this.difficulty}_${this.currentLevel}`
    this.bestTimes[key] = time
    localStorage.setItem("spaceMazeBestTimes", JSON.stringify(this.bestTimes))
  }
  loadBestTimes() {
    const saved = localStorage.getItem("spaceMazeBestTimes")
    if (saved) {
      this.bestTimes = JSON.parse(saved)
    }
  }
  nextLevel() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++
      this.generateMaze()
    } else {
      this.addNotification("All extraction zones completed! Starting over with increased difficulty.", "#00ff00", 5000)
      this.currentLevel = 1
      this.generateMaze()
    }
  }
  render() {
    this.ctx.save()
    this.ctx.translate(this.screenShake.x, this.screenShake.y)
    this.ctx.fillStyle = "#000"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawStarfield()
    this.drawNavigationPoints()
    this.obstacleManager.render(this.ctx)
    this.enemyManager.render(this.ctx)
    this.projectileManager.render(this.ctx)
    this.player.render(this.ctx)
    this.particleSystem.render(this.ctx)
    this.renderNotifications()
    if (this.gameState === "paused") {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.fillStyle = "#00ffff"
      this.ctx.font = "48px Orbitron"
      this.ctx.textAlign = "center"
      this.ctx.shadowBlur = 20
      this.ctx.shadowColor = "#00ffff"
      this.ctx.fillText("NAVIGATION PAUSED", this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.shadowBlur = 0
    }
    this.ctx.restore()
  }
  drawStarfield() {
    const time = Date.now() * 0.001
    const gradient = this.ctx.createRadialGradient(400, 300, 0, 400, 300, 400)
    gradient.addColorStop(0, "rgba(0, 100, 200, 0.1)")
    gradient.addColorStop(0.5, "rgba(100, 0, 200, 0.05)")
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = "#ffffff"
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % this.canvas.width
      const y = (i * 73) % this.canvas.height
      const brightness = (Math.sin(time + i) + 1) * 0.5
      this.ctx.globalAlpha = brightness * 0.6
      this.ctx.fillRect(x, y, 1, 1)
    }
    this.ctx.globalAlpha = 1
  }
  drawNavigationPoints() {
    this.ctx.save()
    this.ctx.fillStyle = "#00ff00"
    this.ctx.shadowBlur = 15
    this.ctx.shadowColor = "#00ff00"
    this.ctx.beginPath()
    this.ctx.arc(this.startPoint.x, this.startPoint.y, 15, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = "#000"
    this.ctx.font = "12px Orbitron"
    this.ctx.textAlign = "center"
    this.ctx.fillText("START", this.startPoint.x, this.startPoint.y + 4)
    this.ctx.fillStyle = "#ffff00"
    this.ctx.shadowColor = "#ffff00"
    this.ctx.beginPath()
    this.ctx.arc(this.exitPoint.x, this.exitPoint.y, 15, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = "#000"
    this.ctx.fillText("EXIT", this.exitPoint.x, this.exitPoint.y + 4)
    this.ctx.restore()
  }
  renderNotifications() {
    this.ctx.save()
    this.ctx.font = "16px Orbitron"
    this.ctx.textAlign = "center"
    for (const notification of this.notifications) {
      const alpha = notification.life / notification.maxLife
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = notification.color
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = notification.color
      this.ctx.fillText(notification.text, this.canvas.width / 2, notification.y)
    }
    this.ctx.restore()
  }
  togglePause() {
    if (this.gameState === "playing") {
      this.pause()
    } else if (this.gameState === "paused") {
      this.resume()
    }
  }
  pause() {
    this.gameState = "paused"
    this.uiManager.showPause(this.gameTime, this.score)
  }
  resume() {
    this.gameState = "playing"
    this.uiManager.hidePause()
    this.canvas.focus()
  }
  restart() {
    this.generateMaze()
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new Game()
})