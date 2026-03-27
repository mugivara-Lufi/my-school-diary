<template>
    <div class="page-wrapper">
        <TheHeader :userName="profileName" :studentId="route.params.id" />
        <div class="journal-container">

            <div class="journal-header">
                <div class="header-left">
                    <button class="btn-back" @click="$router.push('/performance/' + studentId)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div class="header-left">
                        <h1>Журнал оценок</h1>
                        <button class="btn-pdf" @click="generatePDF" :disabled="loading">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            Скачать табель
                        </button>
                    </div>
                </div>

                <div class="calendar-controls">
                    <button class="nav-btn" @click="prevMonth">‹</button>
                    <span class="current-month">{{ monthName }} {{ currentYear }}</span>
                    <button class="nav-btn" @click="nextMonth">›</button>
                </div>
            </div>

            <div class="journal-card">
                <div v-if="loading" class="loading-state">
                    <div class="spinner"></div>
                    <span>Загрузка данных журнала...</span>
                </div>

                <div v-else class="table-responsive">
                    <table class="journal-table">
                        <thead>
                            <tr>
                                <th class="sticky-subject">Предмет</th>
                                <th v-for="day in daysInMonth" :key="day" class="date-col"
                                    :class="{ 'is-today': isToday(day) }">
                                    <div class="day-num">{{ day }}</div>
                                    <div class="day-name">{{ getDayOfWeek(day) }}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="subject in journalData" :key="subject.subjectName">
                                <td class="sticky-subject subject-title">
                                    {{ subject.subjectName }}
                                </td>

                                <td v-for="day in daysInMonth" :key="day" class="mark-cell">
                                    <template v-if="getMarkForDay(subject.marks, day)">
                                        <div class="mark-badge"
                                            :class="getMarkClass(getMarkForDay(subject.marks, day).value)">
                                            {{ getMarkForDay(subject.marks, day).value }}
                                            <span v-if="getMarkForDay(subject.marks, day).isExam" class="exam-point"
                                                title="Контрольная работа"></span>
                                        </div>
                                    </template>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import TheHeader from '../components/TheHeader.vue'; // Импорт шапки

