<template>
  <div class="page-wrapper">
    <TheHeader 
      v-if="profileName"
      :userName="profileName" 
      :studentId="route.params.id" 
    />

    <div class="performance-container">
      <header class="view-header">
        <div class="header-main">
          <h1 class="page-title">Успеваемость</h1>
          <div class="quarter-selector">
            <select v-model="selectedQuarter">
              <option value="1">I четверть</option>
              <option value="2">II четверть</option>
              <option value="3">III четверть</option>
              <option value="4">IV четверть</option>
            </select>
          </div>
        </div>
        <button class="btn-primary-outline" @click="openJournal">Открыть журнал</button>
      </header>

      <section class="tools-panel">
        <div class="tool-group">
          <span class="tool-label">Целевой балл</span>
          <div class="goal-switcher">
            <button 
              v-for="val in [4, 5]" 
              :key="val"
              :class="{ active: globalGoal === val }" 
              @click="setGlobalGoal(val)"
            >
              На {{ val }}
            </button>
          </div>
        </div>

        <div class="tool-group">
          <span class="tool-label">Сортировка</span>
          <div class="sort-select">
            <select v-model="sortBy">
              <option value="default">По умолчанию</option>
              <option value="grade">По высокому баллу</option>
            </select>
          </div>
        </div>
      </section>

      <div class="performance-card">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка оценок...</p>
        </div>

        <table v-else class="modern-table">
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Текущие оценки</th>
              <th>Пропуски</th>
              <th>Средний балл</th>
              <th class="text-center">Цель</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedPerformance" :key="item.subjectName" class="table-row">
              <td class="subject-cell">
                <span class="subject-name">{{ item.subjectName }}</span>
              </td>
              
              <td class="grades-cell">
                <div class="grades-wrap">
                  <span 
                    v-for="(grade, idx) in item.grades" 
                    :key="idx" 
                    class="grade-badge" 
                    :class="getGradeClass(grade)"
                  >
                    {{ grade }}
                  </span>
                  <span v-if="!item.grades.length" class="empty-dash">—</span>
                </div>
              </td>

              <td class="attendance-cell">
                <span :class="{ 'has-absent': item.attendance > 0 }">
                  {{ item.attendance || 'Нет' }}
                </span>
              </td>

              <td class="avg-cell">
                <div class="avg-container">
                  <span class="avg-number">{{ item.averageGrade.toFixed(2) }}</span>
                  <div class="avg-indicator">
                    <div class="avg-bar-bg">
                      <div class="avg-bar-fill" :class="getGradeClass(Math.round(item.averageGrade))"
                           :style="{ width: (item.averageGrade / 5 * 100) + '%' }"></div>
                    </div>
                  </div>
                  <div v-if="item.showWarning" class="warning-icon" title="Спорная оценка">!</div>
                </div>
              </td>

              <td class="goal-cell">
                <div class="goal-target" :class="{ 'reached': item.averageGrade >= item.goalGrade }">
                  {{ item.goalGrade }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import TheHeader from '../components/TheHeader.vue';

const router = useRouter();
const route = useRoute();
const performanceData = ref([]);
const profileName = ref("");
const loading = ref(true);
const selectedQuarter = ref("1");
const globalGoal = ref(5);
const sortBy = ref("default");

const openJournal = () => {
  router.push(`/journal/${route.params.id}`);
};
const fetchData = async () => {
  loading.value = true;
  const studentId = route.params.id;
  try {
    const [perfResponse, profileResponse] = await Promise.all([
      axios.get(`https://localhost:7081/api/Grades/performance/${studentId}`),
      axios.get(`https://localhost:7081/api/Profile/${studentId}`)
    ]);
    performanceData.value = perfResponse.data;
    profileName.value = profileResponse.data.student.fullName;
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  } finally {
    loading.value = false;
  }
};

const sortedPerformance = computed(() => {
  const data = [...performanceData.value];
  if (sortBy.value === 'grade') {
    return data.sort((a, b) => b.averageGrade - a.averageGrade);
  }
  return data;
});

const setGlobalGoal = (val) => {
  globalGoal.value = val;
  performanceData.value.forEach(item => item.goalGrade = val);
};

const getGradeClass = (grade) => {
  if (grade >= 4.5 || grade === 5) return 'grade-5';
  if (grade >= 3.5 || grade === 4) return 'grade-4';
  if (grade > 0) return 'grade-3';
  return '';
};

onMounted(fetchData);
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background-color: #F4F7FE; /* Тот же фон, что в профиле */
  font-family: 'Inter', sans-serif;
  color: #2B3674;
}

