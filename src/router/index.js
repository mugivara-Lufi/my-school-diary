import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue' 

const routes = [
  { path: '/', component: LoginView },
  { 
    path: '/select-child', 
    component: () => import('../views/SelectChildView.vue') 
  },
  { 
    path: '/profile/:id', 
    component: () => import('../views/ProfileView.vue') 
  },
  { 
    path: '/performance/:id', 
    component: () => import('../views/PerformanceView.vue') 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router