import { useRoute } from 'vue-router';
import axios from 'axios';


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const generatePDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4');

    try {
        // 1. Загрузка и регистрация шрифта (Обязательно Roboto-Regular)
        const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
        const fontBuffer = await fontResponse.arrayBuffer();
        
        const binary = new Uint8Array(fontBuffer);
        const base64Font = btoa(
            binary.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        doc.addFileToVFS("Roboto-Regular.ttf", base64Font);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
        doc.setFont("Roboto");

        // 2. Подготовка данных
        const daysCount = daysInMonth.value;
        const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);
        const tableHeaders = ['Предмет', ...daysArray.map(String), 'Итог']; // Заменил "Средний" на более строгое "Итог"

        const tableRows = journalData.value.map(subject => {
            const row = [subject.subjectName];
            daysArray.forEach(day => {
                const mark = getMarkForDay(subject.marks, day);
                row.push(mark ? mark.value : '');
            });
            const numericMarks = subject.marks
                .filter(m => m.value !== 'н' && !isNaN(parseInt(m.value)))
                .map(m => parseInt(m.value));
            const avg = numericMarks.length > 0
                ? (numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length).toFixed(2)
                : '—';
            row.push(avg);
            return row;
        });

        // 3. ОФИЦИАЛЬНАЯ ШАПКА ДОКУМЕНТА
        const pageWidth = doc.internal.pageSize.width;
        
        // Название документа (по центру)
        doc.setFontSize(16);
        doc.text("ТАБЕЛЬ УСПЕВАЕМОСТИ ОБУЧАЮЩЕГОСЯ", pageWidth / 2, 20, { align: 'center' });
        
        // Информационный блок
        doc.setFontSize(11);
        doc.text(`ФИО учащегося:щ ${profileName.value}`, 14, 30);
        doc.text(`Учебный период: ${monthName.value} ${currentYear.value} г.`, 14, 36);

        // Черта под заголовком
        doc.setLineWidth(0.5);
        doc.line(14, 40, pageWidth - 14, 40);

        // 4. Отрисовка таблицы (строгий стиль)
        autoTable(doc, {
            theme: 'grid', // Классическая сетка (как в журналах)
            head: [tableHeaders],
            body: tableRows,
            startY: 45, // Отступ после шапки
            styles: {
                font: "Roboto",
                fontSize: 7.5, // Оптимально для 31 колонки
                cellPadding: 2,
                textColor: [40, 40, 40], // Темно-серый цвет текста для печати
                lineColor: [180, 180, 180], // Цвет границ
                lineWidth: 0.1,
            },
            headStyles: { 
                fillColor: [230, 235, 245], // Светло-серо-голубой, строгий цвет шапки
                textColor: [20, 20, 20],
                halign: 'center',
                valign: 'middle',
                fontStyle: 'normal' // ВАЖНО: чтобы не слетел русский шрифт, так как Bold мы не грузили
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250] // Легкая "зебра" для удобства чтения строк
            },
            columnStyles: {
                0: { halign: 'left', cellWidth: 40 }, // Предметы выровнены по левому краю
                [daysCount + 1]: { fillColor: [240, 248, 255], fontStyle: 'normal' } // Выделяем столбец с итогами
            },
            didParseCell: function (data) {
                // Выделение плохих и отличных оценок (классика красной ручки)
                if (data.section === 'body' && data.column.index > 0 && data.column.index <= daysCount) {
                    const val = data.cell.text[0];
                    if (val === '5') data.cell.styles.textColor = [34, 150, 70]; // Приглушенный зеленый
                    if (val === '2' || val === 'н') data.cell.styles.textColor = [200, 50, 50]; // Строгий красный
                }
            }
        });

        // 5. ПОДВАЛ ДОКУМЕНТА (Подписи)
        // Получаем координату Y конца таблицы, чтобы начать рисовать под ней
        const finalY = doc.lastAutoTable.finalY + 15; 
        
        doc.setFontSize(10);
        doc.text("Куратор:", 14, finalY);
        doc.text("_______________________", 60, finalY); // Место для подписи
        
        doc.text("Директор:", 14, finalY + 10);
        doc.text("_______________________", 60, finalY + 10);

        // Дата выдачи табеля в правом нижнем углу
        const today = new Date().toLocaleDateString('ru-RU');
        doc.text(`Дата выдачи: ${today}`, pageWidth - 14, finalY + 10, { align: 'right' });

        // Сохранение
        doc.save(`Табель_${profileName.value}_${monthName.value}.pdf`);

    } catch (error) {
        console.error("Ошибка при генерации PDF:", error);
        alert("Не удалось создать PDF. Проверьте наличие шрифта public/fonts/Roboto-Regular.ttf");
    }
};



const route = useRoute();
const studentId = route.params.id;
const loading = ref(true);
const journalData = ref([]);
const profileName = ref("");

// Логика календаря
const currentDate = ref(new Date());
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const monthName = computed(() => {
    return currentDate.value.toLocaleString('ru-RU', { month: 'long' });
});

const daysInMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const getDayOfWeek = (day) => {
    const date = new Date(currentYear.value, currentMonth.value, day);
    return date.toLocaleString('ru-RU', { weekday: 'short' });
};

const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth.value && today.getFullYear() === currentYear.value;
};

// Навигация по месяцам
const prevMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
    fetchJournal();
};

const nextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
    fetchJournal();
};

// Загрузка данных
const fetchJournal = async () => {
    loading.value = true;
    try {
        // const res = await axios.get(`https://localhost:7081/api/Grades/journal/${studentId}`);
        // journalData.value = res.data;



        const [res, profileResponse] = await Promise.all([
            axios.get(`https://localhost:7081/api/Grades/journal/${studentId}`),
            axios.get(`https://localhost:7081/api/Profile/${studentId}`)
        ]);

        journalData.value = [...res.data];
        profileName.value = profileResponse.data.student.fullName;
    } catch (error) {
        console.error("Ошибка API:", error);
    } finally {
        loading.value = false;
    }
};

