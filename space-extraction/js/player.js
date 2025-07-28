class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.angle = 0
    this.size = 15
    this.maxHealth = 100
    this.health = this.maxHealth
    this.lives = 1 
    this.maxLives = 3 
    this.maxSpeed = 200
    this.acceleration = 300
    this.friction = 0.9

    this.weaponDamage = 20
    this.fireRate = 0.3
    this.lastShot = 0

    
    this.miningRange = 50
    this.miningEfficiency = 1
    this.isMining = false

    this.resources = {
      crystals: 0,
      metals: 0,
      rare: 0,
    }


    this.upgrades = {
      weaponLevel: 1,
      armorLevel: 1,
      miningLevel: 1,
      shieldLevel: 0,
    }

    this.score = 0
    this.invulnerable = false
    this.invulnerabilityTime = 0


    this.alive = true
    this.collisionCooldown = 0


    this.trailPoints = []
    this.enginePower = 0

  
    this.keys = {}
  }

  handleInput(keys) {
    this.keys = keys
  }

  update(deltaTime, obstacleManager, particleSystem) {
    this.lastShot += deltaTime
    this.isMining = false

  
    if (this.invulnerable) {
      this.invulnerabilityTime -= deltaTime
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false
      }
    }

 
    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= deltaTime
    }

 
    let targetVx = 0
    let targetVy = 0

    if (this.keys["ArrowUp"] || this.keys["KeyW"]) {
      targetVy = -this.maxSpeed
      this.enginePower = Math.min(this.enginePower + deltaTime * 3, 1)
    }

    if (this.keys["ArrowDown"] || this.keys["KeyS"]) {
      targetVy = this.maxSpeed
      this.enginePower = Math.min(this.enginePower + deltaTime * 3, 1)
    }

    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
      targetVx = -this.maxSpeed
      this.enginePower = Math.min(this.enginePower + deltaTime * 3, 1)
    }

    if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
      targetVx = this.maxSpeed
      this.enginePower = Math.min(this.enginePower + deltaTime * 3, 1)
    }

    if (
      !this.keys["ArrowUp"] &&
      !this.keys["KeyW"] &&
      !this.keys["ArrowDown"] &&
      !this.keys["KeyS"] &&
      !this.keys["ArrowLeft"] &&
      !this.keys["KeyA"] &&
      !this.keys["ArrowRight"] &&
      !this.keys["KeyD"]
    ) {
      this.enginePower = Math.max(this.enginePower - deltaTime * 2, 0)
    }
    if (targetVx !== 0 && targetVy !== 0) {
      targetVx *= 0.707
      targetVy *= 0.707
    }

    this.vx += ((targetVx - this.vx) * this.acceleration * deltaTime) / this.maxSpeed
    this.vy += ((targetVy - this.vy) * this.acceleration * deltaTime) / this.maxSpeed
    if (targetVx === 0) this.vx *= this.friction
    if (targetVy === 0) this.vy *= this.friction
    this.x += this.vx * deltaTime
    this.y += this.vy * deltaTime
    this.x = Math.max(this.size, Math.min(1200 - this.size, this.x))
    this.y = Math.max(this.size, Math.min(800 - this.size, this.y))
    if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
      this.angle = Math.atan2(this.vy, this.vx)
    }
    if (this.enginePower > 0.1) {
      particleSystem.createEngineTrail(
        this.x - Math.cos(this.angle) * this.size * 1.5,
        this.y - Math.sin(this.angle) * this.size * 1.5,
        this.vx,
        this.vy,
      )
    }
    this.updateTrail()
    if (this.collisionCooldown <= 0) {
      const collision = obstacleManager.checkCollision(this)
      if (collision.collided) {
        this.handleCollision(collision, particleSystem)
      }
    }
    if (this.keys["Space"] && this.lastShot >= this.fireRate) {
      this.shoot(particleSystem)
      this.lastShot = 0
    }
    if (this.keys["KeyE"]) {
      this.mine(obstacleManager, particleSystem, deltaTime)
    }
  }
  updateTrail() {
    this.trailPoints.push({ x: this.x, y: this.y, life: 1.0 })
    for (let i = this.trailPoints.length - 1; i >= 0; i--) {
      this.trailPoints[i].life -= 0.05
      if (this.trailPoints[i].life <= 0) {
        this.trailPoints.splice(i, 1)
      }
    }
    if (this.trailPoints.length > 20) {
      this.trailPoints.shift()
    }
  }
  handleCollision(collision, particleSystem) {
    if (collision.type === "laser_grid") {
      if (collision.obstacle.active) {
        if (this.collisionCooldown <= 0) {
          const died = this.takeDamage(collision.damage)
          this.collisionCooldown = 0.1
          particleSystem.createCollisionEffect(this.x, this.y, collision.type)
          if (window.game) {
            window.game.playSound("warning") 
            window.game.addScreenShake(5, 0.1) 
          }
          if (died) {
          }
        }
      }
    } else {
      const died = this.takeDamage(50)
      particleSystem.createCollisionEffect(this.x, this.y, collision.type)
      if (window.game) {
        window.game.playSound("collision")
        window.game.addScreenShake(15, 0.5)
      }

      if (died) {
         //this.alive = false (UWUWUWUWUWUWUWU never gonannaaa give you uppppp never gonnnaaa XD)
      }
    }
  }

  shoot(particleSystem) {
    if (window.game) {
      window.game.playSound("shoot")
    }
    const spread = this.upgrades.weaponLevel > 2 ? 0.3 : 0
    const shots = this.upgrades.weaponLevel > 3 ? 3 : 1
    for (let i = 0; i < shots; i++) {
      let angle = this.angle
      if (shots > 1) {
        angle += (i - 1) * spread
      }
      angle += (Math.random() - 0.5) * 0.1
      if (window.game && window.game.projectileManager) {
        window.game.projectileManager.addProjectile(
          this.x + Math.cos(angle) * this.size,
          this.y + Math.sin(angle) * this.size,
          angle,
          this.weaponDamage,
          "player",
        )
      }
    }
    if (window.game && window.game.particleSystem) {
      window.game.particleSystem.createExplosion(
        this.x + Math.cos(this.angle) * this.size,
        this.y + Math.sin(this.angle) * this.size,
        "#00ffff",
        5,
      )
    }
  }
  mine(obstacleManager, particleSystem, deltaTime) {
    const obstacles = obstacleManager.getObstacles()
    for (const obstacle of obstacles) {
      const dx = this.x - obstacle.x
      const dy = this.y - obstacle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= this.miningRange + obstacle.size) {
        this.isMining = true
        
        // Initialize mining properties if they don't exist
        if (!obstacle.miningProgress) {
          obstacle.miningProgress = 0
          obstacle.resources = Math.floor(obstacle.size / 10) + 1
          obstacle.resourceType = obstacle.type === 'asteroid' ? 'crystal' : 'metal'
        }
        
        // Mine the obstacle
        obstacle.miningProgress += deltaTime * this.miningEfficiency * this.upgrades.miningLevel
        
        if (obstacle.miningProgress >= 1.0 && obstacle.resources > 0) {
          obstacle.miningProgress = 0
          obstacle.resources--
          
          const resource = {
            type: obstacle.resourceType,
            amount: 1,
            x: obstacle.x,
            y: obstacle.y
          }
          
          if (window.game) {
            window.game.playSound("mining")
          }
          this.addResource(resource.type, resource.amount)
          this.score += resource.amount * 15 
          particleSystem.createMiningEffect(resource.x, resource.y)
          particleSystem.createResourcePickup(resource.x, resource.y, resource.type)
        }
        
        particleSystem.createMiningEffect(this.x + (obstacle.x - this.x) * 0.5, this.y + (obstacle.y - this.y) * 0.5)
        break 
      }
    }
  }
  addResource(type, amount) {
    switch (type) {
      case "crystal":
        this.resources.crystals += amount
        break
      case "metal":
        this.resources.metals += amount
        break
      case "rare":
        this.resources.rare += amount
        break
    }
  }
  takeDamage(damage) {
    if (this.invulnerable) return false

    const actualDamage = Math.max(1, damage - this.upgrades.armorLevel * 2)
    this.health -= actualDamage

    this.invulnerable = true
    this.invulnerabilityTime = 1.0

    if (this.health <= 0) {
      this.lives-- 
      if (this.lives <= 0) {
        this.alive = false 
        return true
      } else {
        this.health = this.maxHealth 
        this.invulnerabilityTime = 2.0
        if (window.game) {
          window.game.addNotification(`Life Lost! ${this.lives} remaining.`, "#ff8800", 2000)
        }
        return false
      }
    }
    return false
  }
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }
  upgrade(type) {
    const costs = {
      weapon: { crystals: 10 * this.upgrades.weaponLevel },
      armor: { metals: 15 * this.upgrades.armorLevel },
      mining: { rare: 20 * this.upgrades.miningLevel },
      shield: { crystals: 25, metals: 25, rare: 25 },
    }
    const cost = costs[type]
    if (!cost) return false
    if (cost.crystals && this.resources.crystals < cost.crystals) return false
    if (cost.metals && this.resources.metals < cost.metals) return false
    if (cost.rare && this.resources.rare < cost.rare) return false
    if (cost.crystals) this.resources.crystals -= cost.crystals
    if (cost.metals) this.resources.metals -= cost.metals
    if (cost.rare) this.resources.rare -= cost.rare
    switch (type) {
      case "weapon":
        this.upgrades.weaponLevel++
        this.weaponDamage += 5
        if (this.upgrades.weaponLevel > 2) this.fireRate *= 0.9
        break
      case "armor":
        this.upgrades.armorLevel++
        this.maxHealth += 20
        this.health += 20
        break
      case "mining":
        this.upgrades.miningLevel++
        this.miningEfficiency += 0.5
        this.miningRange += 5
        break
      case "shield":
        this.upgrades.shieldLevel++
        break
    }
    return true
  }
  render(ctx) {
    this.renderTrail(ctx)
    ctx.save()
    if (this.invulnerable && Math.floor(this.invulnerabilityTime * 10) % 2) {
      ctx.globalAlpha = 0.5
    }
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.fillStyle = "#00ffff"
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.size, 0)
    ctx.lineTo(-this.size * 0.7, -this.size * 0.5)
    ctx.lineTo(-this.size * 0.3, 0)
    ctx.lineTo(-this.size * 0.7, this.size * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    if (this.enginePower > 0.1) {
      ctx.fillStyle = `rgba(0, 128, 255, ${this.enginePower * 0.8})`
      ctx.shadowBlur = 15
      ctx.shadowColor = "#0080ff"
      ctx.beginPath()
      ctx.ellipse(-this.size * 0.8, 0, this.size * 0.4 * this.enginePower, this.size * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
    if (this.upgrades.shieldLevel > 0) {
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    ctx.restore()
    if (this.isMining) {
      ctx.strokeStyle = "#00ffff"
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.miningRange, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
  renderTrail(ctx) {
    if (this.trailPoints.length < 2) return

    ctx.save()
    ctx.strokeStyle = "#00ffff"
    ctx.lineWidth = 3

    for (let i = 1; i < this.trailPoints.length; i++) {
      const point = this.trailPoints[i]
      const prevPoint = this.trailPoints[i - 1]

      ctx.globalAlpha = point.life * 0.5
      ctx.beginPath()
      ctx.moveTo(prevPoint.x, prevPoint.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
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
  reset(x, y) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.angle = 0
    this.health = this.maxHealth
    this.lives = this.maxLives 
    this.resources = { crystals: 0, metals: 0, rare: 0 }
    this.score = 0
    this.invulnerable = false
    this.invulnerabilityTime = 0
    this.upgrades = {
      weaponLevel: 1,
      armorLevel: 1,
      miningLevel: 1,
      shieldLevel: 0,
    }
    this.weaponDamage = 20
    this.fireRate = 0.3
    this.miningEfficiency = 1
    this.miningRange = 50
    this.maxHealth = 100
    this.alive = true
    this.collisionCooldown = 0
    this.trailPoints = []
    this.enginePower = 0
  }

  isAlive() {
    return this.alive
  }
}
window.Player = Player
