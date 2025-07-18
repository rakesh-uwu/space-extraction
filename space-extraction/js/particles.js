class ParticleSystem {
  constructor() {
    this.particles = []
  }
  createExplosion(x, y, color = "#ff6600", count = 15) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * 4 + 2,
        color: color,
        type: "explosion",
      })
    }
  }
  createMiningEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * 3 + 1,
        color: "#00ffff",
        type: "mining",
      })
    }
  }
  createCollisionEffect(x, y, obstacleType) {
    const colors = {
      asteroid: "#888888",
      planet: "#ff4444",
      structure: "#ffff44",
      energy_field: "#ff00ff",
    }
    const color = colors[obstacleType] || "#ff6600"
    const count = obstacleType === "energy_field" ? 25 : 15
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.5,
        maxLife: 1.5,
        size: Math.random() * 5 + 3,
        color: color,
        type: "collision",
      })
    }
  }
  createEngineTrail(x, y, vx, vy) {
    this.particles.push({
      x: x,
      y: y,
      vx: -vx * 0.3 + (Math.random() - 0.5) * 2,
      vy: -vy * 0.3 + (Math.random() - 0.5) * 2,
      life: 0.8,
      maxLife: 0.8,
      size: Math.random() * 3 + 1,
      color: "#0080ff",
      type: "engine",
    })
  }
  createResourcePickup(x, y, type) {
    const colors = {
      crystal: "#00ffff",
      metal: "#ffff00",
      rare: "#ff00ff",
    }
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 0.8,
        maxLife: 0.8,
        size: Math.random() * 3 + 1,
        color: colors[type] || "#ffffff",
        type: "pickup",
      })
    }
  }
  createSuccessEffect(x, y) {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 2.0,
        maxLife: 2.0,
        size: Math.random() * 4 + 2,
        color: "#00ff00",
        type: "success",
      })
    }
  }
  createSparkles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * 2 + 1,
        color: "#ffff00",
        type: "sparkle",
      })
    }
  }
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.x += particle.vx * deltaTime
      particle.y += particle.vy * deltaTime
      particle.life -= deltaTime
      particle.vx *= 0.98
      particle.vy *= 0.98
      if (particle.type === "explosion" || particle.type === "collision") {
        particle.vy += 50 * deltaTime
      }

      if (particle.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }
  render(ctx) {
    ctx.save()
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife
      ctx.globalAlpha = alpha

      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
      ctx.fill()
      if (particle.type === "success" || particle.type === "sparkle") {
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * alpha * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
    ctx.restore()
  }
  clear() {
    this.particles = []
  }
}
window.ParticleSystem = ParticleSystem
