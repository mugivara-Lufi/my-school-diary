<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import TheHeader from '../components/TheHeader.vue'

const route = useRoute()
const profileData = ref(null)
const loading = ref(true)
const showAllBadges = ref(false)

// Режим графика: 'week', 'month', 'year'
const chartMode = ref('week')

const GRAPH_WIDTH = 300
const GRAPH_HEIGHT = 100

// Расчет количества открытых значков
const unlockedCount = computed(() => profileData.value?.badges.filter(b => b.isUnlocked).length || 0)

// Список видимых значков
const visibleBadges = computed(() => {
  if (!profileData.value) return []
  return showAllBadges.value ? profileData.value.badges : profileData.value.badges.slice(0, 5)
})

// Загрузка данных
onMounted(async () => {
  try {
    const studentId = route.params.id
    const response = await axios.get(`https://jdhfnmhb-7081.euw.devtunnels.ms/api/Profile/${studentId}`)
    profileData.value = response.data
    console.log('Profile data:', profileData.value) // Для отладки
  } catch (e) {
    console.error("Ошибка загрузки профиля:", e)
  } finally {
    loading.value = false
  }
})

// Преобразование даты в день недели (Пн=1, Вс=7)
const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr)
  let day = date.getDay() // 0=Вс, 1=Пн, ..., 6=Сб
  if (day === 0) day = 7 // Превращаем Вс из 0 в 7
  return day
}

// Получение названия дня недели
const getDayName = (dayNum) => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return days[dayNum - 1]
}

// Группировка по дням недели (усреднение оценок за одинаковые дни)
const groupByWeekdays = (grades) => {
  if (!grades || grades.length === 0) return []
  
  const weekdayGroups = {}
  
  grades.forEach(grade => {
    const dayOfWeek = getDayOfWeek(grade.date)
    if (!weekdayGroups[dayOfWeek]) {
      weekdayGroups[dayOfWeek] = { sum: 0, count: 0 }
    }
    weekdayGroups[dayOfWeek].sum += grade.value
    weekdayGroups[dayOfWeek].count++
  })
  
  // Создаем массив для всех 7 дней недели (Пн=1...Вс=7)
  const result = []
  for (let day = 1; day <= 7; day++) {
    if (weekdayGroups[day]) {
      result.push({
        label: getDayName(day),
        value: weekdayGroups[day].sum / weekdayGroups[day].count,
        fullDate: null
      })
    } else {
      result.push({
        label: getDayName(day),
        value: null,
        fullDate: null
      })
    }
  }
  return result
}

// Группировка по месяцам
const groupByMonths = (grades) => {
  if (!grades || grades.length === 0) return []
  
  const monthGroups = {}
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
  
  grades.forEach(grade => {
    const date = new Date(grade.date)
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
    const monthName = monthNames[date.getMonth()]
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = { 
        sum: 0, 
        count: 0, 
        label: monthName, 
        year: date.getFullYear(), 
        month: date.getMonth(),
        sortKey: date.getTime()
      }
    }
    monthGroups[monthKey].sum += grade.value
    monthGroups[monthKey].count++
  })
  
  // Сортируем по дате и берем последние 6 месяцев для графика
  return Object.values(monthGroups)
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-6)
    .map(m => ({
      label: `${m.label} ${m.year}`,
      value: m.sum / m.count,
      fullDate: null
    }))
}

// Группировка по годам
const groupByYears = (grades) => {
  if (!grades || grades.length === 0) return []
  
  const yearGroups = {}
  
  grades.forEach(grade => {
    const date = new Date(grade.date)
    const year = date.getFullYear()
    
    if (!yearGroups[year]) {
      yearGroups[year] = { sum: 0, count: 0, label: `${year}` }
    }
    yearGroups[year].sum += grade.value
    yearGroups[year].count++
  })
  
  return Object.values(yearGroups)
    .sort((a, b) => parseInt(a.label) - parseInt(b.label))
    .map(y => ({
      label: y.label,
      value: y.sum / y.count,
      fullDate: null
    }))
}

