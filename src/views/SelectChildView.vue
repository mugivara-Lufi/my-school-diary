<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-wrapper">
        <div class="logo">
          <div class="logo-icon">Д</div>
          <span class="logo-text">ДНЕВНИК</span>
        </div>

        <div class="welcome-text">
          <h1 class="welcome-title">Выбор профиля</h1>
          <p class="welcome-subtitle">Выберите, чей дневник хотите открыть</p>
        </div>

        <div class="child-selection">
          <div v-for="child in children" :key="child.id" class="child-card" @click="selectStudent(child.id)">
            <div class="child-avatar">
              <div>
                <img src="@/assets/image/student-icon.jpg" alt="Avatar" class="avatar" />
              </div>
            </div>
            <div class="child-info">
              <div class="child-name">{{ child.fullName }}</div>
              <div class="child-class">{{ child.className }}</div>
            </div>
            <div class="child-arrow">→</div>
          </div>
          
          <div v-if="!loading && children.length === 0" class="empty-state">
            <p>Нет привязанных детей</p>
          </div>
          
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    </div>

    <div class="image-panel">
      <div class="overlay"></div>
      <div class="quote-block">
        <p class="quote-text">"Образование — это самое мощное оружие, которое вы можете использовать, чтобы изменить мир."</p>
        <p class="quote-author">— Нельсон Мандела</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCookies } from 'vue3-cookies'
import axios from 'axios'
import { API_URL } from '../router/config.js'

const router = useRouter()
const { cookies } = useCookies()
const children = ref([])
const loading = ref(true)

const getInitials = (fullName) => {
  if (!fullName) return '?'
  const parts = fullName.split(' ')
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`
  }
  return fullName.charAt(0)
}

onMounted(async () => {
  try {
    const user = cookies.get('user')
    if (!user || user.role !== 'parent') {
      router.push('/')
      return
    }

    const response = await axios.get(`${API_URL}/api/Auth/children/${user.id}`)
    children.value = response.data
  } catch (error) {
    console.error("Ошибка при загрузке детей:", error)
    alert("Не удалось загрузить список детей")
  } finally {
    loading.value = false
  }
})

const selectStudent = (studentId) => {
  cookies.set('selectedStudentId', studentId)
  router.push(`/profile/${studentId}`)
}
</script>

<style scoped>

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
  background: #F8F9FA;
}

/* Левая панель - белая */
.login-panel {
  flex: 1;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05);
}

.login-wrapper {
  width: 100%;
  max-width: 500px;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 50px;
}

.logo-icon {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #5271FF 0%, #4060E8 100%);
  color: white;
  font-weight: bold;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-right: 12px;
  box-shadow: 0 4px 15px rgba(82, 113, 255, 0.3);
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  letter-spacing: 1px;
}

.welcome-text {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-title {
  color: #333;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.welcome-subtitle {
  color: #999;
  font-size: 14px;
}

/* Список детей */
.child-selection {
  margin-top: 20px;
}

.child-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #F8F9FA;
  border: 1px solid #E0E0E0;
  border-radius: 16px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.child-card:hover {
  background: white;
  border-color: #5271FF;
  box-shadow: 0 4px 20px rgba(82, 113, 255, 0.15);
  transform: translateY(-2px);
}

.child-avatar {
  margin-right: 15px;
}

.avatar-placeholder {
  width: 55px;
  height: 55px;
  background: linear-gradient(135deg, #5271FF 0%, #4060E8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 20px;
}

.child-info {
  flex: 1;
}

.child-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.child-class {
  font-size: 13px;
  color: #999;
}

.child-arrow {
  font-size: 20px;
  color: #5271FF;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.child-card:hover .child-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* Загрузка */
.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E0E0E0;
  border-top-color: #5271FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Правая панель - синяя */
.image-panel {
  flex: 1.2;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 60px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200') center/cover no-repeat;
  opacity: 0.2;
}

.quote-block {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 500px;
  animation: fadeInUp 1s ease;
}

.quote-text {
  color: white;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 20px;
  font-style: italic;
}

.quote-author {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
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

/* Адаптивность */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  
  .image-panel {
    display: none;
  }
  
  .login-panel {
    max-width: 100%;
  }
  
  .login-wrapper {
    padding: 30px;
  }
  
  .welcome-title {
    font-size: 24px;
  }
}
</style>