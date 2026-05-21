<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-wrapper">
        <div class="logo">
          <div class="logo-icon">Д</div>
          <span class="logo-text">ДНЕВНИК</span>
        </div>

        <div class="welcome-text">
          <h1 class="welcome-title">Добро пожаловать!</h1>
          <p class="welcome-subtitle">Войдите в свой аккаунт, чтобы продолжить</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-field">
            <div class="input-icon">👤</div>
            <input
              v-model="login"
              type="text"
              placeholder="Логин"
              class="form-input"
              required
            />
          </div>
          
          <div class="input-field">
            <div class="input-icon">🔒</div>
            <input
              v-model="password"
              type="password"
              placeholder="Пароль"
              class="form-input"
              required
            />
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="rememberMe" />
              <span class="checkmark-custom"></span>
              <span>Запомнить меня</span>
            </label>
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? 'ВХОД...' : 'ВОЙТИ' }}
          </button>
        </form>
      </div>
    </div>

    <div class="image-panel">
      <div class="overlay"></div>
      <div class="quote-block">
        <p class="quote-text">"Образование — это самое мощное оружие, которое вы можете использовать, чтобы изменить мир."</p>
        <p class="quote-author">— Нельсон Мандела</p>
      </div>
    </div>

    <!-- Модальное окно "Забыли пароль?" -->
    <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔐 Восстановление пароля</h3>
          <button class="modal-close" @click="closeResetModal">×</button>
        </div>
        
        <div class="modal-body">
          <p class="reset-info">Введите email, указанный при регистрации. Мы отправим инструкции для восстановления пароля.</p>
          
          <div class="input-group">
            <input
              type="email"
              v-model="resetEmail"
              placeholder="example@mail.ru"
              class="modal-input"
              :class="{ 'error': resetError }"
            />
          </div>
          
          <div v-if="resetMessage" class="success-message">
            ✅ {{ resetMessage }}
          </div>
          
          <div v-if="resetError" class="error-message">
            ❌ {{ resetError }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="modal-cancel" @click="closeResetModal">Отмена</button>
          <button class="modal-submit" @click="handleResetPassword" :disabled="!resetEmail">Отправить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useCookies } from 'vue3-cookies'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { API_URL } from '../router/config.js'

const login = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const resetEmail = ref('')
const showResetModal = ref(false)
const resetMessage = ref('')
const resetError = ref('')

const { cookies } = useCookies()
const router = useRouter()

onMounted(() => {
  const savedLogin = cookies.get('saved_login')
  const savedRemember = cookies.get('remember_me')
  
  if (savedLogin && savedRemember === 'true') {
    login.value = savedLogin
    rememberMe.value = true
  }
})

watch(rememberMe, (newValue) => {
  if (!newValue) {
    cookies.remove('saved_login')
    cookies.remove('remember_me')
  }
})

const handleLogin = async () => {
  if (!login.value || !password.value) {
    alert('Заполните все поля')
    return
  }
  
  isLoading.value = true
  
  try {
    const url = `${API_URL}/api/Auth/login`
    const response = await axios.post(url, {
      login: login.value,
      password: password.value
    })

    if (response.data) {
      const user = response.data
      cookies.set('user', user, { path: '/' })
      
      if (rememberMe.value) {
        cookies.set('saved_login', login.value, { path: '/', maxAge: 60 * 60 * 24 * 30 })
        cookies.set('remember_me', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 })
      }
      
      if (user.role === 'student') {
        router.push(`/profile/${user.id}`)
      } 
      else if (user.role === 'parent') {
        router.push('/select-child')
      } 
      else if (user.role === 'teacher') {
        router.push('/teacher/dashboard')
      }
      else if (user.role === 'admin') {
        router.push('/admin/dashboard')
      }
    }
  } catch (error) {
    console.error(error)
    const errorMsg = error.response?.data || "Ошибка соединения с сервером"
    alert("Ошибка: " + errorMsg)
  } finally {
    isLoading.value = false
  }
}

const handleResetPassword = async () => {
  if (!resetEmail.value) {
    resetError.value = 'Введите email'
    return
  }
  
  resetMessage.value = ''
  resetError.value = ''
  
  try {
    const response = await axios.post(`${API_URL}/api/Auth/reset-password`, {
      email: resetEmail.value
    })
    
    if (response.data.success) {
      resetMessage.value = response.data.message || 'Новый пароль отправлен на ваш email'
      setTimeout(() => {
        showResetModal.value = false
        resetEmail.value = ''
        resetMessage.value = ''
      }, 3000)
    } else {
      resetError.value = response.data.message || 'Ошибка восстановления пароля'
    }
  } catch (error) {
    console.error(error)
    resetError.value = error.response?.data?.message || 'Ошибка соединения с сервером'
  }
}

const openResetModal = () => {
  showResetModal.value = true
  resetEmail.value = ''
  resetMessage.value = ''
  resetError.value = ''
}

const closeResetModal = () => {
  showResetModal.value = false
}
</script>

<style scoped>
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
  max-width: 450px;
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
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
}

.welcome-subtitle {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 30px;
}

.input-field {
  position: relative;
  margin-bottom: 20px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  opacity: 0.6;
}

.form-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  background: #F8F9FA;
  border: 1px solid #E0E0E0;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #5271FF;
  background: white;
  box-shadow: 0 0 0 3px rgba(82, 113, 255, 0.1);
}

.form-input::placeholder {
  color: #aaa;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.checkbox-label input {
  display: none;
}

.checkmark-custom {
  width: 18px;
  height: 18px;
  background: white;
  border: 1px solid #D0D0D0;
  border-radius: 4px;
  margin-right: 8px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkmark-custom {
  background: #5271FF;
  border-color: #5271FF;
}

.checkbox-label input:checked + .checkmark-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.forgot-link {
  color: #5271FF;
  text-decoration: none;
  font-size: 14px;
  transition: opacity 0.2s;
}

.forgot-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #5271FF 0%, #4060E8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(82, 113, 255, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

/* Модальное окно */
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
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  animation: fadeInUp 0.3s ease;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E0E0E0;
  background: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #5271FF;
}

.modal-body {
  padding: 24px;
}

.reset-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.input-group {
  margin-bottom: 20px;
}

.modal-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-input:focus {
  outline: none;
  border-color: #5271FF;
  box-shadow: 0 0 0 3px rgba(82, 113, 255, 0.1);
}

.modal-input.error {
  border-color: #E53E3E;
}

.success-message {
  background: #E8F5E9;
  color: #2E7D32;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 15px;
}

.error-message {
  background: #FFEBEE;
  color: #C62828;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 15px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #E0E0E0;
  background: #F8F9FA;
}

.modal-cancel {
  padding: 10px 20px;
  background: white;
  border: 1px solid #D0D0D0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-cancel:hover {
  background: #F5F5F5;
}

.modal-submit {
  padding: 10px 20px;
  background: linear-gradient(135deg, #5271FF 0%, #4060E8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.modal-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 113, 255, 0.3);
}

.modal-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
    font-size: 28px;
  }
}
</style>