// Основные данные для графика в зависимости от режима
const chartData = computed(() => {
  if (!profileData?.value?.stats?.graphData) return []
  if (profileData.value.stats.graphData.length === 0) return []
  
  const rawGrades = profileData.value.stats.graphData
  
  switch (chartMode.value) {
    case 'week':
      return groupByWeekdays(rawGrades)
    case 'month':
      return groupByMonths(rawGrades)
    case 'year':
      return groupByYears(rawGrades)
    default:
      return groupByWeekdays(rawGrades)
  }
})

// Фильтруем null значения для отображения
const filteredChartData = computed(() => {
  return chartData.value.filter(item => item.value !== null)
})

// Метки для оси X
const xLabels = computed(() => {
  return filteredChartData.value.map(item => item.label || '—')
})

// Получение координат для графика
const getCoords = () => {
  const data = filteredChartData.value
  if (data.length === 0) return []
  
  const step = data.length === 1 ? GRAPH_WIDTH / 2 : GRAPH_WIDTH / (data.length - 1)
  const minValue = 2
  const maxValue = 5
  
  return data.map((item, i) => ({
    x: i * step,
    y: ((maxValue - item.value) / (maxValue - minValue)) * (GRAPH_HEIGHT - 20) + 10,
    val: item.value.toFixed(2),
    label: item.label
  }))
}

// Плавная кривая
const smoothPath = () => {
  const points = getCoords()
  if (points.length < 2) return ""
  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const mx = (curr.x + next.x) / 2
    d += ` C ${mx},${curr.y} ${mx},${next.y} ${next.x},${next.y}`
  }
  return d
}

// Заливка под кривой
const fillPath = () => {
  const points = getCoords()
  if (points.length === 0) return ""
  const path = smoothPath()
  if (!path) return ""
  return `${path} L ${points[points.length - 1].x},${GRAPH_HEIGHT} L 0,${GRAPH_HEIGHT} Z`
}

// Переключение режима
const setChartMode = (mode) => {
  chartMode.value = mode
}

