<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCookies } from 'vue3-cookies'
import axios from 'axios'

const router = useRouter()
const { cookies } = useCookies()
const children = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const user = cookies.get('user')
    if (!user || user.role !== 'parent') {
      router.push('/')
      return
    }

    // Тот самый запрос, который ты проверял в Swagger
    const response = await axios.get(`https://localhost:7081/api/Auth/children/${user.id}`)
    children.value = response.data
  } catch (error) {
    console.error("Ошибка при загрузке детей:", error)
    alert("Не удалось загрузить список детей")
  } finally {
    loading.value = false
  }
})

const selectStudent = (studentId) => {
  // Сохраняем ID выбранного ребенка, чтобы профиль знал, чьи данные грузить
  cookies.set('selectedStudentId', studentId)
  router.push(`/profile/${studentId}`)
}
</script>
<template>
  <div class="auth-page">
    <div class="content-panel">
      <div class="login-header">
        <div class="logo">
          <div class="logo-icon">Д</div>
          <span class="logo-text">ДНЕВНИК</span>
        </div>
      </div>

      <div class="main-container">
        <h2 class="page-title">Чей дневник открыть?</h2>
        
        <div class="child-selection">
          <div v-for="child in children" :key="child.id" class="child-card" @click="selectStudent(child.id)">
            <div class="child-avatar">
               <img src="../assets/image/avatar-placeholder.png" alt="avatar" />
            </div>
            <div class="child-info">
              <div class="child-name">{{ child.fullName }}</div>
              <div class="child-class">{{ child.className }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="image-panel">
      <img src="@/assets/image/avtirization_foto.png" alt="School building" class="cover-image" />
    </div>
  </div>
</template>

<style scoped>

/* --- Правая панель --- */
.image-panel {
  flex: 1.2; /* Правая часть немного шире */
  background-color: #f0f2f5;
  overflow: hidden;
  position: relative;
  height: 100vh;
  width: 100%;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Изображение заполняет всю область без искажений */
  /* Поскольку у нас заглушка, я немного смещу её, чтобы показать правую часть скриншота */
      object-position: right center; 
}
/* Здесь только специфичные стили для карточек */
.child-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #EAECEF;
  border-radius: 12px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: 0.2s;
}

.child-card:hover {
  box-shadow: 0 4px 15px rgba(90, 141, 238, 0.15);
  border-color: #5A8DEE;
}

.child-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
}

.child-name { font-weight: 600; color: #5A6679; }
.child-class { color: #A0A7B1; font-size: 13px; }
</style>