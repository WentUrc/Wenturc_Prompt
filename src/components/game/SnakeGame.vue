<template>
  <div class="snake-game">
    <div class="game-header">
      <h4>🐍 贪吃蛇小游戏</h4>
      <div class="game-info">
        <span class="score">得分: {{ score }}</span>
        <span class="high-score">最高: {{ highScore }}</span>
      </div>
    </div>
    
    <div class="game-container">
      <div 
        class="game-board" 
        ref="gameBoard"
        :style="{ 
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`
        }"
      >
        <div
          v-for="(cell, index) in board"
          :key="index"
          :class="[
            'cell',
            {
              'snake-head': cell === 'head',
              'snake-body': cell === 'body',
              'food': cell === 'food',
              'empty': cell === 'empty'
            }
          ]"
        ></div>
      </div>
      
      <div class="game-overlay" v-if="!isPlaying">
        <div class="game-message">
          <div v-if="!gameStarted" class="start-message">
            <p>🎮 点击开始游戏</p>
            <p class="controls">使用 WASD 或方向键控制</p>
          </div>
          <div v-else class="game-over-message">
            <p>🎯 游戏结束</p>
            <p>最终得分: {{ score }}</p>
            <p v-if="isNewRecord" class="new-record">🏆 新纪录！</p>
          </div>
          <el-button 
            type="primary" 
            size="small"
            @click="startGame"
            class="start-btn"
          >
            {{ gameStarted ? '重新开始' : '开始游戏' }}
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="game-controls">
      <div class="control-buttons">
        <el-button-group>
          <el-button size="small" @click="changeDirection('up')">↑</el-button>
        </el-button-group>
        <div class="middle-row">
          <el-button size="small" @click="changeDirection('left')">←</el-button>
          <el-button 
            size="small" 
            :type="isPlaying ? 'warning' : 'success'"
            @click="toggleGame"
          >
            {{ isPlaying ? '暂停' : '继续' }}
          </el-button>
          <el-button size="small" @click="changeDirection('right')">→</el-button>
        </div>
        <el-button-group>
          <el-button size="small" @click="changeDirection('down')">↓</el-button>
        </el-button-group>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'

// 游戏状态
const boardSize = ref(12)
const snake = ref([{ x: 5, y: 5 }])
const food = ref({ x: 8, y: 8 })
const direction = ref({ x: 1, y: 0 })
const nextDirection = ref({ x: 1, y: 0 })
const isPlaying = ref(false)
const gameStarted = ref(false)
const score = ref(0)
const highScore = ref(parseInt(localStorage.getItem('snakeHighScore') || '0'))
const isNewRecord = ref(false)
const gameLoop = ref(null)

// 游戏板
const board = computed(() => {
  const newBoard = Array(boardSize.value * boardSize.value).fill('empty')
  
  // 放置蛇
  snake.value.forEach((segment, index) => {
    const pos = segment.y * boardSize.value + segment.x
    if (pos >= 0 && pos < newBoard.length) {
      newBoard[pos] = index === 0 ? 'head' : 'body'
    }
  })
  
  // 放置食物
  const foodPos = food.value.y * boardSize.value + food.value.x
  if (foodPos >= 0 && foodPos < newBoard.length) {
    newBoard[foodPos] = 'food'
  }
  
  return newBoard
})

// 开始游戏
const startGame = () => {
  resetGame()
  isPlaying.value = true
  gameStarted.value = true
  gameLoop.value = setInterval(updateGame, 200)
}

// 重置游戏
const resetGame = () => {
  snake.value = [{ x: 5, y: 5 }]
  food.value = generateFood()
  direction.value = { x: 1, y: 0 }
  nextDirection.value = { x: 1, y: 0 }
  score.value = 0
  isNewRecord.value = false
}

// 暂停/继续游戏
const toggleGame = () => {
  if (!gameStarted.value) return
  
  if (isPlaying.value) {
    clearInterval(gameLoop.value)
    isPlaying.value = false
  } else {
    isPlaying.value = true
    gameLoop.value = setInterval(updateGame, 200)
  }
}

// 游戏主循环
const updateGame = () => {
  if (!isPlaying.value) return
  
  direction.value = { ...nextDirection.value }
  
  const head = { ...snake.value[0] }
  head.x += direction.value.x
  head.y += direction.value.y
  
  // 检查碰撞
  if (checkCollision(head)) {
    gameOver()
    return
  }
  
  snake.value.unshift(head)
  
  // 检查是否吃到食物
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10
    food.value = generateFood()
  } else {
    snake.value.pop()
  }
}

// 检查碰撞
const checkCollision = (head) => {
  // 撞墙
  if (head.x < 0 || head.x >= boardSize.value || head.y < 0 || head.y >= boardSize.value) {
    return true
  }
  
  // 撞自己
  return snake.value.some(segment => segment.x === head.x && segment.y === head.y)
}

// 生成食物
const generateFood = () => {
  let newFood
  do {
    newFood = {
      x: Math.floor(Math.random() * boardSize.value),
      y: Math.floor(Math.random() * boardSize.value)
    }
  } while (snake.value.some(segment => segment.x === newFood.x && segment.y === newFood.y))
  
  return newFood
}

// 改变方向
const changeDirection = (dir) => {
  if (!isPlaying.value) return
  
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  }
  
  const newDir = directions[dir]
  
  // 防止反向移动
  if (newDir.x !== -direction.value.x || newDir.y !== -direction.value.y) {
    nextDirection.value = newDir
  }
}

// 游戏结束
const gameOver = () => {
  clearInterval(gameLoop.value)
  isPlaying.value = false
  
  if (score.value > highScore.value) {
    highScore.value = score.value
    isNewRecord.value = true
    localStorage.setItem('snakeHighScore', highScore.value.toString())
  }
}

// 键盘控制
const handleKeyPress = (event) => {
  const keyMap = {
    'ArrowUp': 'up',
    'ArrowDown': 'down', 
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'w': 'up',
    'W': 'up',
    's': 'down',
    'S': 'down',
    'a': 'left',
    'A': 'left',
    'd': 'right',
    'D': 'right'
  }
  
  if (keyMap[event.key]) {
    event.preventDefault()
    changeDirection(keyMap[event.key])
  }
  
  if (event.key === ' ') {
    event.preventDefault()
    if (gameStarted.value) {
      toggleGame()
    } else {
      startGame()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
  }
})
</script>

<style scoped>
.snake-game {
  background: var(--background-color);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color-light);
  max-width: 300px;
  margin: 0 auto;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.game-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-color);
}

.game-info {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
}

.score {
  color: var(--primary-color);
  font-weight: 600;
}

.high-score {
  color: var(--warning-color);
  font-weight: 600;
}

.game-container {
  position: relative;
  margin-bottom: 12px;
}

.game-board {
  display: grid;
  gap: 1px;
  background: var(--border-color-light);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  max-width: 240px;
  margin: 0 auto;
}

.cell {
  background: var(--background-color-light);
  transition: all 0.1s ease;
}

.cell.snake-head {
  background: var(--primary-color);
  position: relative;
}

.cell.snake-head::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  background: white;
  border-radius: 50%;
}

.cell.snake-body {
  background: color-mix(in srgb, var(--primary-color) 70%, transparent);
}

.cell.food {
  background: var(--danger-color);
  border-radius: 50%;
  position: relative;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.game-message {
  text-align: center;
  color: white;
  padding: 20px;
}

.start-message p, .game-over-message p {
  margin: 8px 0;
}

.controls {
  font-size: 0.75rem;
  opacity: 0.8;
}

.new-record {
  color: var(--warning-color);
  font-weight: 600;
  animation: bounce 0.5s ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.start-btn {
  margin-top: 12px;
}

.game-controls {
  text-align: center;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.middle-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-button) {
  min-width: 32px;
  padding: 4px 8px;
}

/* 深色模式适配 */
.dark-mode .cell {
  background: var(--background-color-dark);
}

.dark-mode .cell.empty {
  background: color-mix(in srgb, var(--background-color-dark) 80%, white);
}
</style>
