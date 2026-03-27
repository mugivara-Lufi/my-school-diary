<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import TheHeader from '../components/TheHeader.vue'

const route = useRoute()
const profileData = ref(null)
const loading = ref(true)
const showAllBadges = ref(false)

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
    const response = await axios.get(`https://localhost:7081/api/Profile/${studentId}`)
    profileData.value = response.data
  } catch (e) {
    console.error("Ошибка загрузки профиля:", e)
  } finally {
    loading.value = false
  }
})

// Логика отрисовки графика (улучшенная)
const getPointsArray = (grades) => {
  if (!grades || grades.length < 2) return []
  const width = 300
  const height = 80
  const step = width / (grades.length - 1)
  
  // Масштабируем: 5 баллов = верх (5px), 2 балла = низ (75px)
  return grades.map((g, i) => ({ 
    x: i * step, 
    y: height - ((g - 2) * (height / 3)) - 10 
  })) 
}

const calculateGraphPoints = (grades) => getPointsArray(grades).map(p => `${p.x},${p.y}`).join(' ')

// Для заливки под графиком
const calculateAreaPoints = (grades) => {
  const points = getPointsArray(grades)
  if (points.length === 0) return ""
  return `${points[0].x},80 ` + points.map(p => `${p.x},${p.y}`).join(' ') + ` ${points[points.length-1].x},80`
}
</script>

<template>
  <div class="page-wrapper">
    <TheHeader 
      v-if="profileData" 
      :userName="profileData.student.fullName" 
      :studentId="route.params.id" 
    />

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
              <div v-for="cert in profileData.certificates.slice(0, 2)" :key="cert.id" class="cert-item">
                <div class="cert-icon">📄</div>
                <div class="cert-info">
                  <div class="cert-subj">{{ cert.achievementType }}</div>
                  <div class="cert-date">{{ new Date(cert.date).toLocaleDateString('ru-RU') }}</div>
                </div>
              </div>
              <div v-if="profileData.certificates.length === 0" class="empty-certs">Пока нет грамот</div>
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
              <div class="trend up">▲ На этой неделе</div>
            </div>

            <div class="divider"></div>

            <div class="stat-block wide">
              <span class="label">Средний балл</span>
              <div class="value-row">
                <span class="big-num">{{ profileData.stats.averageGrade.toFixed(2) }}</span>
              </div>
              <div class="mini-progress">
                <div class="bg-bar">
                  <div class="fill-bar" :style="{ width: (profileData.stats.averageGrade / 5 * 100) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="stat-block graph-block">
              <span class="label">Динамика успеваемости</span>
              <div class="chart-container">
                <svg viewBox="0 0 300 80" preserveAspectRatio="none" class="main-svg">
                  <polyline fill="rgba(76, 111, 255, 0.1)" :points="calculateAreaPoints(profileData.stats.graphData)" />
                  <polyline fill="none" stroke="#4C6FFF" stroke-width="3" stroke-linecap="round"
                    stroke-linejoin="round" :points="calculateGraphPoints(profileData.stats.graphData)" />
                  <circle v-for="(p, i) in getPointsArray(profileData.stats.graphData)" :key="i" :cx="p.x" :cy="p.y"
                    r="4" fill="white" stroke="#4C6FFF" stroke-width="2" />
                </svg>
              </div>
              <div class="x-axis">
                <span>Пн</span><span>Ср</span><span>Пт</span><span>Вс</span>
              </div>
            </div>
          </div>
        </section>

        <section class="card parallel-card">
          <div class="card-header">
            <h3>Лидеры параллели</h3>
          </div>
          <div class="parallel-grid">
            <div v-for="(cls, idx) in profileData.parallelRating" :key="idx" class="parallel-col" :class="{ 'is-mine': cls.name.includes('А') }">
              <div class="cls-header">
                <span class="cls-title">{{ cls.name }}</span>
                <span class="cls-avg">{{ cls.avg }}</span>
              </div>
              <div class="cls-progress">
                <div class="cls-fill" :class="cls.trend.includes('-') ? 'bg-red' : 'bg-green'"
                  :style="{ width: (cls.avg / 5 * 100) + '%' }"></div>
              </div>
              <span class="cls-trend" :class="cls.trend.includes('-') ? 'down' : 'up'">
                {{ cls.trend.includes('-') ? '▼' : '▲' }} {{ cls.trend }}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ОБЩИЕ СТИЛИ */
