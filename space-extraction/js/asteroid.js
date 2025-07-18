class Asteroid {
  constructor(x, y, size, type) {
    this.x = x
    this.y = y
    this.size = size
    this.type = type || this.getRandomType()
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 2
    this.health = size * 2
    this.maxHealth = this.health
    this.resources = this.calculateResources()
    this.miningProgress = 0
    this.beingMined = false
    this.vx = (Math.random() - 0.5) * 20
    this.vy = (Math.random() - 0.5) * 20
  }
  getRandomType() {
    const types = ["crystal", "metal", "rare"]
    const random = Math.random()
    let sum = 0
    for (let i = 0; i < types.length; i++) {
      sum += weights[i]
      if (random <= sum) {
        return types[i]
      }
    }
    return "crystal"
  }
  calculateResources() {
    const baseAmount = Math.floor(this.size / 5) + 1
    const multipliers = {
      crystal: 1,
      metal: 1.5,
      rare: 3,
    }
    return Math.floor(baseAmount * multipliers[this.type])
  }
  update(deltaTime) {
    this.x += this.vx * deltaTime
    this.y += this.vy * deltaTime
    this.rotation += this.rotationSpeed * deltaTime
    this.vx *= 0.99
    this.vy *= 0.99
    this.beingMined = false
    if (this.x < -this.size) this.x = 800 + this.size
    if (this.x > 800 + this.size) this.x = -this.size
    if (this.y < -this.size) this.y = 600 + this.size
    if (this.y > 600 + this.size) this.y = -this.size
  }
  mine(deltaTime, efficiency = 1) {
    this.beingMined = true
    this.miningProgress += deltaTime * efficiency
    if (this.miningProgress >= 1.0) {
      this.miningProgress = 0
      return this.extractResource()
    }
    return null
  }
  extractResource() {
    if (this.resources > 0) {
      this.resources--
      this.health -= 0.5
      return {
        type: this.type,
        amount: 1,
        x: this.x,
        y: this.y,
      }
    }
    return null
  }
  takeDamage(damage) {
    this.health -= damage
    return this.health <= 0
  }
  render(ctx) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)
    const colors = {
      crystal: "#00ffff",
      metal: "#ffff00",
      rare: "#ff00ff",
    }
    const color = colors[this.type]
    ctx.strokeStyle = color
    ctx.fillStyle = color + "20"
    ctx.lineWidth = 2
    ctx.beginPath()
    const sides = 8
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2
      const radius = this.size + Math.sin(angle * 3) * (this.size * 0.2)
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    if (this.health < this.maxHealth) {
      const barWidth = this.size * 1.5
      const barHeight = 4
      const healthPercent = this.health / this.maxHealth
      ctx.fillStyle = "#333"
      ctx.fillRect(-barWidth / 2, -this.size - 15, barWidth, barHeight)
      ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000"
      ctx.fillRect(-barWidth / 2, -this.size - 15, barWidth * healthPercent, barHeight)
    }
    if (this.beingMined && this.miningProgress > 0) {
      const barWidth = this.size * 1.5
      const barHeight = 4
      ctx.fillStyle = "#333"
      ctx.fillRect(-barWidth / 2, this.size + 10, barWidth, barHeight)

      ctx.fillStyle = color
      ctx.fillRect(-barWidth / 2, this.size + 10, barWidth * this.miningProgress, barHeight)
    }
    if (this.resources > 0) {
      ctx.fillStyle = color
      ctx.font = "12px monospace"
      ctx.textAlign = "center"
      ctx.fillText(this.resources.toString(), 0, this.size + 25)
    }
    ctx.restore()
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
class AsteroidManager {
  constructor() {
    this.asteroids = []
    this.spawnTimer = 0
    this.spawnInterval = 3
  }
  spawnAsteroid() {
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
    const size = Math.random() * 30 + 20
    this.asteroids.push(new Asteroid(x, y, size))
  }
  update(deltaTime) {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      this.asteroids[i].update(deltaTime)
      if (this.asteroids[i].health <= 0) {
        this.asteroids.splice(i, 1)
      }
    }
    this.spawnTimer += deltaTime
    if (this.spawnTimer >= this.spawnInterval && this.asteroids.length < 15) {
      this.spawnAsteroid()
      this.spawnTimer = 0
    }
  }
  render(ctx) {
    for (const asteroid of this.asteroids) {
      asteroid.render(ctx)
    }
  }
  getAsteroids() {
    return this.asteroids
  }
  removeAsteroid(asteroid) {
    const index = this.asteroids.indexOf(asteroid)
    if (index > -1) {
      this.asteroids.splice(index, 1)
    }
  }
  clear() {
    this.asteroids = []
  }
}
window.Asteroid = Asteroid
window.AsteroidManager = AsteroidManager