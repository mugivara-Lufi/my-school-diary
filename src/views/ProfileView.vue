<template>
  <div class="page-wrapper">
    <TheHeader v-if="profileData" :userName="profileData.student.fullName" :studentId="route.params.id" />

    <div class="dashboard-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка профиля...</p>
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
                :class="{ 'locked': !badge.isUnlocked, [badge.iconColor]: badge.isUnlocked }"
                @click="showBadgeDetails(badge)">
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
              <div class="header-left-col">
                <h3>Портфолио</h3>
                <span class="sub-label">Последние документы</span>
              </div>
              <button class="link-btn" @click="openAddCertificateModal">➕ Добавить грамоту</button>
            </div>
            <div class="cert-display">
              <div v-for="cert in profileData.certificates.slice(0, 3)" :key="cert.id" class="cert-item" @click="showCertificateDetails(cert)">
                <div class="cert-icon">📄</div>
                <div class="cert-info">
                  <div class="cert-subj">{{ cert.achievementType || 'Достижение' }}</div>
                  <div class="cert-date">{{ formatDate(cert.date) }}</div>
                </div>
                <button class="delete-cert-btn" @click.stop="deleteCertificate(cert.id)">🗑️</button>
              </div>
              <div v-if="profileData.certificates.length === 0" class="empty-certs">
                <span class="empty-icon">🎓</span>
                <p>Пока нет грамот</p>
                <button class="link-btn" @click="openAddCertificateModal">Добавить первую грамоту</button>
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

                  <g class="grid-lines">
                    <line x1="0" y1="10" :x2="GRAPH_WIDTH" y2="10" stroke="#EDF2F7" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="0" :y1="GRAPH_HEIGHT / 2" :x2="GRAPH_WIDTH" :y2="GRAPH_HEIGHT / 2" stroke="#EDF2F7" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="0" :y1="GRAPH_HEIGHT - 10" :x2="GRAPH_WIDTH" :y2="GRAPH_HEIGHT - 10" stroke="#EDF2F7" stroke-width="1" stroke-dasharray="4 4" />
                  </g>

                  <path :d="fillPath()" fill="url(#fillGradient)" />
                  <path :d="smoothPath()" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round" class="path-animation" />

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

    <!-- Модальное окно для добавления грамоты -->
    <div v-if="showCertificateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>➕ Добавление грамоты</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Название грамоты / достижения *</label>
            <input type="text" v-model="newCertificate.title" placeholder="Например: Победитель олимпиады по математике">
          </div>
          
          <div class="form-group">
            <label>Тип достижения</label>
            <select v-model="newCertificate.type">
              <option value="olympiad">🏆 Олимпиада</option>
              <option value="competition">🎯 Конкурс</option>
              <option value="sports">⚽ Спортивное достижение</option>
              <option value="academic">📚 Учебное достижение</option>
              <option value="other">✨ Другое</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Дата получения *</label>
            <input type="date" v-model="newCertificate.date">
          </div>
          
          <div class="form-group">
            <label>Описание (необязательно)</label>
            <textarea v-model="newCertificate.description" rows="3" placeholder="Подробности о достижении..."></textarea>
          </div>
          
          <div class="form-group">
            <label>Ссылка на файл (PDF/изображение)</label>
            <input type="url" v-model="newCertificate.fileUrl" placeholder="https://...">
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Отмена</button>
          <button class="btn-primary" @click="saveCertificate" :disabled="!canSave">Сохранить</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно для просмотра деталей грамоты -->
    <div v-if="selectedCertificate" class="modal-overlay" @click.self="closeCertificateModal">
      <div class="modal-content certificate-details-modal">
        <div class="modal-header">
          <h3>📜 Детали грамоты</h3>
          <button class="modal-close" @click="closeCertificateModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="certificate-preview" v-if="selectedCertificate.fileLink">
            <img v-if="isImageFile(selectedCertificate.fileLink)" :src="selectedCertificate.fileLink" alt="Грамота" class="certificate-image" @error="handleImageError">
            <div v-else class="file-link-container">
              <a :href="selectedCertificate.fileLink" target="_blank" class="file-link">📄 Открыть файл грамоты</a>
            </div>
          </div>
          
          <div class="certificate-info">
            <div class="info-row">
              <span class="info-label">Название:</span>
              <span class="info-value">{{ selectedCertificate.description || selectedCertificate.achievementType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Тип:</span>
              <span class="info-value">{{ getTypeName(selectedCertificate.achievementType) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Дата получения:</span>
              <span class="info-value">{{ formatDate(selectedCertificate.date) }}</span>
            </div>
            <div class="info-row" v-if="selectedCertificate.fileLink">
              <span class="info-label">Ссылка:</span>
              <a :href="selectedCertificate.fileLink" target="_blank" class="info-link">Скачать файл</a>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeCertificateModal">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно для просмотра деталей достижения -->
    <div v-if="selectedBadge" class="modal-overlay" @click.self="closeBadgeModal">
      <div class="modal-content badge-details-modal">
        <div class="modal-header">
          <h3>🏆 Детали достижения</h3>
          <button class="modal-close" @click="closeBadgeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="badge-icon-large" :class="selectedBadge.iconColor">
            <span class="badge-emoji">{{ selectedBadge.isUnlocked ? '🏆' : '🔒' }}</span>
          </div>
          
          <div class="badge-info">
            <div class="info-row">
              <span class="info-label">Название:</span>
              <span class="info-value">{{ selectedBadge.title }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Описание:</span>
              <span class="info-value">{{ selectedBadge.description }}</span>
            </div>
            <div class="info-row" v-if="selectedBadge.isUnlocked && selectedBadge.earnedReason">
              <span class="info-label">Причина получения:</span>
              <span class="info-value earned-reason">{{ selectedBadge.earnedReason }}</span>
            </div>
            <div class="info-row" v-if="!selectedBadge.isUnlocked">
              <span class="info-label">Статус:</span>
              <span class="info-value locked-status">🔒 Ещё не получено</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeBadgeModal">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import TheHeader from '../components/TheHeader.vue'
import { API_URL } from '../router/config.js'

const route = useRoute()
const profileData = ref(null)
const loading = ref(true)
const showAllBadges = ref(false)
const chartMode = ref('week')
const showCertificateModal = ref(false)
const selectedCertificate = ref(null)
const selectedBadge = ref(null)
const GRAPH_WIDTH = 300
const GRAPH_HEIGHT = 100

const newCertificate = ref({
  title: '',
  type: 'olympiad',
  date: new Date().toISOString().split('T')[0],
  description: '',
  fileUrl: ''
})

const canSave = computed(() => {
  return newCertificate.value.title.trim() && newCertificate.value.date
})

// Открытие модальных окон
const openAddCertificateModal = () => {
  newCertificate.value = {
    title: '',
    type: 'olympiad',
    date: new Date().toISOString().split('T')[0],
    description: '',
    fileUrl: ''
  }
  showCertificateModal.value = true
}

const showCertificateDetails = (cert) => {
  selectedCertificate.value = cert
}

const closeCertificateModal = () => {
  selectedCertificate.value = null
}

const showBadgeDetails = (badge) => {
  selectedBadge.value = badge
}

const closeBadgeModal = () => {
  selectedBadge.value = null
}

const closeModal = () => {
  showCertificateModal.value = false
}

// Вспомогательные функции
const isImageFile = (url) => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  return imageExtensions.some(ext => url.toLowerCase().includes(ext))
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.innerHTML = '<div class="image-error">❌ Не удалось загрузить изображение</div>'
}

const getTypeName = (type) => {
  const types = {
    'olympiad': '🏆 Олимпиада',
    'competition': '🎯 Конкурс',
    'sports': '⚽ Спортивное достижение',
    'academic': '📚 Учебное достижение',
    'other': '✨ Другое'
  }
  return types[type] || type || 'Достижение'
}

const saveCertificate = async () => {
  if (!canSave.value) return
  
  try {
    const studentId = route.params.id
    const response = await axios.post(`${API_URL}/api/Profile/${studentId}/certificate`, {
      achievementType: newCertificate.value.type,
      description: newCertificate.value.title + (newCertificate.value.description ? `: ${newCertificate.value.description}` : ''),
      date: newCertificate.value.date,
      fileLink: newCertificate.value.fileUrl || null
    })
    
    if (response.data.success) {
      await fetchData()
      closeModal()
    }
  } catch (error) {
    console.error('Ошибка при сохранении грамоты:', error)
    alert('Не удалось сохранить грамоту')
  }
}

const deleteCertificate = async (certId) => {
  if (!confirm('Удалить эту грамоту?')) return
  
  try {
    const studentId = route.params.id
    await axios.delete(`${API_URL}/api/Profile/${studentId}/certificate/${certId}`)
    await fetchData()
  } catch (error) {
    console.error('Ошибка при удалении:', error)
    alert('Не удалось удалить грамоту')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Дата не указана'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const unlockedCount = computed(() => profileData.value?.badges.filter(b => b.isUnlocked).length || 0)

const visibleBadges = computed(() => {
  if (!profileData.value) return []
  return showAllBadges.value ? profileData.value.badges : profileData.value.badges.slice(0, 5)
})

const fetchData = async () => {
  try {
    const studentId = route.params.id
    const response = await axios.get(`${API_URL}/api/Profile/${studentId}`)
    profileData.value = response.data
    console.log('Profile data:', profileData.value)
  } catch (e) {
    console.error("Ошибка загрузки профиля:", e)
  } finally {
    loading.value = false
  }
}

// Функции для графика
const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr)
  let day = date.getDay()
  if (day === 0) day = 7
  return day
}

const getDayName = (dayNum) => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return days[dayNum - 1]
}

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
  
  return Object.values(monthGroups)
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-6)
    .map(m => ({
      label: `${m.label} ${m.year}`,
      value: m.sum / m.count,
      fullDate: null
    }))
}

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

const filteredChartData = computed(() => {
  return chartData.value.filter(item => item.value !== null)
})

const xLabels = computed(() => {
  return filteredChartData.value.map(item => item.label || '—')
})

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

const fillPath = () => {
  const points = getCoords()
  if (points.length === 0) return ""
  const path = smoothPath()
  if (!path) return ""
  return `${path} L ${points[points.length - 1].x},${GRAPH_HEIGHT} L 0,${GRAPH_HEIGHT} Z`
}

const setChartMode = (mode) => {
  chartMode.value = mode
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.certificate-details-modal .modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.certificate-preview {
  margin-bottom: 20px;
  text-align: center;
  background: #F7FAFC;
  border-radius: 20px;
  padding: 20px;
}

.certificate-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-link-container {
  padding: 20px;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4C6FFF 0%, #6B46FF 100%);
  color: white;
  text-decoration: none;
  border-radius: 40px;
  font-weight: 600;
  transition: transform 0.2s;
}

.file-link:hover {
  transform: translateY(-2px);
}

.image-error {
  color: #E53E3E;
  padding: 20px;
  text-align: center;
}

.certificate-info {
  background: #F8FAFC;
  border-radius: 20px;
  padding: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.info-label {
  width: 120px;
  font-weight: 600;
  color: #4A5568;
}

.info-value {
  flex: 1;
  color: #2D3748;
}

.info-link {
  color: #4C6FFF;
  text-decoration: none;
}

.info-link:hover {
  text-decoration: underline;
}

/* Модальное окно деталей достижения */
.badge-details-modal .modal-body {
  text-align: center;
}

.badge-icon-large {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  background: #EDF2F7;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
}

.badge-emoji {
  transform: rotate(-45deg);
  font-size: 48px;
}

.badge-icon-large.gold {
  background: linear-gradient(135deg, #F6AD55, #ED8936);
}

.badge-icon-large.blue {
  background: linear-gradient(135deg, #63B3ED, #4299E1);
}

.badge-icon-large.purple {
  background: linear-gradient(135deg, #B794F4, #805AD5);
}

.badge-icon-large.silver {
  background: linear-gradient(135deg, #CBD5E0, #A0AEC0);
}

.badge-icon-large.bronze {
  background: linear-gradient(135deg, #FBD38D, #DD6B20);
}

.badge-info {
  text-align: left;
  background: #F8FAFC;
  border-radius: 20px;
  padding: 20px;
}

.earned-reason {
  color: #48BB78;
  font-style: italic;
}

.locked-status {
  color: #A0AEC0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .info-row {
    flex-direction: column;
    gap: 5px;
  }
  
  .info-label {
    width: auto;
  }
  
  .badge-icon-large {
    width: 80px;
    height: 80px;
  }
  
  .badge-emoji {
    font-size: 38px;
  }
}




.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 28px;
  width: 90%;
  max-width: 560px;
  max-height: 85vh;
  overflow-x: hidden;  /* ← Скрываем горизонтальный скролл */
  overflow-y: auto;    /* ← Вертикальный оставляем */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: fadeInUp 0.3s ease;
}

.modal-body {
  padding: 24px;
  overflow-x: hidden;  /* ← Скрываем горизонтальный скролл внутри тела */
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
  box-sizing: border-box;  /* ← Важно: чтобы padding не увеличивал ширину */
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E2E8F0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1A202C;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #A0AEC0;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #F1F5F9;
  color: #4C6FFF;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #E2E8F0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4A5568;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4C6FFF;
  box-shadow: 0 0 0 3px rgba(76, 111, 255, 0.1);
}

.btn-primary, .btn-secondary {
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #4C6FFF 0%, #6B46FF 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 111, 255, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #F1F5F9;
  color: #64748B;
}

.btn-secondary:hover {
  background: #E2E8F0;
}

.delete-cert-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;
  padding: 5px;
}

.delete-cert-btn:hover {
  opacity: 1;
  color: #E53E3E;
}











.loading-state {
  text-align: center;
  padding: 100px 0;
}

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

.cert-icon {
  font-size: 28px;
}

.cert-subj {
  font-weight: 700;
  font-size: 14px;
  color: #2D3748;
}

.cert-date {
  font-size: 11px;
  color: #A0AEC0;
  margin-top: 4px;
}

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
  to {
    stroke-dashoffset: 0;
  }
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

.hover-area {
  cursor: help;
}

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

.bg-green {
  background: linear-gradient(90deg, #48BB78, #38A169);
}

.bg-red {
  background: linear-gradient(90deg, #F56565, #E53E3E);
}

.cls-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cls-trend {
  font-size: 12px;
  font-weight: 700;
}

.up {
  color: #48BB78;
}

.down {
  color: #F56565;
}

.cls-rank {
  font-size: 18px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #E9EDF7;
  border-top-color: #4318FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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

/* Стили для полей ввода в модальном окне восстановления пароля */
.reset-info {
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 20px;
  line-height: 1.5;
}

.input-group {
  margin-bottom: 20px;
}

.modal-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-input.error {
  border-color: #e53e3e;
}

.success-message {
  background: #c6f6d5;
  color: #276749;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  margin-top: 15px;
}

.error-message {
  background: #fed7d7;
  color: #c53030;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  margin-top: 15px;
}

.modal-cancel, .modal-submit {
  padding: 10px 24px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.modal-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.modal-cancel:hover {
  background: #e2e8f0;
}

.modal-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.modal-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>