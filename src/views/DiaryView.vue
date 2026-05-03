<template>
  <div class="page-wrapper">
    <TheHeader v-if="profileName" :userName="profileName" :studentId="route.params.id" />

    <div class="diary-container">
      <header class="view-header">
        <div class="header-main">
          <h1 class="page-title">Учебный дневник</h1>
          <span class="week-range">{{ weekRangeStr }}</span>
        </div>
        <div class="week-navigation">
          <button class="nav-btn" @click="changeWeek(-1)">←</button>
          <button class="nav-btn active" @click="goToday">Сегодня</button>
          <button class="nav-btn" @click="changeWeek(1)">→</button>
        </div>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else class="diary-grid">
        <div v-for="day in diaryData" :key="day.date" class="day-card" :class="{ 'is-today': isToday(day.date) }">
          <div class="day-header">
            <h3 class="day-name">{{ day.dayOfWeek }}</h3>
            <span class="day-date">{{ formatDate(day.date) }}</span>
          </div>

          <div class="lessons-list">
            <div v-for="lesson in day.lessons" :key="lesson.id" class="lesson-item">
              <div class="lesson-main-info">
                <div class="lesson-time">
                  <span class="start">{{ lesson.time.split(' - ')[0] }}</span>
                  <span class="lesson-num">{{ lesson.lessonNumber }} пара</span>
                </div>
                
                <div class="lesson-content">
                  <div class="subject-row">
                    <h4 class="subject-name">{{ lesson.subjectName }}</h4>
                    <span v-if="lesson.grade" :class="['grade-badge', 'grade-' + lesson.grade]">
                      {{ lesson.grade }}
                    </span>
                  </div>
                  <p class="teacher-name">👤 {{ lesson.teacherName }} <span v-if="lesson.room">• каб. {{ lesson.room }}</span></p>
                </div>
              </div>

              <div class="homework-box" v-if="lesson.homework || lesson.topic">
                <div v-if="lesson.topic" class="topic-text">
                  <strong>Тема:</strong> {{ lesson.topic }}
                </div>
                <div v-if="lesson.homework" class="task-text">
                  <strong>Задание:</strong> {{ lesson.homework.taskText }}
                  <a v-if="lesson.homework.fileUrl" :href="lesson.homework.fileUrl" class="file-link">📎 Файл</a>
                </div>
              </div>
            </div>

            <div v-if="!day.lessons.length" class="empty-day-state">
              <p>Занятий не запланировано</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const diaryData = ref([]);
const loading = ref(true);
const currentWeekStart = ref(new Date());

const setInitialWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  currentWeekStart.value = monday;
};

const weekRangeStr = computed(() => {
  const start = new Date(currentWeekStart.value);
  const end = new Date(start);
  end.setDate(end.getDate() + 5); // Суббота
  
  const options = { day: 'numeric', month: 'long' };
  return `${start.toLocaleDateString('ru-RU', options)} — ${end.toLocaleDateString('ru-RU', options)}`;
});

const fetchData = async () => {
  loading.value = true;
  const startDate = currentWeekStart.value.toISOString().split('T')[0];
  
  try {
    const res = await axios.get(`https://localhost:7081/api/Diary/student/${route.params.id}`, {
      params: { startDate }
    });
    diaryData.value = res.data;
  } catch (error) {
    console.error("Ошибка загрузки дневника:", error);
  } finally {
    loading.value = false;
  }
};

const changeWeek = (direction) => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + (direction * 7));
  currentWeekStart.value = newDate;
  fetchData();
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

onMounted(() => {
  setInitialWeek();
  fetchData();
});
</script>

<style scoped>
.diary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 25px;
}

.day-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0px 18px 40px rgba(112, 144, 176, 0.08);
  transition: transform 0.2s;
  border: 2px solid transparent;
}

.day-card.is-today {
  border-color: #4318FF;
  background: #fbfaff;
}

.lesson-item {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #F4F7FE;
}

.lesson-main-info {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.lesson-time {
  display: flex;
  flex-direction: column;
  min-width: 65px;
}

.subject-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.grade-badge {
  padding: 4px 12px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 16px;
}

.grade-5 { background: #E8FDE8; color: #05A660; }
.grade-4 { background: #E1F4FF; color: #0075FF; }
.grade-3 { background: #FFF4E5; color: #FF9900; }
.grade-2 { background: #FFEDED; color: #E0282E; }

.homework-box {
  background: #F4F7FE;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  margin-left: 10px;
}

.task-text { margin-top: 5px; color: #4A5568; }
.topic-text { color: #2B3674; font-weight: 600; }

.file-link {
  display: inline-block;
  margin-left: 10px;
  color: #4318FF;
  text-decoration: none;
  font-weight: bold;
}

.empty-day-state {
  text-align: center;
  padding: 30px;
  color: #A3AED0;
  font-style: italic;
}
.page-wrapper {
  min-height: 100vh;
  background-color: #F4F7FE;
  padding: 40px 20px;
  color: #2B3674;
}

.diary-container {
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
}

.week-navigation {
  display: flex;
  align-items: center;
  background: white;
  padding: 8px 15px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  gap: 15px;
}

.current-week {
  font-weight: 700;
  color: #2B3674;
}

.nav-btn {
  border: none;
  background: #F4F7FE;
  padding: 8px 12px;
  border-radius: 8px;
  color: #4318FF;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}

.nav-btn:hover { background: #E9EDF7; }

/* РАЗВОРОТ ДНЕВНИКА */
.diary-spread {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Две колонки как в бумажном дневнике */
  gap: 30px;
  align-items: start;
}

.diary-day {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(112, 144, 176, 0.05);
  overflow: hidden;
}

.day-header {
  display: flex;
  justify-content: space-between;
  background: #4318FF;
  color: white;
  padding: 12px 20px;
  font-weight: 700;
}

.day-date { font-weight: 500; opacity: 0.8; }

.diary-table {
  width: 100%;
  border-collapse: collapse;
}

.diary-table th {
  text-align: left;
  padding: 12px;
  font-size: 12px;
  color: #A3AED0;
  text-transform: uppercase;
  border-bottom: 1px solid #E9EDF7;
}

.diary-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #F4F7FE;
  vertical-align: top;
}

.lesson-row:hover { background: #FAFCFE; }

.col-num { width: 30px; font-weight: 700; color: #A3AED0; text-align: center; }
.col-subject { width: 140px; font-weight: 700; color: #2B3674; }
.col-task { line-height: 1.4; font-size: 14px; color: #4A5568; }
.col-grade { width: 60px; text-align: center; }

.no-task { color: #CBD5E1; }
.file-icon { cursor: pointer; margin-left: 5px; }

/* Цветные оценки */
.grade-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 14px;
}

.grade-5 { background: #E8FDE8; color: #05A660; }
.grade-4 { background: #E1F4FF; color: #0075FF; }
.grade-3 { background: #FFF4E5; color: #FF9900; }
.grade-2 { background: #FFEDED; color: #E0282E; }
.grade-Н { background: #F1F5F9; color: #64748B; }

.empty-day {
  text-align: center;
  padding: 20px;
  color: #A3AED0;
}

/* Адаптивность для телефонов */
@media (max-width: 900px) {
  .diary-spread { grid-template-columns: 1fr; } /* На мобилках в один столбик */
}
</style>