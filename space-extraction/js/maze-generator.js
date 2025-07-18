class MazeGenerator {
  constructor(width, height, difficulty) {
    this.width = width
    this.height = height
    this.difficulty = difficulty
    this.cellSize = 60 
    this.maze = []
    this.obstacles = [] 
    this.dynamicObstacles = [] 
    this.startPoint = { x: 80, y: 80 }
    this.exitPoint = { x: width - 80, y: height - 80 }
  }
  generate() {
    this.createBaseMaze()
    this.addStaticObstacles()
    this.addDynamicObstacles() 
    this.addPowerUps()
    this.ensurePath()
    return {
      obstacles: this.obstacles,
      dynamicObstacles: this.dynamicObstacles, 
      startPoint: this.startPoint,
      exitPoint: this.exitPoint,
    }
  }
  createBaseMaze() {
    const cols = Math.floor(this.width / this.cellSize)
    const rows = Math.floor(this.height / this.cellSize)
    this.maze = Array(rows)
      .fill()
      .map(() => Array(cols).fill(0))
    const wallDensity = {
      easy: 0.15,
      normal: 0.25,
      hard: 0.4,
      nightmare: 0.55,
    }
    const density = wallDensity[this.difficulty] || 0.25
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() < density) {
          this.maze[row][col] = 1 
        }
      }
    }
    this.clearArea(1, 1, 4, 4) 
    this.clearArea(cols - 5, rows - 5, 4, 4) 
    this.createMainPathways(cols, rows)
  }
  createMainPathways(cols, rows) {
    const midRow = Math.floor(rows / 2)
    for (let col = 0; col < cols; col++) {
      this.maze[midRow][col] = 0
      if (midRow > 0) this.maze[midRow - 1][col] = 0
      if (midRow < rows - 1) this.maze[midRow + 1][col] = 0
    }
    const midCol = Math.floor(cols / 2)
    for (let row = 0; row < rows; row++) {
      this.maze[row][midCol] = 0
      if (midCol > 0) this.maze[row][midCol - 1] = 0
      if (midCol < cols - 1) this.maze[row][midCol + 1] = 0
    }
  }
  clearArea(startCol, startRow, width, height) {
    for (let row = startRow; row < startRow + height && row < this.maze.length; row++) {
      for (let col = startCol; col < startCol + width && col < this.maze[0].length; col++) {
        if (row >= 0 && col >= 0) {
          this.maze[row][col] = 0
        }
      }
    }
  }
  addStaticObstacles() {
    const obstacleTypes = {
      easy: ["asteroid"],
      normal: ["asteroid", "planet"],
      hard: ["asteroid", "planet", "structure"],
      nightmare: ["asteroid", "planet", "structure", "energy_field"],
    }
    const types = obstacleTypes[this.difficulty] || ["asteroid"]
    for (let row = 0; row < this.maze.length; row++) {
      for (let col = 0; col < this.maze[0].length; col++) {
        if (this.maze[row][col] === 1) {
          const x = col * this.cellSize + this.cellSize / 2
          const y = row * this.cellSize + this.cellSize / 2
          const type = types[Math.floor(Math.random() * types.length)]

          this.obstacles.push(this.createObstacle(x, y, type))
        }
      }
    }
    this.addRandomObstacles(types)
  }
  createObstacle(x, y, type) {
    const baseObstacle = {
      x: x,
      y: y,
      type: type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
    }
    switch (type) {
      case "asteroid":
        return {
          ...baseObstacle,
          size: 15 + Math.random() * 10,
          color: "#888888",
          shape: "irregular",
        }
      case "planet":
        return {
          ...baseObstacle,
          size: 20 + Math.random() * 15,
          color: this.getRandomPlanetColor(),
          shape: "circle",
          atmosphere: true,
        }
      case "structure":
        return {
          ...baseObstacle,
          size: 18 + Math.random() * 12,
          color: "#666666",
          shape: "rectangle",
          lights: true,
        }
      case "energy_field":
        return {
          ...baseObstacle,
          size: 25 + Math.random() * 10,
          color: "#ff00ff",
          shape: "energy",
          pulse: 0,
          dangerous: true,
        }

      default:
        return baseObstacle
    }
  }
  getRandomPlanetColor() {
    const colors = ["#4169E1", "#228B22", "#DC143C", "#FF8C00", "#9370DB", "#20B2AA"]
    return colors[Math.floor(Math.random() * colors.length)]
  }
  addRandomObstacles(types) {
    const count = {
      easy: 5,
      normal: 10,
      hard: 15,
      nightmare: 20,
    }
    const obstacleCount = count[this.difficulty] || 10
    for (let i = 0; i < obstacleCount; i++) {
      let x, y
      let attempts = 0
      do {
        x = Math.random() * (this.width - 100) + 50
        y = Math.random() * (this.height - 100) + 50
        attempts++
      } while (this.isNearPath(x, y) && attempts < 50)

      if (attempts < 50) {
        const type = types[Math.floor(Math.random() * types.length)]
        this.obstacles.push(this.createObstacle(x, y, type))
      }
    }
  }
  isNearPath(x, y) {
    const startDist = Math.sqrt((x - this.startPoint.x) ** 2 + (y - this.startPoint.y) ** 2)
    const exitDist = Math.sqrt((x - this.exitPoint.x) ** 2 + (y - this.exitPoint.y) ** 2)

    return startDist < 80 || exitDist < 80
  }
  addDynamicObstacles() {
    const dynamicCount = {
      easy: 3,
      normal: 6,
      hard: 10,
      nightmare: 15,
    }
    const count = dynamicCount[this.difficulty] || 6
    const dynamicTypes = {
      easy: ["patrol", "orbit", "bounce"],
      normal: ["patrol", "orbit", "bounce"],
      hard: ["patrol", "orbit", "bounce", "laser_grid"], 
      nightmare: ["patrol", "orbit", "bounce", "laser_grid"], 
    }
    const types = dynamicTypes[this.difficulty] || ["patrol"]
    for (let i = 0; i < count; i++) {
      let x, y
      let attempts = 0
      do {
        x = Math.random() * (this.width - 200) + 100
        y = Math.random() * (this.height - 200) + 100
        attempts++
      } while (this.isNearPath(x, y) && attempts < 50)
      if (attempts < 50) {
        const type = types[Math.floor(Math.random() * types.length)]
        this.dynamicObstacles.push(this.createDynamicObstacle(x, y, type)) 
      }
    }
  }
  createDynamicObstacle(x, y, movementType) {
    const baseObstacle = {
      x: x,
      y: y,
      originalX: x,
      originalY: y,
      size: 20 + Math.random() * 15,
      type: "moving_asteroid",
      color: "#ff6666",
      movementType: movementType,
      speed: 30 + Math.random() * 40,
      angle: Math.random() * Math.PI * 2,
      time: 0,
      radius: 50 + Math.random() * 100, 
    }
    if (movementType === "laser_grid") {
      return {
        ...baseObstacle,
        type: "laser_grid",
        orientation: Math.random() < 0.5 ? "horizontal" : "vertical",
        length: 100 + Math.random() * 100, 
        thickness: 5 + Math.random() * 5, 
        cycleDuration: 3 + Math.random() * 2, 
        activeDuration: 1 + Math.random() * 0.5, 
        damage: 50, 
        active: false,
        color: "#ff0000",
        size: 0, 
      }
    }
    return baseObstacle
  }
  addPowerUps() {
    const powerUpCount = {
      easy: 2,
      normal: 3,
      hard: 4,
      nightmare: 5,
    }
    const count = powerUpCount[this.difficulty] || 3
    for (let i = 0; i < count; i++) {
      let x, y
      let attempts = 0
      do {
        x = Math.random() * (this.width - 200) + 100
        y = Math.random() * (this.height - 200) + 100
        attempts++
      } while (this.isNearPath(x, y) && attempts < 50)
      if (attempts < 50) {
        const types = ["speed", "shield", "phase"]
        const type = types[Math.floor(Math.random() * types.length)]

        this.obstacles.push({
          x: x,
          y: y,
          size: 12,
          type: "powerup",
          powerType: type,
          color: "#00ff00",
          pulse: 0,
          collected: false,
        })
      }
    }
  }
  ensurePath() {
    const path = this.findPath(this.startPoint, this.exitPoint)
    if (!path || path.length === 0) {
      this.createEmergencyPath()
    }
  }
  findPath(start, end) {
    const openSet = [{ x: start.x, y: start.y, g: 0, h: this.heuristic(start, end), f: 0 }]
    const closedSet = []
    const cameFrom = new Map()
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()
      if (this.distance(current, end) < 30) {
        return this.reconstructPath(cameFrom, current)
      }
      closedSet.push(current)
      const neighbors = this.getNeighbors(current)
      for (const neighbor of neighbors) {
        if (closedSet.some((node) => this.distance(node, neighbor) < 10)) continue
        if (this.hasObstacleAt(neighbor.x, neighbor.y)) continue
        const tentativeG = current.g + this.distance(current, neighbor)
        const existingOpen = openSet.find((node) => this.distance(node, neighbor) < 10)
        if (existingOpen && tentativeG >= existingOpen.g) continue
        neighbor.g = tentativeG
        neighbor.h = this.heuristic(neighbor, end)
        neighbor.f = neighbor.g + neighbor.h
        cameFrom.set(`${neighbor.x},${neighbor.y}`, current)
        if (!existingOpen) {
          openSet.push(neighbor)
        }
      }
    }
    return null
  }
  getNeighbors(node) {
    const neighbors = []
    const step = 20

    for (let dx = -step; dx <= step; dx += step) {
      for (let dy = -step; dy <= step; dy += step) {
        if (dx === 0 && dy === 0) continue

        const x = node.x + dx
        const y = node.y + dy

        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          neighbors.push({ x, y })
        }
      }
    }
    return neighbors
  }
  hasObstacleAt(x, y) {
    if (
      this.obstacles.some((obstacle) => {
        const dist = Math.sqrt((x - obstacle.x) ** 2 + (y - obstacle.y) ** 2)
        return dist < obstacle.size + 20 
      })
    ) {
      return true
    }
    if (
      this.dynamicObstacles.some((obstacle) => {
        if (obstacle.type === "laser_grid") {
          const halfLength = obstacle.length / 2
          const halfThickness = obstacle.thickness / 2
          let minX, maxX, minY, maxY
          if (obstacle.orientation === "horizontal") {
            minX = obstacle.x - halfLength
            maxX = obstacle.x + halfLength
            minY = obstacle.y - halfThickness
            maxY = obstacle.y + halfThickness
          } else {
            minX = obstacle.x - halfThickness
            maxX = obstacle.x + halfThickness
            minY = obstacle.y - halfLength
            maxY = obstacle.y + halfLength
          }
          const buffer = 20
          return x > minX - buffer && x < maxX + buffer && y > minY - buffer && y < maxY + buffer
        } else {
          const dist = Math.sqrt((x - obstacle.x) ** 2 + (y - obstacle.y) ** 2)
          return dist < obstacle.size + 20
        }
      })
    ) {
      return true
    }
    return false
  }
  heuristic(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }
  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }
  reconstructPath(cameFrom, current) {
    const path = [current]
    let node = current
    while (cameFrom.has(`${node.x},${node.y}`)) {
      node = cameFrom.get(`${node.x},${node.y}`)
      path.unshift(node)
    }
    return path
  }

  createEmergencyPath() {
    const dx = this.exitPoint.x - this.startPoint.x
    const dy = this.exitPoint.y - this.startPoint.y
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) / 10
    for (let i = 0; i <= steps; i++) {
      const x = this.startPoint.x + (dx * i) / steps
      const y = this.startPoint.y + (dy * i) / steps
      this.obstacles = this.obstacles.filter((obstacle) => {
        const dist = Math.sqrt((x - obstacle.x) ** 2 + (y - obstacle.y) ** 2)
        return dist > 40
      })
      this.dynamicObstacles = this.dynamicObstacles.filter((obstacle) => {
        const dist = Math.sqrt((x - obstacle.x) ** 2 + (y - obstacle.y) ** 2)
        return dist > 40
      })
    }
  }
}
window.MazeGenerator = MazeGenerator