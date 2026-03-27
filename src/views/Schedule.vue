<template>
  <div class="page-wrapper">
    <TheHeader v-if="profileName" :userName="profileName" :studentId="route.params.id" />

    <div class="schedule-container">
      <header class="view-header">
        <div class="header-main">
          <h1 class="page-title">Расписание занятий</h1>
          <span class="group-badge" v-if="groupName">{{ groupName }}</span>
        </div>
        <div class="week-navigation">
          <button class="nav-btn" @click="changeWeek(-7)">← Пред. неделя</button>
          <button class="nav-btn" :class="{ active: isCurrentWeek }" @click="goToday">Текущая</button>
          <button class="nav-btn" @click="changeWeek(7)">След. неделя →</button>
        </div>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загружаем пары...</p>
      </div>

      <div v-else class="schedule-grid">
        <div v-for="day in scheduleData" :key="day.date" class="day-card">
          <div class="day-header">
            <h3 class="day-name">{{ day.dayOfWeek }}</h3>
            <span class="day-date">{{ formatDate(day.date) }}</span>
          </div>

          <div class="lessons-list">
            <template v-for="lesson in getLessonsWithWindows(day.lessons)" :key="lesson.id || lesson.lessonNumber">
              
              <div v-if="!lesson.isWindow" class="lesson-item">
                <div class="lesson-time">
                  <span class="start">{{ lesson.time.split(' - ')[0] }}</span>
                  <span class="end">{{ lesson.time.split(' - ')[1] }}</span>
                </div>
                <div class="lesson-info">
                  <div class="lesson-top">
                    <span class="lesson-number">{{ lesson.lessonNumber }} пара</span>
                    <span class="lesson-room" v-if="lesson.room">каб. {{ lesson.room }}</span>
                  </div>
                  <h4 class="subject-name">{{ lesson.subjectName }}</h4>
                  <p class="teacher-name"><span class="icon">👤</span> {{ lesson.teacherName }}</p>
                  <div class="lesson-topic" v-if="lesson.topic">
                    <strong>Тема:</strong> {{ lesson.topic }}
                  </div>
                </div>
              </div>

              <div v-else class="lesson-window">
                <div class="window-time">{{ lesson.time }}</div>
                <div class="window-content">Свободное время (окно)</div>
              </div>

            </template>
          </div>

          <div v-if="!day.lessons.length" class="empty-day">
            Пар нет. Можно отдохнуть! 🙌
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
import TheHeader from '../components/TheHeader.vue';

const route = useRoute();
const scheduleData = ref([]);
const profileName = ref("");
const groupName = ref("");
const loading = ref(true);
const currentDate = ref(new Date()); // Храним дату выбранной недели

// Проверка, является ли неделя текущей
const isCurrentWeek = computed(() => {
  const now = new Date();
  return now.toDateString() === currentDate.value.toDateString();
});

const fetchData = async () => {
  loading.value = true;
  const studentId = route.params.id;
  const dateStr = currentDate.value.toISOString().split('T')[0];
  
  try {
    const [scheduleRes, profileRes] = await Promise.all([
      axios.get(`https://localhost:7081/api/Schedule/student/${studentId}?date=${dateStr}`),
      axios.get(`https://localhost:7081/api/Profile/${studentId}`)
    ]);

    scheduleData.value = scheduleRes.data;
    profileName.value = profileRes.data.student.fullName;
    groupName.value = profileRes.data.student.className;
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    loading.value = false;
  }
};

const changeWeek = (days) => {
  currentDate.value.setDate(currentDate.value.getDate() + days);
  fetchData();
};

const goToday = () => {
  currentDate.value = new Date();
  fetchData();
};

// Логика поиска окон
const getLessonsWithWindows = (lessons) => {
  if (!lessons || lessons.length === 0) return [];
  
  const result = [];
  const min = Math.min(...lessons.map(l => l.lessonNumber));
  const max = Math.max(...lessons.map(l => l.lessonNumber));

  for (let i = min; i <= max; i++) {
    const found = lessons.find(l => l.lessonNumber === i);
    if (found) {
      result.push({ ...found, isWindow: false });
    } else {
      result.push({ 
        lessonNumber: i, 
        isWindow: true, 
        time: getStaticTime(i) 
      });
    }
  }
  return result;
};

const getStaticTime = (n) => {
  const times = { 1: "08:30 - 10:00", 2: "10:10 - 11:40", 3: "12:10 - 13:40", 4: "13:50 - 15:20", 5: "15:30 - 17:00" };
  return times[n] || "00:00 - 00:00";
};

const formatDate = (dateStr) => {
  const options = { day: 'numeric', month: 'long' };
  return new Date(dateStr).toLocaleDateString('ru-RU', options);
};

onMounted(fetchData);
</script>

<style scoped>
.lesson-window {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f8faff;
  border: 1px dashed #A3AED0;
  border-radius: 16px;
  margin-bottom: 10px;
}

.window-time {
  font-size: 11px;
  color: #A3AED0;
  font-weight: 600;
  min-width: 60px;
  border-right: 1px solid #E9EDF7;
}

.window-content {
  font-size: 13px;
  color: #707EAE;
  font-style: italic;
}

.page-wrapper {
  min-height: 100vh;
  background-color: #F4F7FE;
  color: #2B3674;
}

.schedule-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
}

.group-badge {
  background: #E9EDF7;
  color: #4318FF;
  padding: 6px 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
}

/* Навигация по неделям */
.week-navigation {
  display: flex;
  background: white;
  padding: 5px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.nav-btn {
  border: none;
  background: transparent;
  padding: 10px 18px;
  border-radius: 12px;
  color: #707EAE;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.nav-btn.active {
  background: #4318FF;
  color: white;
}

/* Сетка карточек */
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  align-items: start;
}

.day-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0px 18px 40px rgba(112, 144, 176, 0.08);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #F4F7FE;
}

.day-name {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
}

.day-date {
  color: #A3AED0;
  font-size: 14px;
  font-weight: 600;
}

/* Список пар */
.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lesson-item {
  display: flex;
  gap: 15px;
}

.lesson-time {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 60px;
  padding-right: 15px;
  border-right: 1px solid #E9EDF7;
}

.lesson-time .start {
  font-weight: 800;
  font-size: 14px;
  color: #2B3674;
}

.lesson-time .end {
  font-size: 12px;
  color: #A3AED0;
  font-weight: 600;
}

.lesson-info {
  flex: 1;
}

.lesson-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.lesson-number {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #4318FF;
  font-weight: 800;
}

.lesson-room {
  font-size: 12px;
  background: #F4F7FE;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.subject-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.teacher-name {
  font-size: 13px;
  color: #707EAE;
  margin: 0;
}

.lesson-topic {
  margin-top: 8px;
  font-size: 12px;
  background: #FAFCFE;
  padding: 8px;
  border-radius: 8px;
  border-left: 3px solid #E9EDF7;
  color: #4A5568;
}

.empty-day {
  text-align: center;
  padding: 40px 10px;
  color: #A3AED0;
  font-style: italic;
}

/* Спиннер загрузки */
.loading-state {
  text-align: center;
  padding: 100px 0;
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

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}
</style>