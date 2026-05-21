<template>
  <header class="top-bar">
    <div class="header-left">
      <div class="logo">
        <div class="logo-icon">Д</div>
        <span class="logo-text">ДНЕВНИК</span>
      </div>
    </div>

    <div class="header-top">
      <nav class="main-menu">
        <router-link :to="'/schedule/' + studentId" active-class="active">Расписание</router-link>
        <router-link :to="'/performance/' + studentId" active-class="active">Успеваемость</router-link>
      </nav>
    </div>

    <div class="header-right" v-if="userName">
      <div class="user-block" @click.stop="toggleDropdown">
        <div class="avatar-wrapper">
          <img src="@/assets/image/student-icon.jpg" alt="Avatar" class="avatar" />
        </div>
        <div class="user-info">
          <span class="user-name">{{ shortName }}</span>
          <span class="user-role">Студент</span>
        </div>
        <svg class="chevron-dropdown" :class="{ rotated: isDropdownOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <!-- Выпадающее меню -->
      <transition name="dropdown">
        <div v-if="isDropdownOpen" class="dropdown-menu" @click.stop>
          <div class="dropdown-header">
            <div class="dropdown-avatar">
              <img src="@/assets/image/student-icon.jpg" alt="Avatar" />
            </div>
            <div class="dropdown-user-info">
              <div class="dropdown-user-name">{{ userName }}</div>
              <div class="dropdown-user-role">Студент</div>
            </div>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <div class="dropdown-item" @click="goToProfile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Мой профиль</span>
          </div>
          
          
          <div class="dropdown-divider"></div>
          
          <div class="dropdown-item logout" @click="logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Выйти</span>
          </div>
        </div>
      </transition>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  userName: String,
  studentId: [String, Number]
});

const router = useRouter();
const isDropdownOpen = ref(false);

const shortName = computed(() => {
  if (!props.userName) return 'Гость';
  const nameParts = props.userName.split(' ');
  return nameParts[0] + (nameParts[1] ? ` ${nameParts[1].charAt(0)}.` : '');
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const goToProfile = () => {
  router.push('/profile/' + props.studentId);
  closeDropdown();
};

const goToSettings = () => {
  router.push('/settings/' + props.studentId);
  closeDropdown();
};

const logout = () => {
  // Очищаем localStorage/токены
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Перенаправляем на страницу входа
  router.push('/');
  closeDropdown();
};

// Закрываем меню при клике вне его
const handleClickOutside = (event) => {
  const userBlock = document.querySelector('.user-block');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (userBlock && !userBlock.contains(event.target) && dropdownMenu && !dropdownMenu.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.chevron {
  margin-left: 4px;
  opacity: 0.6;
  transition: transform 0.2s ease;
}

.user-block:hover .chevron {
  transform: translateY(1px);
  opacity: 1;
  color: #4C6FFF;
}

.top-bar {
  z-index: 1000;
  background: white;
  height: 80px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  border-bottom: 1px solid #f0f4f8;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  position: absolute;
  left: 24px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #5A8DEE 0%, #4C6FFF 100%);
  color: white;
  font-weight: bold;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.logo:hover .logo-icon {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(76, 111, 255, 0.3);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #4C6FFF 0%, #5A8DEE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-top {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.main-menu {
  display: flex;
  gap: 32px;
}

.main-menu a {
  text-decoration: none;
  font-size: 15px;
  color: #A0AEC0;
  font-weight: 500;
  transition: all 0.2s;
  padding: 8px 0;
}

.main-menu a:hover {
  color: #4C6FFF;
}

.main-menu a.active {
  color: #4C6FFF;
  border-bottom: 2px solid #4C6FFF;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  position: absolute;
  right: 24px;
}

/* Новый стиль для блока пользователя */
.user-block {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 50px;
  transition: all 0.3s ease;
  background: transparent;
}

.user-block:hover {
  background: #F8F9FA;
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.user-block:hover .avatar {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(76, 111, 255, 0.2);
}

.avatar-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.avatar-status.online {
  background: #4CAF50;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  color: #2D3748;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.user-role {
  color: #A0AEC0;
  font-size: 11px;
  font-weight: 500;
}

.chevron-dropdown {
  margin-left: 4px;
  opacity: 0.6;
  transition: transform 0.3s ease;
  color: #718096;
}

.chevron-dropdown.rotated {
  transform: rotate(180deg);
}

/* Выпадающее меню */
.dropdown-menu {
  position: absolute;
  top: 70px;
  right: 24px;
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1001;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%);
  border-bottom: 1px solid #EDF2F7;
}

.dropdown-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffffff;
}

.dropdown-user-info {
  flex: 1;
}

.dropdown-user-name {
  font-size: 15px;
  font-weight: 600;
  color: #2D3748;
  margin-bottom: 4px;
}

.dropdown-user-role {
  font-size: 12px;
  color: #A0AEC0;
  display: inline-block;
  background: #F0F4F8;
  padding: 2px 8px;
  border-radius: 12px;
}

.dropdown-divider {
  height: 1px;
  background: #EDF2F7;
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #4A5568;
  font-size: 14px;
}

.dropdown-item svg {
  stroke: #A0AEC0;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: #F8F9FA;
  color: #4C6FFF;
}

.dropdown-item:hover svg {
  stroke: #4C6FFF;
}

.dropdown-item.logout {
  color: #E53E3E;
}

.dropdown-item.logout:hover {
  background: #FFF5F5;
  color: #C53030;
}

.dropdown-item.logout:hover svg {
  stroke: #C53030;
}

/* Анимация выпадающего меню */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>