.page-wrapper {
  min-height: 100vh;
  background-color: #F0F2F5;
  color: #2D3748;
  font-family: 'Inter', sans-serif;
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
}

.page-header { font-size: 28px; font-weight: 800; color: #1A202C; margin: 0; }
.class-tag { background: #4C6FFF; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }

.card {
  background: white;
  border-radius: 24px;
  padding: 25px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0,0,0,0.02);
  margin-bottom: 25px;
}

/* СЕТКА */
.grid-top-row { display: grid; grid-template-columns: 1.8fr 1fr; gap: 25px; }

/* ЗНАЧКИ (АЛМАЗЫ) */
.badges-wrapper {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.diamond-shape {
  width: 60px;
  height: 60px;
  background: #EDF2F7;
  transform: rotate(45deg);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.diamond-content { transform: rotate(-45deg); font-size: 22px; }
.badge-element { display: flex; flex-direction: column; align-items: center; width: 85px; gap: 15px; }
.badge-name { font-size: 11px; font-weight: 600; color: #718096; text-align: center; line-height: 1.2; }

/* Цвета значков */
.gold .diamond-shape { background: linear-gradient(135deg, #F6AD55, #ED8936); box-shadow: 0 5px 15px rgba(237, 137, 54, 0.3); }
.blue .diamond-shape { background: linear-gradient(135deg, #63B3ED, #4299E1); box-shadow: 0 5px 15px rgba(66, 153, 225, 0.3); }
.purple .diamond-shape { background: linear-gradient(135deg, #B794F4, #805AD5); box-shadow: 0 5px 15px rgba(128, 90, 213, 0.3); }

/* ГРАМОТЫ */
.cert-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #F7FAFC;
  border-radius: 16px;
  margin-bottom: 10px;
}
.cert-icon { font-size: 24px; }
.cert-subj { font-weight: 700; font-size: 14px; }
.cert-date { font-size: 12px; color: #A0AEC0; }

/* РЕЙТИНГОВАЯ ПАНЕЛЬ */
.rating-grid { display: flex; align-items: center; justify-content: space-around; }
.stat-block { flex: 1; padding: 0 10px; }
.big-num { font-size: 48px; font-weight: 800; color: #1A202C; }
.total-count { font-size: 20px; color: #A0AEC0; font-weight: 600; }
.label { font-size: 13px; font-weight: 700; color: #A0AEC0; text-transform: uppercase; letter-spacing: 0.5px; }
.divider { width: 1px; height: 70px; background: #E2E8F0; margin: 0 20px; }

/* ГРАФИК */
.chart-container { height: 80px; margin: 15px 0 10px; }
.main-svg { overflow: visible; width: 100%; height: 100%; }
.x-axis { display: flex; justify-content: space-between; font-size: 11px; color: #CBD5E0; font-weight: 600; }

/* ПАРАЛЛЕЛИ */
.parallel-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.parallel-col { background: #F8FAFC; padding: 15px; border-radius: 18px; transition: transform 0.2s; }
.parallel-col.is-mine { background: #EBF4FF; border: 1px solid #BEE3F8; transform: scale(1.05); }
.cls-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.cls-title { font-weight: 700; }
.cls-avg { font-weight: 800; color: #4C6FFF; }
.cls-progress { height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
.cls-fill { height: 100%; transition: width 1s ease-out; }
.bg-green { background: #48BB78; }
.bg-red { background: #F56565; }
.cls-trend { font-size: 11px; font-weight: 700; }
.up { color: #48BB78; }
.down { color: #F56565; }

/* ЗАГРУЗКА */
.spinner { width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top-color: #4C6FFF; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.link-btn { background: none; border: none; color: #4C6FFF; font-weight: 700; cursor: pointer; }
</style>