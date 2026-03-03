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
        <p>Загрузка данных профиля...</p>
      </div>

      <main v-else-if="profileData" class="content-area">
        <h1 class="page-header">Достижения и рейтинг</h1>

        <div class="grid-top-row">
          <section class="card badges-card">
            <div class="card-header">
              <div class="header-left-col">
                <h3>Значки</h3>
                <span class="sub-label">Получено {{ unlockedCount }} из 20</span>
              </div>
              <button class="link-btn" @click="showAllBadges = !showAllBadges">
                {{ showAllBadges ? 'Скрыть' : 'Показать все' }}
              </button>
            </div>

            <div class="badges-wrapper" :class="{ 'expanded': showAllBadges }">
              <div v-for="badge in visibleBadges" :key="badge.id" class="badge-element"
                :class="{ 'locked': !badge.isUnlocked, [badge.iconColor]: badge.isUnlocked }">
                <div class="diamond-shape">
                  <div class="diamond-content">
                    <span class="b-icon" v-if="badge.isUnlocked">🏆</span>
                    <span class="b-icon" v-else>🔒</span>
                    <span class="b-text" v-if="badge.isUnlocked">{{ badge.title.includes('%') ? badge.title : '5' }}</span>
                  </div>
                </div>
                <span class="badge-name">{{ badge.title }}</span>
              </div>
            </div>
          </section>

          <section class="card certificates-card">
            <div class="card-header">
              <h3>Грамоты</h3>
            </div>
            <div class="cert-slider">
              <button class="nav-arrow left">‹</button>
              <div class="cert-display">
                <div v-for="cert in profileData.certificates.slice(0, 3)" :key="cert.id" class="cert-item">
                  <div class="cert-frame">
                    <img src="https://via.placeholder.com/100x140?text=Diploma" alt="Грамота" class="cert-img">
                  </div>
                  <div class="cert-info">
                    <div class="cert-subj">{{ cert.achievementType }}</div>
                    <div class="cert-date">{{ new Date(cert.date).toLocaleDateString('ru-RU') }}</div>
                  </div>
                </div>
              </div>
              <button class="nav-arrow right">›</button>
            </div>
          </section>
        </div>

        <section class="card rating-main-card">
          <div class="card-header">
            <h3>Рейтинг в классе</h3>
            <span class="filter-dropdown">За неделю ⌄</span>
          </div>

          <div class="rating-body">
            <div class="stat-block">
              <span class="label">Место в классе</span>
              <div class="value-row">
                <span class="big-num">{{ profileData.stats.place }}</span>
                <span class="trend-icon up">▲</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="stat-block wide">
              <span class="label">Средний балл</span>
              <div class="value-row">
                <span class="big-num">{{ profileData.stats.averageGrade.toFixed(2) }}</span>
                <span class="trend-text up">+0,18</span>
              </div>
              <div class="mini-progress">
                <div class="bg-bar">
                  <div class="fill-bar" :style="{ width: (profileData.stats.averageGrade / 5 * 100) + '%' }"></div>
                </div>
                <div class="scale-nums"><span>5</span><span>4</span><span>3</span></div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="stat-block graph-block">
              <span class="label">Изменение среднего балла</span>
              <div class="chart-container">
                <span class="y-axis-val top">4.45</span>
                <svg viewBox="0 0 300 80" preserveAspectRatio="none">
                  <polyline fill="none" stroke="#4CD964" stroke-width="3" stroke-linecap="round"
                    stroke-linejoin="round" :points="calculateGraphPoints(profileData.stats.graphData)" />
                  <circle v-for="(p, i) in getPointsArray(profileData.stats.graphData)" :key="i" :cx="p.x" :cy="p.y"
                    r="4" fill="white" stroke="#4CD964" stroke-width="2" />
                </svg>
                <span class="y-axis-val bottom">4.25</span>
              </div>
              <div class="x-axis">
                <span>2 сен</span><span>3 сен</span><span>4 сен</span><span>5 сен</span><span>6 сен</span><span>7 сен</span>
              </div>
            </div>
          </div>
        </section>

        <section class="card parallel-card">
          <div class="card-header">
            <h3>Рейтинг параллели по среднему баллу</h3>
          </div>
          <div class="parallel-grid">
            <div v-for="(cls, idx) in profileData.parallelRating" :key="idx" class="parallel-col">
              <span class="cls-title">{{ cls.name }}</span>
              <div class="cls-val-row">
                <span class="cls-num">{{ cls.avg }}</span>
                <span class="cls-trend" :class="cls.trend.includes('-') ? 'down' : 'up'">
                  {{ cls.trend.includes('-') ? '▼' : '▲' }} {{ cls.trend }}
                </span>
              </div>
              <div class="cls-progress">
                <div class="cls-fill" :class="cls.trend.includes('-') ? 'bg-red' : 'bg-green'"
                  :style="{ width: (cls.avg / 5 * 100) + '%' }"></div>
              </div>
              <div class="scale-min"><span>5</span><span>4</span><span>3</span><span>2</span></div>
              <span v-if="cls.name === '10 А'" class="my-class-badge">Мой класс</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

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

