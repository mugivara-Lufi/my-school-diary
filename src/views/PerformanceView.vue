<template>
  <div class="page-wrapper">
    <TheHeader 
      :userName="profileName" 
      :studentId="route.params.id" 
    />

    <div class="performance-container">
      <div class="page-header">
        <div class="title-group">
          <h1>Успеваемость</h1>
          <div class="select-wrapper">
            <select v-model="selectedQuarter">
              <option value="1">1 четверть (текущая)</option>
              <option value="2">2 четверть</option>
            </select>
          </div>
        </div>
        <button class="btn-journal">Открыть журнал</button>
      </div>

      <div class="table-controls">
        <div class="goal-setter">
          <span class="label">Задать цели</span>
          <div class="goal-buttons">
            <button :class="{ active: globalGoal === 5 }" @click="setGlobalGoal(5)">5</button>
            <button :class="{ active: globalGoal === 4 }" @click="setGlobalGoal(4)">4</button>
          </div>
        </div>

        <div class="sort-wrapper">
          <span class="label">Упорядочить</span>
          <select v-model="sortBy">
            <option value="default">по умолчанию</option>
            <option value="grade">по баллу</option>
          </select>
        </div>
      </div>

      <div class="performance-card">
        <div v-if="loading" class="loading-text">Загрузка данных...</div>
        <table v-else class="performance-table">
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Последние оценки</th>
              <th>Посещаемость</th>
              <th>Средний балл</th>
              <th class="text-center">Цель</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in performanceData" :key="item.subjectName">
              <td class="subject-column">{{ item.subjectName }}</td>
              <td class="grades-column">
                <span v-for="(grade, idx) in item.grades" :key="idx" class="grade-item" :class="getGradeClass(grade)">
                  {{ grade }}
                </span>
                <span v-if="!item.grades.length" class="no-grades">—</span>
              </td>
              <td class="attendance-column">{{ item.attendance }}</td>
              <td class="avg-column">
                <span class="avg-value">{{ item.averageGrade.toFixed(2) }}</span>
                <div v-if="item.showWarning" class="warning-badge" title="Спорная оценка">!</div>
              </td>
              <td class="goal-column">
                <div class="goal-box">{{ item.goalGrade }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import TheHeader from '../components/TheHeader.vue'; // Импорт шапки

const route = useRoute();
const performanceData = ref([]);
const profileName = ref(""); // Для отображения имени в шапке
const loading = ref(true);
const selectedQuarter = ref("1");
const globalGoal = ref(5);
const sortBy = ref("default");

const fetchData = async () => {
  loading.value = true;
  const studentId = route.params.id;
  try {
    // Загружаем оба запроса параллельно вместо последовательно
    const [perfResponse, profileResponse] = await Promise.all([
      axios.get(`https://localhost:7081/api/Grades/performance/${studentId}`),
      axios.get(`https://localhost:7081/api/Profile/${studentId}`)
    ]);

    performanceData.value = [...perfResponse.data];
    profileName.value = profileResponse.data.student.fullName;

  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  } finally {
    loading.value = false;
  }
};

const setGlobalGoal = (val) => {
  globalGoal.value = val;
  performanceData.value.forEach(item => item.goalGrade = val);
};

const getGradeClass = (grade) => {
  if (grade === 5) return 'grade-5';
  if (grade === 4) return 'grade-4';
  if (grade <= 3) return 'grade-3';
  return '';
};

onMounted(fetchData);
</script>

<style scoped>
/* Общая обертка для фона и скролла */
.page-wrapper {
  min-height: 100vh;
  background-color: #F8FAFC;
}

.performance-container {
  padding: 40px 30px;
  max-width: 1240px;
  margin: 0 auto;
}

.loading-text {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

/* Шапка страницы (внутренняя) */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-group h1 {
  font-size: 28px;
  color: #8E9DB0; /* Цвет как в профиле */
  font-weight: 500;
}

/* Контролы */
.table-controls {
  display: flex;
  gap: 40px;
  margin-bottom: 25px;
  align-items: center;
}

.label {
  color: #cbd5e1;
  font-size: 14px;
}

.select-wrapper select {
  padding: 8px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #94a3b8;
  outline: none;
}

.btn-journal {
  padding: 10px 25px;
  border: 1px solid #cbd5e1;
  border-radius: 25px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.goal-buttons button {
  width: 35px;
  height: 35px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  margin-right: 8px;
}

.goal-buttons button.active {
  border-color: #4C6FFF;
  color: #4C6FFF;
  font-weight: bold;
}

/* Таблица */
.performance-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(112, 144, 176, 0.08);
  overflow: hidden;
}

.performance-table {
  width: 100%;
  border-collapse: collapse;
}

.performance-table th {
  text-align: left;
  padding: 20px;
  color: #cbd5e1;
  font-weight: 500;
  font-size: 13px;
  border-bottom: 1px solid #f8fafc;
}

.performance-table td {
  padding: 20px;
  border-bottom: 1px solid #f8fafc;
  color: #64748b;
}

.subject-column {
  color: #8e9db0;
  width: 25%;
}

.grade-item {
  margin-right: 12px;
  font-weight: 600;
}

/* Цвета оценок */
.grade-5 { color: #4CD964; }
.grade-4 { color: #4C6FFF; }
.grade-3 { color: #FF9500; }

.avg-value {
  font-weight: 700;
  color: #4A5568;
}

.no-grades { color: #cbd5e1; }

.warning-badge {
  display: inline-flex;
  width: 20px;
  height: 20px;
  background: #fff5f5;
  color: #ff5c5c;
  border: 1px solid #ff5c5c;
  border-radius: 50%;
  font-size: 12px;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
}

.goal-box {
  width: 40px;
  height: 40px;
  border: 2px solid #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: #4C6FFF;
  font-weight: 700;
}

.text-center { text-align: center; }
</style>