class Enemy {
  constructor(x, y, type) {
    this.x = x
    this.y = y
    this.type = type || "scout"
    this.angle = 0
    this.speed = this.getTypeStats().speed
    this.health = this.getTypeStats().health
    this.maxHealth = this.health
    this.damage = this.getTypeStats().damage
    this.fireRate = this.getTypeStats().fireRate
    this.lastShot = 0
    this.size = this.getTypeStats().size
    this.vx = 0
    this.vy = 0
    this.target = null
    this.state = "patrol" 
    this.patrolAngle = Math.random() * Math.PI * 2
    this.stateTimer = 0
    this.resources = Math.floor(Math.random() * 5) + 2
  }
  getTypeStats() {
    const stats = {
      scout: {
        speed: 80,
        health: 30,
        damage: 10,
        fireRate: 1.5,
        size: 12,
        color: "#ff4444",
      },
      fighter: {
        speed: 60,
        health: 50,
        damage: 15,
        fireRate: 1.0,
        size: 16,
        color: "#ff8844",
      },
      heavy: {
        speed: 40,
        health: 80,
        damage: 25,
        fireRate: 0.7,
        size: 20,
        color: "#ff0000",
      },
    }
    return stats[this.type] || stats.scout
  }
  update(deltaTime, player, projectileManager) {
    this.stateTimer += deltaTime
    this.lastShot += deltaTime
    const dx = player.x - this.x
    const dy = player.y - this.y
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy)
    switch (this.state) {
      case "patrol":
        this.patrol(deltaTime)
        if (distanceToPlayer < 200) {
          this.state = "attack"
          this.stateTimer = 0
        }
        break
      case "attack":
        this.attack(deltaTime, player, projectileManager)
        if (distanceToPlayer > 300 || this.health < this.maxHealth * 0.3) {
          this.state = "retreat"
          this.stateTimer = 0
        }
        break
      case "retreat":
        this.retreat(deltaTime, player)
        if (this.stateTimer > 3 && distanceToPlayer > 250) {
          this.state = "patrol"
          this.stateTimer = 0
        }
        break
    }
    this.x += this.vx * deltaTime
    this.y += this.vy * deltaTime
    this.vx *= 0.95
    this.vy *= 0.95
    this.x = Math.max(this.size, Math.min(800 - this.size, this.x))
    this.y = Math.max(this.size, Math.min(600 - this.size, this.y))
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      this.angle = Math.atan2(this.vy, this.vx)
    }
  }
  patrol(deltaTime) {
    this.patrolAngle += (Math.random() - 0.5) * 2 * deltaTime
    const targetVx = Math.cos(this.patrolAngle) * this.speed * 0.5
    const targetVy = Math.sin(this.patrolAngle) * this.speed * 0.5

    this.vx += (targetVx - this.vx) * deltaTime * 2
    this.vy += (targetVy - this.vy) * deltaTime * 2
  }
  attack(deltaTime, player, projectileManager) {
    const dx = player.x - this.x
    const dy = player.y - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > 150) {
      const targetVx = (dx / distance) * this.speed
      const targetVy = (dy / distance) * this.speed

      this.vx += (targetVx - this.vx) * deltaTime * 3
      this.vy += (targetVy - this.vy) * deltaTime * 3
    } else {
      const circleAngle = Math.atan2(dy, dx) + Math.PI / 2
      const targetVx = Math.cos(circleAngle) * this.speed * 0.7
      const targetVy = Math.sin(circleAngle) * this.speed * 0.7

      this.vx += (targetVx - this.vx) * deltaTime * 2
      this.vy += (targetVy - this.vy) * deltaTime * 2
    }
    if (this.lastShot >= this.fireRate && distance < 250) {
      const angleToPlayer = Math.atan2(dy, dx)
      projectileManager.addProjectile(
        this.x + Math.cos(angleToPlayer) * this.size,
        this.y + Math.sin(angleToPlayer) * this.size,
        angleToPlayer,
        200,
        this.damage,
        "enemy",
      )
      this.lastShot = 0
    }
  }
  retreat(deltaTime, player) {
    const dx = player.x - this.x
    const dy = player.y - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const targetVx = -(dx / distance) * this.speed
    const targetVy = -(dy / distance) * this.speed
    this.vx += (targetVx - this.vx) * deltaTime * 4
    this.vy += (targetVy - this.vy) * deltaTime * 4
  }
  takeDamage(damage) {
    this.health -= damage
    return this.health <= 0
  }
  render(ctx) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    const stats = this.getTypeStats()
    ctx.fillStyle = stats.color
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(this.size, 0)
    ctx.lineTo(-this.size * 0.7, -this.size * 0.5)
    ctx.lineTo(-this.size * 0.3, 0)
    ctx.lineTo(-this.size * 0.7, this.size * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
      ctx.fillStyle = "#0080ff"
      ctx.beginPath()
      ctx.ellipse(-this.size * 0.8, 0, this.size * 0.3, this.size * 0.2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    if (this.health < this.maxHealth) {
      const barWidth = this.size * 1.5
      const barHeight = 3
      const healthPercent = this.health / this.maxHealth
      ctx.fillStyle = "#333"
      ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 10, barWidth, barHeight)

      ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000"
      ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 10, barWidth * healthPercent, barHeight)
    }
    ctx.fillStyle = "#ffffff"
    ctx.font = "8px monospace"
    ctx.textAlign = "center"
    ctx.fillText(this.state.toUpperCase(), this.x, this.y + this.size + 15)
  }
  getBounds() {
    return {
      x: this.x - this.size,
      y: this.y - this.size,
      width: this.size * 2,
      height: this.size * 2,
    }
  }
  getDistance(x, y) {
    const dx = this.x - x
    const dy = this.y - y
    return Math.sqrt(dx * dx + dy * dy)
  }
}
class EnemyManager {
  constructor() {
    this.enemies = []
    this.spawnTimer = 0
    this.spawnInterval = 5 
    this.wave = 1
    this.enemiesThisWave = 0
    this.maxEnemiesPerWave = 3
  }
  spawnEnemy(wave) {
    const side = Math.floor(Math.random() * 4)
    let x, y

    switch (side) {
      case 0: 
        x = Math.random() * 800
        y = -50
        break
      case 1: 
        x = 850
        y = Math.random() * 600
        break
      case 2: 
        x = Math.random() * 800
        y = 650
        break
      case 3: 
        x = -50
        y = Math.random() * 600
        break
    }
    let type = "scout"
    if (wave > 3) {
      const rand = Math.random()
      if (rand < 0.6) type = "scout"
      else if (rand < 0.9) type = "fighter"
      else type = "heavy"
    } else if (wave > 1) {
      type = Math.random() < 0.8 ? "scout" : "fighter"
    }
    this.enemies.push(new Enemy(x, y, type))
    this.enemiesThisWave++
  }
  update(deltaTime, player, projectileManager) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].update(deltaTime, player, projectileManager)
      if (this.enemies[i].health <= 0) {
        this.enemies.splice(i, 1)
      }
    }
    this.spawnTimer += deltaTime
    if (
      this.spawnTimer >= this.spawnInterval &&
      this.enemiesThisWave < this.maxEnemiesPerWave &&
      this.enemies.length < 8
    ) {
      this.spawnEnemy(this.wave)
      this.spawnTimer = 0
    }
    if (this.enemiesThisWave >= this.maxEnemiesPerWave && this.enemies.length === 0) {
      this.nextWave()
    }
  }
  nextWave() {
    this.wave++
    this.enemiesThisWave = 0
    this.maxEnemiesPerWave = Math.min(3 + Math.floor(this.wave / 2), 10)
    this.spawnInterval = Math.max(2, 5 - this.wave * 0.2)
  }
  render(ctx) {
    for (const enemy of this.enemies) {
      enemy.render(ctx)
    }
  }
  getEnemies() {
    return this.enemies
  }
  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy)
    if (index > -1) {
      this.enemies.splice(index, 1)
    }
  }
  clear() {
    this.enemies = []
    this.wave = 1
    this.enemiesThisWave = 0
    this.maxEnemiesPerWave = 3
  }
  getWave() {
    return this.wave
  }
}
window.Enemy = Enemy
window.EnemyManager = EnemyManager
