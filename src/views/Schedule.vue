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
              
              <div v-if="!lesson.isWindow" class="lesson-item" @click="showLessonDetails(lesson)">
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
                  
                  <!-- Отображение оценки -->
                  <div v-if="lesson.grade" class="lesson-grade" @click.stop="showGradeDetails(lesson.grade)">
                    <span class="grade-badge" :class="getGradeClass(lesson.grade.gradeValue)">
                      {{ lesson.grade.gradeValue }}
                    </span>
                    <span class="grade-type">{{ lesson.grade.type }}</span>
                  </div>

                  <!-- Отображение домашнего задания -->
                  <div v-if="lesson.homework" class="lesson-homework" @click.stop="showHomeworkDetails(lesson.homework)">
                    <span class="homework-icon">📚</span>
                    <span class="homework-text">Домашнее задание</span>
                  </div>
                </div>
              </div>

              <div v-else class="lesson-window">
                <div class="window-time">{{ lesson.time }}</div>
                <div class="window-content">Свободное время (окно)</div>
              </div>

            </template>

            <!-- Отдельные домашние задания без привязки к уроку -->
            <div v-for="homework in day.standaloneHomework" :key="homework.id" 
                 class="standalone-homework" @click="showHomeworkDetails(homework)">
              <div class="homework-time">📋</div>
              <div class="homework-info">
                <div class="homework-subject">{{ homework.subjectName }}</div>
                <div class="homework-preview">{{ truncateText(homework.task, 50) }}</div>
              </div>
            </div>
          </div>

          <div v-if="!day.lessons.length && (!day.standaloneHomework || !day.standaloneHomework.length)" class="empty-day">
            Пар нет. Можно отдохнуть! 🙌
          </div>
        </div>
      </div>

      <!-- Модальное окно для деталей домашнего задания -->
      <div v-if="selectedHomework" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>📚 Домашнее задание</h2>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-row">
              <span class="detail-label">Предмет:</span>
              <span class="detail-value">{{ selectedHomework.subjectName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Группа:</span>
              <span class="detail-value">{{ selectedHomework.className }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Дедлайн:</span>
              <span class="detail-value">{{ selectedHomework.deadline }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Задание:</span>
              <div class="detail-text">{{ selectedHomework.task }}</div>
            </div>
            <div v-if="selectedHomework.comment" class="detail-row">
              <span class="detail-label">Комментарий:</span>
              <div class="detail-text">{{ selectedHomework.comment }}</div>
            </div>
            <div v-if="selectedHomework.fileLink" class="detail-row">
              <span class="detail-label">Файл:</span>
              <a :href="selectedHomework.fileLink" target="_blank" class="detail-link">Скачать материал</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Модальное окно для деталей оценки -->
      <div v-if="selectedGrade" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>📝 Детали оценки</h2>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-row">
              <span class="detail-label">Предмет:</span>
              <span class="detail-value">{{ selectedGrade.subjectName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Преподаватель:</span>
              <span class="detail-value">{{ selectedGrade.teacherName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Оценка:</span>
              <span class="grade-large" :class="getGradeClass(selectedGrade.gradeValue)">
                {{ selectedGrade.gradeValue }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Тип:</span>
              <span class="detail-value">{{ selectedGrade.type }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Дата:</span>
              <span class="detail-value">{{ selectedGrade.date }}</span>
            </div>
            <div v-if="selectedGrade.comment" class="detail-row">
              <span class="detail-label">Комментарий:</span>
              <div class="detail-text">{{ selectedGrade.comment }}</div>
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
import TheHeader from '../components/TheHeader.vue';
import { API_URL } from '../router/config.js';

const route = useRoute();
const scheduleData = ref([]);
const profileName = ref("");
const groupName = ref("");
const loading = ref(true);
const currentDate = ref(new Date());
const selectedHomework = ref(null);
const selectedGrade = ref(null);

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
      axios.get(`${API_URL}/api/Schedule/student/${studentId}?date=${dateStr}`),
      axios.get(`${API_URL}/api/Profile/${studentId}`)
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

const showHomeworkDetails = async (homework) => {
  try {
    const response = await axios.get(`${API_URL}/api/Schedule/homework/${homework.id}/details`);
    selectedHomework.value = response.data;
  } catch (error) {
    console.error("Ошибка загрузки деталей:", error);
  }
};

const showGradeDetails = async (grade) => {
  try {
    const response = await axios.get(`${API_URL}/api/Schedule/grade/${grade.id}/details`);
    selectedGrade.value = response.data;
  } catch (error) {
    console.error("Ошибка загрузки деталей оценки:", error);
  }
};

const showLessonDetails = (lesson) => {
  // Если есть домашнее задание - показываем его
  if (lesson.homework) {
    showHomeworkDetails(lesson.homework);
  }
  // Если есть оценка - можно отобразить уведомление
  if (lesson.grade) {
    // Можно добавить тост-уведомление
    console.log(`Оценка по предмету ${lesson.subjectName}: ${lesson.grade.gradeValue}`);
  }
};

const closeModal = () => {
  selectedHomework.value = null;
  selectedGrade.value = null;
};

const changeWeek = (days) => {
  currentDate.value.setDate(currentDate.value.getDate() + days);
  fetchData();
};

const goToday = () => {
  currentDate.value = new Date();
  fetchData();
};

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
  const times = { 1: "08:00 - 09:30", 2: "09:40 - 11:10", 3: "11:20 - 12:50", 4: "13:45 - 15:15", 5: "15:25 - 16:55", 6: "17:05 - 18:35", 7: "18:45 - 20:15" };
  return times[n] || "00:00 - 00:00";
};

const formatDate = (dateStr) => {
  const options = { day: 'numeric', month: 'long' };
  return new Date(dateStr).toLocaleDateString('ru-RU', options);
};

const getGradeClass = (grade) => {
  if (grade === '5') return 'grade-5';
  if (grade === '4') return 'grade-4';
  if (grade === '3') return 'grade-3';
  if (grade === '2') return 'grade-2';
  if (grade === 'Н') return 'grade-n';
  return '';
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
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


/* Стили для оценок */
.lesson-grade {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.grade-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
}

.grade-5 { background: #E8F5E9; color: #2E7D32; }
.grade-4 { background: #E3F2FD; color: #1565C0; }
.grade-3 { background: #FFF3E0; color: #F57C00; }
.grade-2 { background: #FFEBEE; color: #C62828; }
.grade-n { background: #F3E5F5; color: #7B1FA2; }

.grade-type {
  font-size: 12px;
  color: #707EAE;
}

/* Стили для домашнего задания */
.lesson-homework {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #4318FF;
  font-size: 12px;
  font-weight: 500;
}

.homework-icon {
  font-size: 14px;
}

.lesson-homework {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #4318FF;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  background: linear-gradient(135deg, #EEF2FF 0%, #E8EDFF 100%);
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.lesson-homework::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  transition: left 0.5s ease;
}

.lesson-homework:hover::before {
  left: 100%;
}

.lesson-homework:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(67, 24, 255, 0.2);
  background: linear-gradient(135deg, #E8EDFF 0%, #DCE4FF 100%);
}

.homework-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.lesson-homework:hover .homework-icon {
  transform: rotate(15deg) scale(1.1);
}

.homework-text {
  position: relative;
}

.lesson-homework:hover .homework-text::after {
  content: '📖';
  margin-left: 6px;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.standalone-homework {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #F0F7FF;
  border-radius: 12px;
  margin-top: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.standalone-homework:hover {
  background: #E8F0FE;
  transform: translateX(5px);
}

.homework-time {
  font-size: 20px;
}

.homework-info {
  flex: 1;
}

.homework-subject {
  font-weight: 700;
  font-size: 14px;
  color: #2B3674;
  margin-bottom: 4px;
}

.homework-preview {
  font-size: 12px;
  color: #707EAE;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E9EDF7;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #2B3674;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #707EAE;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.modal-close:hover {
  background: #F4F7FE;
  color: #4318FF;
}

.modal-body {
  padding: 24px;
}

.detail-row {
  margin-bottom: 20px;
}

.detail-label {
  display: block;
  font-size: 12px;
  color: #707EAE;
  margin-bottom: 6px;
  font-weight: 600;
}

.detail-value {
  font-size: 15px;
  color: #2B3674;
  font-weight: 500;
}

.detail-text {
  font-size: 14px;
  color: #4A5568;
  line-height: 1.5;
  background: #F8F9FA;
  padding: 12px;
  border-radius: 12px;
}

.detail-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4318FF;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 0;
  transition: all 0.3s ease;
}

.detail-link::before {
  content: '📎';
  margin-right: 6px;
  font-size: 13px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.detail-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #4318FF, #764ba2);
  transition: width 0.3s ease;
}

.detail-link:hover {
  gap: 10px;
  color: #764ba2;
}

.detail-link:hover::before {
  opacity: 1;
  transform: rotate(15deg) scale(1.1);
}

.detail-link:hover::after {
  width: 100%;
}
.detail-link:hover {
  text-decoration: underline;
}

.grade-large {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 40px;
  font-size: 24px;
  font-weight: 700;
}

.lesson-item {
  cursor: pointer;
  transition: 0.2s;
}

.lesson-item:hover {
  background: #FAFCFE;
  border-radius: 12px;
  transform: translateX(5px);
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