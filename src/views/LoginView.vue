<script setup>
import { ref } from 'vue'
import { useCookies } from 'vue3-cookies'
import { useRouter } from 'vue-router' // 1. Импортируем роутер
import axios from 'axios'

const login = ref('')
const password = ref('')
const { cookies } = useCookies()
const router = useRouter() // 2. Инициализируем роутер

const handleLogin = async () => {
  try {
    // ВАЖНО: Мы перешли на передачу данных через Body ([FromBody] в C#)
    const url = 'https://localhost:7081/api/Auth/login'
    
    const response = await axios.post(url, {
      login: login.value,
      password: password.value
    })

    if (response.data) {
      const user = response.data // Объект { id, login, role }
      
      // Сохраняем пользователя в куки
      cookies.set('user', user)
      
      // 3. Логика разветвления в зависимости от роли
      if (user.role === 'student') {
        // Если студент — сразу в профиль (используем его ID)
        router.push(`/profile/${user.id}`)
      } 
      else if (user.role === 'parent') {
        // Если родитель — на страницу выбора ребенка
        router.push('/select-child')
      } 
      else {
        // Запасной вариант (например, для учителей)
        router.push('/account')
      }
    }
  } catch (error) {
    console.error(error)
    const errorMsg = error.response?.data || "Ошибка соединения с сервером"
    alert("Ошибка: " + errorMsg)
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-panel">
      <header class="login-header">
        <div class="logo">
          <div class="logo-icon">Д</div>
          <span class="logo-text">ДНЕВНИК</span>
        </div>
        <a href="#" class="register-link">Как зарегистрироваться?</a>
      </header>

      <main class="form-container">
        <h1 class="form-title">Вход</h1>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <input
              v-model="login"
              type="text"
              placeholder="Введите логин"
              class="form-input"
              required
            />
          </div>
          
          <div class="input-group">
            <input
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              class="form-input"
              required
            />
          </div>

          <div class="form-options">
            <label class="checkbox-container">
              <input type="checkbox" v-model="rememberMe" />
              <span class="checkmark"></span>
              Запомнить меня
            </label>
            <a href="#" class="forgot-password">Забыли пароль?</a>
          </div>

          <button type="submit" class="btn btn-primary">ВОЙТИ</button>

          <button type="button" class="btn btn-secondary">
            ВОЙТИ ЧЕРЕЗ <span class="brand-max">MAX</span>
          </button>
        </form>
      </main>
    </div>

    <div class="image-panel">
      <img src="@/assets/image/avtirization_foto.png" alt="School building" class="cover-image" />
    </div>
  </div>
</template>

<style scoped>
/* --- Общий макет --- */
.login-page {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background-color: #fff;
}

/* --- Левая панель --- */
.login-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 60px;
  max-width: 50%; /* Ограничиваем ширину формы */
  box-sizing: border-box;
}

/* Шапка */
.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 80px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background-color: #5A8DEE;
  color: white;
  font-weight: bold;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px 0 4px 0; /* Форма ромба/листа */
  margin-right: 10px;
  transform: skew(-10deg); /* Небольшой наклон как на скриншоте */
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #6C757D;
}

.register-link {
  font-size: 14px;
  color: #A0A7B1;
  text-decoration: none;
}

/* Форма */
.form-container {
  max-width: 380px;
  margin: 0 auto; /* Центрируем форму по горизонтали в левой панели */
  width: 100%;
}

.form-title {
  font-size: 28px;
  font-weight: 600;
  color: #6C757D;
  margin-bottom: 40px;
}

.input-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #495057;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #BDBDBD;
}

/* Опции (Чекбокс и Забыли пароль) */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  font-size: 14px;
  color: #A0A7B1;
}

.forgot-password {
  color: #A0A7B1;
  text-decoration: none;
}

/* Кастомный чекбокс */
.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding-left: 28px;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #5A8DEE;
  border-color: #5A8DEE;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Кнопки */
.btn {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 30px; /* Сильное скругление */
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.btn-primary {
  background-color: #5A8DEE;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #4A7CDE;
}

.btn-secondary {
  background-color: white;
  color: #A0A7B1;
  border: 1px solid #E0E0E0;
}

.btn-secondary:hover {
  border-color: #BDBDBD;
  color: #808791;
}

.brand-max {
  color: #5A8DEE;
}

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

/* Адаптивность для мобильных */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  .login-panel {
    border-right: none;
    padding: 30px;
    max-width: 100%;
  }
  .image-panel {
    display: none; /* Скрываем картинку на маленьких экранах */
  }
  .login-header {
    margin-bottom: 40px;
  }
}
</style>