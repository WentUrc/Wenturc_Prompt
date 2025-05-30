<template>
  <div class="bongo-cat-original">
    <div class="game-header">
      <h4>🥁 Bongo Cat</h4>
      <div class="controls-hint">
        <span class="key">A</span>
        <span class="key">D</span>
        <span class="key wide">S</span>
      </div>
    </div>
    
    <div class="bongo-container" ref="bongoContainer">
      <div class="cat-emoji">
        <!-- 猫头 - 根据状态变化 -->
        <div class="cat-head" ref="catHead">
          {{ currentCatFace }}
        </div>
        
        <!-- 左爪 - 按A键时显示 -->
        <div class="paw-left" ref="pawLeft" :class="{ active: showLeftPaw }">
          🐾
        </div>
        
        <!-- 右爪 - 按D键时显示 -->
        <div class="paw-right" ref="pawRight" :class="{ active: showRightPaw }">
          🐾
        </div>
      </div>
      
      <!-- 鼓 -->
      <div class="bongo-drums" ref="bongo" :class="{ hit: drumHit }">
        🥁
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 组件引用
const bongoContainer = ref(null)
const catHead = ref(null)
const pawLeft = ref(null)
const pawRight = ref(null)
const bongo = ref(null)

// 游戏状态
const pressed = []
const audioBuffers = {}
const currentCatFace = ref('😸')
const showLeftPaw = ref(false)
const showRightPaw = ref(false)
const drumHit = ref(false)

// 音频上下文
let audioContext = null

// 键值映射
const KeyEnum = Object.freeze({
  "A": 1,
  "D": 0,
  "S": 0
})

// 初始化音频
const initAudio = async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    await loadSounds()
  } catch (error) {
    console.log('Audio not available:', error)
  }
}

// 加载音效文件
const loadSounds = async () => {
  const soundFiles = [
    { name: 'bongo0', url: '/bongo-cat/sounds/bongo0.wav' },
    { name: 'bongo1', url: '/bongo-cat/sounds/bongo1.wav' },
    { name: 'meow', url: '/bongo-cat/sounds/meow.wav' }
  ]

  for (const sound of soundFiles) {
    try {
      const response = await fetch(sound.url)
      const arrayBuffer = await response.arrayBuffer()
      audioBuffers[sound.name] = await audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.log('Failed to load sound:', sound.name, error)
    }
  }
}

// 播放音效
const playSound = (soundName) => {
  if (!audioContext || !audioBuffers[soundName]) return
  
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffers[soundName]
  source.connect(audioContext.destination)
  source.start()
}

// 处理按键
const handleKeyPress = (event) => {
  // 检查是否在输入框中，如果是则不响应游戏按键
  const activeElement = document.activeElement
  const isInputFocused = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable ||
    activeElement.closest('.el-input') || // Element Plus 输入框
    activeElement.closest('.el-textarea') || // Element Plus 文本域
    activeElement.closest('[contenteditable]') // 可编辑元素
  )
  
  if (isInputFocused) {
    return // 如果在输入框中，不处理游戏按键
  }
  
  const key = event.key.toUpperCase()
  
  if (key in KeyEnum) {
    event.preventDefault()
    playInstrument(key, true)
  }
}

const handleKeyRelease = (event) => {
  // 同样检查是否在输入框中
  const activeElement = document.activeElement
  const isInputFocused = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable ||
    activeElement.closest('.el-input') ||
    activeElement.closest('.el-textarea') ||
    activeElement.closest('[contenteditable]')
  )
  
  if (isInputFocused) {
    return
  }
  
  const key = event.key.toUpperCase()
  
  if (key in KeyEnum) {
    playInstrument(key, false)
  }
}

// 播放乐器
const playInstrument = (key, isPressed) => {
  const commonKey = KeyEnum[key]
  
  if (key === 'S') {
    // 喵叫
    if (isPressed && !pressed.includes(commonKey)) {
      pressed.push(commonKey)
      currentCatFace.value = '😻'
      playSound('meow')
      
      setTimeout(() => {
        currentCatFace.value = '😸'
        const index = pressed.indexOf(commonKey)
        if (index > -1) pressed.splice(index, 1)
      }, 300)
    }
  } else {
    // 敲鼓
    if (isPressed && !pressed.includes(commonKey)) {
      pressed.push(commonKey)
      
      if (commonKey === 0) {
        showRightPaw.value = true
      } else {
        showLeftPaw.value = true
      }
      
      drumHit.value = true
      currentCatFace.value = '😼'
      
      playSound(`bongo${commonKey}`)
      
      setTimeout(() => {
        showLeftPaw.value = false
        showRightPaw.value = false
        drumHit.value = false
        currentCatFace.value = '😸'
        
        const index = pressed.indexOf(commonKey)
        if (index > -1) pressed.splice(index, 1)
      }, 150)
    }
  }
}

onMounted(() => {
  initAudio()
  document.addEventListener('keydown', handleKeyPress)
  document.addEventListener('keyup', handleKeyRelease)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
  document.removeEventListener('keyup', handleKeyRelease)
})
</script>

<style scoped>
.bongo-cat-original {
  background: var(--background-color);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color-light);
  max-width: 300px;
  margin: 0 auto;
  user-select: none;
  overflow: hidden;
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

.controls-hint {
  display: flex;
  gap: 4px;
  align-items: center;
}

.key {
  display: inline-block;
  min-width: 20px;
  height: 20px;
  line-height: 20px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  text-align: center;
  padding: 0 4px;
}

.key.wide {
  min-width: 40px;
}

.bongo-container {
  position: relative;
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Emoji猫猫容器 */
.cat-emoji {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* 猫头：根据状态变化表情 */
.cat-head {
  font-size: 3rem;
  transition: all 0.2s ease;
  user-select: none;
}

/* 爪子：左右排列，按键时显示 */
.paw-left,
.paw-right {
  position: absolute;
  top: 20px;
  font-size: 1.5rem;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.15s ease;
  user-select: none;
}

.paw-left {
  left: -40px;
}

.paw-right {
  right: -40px;
}

.paw-left.active,
.paw-right.active {
  opacity: 1;
  transform: scale(1.2);
}

/* 鼓：在下方 */
.bongo-drums {
  position: absolute;
  bottom: 20px;
  font-size: 2.5rem;
  transition: all 0.15s ease;
  user-select: none;
}

.bongo-drums.hit {
  transform: scale(1.1);
  filter: brightness(1.3);
}

/* 深色模式适配 */
.dark-mode .bongo-container {
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
}

.dark-mode .key {
  background: #4a5568;
  border-color: #2d3748;
  color: #e2e8f0;
}
</style>