.performance-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* HEADER СТИЛИ */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 25px;
}

.page-title {
  font-size: 30px;
  font-weight: 800;
  color: #2B3674;
  margin: 0;
}

.quarter-selector select {
  background: white;
  border: none;
  padding: 10px 15px;
  border-radius: 12px;
  font-weight: 600;
  color: #707EAE;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  outline: none;
}

.btn-primary-outline {
  background: transparent;
  border: 2px solid #4318FF;
  color: #4318FF;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary-outline:hover {
  background: #4318FF;
  color: white;
}

/* ПАНЕЛЬ ИНСТРУМЕНТОВ */
.tools-panel {
  display: flex;
  gap: 30px;
  background: white;
  padding: 20px 25px;
  border-radius: 20px;
  margin-bottom: 25px;
  box-shadow: 0px 18px 40px rgba(112, 144, 176, 0.06);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.tool-label {
  font-size: 14px;
  font-weight: 700;
  color: #A3AED0;
}

.goal-switcher {
  display: flex;
  background: #F4F7FE;
  padding: 4px;
  border-radius: 10px;
}

.goal-switcher button {
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  font-weight: 700;
  color: #707EAE;
  background: transparent;
  cursor: pointer;
}

.goal-switcher button.active {
  background: white;
  color: #4318FF;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.sort-select select {
  border: none;
  background: #F4F7FE;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 600;
  color: #2B3674;
}

/* ТАБЛИЦА */
.performance-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0px 18px 40px rgba(112, 144, 176, 0.06);
  overflow: hidden;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  background: #FAFCFE;
  padding: 16px 24px;
  text-align: left;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #A3AED0;
  border-bottom: 1px solid #E9EDF7;
}

.table-row {
  transition: background 0.2s;
}

.table-row:hover {
  background: #F9FAFF;
}

.modern-table td {
  padding: 18px 24px;
  border-bottom: 1px solid #E9EDF7;
}

.subject-name {
  font-weight: 700;
  font-size: 16px;
  color: #2B3674;
}

/* ОЦЕНКИ-ЧИПСЫ */
.grades-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grade-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 800;
  font-size: 14px;
}

.grade-5 { background: #E6FFF5; color: #05CD99; }
.grade-4 { background: #EFF4FF; color: #4318FF; }
.grade-3 { background: #FFF7E6; color: #FFB547; }

/* СРЕДНИЙ БАЛЛ И ИНДИКАТОР */
.avg-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avg-number {
  font-size: 18px;
  font-weight: 800;
  min-width: 40px;
}

.avg-indicator {
  width: 80px;
}

.avg-bar-bg {
  height: 6px;
  background: #F4F7FE;
  border-radius: 10px;
  overflow: hidden;
}

.avg-bar-fill {
  height: 100%;
  border-radius: 10px;
}

.avg-bar-fill.grade-5 { background: #05CD99; }
.avg-bar-fill.grade-4 { background: #4318FF; }
.avg-bar-fill.grade-3 { background: #FFB547; }

.warning-icon {
  width: 18px;
  height: 18px;
  background: #EE5D50;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
}

/* ЦЕЛЬ */
.goal-target {
  width: 42px;
  height: 42px;
  border: 2px dashed #E0E5F2;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-weight: 800;
  color: #A3AED0;
}

.goal-target.reached {
  border-style: solid;
  border-color: #4318FF;
  background: #F4F7FE;
  color: #4318FF;
}

/* ЗАГРУЗКА */
.loading-state {
  padding: 60px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #F4F7FE;
  border-top-color: #4318FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>