const getMarkForDay = (marks, day) => {
    return marks.find(m => {
        const mDate = new Date(m.date);
        return mDate.getDate() === day && mDate.getMonth() === currentMonth.value;
    });
};

const getMarkClass = (val) => {
    if (val === 'н') return 'm-n';
    if (val === '5') return 'm-5';
    if (val === '4') return 'm-4';
    if (val === '3') return 'm-3';
    return 'm-2';
};

onMounted(fetchJournal);
</script>

<style scoped>
.btn-pdf {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background-color: #4C6FFF;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 20px;
}

.btn-pdf:hover {
    background-color: #3b5bdb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 111, 255, 0.2);
}

.btn-pdf:disabled {
    background-color: #cbd5e1;
    cursor: not-allowed;
}

.journal-container {
    padding: 30px;
    max-width: 1400px;
    margin: 0 auto;
}

.journal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-left h1 {
    font-size: 26px;
    color: #4A5568;
    font-weight: 600;
    margin: 0;
}

.btn-back {
    width: 45px;
    height: 45px;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    background: white;
    color: #718096;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.btn-back:hover {
    background: #F7FAFC;
    color: #4C6FFF;
    border-color: #4C6FFF;
}

/* Календарь */
.calendar-controls {
    display: flex;
    align-items: center;
    background: white;
    padding: 8px 16px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    gap: 20px;
}

.current-month {
    font-weight: 600;
    color: #4A5568;
    text-transform: capitalize;
    min-width: 120px;
    text-align: center;
}

.nav-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #A0AEC0;
    cursor: pointer;
    padding: 0 10px;
}

.nav-btn:hover {
    color: #4C6FFF;
}

/* Таблица */
.journal-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(112, 144, 176, 0.08);
    overflow: hidden;
}

.table-responsive {
    overflow-x: auto;
}

.journal-table {
    width: 100%;
    border-collapse: collapse;
}

.sticky-subject {
    position: sticky;
    left: 0;
    background: white;
    z-index: 10;
    padding: 20px;
    text-align: left;
    min-width: 220px;
    border-right: 1px solid #EDF2F7;
    font-weight: 600;
    color: #4A5568;
}

.date-col {
    padding: 10px;
    min-width: 50px;
    border-bottom: 1px solid #EDF2F7;
    text-align: center;
}

.day-num {
    font-size: 14px;
    font-weight: 700;
    color: #4A5568;
}

.day-name {
    font-size: 11px;
    color: #A0AEC0;
    text-transform: uppercase;
}

.is-today {
    background: #F0F4FF;
}

.is-today .day-num {
    color: #4C6FFF;
}

.mark-cell {
    height: 60px;
    border-bottom: 1px solid #EDF2F7;
    border-right: 1px solid #F7FAFC;
    text-align: center;
}

.mark-badge {
    width: 36px;
    height: 36px;
    line-height: 36px;
    margin: 0 auto;
    border-radius: 10px;
    font-weight: 700;
    font-size: 15px;
    position: relative;
}

/* Цвета */
.m-5 {
    background: #EFFFF4;
    color: #4CD964;
}

.m-4 {
    background: #F0F4FF;
    color: #4C6FFF;
}

.m-3 {
    background: #FFF9F0;
    color: #FF9500;
}

.m-n {
    background: #FFF2F1;
    color: #FF3B30;
}

.exam-point {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 6px;
    height: 6px;
    background: #FF3B30;
    border-radius: 50%;
    border: 1px solid white;
}

.loading-state {
    padding: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    color: #A0AEC0;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #F3F3F3;
    border-top: 4px solid #4C6FFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>