// Форматирование даты для сертификатов
const formatDate = (dateString) => {
  if (!dateString) return 'Дата не указана'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="page-wrapper">
    <TheHeader v-if="profileData" :userName="profileData.student.fullName" :studentId="route.params.id" />

    <div class="dashboard-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Синхронизация с базой данных...</p>
      </div>

      <main v-else-if="profileData" class="content-area">
        <div class="welcome-section">
          <h1 class="page-header">Профиль ученика</h1>
          <span class="class-tag">{{ profileData.student.className }}</span>
        </div>

        <div class="grid-top-row">
          <section class="card badges-card">
            <div class="card-header">
              <div class="header-left-col">
                <h3>Достижения</h3>
                <span class="sub-label">Собрано {{ unlockedCount }} из {{ profileData.badges.length }}</span>
              </div>
              <button class="link-btn" @click="showAllBadges = !showAllBadges">
                {{ showAllBadges ? 'Свернуть' : 'Все награды' }}
              </button>
            </div>

            <div class="badges-wrapper" :class="{ 'expanded': showAllBadges }">
              <div v-for="badge in visibleBadges" :key="badge.id" class="badge-element"
                :class="{ 'locked': !badge.isUnlocked, [badge.iconColor]: badge.isUnlocked }">
                <div class="diamond-shape">
                  <div class="diamond-content">
                    <span class="b-icon">{{ badge.isUnlocked ? '🏆' : '🔒' }}</span>
                  </div>
                </div>
                <span class="badge-name">{{ badge.title }}</span>
              </div>
            </div>
          </section>

          <section class="card certificates-card">
            <div class="card-header">
              <h3>Портфолио</h3>
              <span class="sub-label">Последние документы</span>
            </div>
            <div class="cert-display">
              <div v-for="cert in profileData.certificates.slice(0, 3)" :key="cert.id" class="cert-item">
                <div class="cert-icon">📄</div>
                <div class="cert-info">
                  <div class="cert-subj">{{ cert.achievementType || 'Достижение' }}</div>
                  <div class="cert-date">{{ formatDate(cert.date) }}</div>
                </div>
              </div>
              <div v-if="profileData.certificates.length === 0" class="empty-certs">
                <span class="empty-icon">🎓</span>
                <p>Пока нет грамот</p>
              </div>
            </div>
          </section>
        </div>

        <section class="card rating-main-card">
          <div class="rating-grid">
            <div class="stat-block">
              <span class="label">Место в классе</span>
              <div class="value-row">
                <span class="big-num">{{ profileData.stats.place }}</span>
                <span class="total-count">/{{ profileData.stats.totalStudents }}</span>
              </div>
              <div class="trend up">▲ В рейтинге</div>
            </div>

            <div class="divider"></div>

            <div class="stat-block wide">
              <span class="label">Средний балл</span>
              <div class="value-row">
                <span class="big-num">{{ profileData.stats.averageGrade.toFixed(2) }}</span>
                <span class="total-count">из 5.00</span>
              </div>
              <div class="mini-progress">
                <div class="bg-bar">
                  <div class="fill-bar" :style="{ width: (profileData.stats.averageGrade / 5 * 100) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="stat-block graph-block">
              <div class="graph-header">
                <span class="label">Успеваемость</span>
                <div class="mode-switch">
                  <button 
                    class="mode-btn" 
                    :class="{ active: chartMode === 'week' }"
                    @click="setChartMode('week')"
                  >
                    По дням
                  </button>
                  <button 
                    class="mode-btn" 
                    :class="{ active: chartMode === 'month' }"
                    @click="setChartMode('month')"
                  >
                    По месяцам
                  </button>
                  <button 
                    class="mode-btn" 
                    :class="{ active: chartMode === 'year' }"
                    @click="setChartMode('year')"
                  >
                    По годам
                  </button>
                </div>
              </div>
              <div class="chart-container" v-if="filteredChartData.length > 0">
                <svg :viewBox="`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`" preserveAspectRatio="none" class="main-svg">
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stop-color="#4C6FFF" />
                      <stop offset="100%" stop-color="#70E1F5" />
                    </linearGradient>
                    <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#4C6FFF" stop-opacity="0.2" />
                      <stop offset="100%" stop-color="#4C6FFF" stop-opacity="0" />
                    </linearGradient>
                  </defs>

                  <!-- Сетка -->
                  <g class="grid-lines">
                    <line x1="0" y1="10" :x2="GRAPH_WIDTH" y2="10" stroke="#EDF2F7" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="0" :y1="GRAPH_HEIGHT / 2" :x2="GRAPH_WIDTH" :y2="GRAPH_HEIGHT / 2" stroke="#EDF2F7" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="0" :y1="GRAPH_HEIGHT - 10" :x2="GRAPH_WIDTH" :y2="GRAPH_HEIGHT - 10" stroke="#EDF2F7" stroke-width="1" stroke-dasharray="4 4" />
                  </g>

                  <!-- Заливка и линия -->
                  <path :d="fillPath()" fill="url(#fillGradient)" />
                  <path :d="smoothPath()" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round" class="path-animation" />

                  <!-- Точки данных -->
                  <g v-for="(p, i) in getCoords()" :key="i" class="data-point">
                    <circle :cx="p.x" :cy="p.y" r="4" class="visible-dot" />
                    <circle :cx="p.x" :cy="p.y" r="15" fill="transparent" class="hover-area">
                      <title>{{ p.label }}: {{ p.val }} баллов</title>
                    </circle>
                  </g>
                </svg>
              </div>
              <div v-else class="no-data-message">
                <span class="no-data-icon">📊</span>
                <p>Нет данных для отображения</p>
                <span class="no-data-hint">Добавьте оценки, чтобы увидеть график</span>
              </div>
              <div class="x-axis" v-if="filteredChartData.length > 0">
                <span v-for="(label, idx) in xLabels" :key="idx">{{ label }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="card parallel-card">
          <div class="card-header">
            <h3>Средний балл группы</h3>
          </div>
          <div class="parallel-grid">
            <div v-for="(cls, idx) in profileData.parallelRating" :key="idx" class="parallel-col"
              :class="{ 'is-mine': cls.name === profileData.student.className }">
              <div class="cls-header">
                <span class="cls-title">{{ cls.name }}</span>
                <span class="cls-avg">{{ cls.avg.toFixed(2) }}</span>
              </div>
              <div class="cls-progress">
                <div class="cls-fill" :class="parseFloat(cls.trend) >= 0 ? 'bg-green' : 'bg-red'"
                  :style="{ width: (cls.avg / 5 * 100) + '%' }"></div>
              </div>
              <div class="cls-footer">
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #F0F2F5 0%, #E8ECF1 100%);
  color: #2D3748;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.welcome-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  animation: fadeInUp 0.5s ease;
}

.page-header {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #1A202C 0%, #2D3748 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.class-tag {
  background: linear-gradient(135deg, #4C6FFF 0%, #6B46FF 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(76, 111, 255, 0.3);
}

.card {
  background: white;
  border-radius: 28px;
  padding: 25px;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  margin-bottom: 25px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 40px -12px rgba(0, 0, 0, 0.1);
}

.grid-top-row {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 25px;
}

.badges-wrapper {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.diamond-shape {
  width: 60px;
  height: 60px;
  background: #EDF2F7;
  transform: rotate(45deg);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.badge-element:hover .diamond-shape {
  transform: rotate(45deg) scale(1.05);
}

.diamond-content {
  transform: rotate(-45deg);
  font-size: 24px;
}

.badge-element {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 85px;
  gap: 12px;
  cursor: pointer;
}

.badge-name {
  font-size: 11px;
  font-weight: 600;
  color: #718096;
  text-align: center;
  line-height: 1.3;
}

.gold .diamond-shape {
  background: linear-gradient(135deg, #F6AD55, #ED8936);
  box-shadow: 0 5px 15px rgba(237, 137, 54, 0.3);
}

.blue .diamond-shape {
  background: linear-gradient(135deg, #63B3ED, #4299E1);
  box-shadow: 0 5px 15px rgba(66, 153, 225, 0.3);
}

.purple .diamond-shape {
  background: linear-gradient(135deg, #B794F4, #805AD5);
  box-shadow: 0 5px 15px rgba(128, 90, 213, 0.3);
}

.locked .diamond-shape {
  background: #E2E8F0;
  filter: grayscale(0.3);
}

.cert-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #F7FAFC;
  border-radius: 18px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.cert-item:hover {
  background: #EDF2F7;
  transform: translateX(5px);
}

.cert-icon { font-size: 28px; }
.cert-subj { font-weight: 700; font-size: 14px; color: #2D3748; }
.cert-date { font-size: 11px; color: #A0AEC0; margin-top: 4px; }

.empty-certs {
  text-align: center;
  padding: 30px 20px;
  color: #A0AEC0;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.rating-grid {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  flex-wrap: wrap;
}

.stat-block {
  flex: 1;
  padding: 0 15px;
  min-width: 150px;
}

.big-num {
  font-size: 52px;
  font-weight: 800;
  background: linear-gradient(135deg, #1A202C 0%, #4A5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.total-count {
  font-size: 20px;
  color: #A0AEC0;
  font-weight: 600;
  margin-left: 5px;
}

.label {
  font-size: 12px;
  font-weight: 700;
  color: #A0AEC0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.divider {
  width: 1px;
  background: linear-gradient(to bottom, transparent, #E2E8F0, transparent);
  margin: 0 15px;
}

.mini-progress {
  margin-top: 15px;
}

.bg-bar {
  height: 6px;
  background: #EDF2F7;
  border-radius: 10px;
  overflow: hidden;
}

.fill-bar {
  height: 100%;
  background: linear-gradient(90deg, #4C6FFF, #70E1F5);
  border-radius: 10px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ГРАФИК */
.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.mode-switch {
  display: flex;
  gap: 5px;
  background: #F1F5F9;
  border-radius: 40px;
  padding: 3px;
}

.mode-btn {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  background: transparent;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748B;
}

.mode-btn.active {
  background: #4C6FFF;
  color: white;
  box-shadow: 0 2px 8px rgba(76, 111, 255, 0.4);
}

.mode-btn:hover:not(.active) {
  background: #E2E8F0;
  color: #1E293B;
}

.chart-container {
  height: 100px;
  margin-top: 10px;
  position: relative;
}

.main-svg {
  overflow: visible;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 12px rgba(76, 111, 255, 0.15));
}

.visible-dot {
  fill: white;
  stroke: #4C6FFF;
  stroke-width: 2.5;
  transition: all 0.2s ease;
  cursor: pointer;
}

.data-point:hover .visible-dot {
  r: 6;
  fill: #4C6FFF;
  stroke: white;
  stroke-width: 2;
}

.path-animation {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw 1.5s ease forwards;
}

@keyframes draw { 
  to { stroke-dashoffset: 0; } 
}

.x-axis {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #94A3B8;
  font-weight: 500;
  margin-top: 12px;
  padding: 0 5px;
}

.x-axis span {
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-area { cursor: help; }

.no-data-message {
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  font-size: 13px;
  text-align: center;
}

.no-data-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.no-data-hint {
  font-size: 10px;
  margin-top: 5px;
  opacity: 0.6;
}

/* ПАРАЛЛЕЛИ */
.parallel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.parallel-col {
  background: #F8FAFC;
  padding: 18px;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.parallel-col:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.parallel-col.is-mine {
  background: linear-gradient(135deg, #EBF4FF 0%, #E0EEFF 100%);
  border: 1px solid #BEE3F8;
  box-shadow: 0 5px 15px rgba(76, 111, 255, 0.1);
}

.cls-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.cls-title { 
  font-weight: 700; 
  font-size: 16px;
  color: #2D3748;
}

.cls-avg { 
  font-weight: 800; 
  font-size: 20px;
  background: linear-gradient(135deg, #4C6FFF 0%, #6B46FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cls-progress {
  height: 8px;
  background: #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.cls-fill { 
  height: 100%; 
  transition: width 1s ease-out;
  border-radius: 10px;
}

.bg-green { background: linear-gradient(90deg, #48BB78, #38A169); }
.bg-red { background: linear-gradient(90deg, #F56565, #E53E3E); }

.cls-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cls-trend { 
  font-size: 12px; 
  font-weight: 700; 
}

.up { color: #48BB78; }
.down { color: #F56565; }

.cls-rank {
  font-size: 18px;
}

.spinner {
  width: 45px;
  height: 45px;
  border: 4px solid #EDF2F7;
  border-top-color: #4C6FFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.link-btn {
  background: none;
  border: none;
  color: #4C6FFF;
  font-weight: 700;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.link-btn:hover {
  color: #6B46FF;
  transform: translateX(3px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .grid-top-row {
    grid-template-columns: 1fr;
  }
  
  .rating-grid {
    flex-direction: column;
    gap: 20px;
  }
  
  .divider {
    width: 100%;
    height: 1px;
    margin: 10px 0;
  }
  
  .parallel-grid {
    grid-template-columns: 1fr;
  }
  
  .graph-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .mode-switch {
    justify-content: center;
  }
}
</style>