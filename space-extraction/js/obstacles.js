class ObstacleManager {
  constructor() {
    this.staticObstacles = [] 
    this.dynamicObstacles = [] 
  }
  setMazeElements(staticObstacles, dynamicObstacles = []) {
    this.staticObstacles = staticObstacles
    this.dynamicObstacles = dynamicObstacles
  }

  update(deltaTime) {
    for (const obstacle of this.staticObstacles) {
      obstacle.rotation += obstacle.rotationSpeed * deltaTime
      if (obstacle.type === "energy_field") {
        obstacle.pulse += deltaTime * 3
      }
      if (obstacle.type === "powerup") {
        obstacle.pulse += deltaTime * 4
      }
    }
    for (const obstacle of this.dynamicObstacles) {
      obstacle.time += deltaTime
      this.updateDynamicObstacle(obstacle, deltaTime)
    }
  }
  updateDynamicObstacle(obstacle, deltaTime) {
    switch (obstacle.movementType) {
      case "patrol":
        obstacle.x += Math.cos(obstacle.angle) * obstacle.speed * deltaTime
        obstacle.y += Math.sin(obstacle.angle) * obstacle.speed * deltaTime
        if (obstacle.x < obstacle.size || obstacle.x > 1200 - obstacle.size) {
          obstacle.angle = Math.PI - obstacle.angle
        }
        if (obstacle.y < obstacle.size || obstacle.y > 800 - obstacle.size) {
          obstacle.angle = -obstacle.angle
        }
        obstacle.x = Math.max(obstacle.size, Math.min(1200 - obstacle.size, obstacle.x))
        obstacle.y = Math.max(obstacle.size, Math.min(800 - obstacle.size, obstacle.y))
        break
      case "orbit":
        const orbitAngle = obstacle.time * (obstacle.speed / obstacle.radius)
        obstacle.x = obstacle.originalX + Math.cos(orbitAngle) * obstacle.radius
        obstacle.y = obstacle.originalY + Math.sin(orbitAngle) * obstacle.radius
        break
      case "bounce":
        obstacle.x += Math.cos(obstacle.angle) * obstacle.speed * deltaTime
        obstacle.y += Math.sin(obstacle.angle) * obstacle.speed * deltaTime
        if (obstacle.x < obstacle.size || obstacle.x > 1200 - obstacle.size) {
          obstacle.angle = Math.PI - obstacle.angle
          obstacle.x = Math.max(obstacle.size, Math.min(1200 - obstacle.size, obstacle.x))
        }
        if (obstacle.y < obstacle.size || obstacle.y > 800 - obstacle.size) {
          obstacle.angle = -obstacle.angle
          obstacle.y = Math.max(obstacle.size, Math.min(800 - obstacle.size, obstacle.y))
        }
        break
      case "laser_grid":
        const cycleProgress = obstacle.time % obstacle.cycleDuration
        obstacle.active = cycleProgress < obstacle.activeDuration
        break
    }
  }
  render(ctx) {
    for (const obstacle of this.staticObstacles) {
      this.renderObstacle(ctx, obstacle)
    }
    for (const obstacle of this.dynamicObstacles) {
      this.renderDynamicObstacle(ctx, obstacle)
    }
  }
  renderObstacle(ctx, obstacle) {
    ctx.save()
    ctx.translate(obstacle.x, obstacle.y)
    ctx.rotate(obstacle.rotation)
    switch (obstacle.type) {
      case "asteroid":
        this.renderAsteroid(ctx, obstacle)
        break
      case "planet":
        this.renderPlanet(ctx, obstacle)
        break
      case "structure":
        this.renderStructure(ctx, obstacle)
        break
      case "energy_field":
        this.renderEnergyField(ctx, obstacle)
        break
    }
    ctx.restore()
  }
  renderDynamicObstacle(ctx, obstacle) {
    ctx.save()
    ctx.translate(obstacle.x, obstacle.y)
    if (obstacle.type === "laser_grid") {
      this.renderLaserGrid(ctx, obstacle)
    } else {
      ctx.strokeStyle = obstacle.color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(0, 0, obstacle.size + 5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = obstacle.color
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, obstacle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(obstacle.size * 0.3, 0, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  renderLaserGrid(ctx, obstacle) {
    if (!obstacle.active) return
    const alpha = Math.sin(obstacle.time * 10) * 0.2 + 0.8
    ctx.globalAlpha = alpha
    ctx.strokeStyle = obstacle.color
    ctx.lineWidth = obstacle.thickness
    ctx.shadowBlur = 15
    ctx.shadowColor = obstacle.color
    ctx.beginPath()
    if (obstacle.orientation === "horizontal") {
      ctx.moveTo(-obstacle.length / 2, 0)
      ctx.lineTo(obstacle.length / 2, 0)
    } else {
      ctx.moveTo(0, -obstacle.length / 2)
      ctx.lineTo(0, obstacle.length / 2)
    }
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }
  renderAsteroid(ctx, obstacle) {
    ctx.fillStyle = obstacle.color
    ctx.strokeStyle = "#aaaaaa"
    ctx.lineWidth = 1
    ctx.beginPath()
    const sides = 8
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2
      const radius = obstacle.size + Math.sin(angle * 3) * (obstacle.size * 0.3)
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
    ctx.fillStyle = "#666666"
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2
      const x = Math.cos(angle) * obstacle.size * 0.3
      const y = Math.sin(angle) * obstacle.size * 0.3
      ctx.beginPath()
      ctx.arc(x, y, obstacle.size * 0.1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderPlanet(ctx, obstacle) {
    ctx.fillStyle = obstacle.color
    ctx.beginPath()
    ctx.arc(0, 0, obstacle.size, 0, Math.PI * 2)
    ctx.fill()
    if (obstacle.atmosphere) {
      ctx.shadowBlur = 15
      ctx.shadowColor = obstacle.color
      ctx.strokeStyle = obstacle.color
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(0, 0, obstacle.size + 5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = this.darkenColor(obstacle.color, 0.3)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2
      const x = Math.cos(angle) * obstacle.size * 0.4
      const y = Math.sin(angle) * obstacle.size * 0.4
      ctx.beginPath()
      ctx.arc(x, y, obstacle.size * 0.15, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  renderStructure(ctx, obstacle) {
    ctx.fillStyle = obstacle.color
    ctx.strokeStyle = "#888888"
    ctx.lineWidth = 2
    const size = obstacle.size
    ctx.fillRect(-size / 2, -size / 2, size, size)
    ctx.strokeRect(-size / 2, -size / 2, size, size)
    ctx.strokeStyle = "#aaaaaa"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-size / 2, 0)
    ctx.lineTo(size / 2, 0)
    ctx.moveTo(0, -size / 2)
    ctx.lineTo(0, size / 2)
    ctx.stroke()
    if (obstacle.lights) {
      ctx.fillStyle = "#ffff00"
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2
        const x = Math.cos(angle) * size * 0.3
        const y = Math.sin(angle) * size * 0.3
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  renderEnergyField(ctx, obstacle) {
    const pulseSize = Math.sin(obstacle.pulse) * 5 + obstacle.size
    const alpha = (Math.sin(obstacle.pulse * 2) + 1) * 0.3 + 0.2
    ctx.globalAlpha = alpha
    ctx.fillStyle = obstacle.color
    ctx.shadowBlur = 20
    ctx.shadowColor = obstacle.color
    ctx.beginPath()
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = obstacle.color
    ctx.lineWidth = 2
    ctx.globalAlpha = alpha * 0.8
    for (let i = 0; i < 6; i++) {
      const angle1 = (i / 6) * Math.PI * 2
      const angle2 = ((i + 0.5) / 6) * Math.PI * 2
      const r1 = pulseSize * 0.7
      const r2 = pulseSize * 0.9
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle1) * r1, Math.sin(angle1) * r1)
      ctx.lineTo(Math.cos(angle2) * r2, Math.sin(angle2) * r2)
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }

  darkenColor(color, factor) {
    const hex = color.replace("#", "")
    const r = Math.floor(Number.parseInt(hex.substr(0, 2), 16) * (1 - factor))
    const g = Math.floor(Number.parseInt(hex.substr(2, 2), 16) * (1 - factor))
    const b = Math.floor(Number.parseInt(hex.substr(4, 2), 16) * (1 - factor))
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }
  checkCollision(player) {
    for (const obstacle of this.staticObstacles) {
      if (obstacle.type === "powerup" && obstacle.collected) continue
      const dx = player.x - obstacle.x
      const dy = player.y - obstacle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < obstacle.size + player.size) {
        if (obstacle.type === "powerup") {
          obstacle.collected = true
          return {
            collided: false,
            powerUp: obstacle.powerType,
          }
        }
        return {
          collided: true,
          obstacle: obstacle,
          type: obstacle.type,
        }
      }
    }
    for (const obstacle of this.dynamicObstacles) {
      if (obstacle.type === "laser_grid") {
        if (obstacle.active) {
          let closestX, closestY
          if (obstacle.orientation === "horizontal") {
            closestX = Math.max(obstacle.x - obstacle.length / 2, Math.min(player.x, obstacle.x + obstacle.length / 2))
            closestY = obstacle.y
          } else {
            closestX = obstacle.x
            closestY = Math.max(obstacle.y - obstacle.length / 2, Math.min(player.y, obstacle.y + obstacle.length / 2))
          }
          const dx = player.x - closestX
          const dy = player.y - closestY
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < player.size + obstacle.thickness / 2) {
            return {
              collided: true,
              obstacle: obstacle,
              type: obstacle.type,
              damage: obstacle.damage * 0.016,
            }
          }
        }
      } else {
        const dx = player.x - obstacle.x
        const dy = player.y - obstacle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < obstacle.size + player.size) {
          return {
            collided: true,
            obstacle: obstacle,
            type: obstacle.type,
          }
        }
      }
    }
    return { collided: false }
  }
  getObstacles() {
    return this.staticObstacles
  }
  getAllMazeElements() {
    return [...this.staticObstacles, ...this.dynamicObstacles]
  }
  clear() {
    this.staticObstacles = []
    this.dynamicObstacles = []
  }
}
window.ObstacleManager = ObstacleManager
