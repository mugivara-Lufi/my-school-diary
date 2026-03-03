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
        <router-link to="/calendar" active-class="active">Календарь</router-link>
        <router-link :to="'/performance/' + studentId" active-class="active">Успеваемость</router-link>
        <router-link to="/extra" active-class="active">Доп. обучение</router-link>
        <a href="#" class="dropdown-link">
          Еще 
          <svg class="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </nav>
    </div>

    <div class="header-right" v-if="userName">
      <div class="user-block" @click="$router.push('/profile/' + studentId)">
        <img src="../assets/image/avatar-placeholder.png" alt="Avatar" class="avatar" />
        <span class="user-name">{{ shortName }}...</span>
        <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  userName: String,
  studentId: [String, Number]
});

const shortName = computed(() => {
  if (!props.userName) return 'Гость';
  return props.userName.split(' ')[0];
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
  z-index: 1000; /* Чтобы шапка всегда была сверху */
  background: white;
  height: 80px;
  display: flex;
  align-items: center;
  position: sticky; /* Шапка будет прилипать при скролле */
  top: 0;
  border-bottom: 1px solid #f0f4f8;
  padding: 0 24px;
}

.top-bar {
  height: 80px;
  display: flex;
  align-items: center;
  background: white; /* Сделал белым для универсальности */
  position: relative;
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
}

.main-menu a.active {
  color: #4C6FFF;
  border-bottom: 2px solid #4C6FFF;
  padding-bottom: 5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  position: absolute;
  right: 24px;
}

.icon-actions {
  display: flex;
  gap: 15px;
  border-right: 1px solid #E2E8F0;
  padding-right: 20px;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
}

.user-name {
  color: #718096;
  font-size: 14px;
}
</style>