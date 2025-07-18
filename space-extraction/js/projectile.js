class Projectile {
  constructor(x, y, angle, speed, damage, owner) {
    this.x = x
    this.y = y
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.damage = damage
    this.owner = owner 
    this.life = 2.0 
    this.size = 3
    this.color = owner === "player" ? "#00ffff" : "#ff0000"
  }
  update(deltaTime) {
    this.x += this.vx * deltaTime * 60
    this.y += this.vy * deltaTime * 60
    this.life -= deltaTime
    return this.life > 0
  }
  render(ctx) {
    ctx.save()
    ctx.fillStyle = this.color
    ctx.shadowBlur = 10
    ctx.shadowColor = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(this.x - this.vx * 0.1, this.y - this.vy * 0.1, this.size * 0.7, 0, Math.PI * 2)
    ctx.fill()
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
}
class ProjectileManager {
  constructor() {
    this.projectiles = []
  }
  addProjectile(x, y, angle, speed, damage, owner) {
    this.projectiles.push(new Projectile(x, y, angle, speed, damage, owner))
  }
  update(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].update(deltaTime)) {
        this.projectiles.splice(i, 1)
      }
    }
  }
  render(ctx) {
    for (const projectile of this.projectiles) {
      projectile.render(ctx)
    }
  }
  getProjectilesByOwner(owner) {
    return this.projectiles.filter((p) => p.owner === owner)
  }
  removeProjectile(projectile) {
    const index = this.projectiles.indexOf(projectile)
    if (index > -1) {
      this.projectiles.splice(index, 1)
    }
  }
  clear() {
    this.projectiles = []
  }
}
window.Projectile = Projectile
window.ProjectileManager = ProjectileManager