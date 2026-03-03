import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Импортируем созданный роутер
import './assets/style.css'

const app = createApp(App)

app.use(router)
app.mount('#app')

// Глобальные стили (лучше со временем перенести в style.css)
const style = document.createElement('style')
style.textContent = `
  html, body, #app {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow-x: hidden; /* Разрешаем вертикальный скролл, запрещаем горизонтальный */
    background-color: #F0F4F8;
  }
`
document.head.appendChild(style)