// Список видимых значков (4 или все)
const visibleBadges = computed(() => {
  if (!profileData.value) return []
  return showAllBadges.value ? profileData.value.badges : profileData.value.badges.slice(0, 4)
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

// Логика отрисовки графика
const getPointsArray = (grades) => {
  if (!grades || grades.length < 2) return []
  const step = 300 / (grades.length - 1)
  // Масштабируем: 5 баллов вверху (y=10), 3 балла внизу (y=70)
  return grades.map((g, i) => ({ x: i * step, y: 80 - ((g - 3) * 30) })) 
}

const calculateGraphPoints = (grades) => getPointsArray(grades).map(p => `${p.x},${p.y}`).join(' ')
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background-color: #F8FAFC;
  overflow-y: auto;
}

.dashboard-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 40px 30px;
}

.loading-state {
  text-align: center;
  padding: 100px;
  color: #A0AEC0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4C6FFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Остальные стили карточек из твоего кода без изменений */
.page-header { font-size: 26px; color: #8E9DB0; font-weight: 500; margin-bottom: 30px; }
.card { background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(112, 144, 176, 0.08); margin-bottom: 25px; }
.card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 25px; }
.card-header h3 { font-size: 18px; font-weight: 600; color: #8E9DB0; margin: 0; }
.sub-label { display: block; font-size: 13px; color: #CBD5E0; margin-top: 4px; }
.link-btn { background: none; border: none; color: #4C6FFF; cursor: pointer; font-size: 13px; }

.grid-top-row { display: grid; grid-template-columns: 1fr 1.6fr; gap: 25px; }

/* Значки */
.badges-wrapper { display: flex; justify-content: flex-start; gap: 20px; flex-wrap: wrap; }
.badge-element { display: flex; flex-direction: column; align-items: center; width: 80px; }
.diamond-shape { width: 55px; height: 55px; transform: rotate(45deg); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
.diamond-content { transform: rotate(-45deg); text-align: center; }
.locked .diamond-shape { background: #EDF2F7; }
.gold .diamond-shape { background: linear-gradient(135deg, #F6AD55, #ED8936); }
.purple .diamond-shape { background: linear-gradient(135deg, #B794F4, #805AD5); }
.blue .diamond-shape { background: linear-gradient(135deg, #63B3ED, #4299E1); }
.b-text { color: white; font-weight: bold; font-size: 14px; }
.badge-name { font-size: 11px; color: #A0AEC0; text-align: center; }

/* Рейтинг */
.rating-body { display: flex; align-items: center; justify-content: space-between; }
.divider { width: 1px; height: 80px; background: #EDF2F7; margin: 0 30px; }
.big-num { font-size: 56px; font-weight: 700; color: #4A5568; }
.label { font-size: 14px; color: #CBD5E0; margin-bottom: 5px; }
.mini-progress { margin-top: 10px; }
.bg-bar { height: 6px; background: #EDF2F7; border-radius: 3px; position: relative; }
.fill-bar { height: 100%; background: #4CD964; border-radius: 3px; }
.scale-nums { display: flex; justify-content: space-between; font-size: 10px; color: #CBD5E0; margin-top: 4px; }

/* Графики и параллели */
.chart-container { height: 80px; position: relative; margin: 10px 0; }
.x-axis { display: flex; justify-content: space-between; font-size: 10px; color: #CBD5E0; }
.parallel-grid { display: flex; justify-content: space-between; gap: 20px; }
.parallel-col { flex: 1; text-align: center; }
.cls-num { font-size: 32px; font-weight: 700; color: #4A5568; }
.cls-progress { height: 6px; background: #EDF2F7; border-radius: 3px; margin: 10px 0; overflow: hidden; }
.bg-green { background: #4CD964; }
.bg-red { background: #FF3B30; }
</style>