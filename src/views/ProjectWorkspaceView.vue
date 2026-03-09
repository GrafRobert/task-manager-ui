<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import TopNavbar from '@/components/TopNavbar.vue'
import apiClient from '@/api/axios'

const route = useRoute()
const projectId = route.params.id

const tasks = ref<any[]>([])
const loading = ref(true)

const fetchTasks = async () => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/tasks`)
    tasks.value = response.data.tasks || []
  } catch (error) {
    console.error('Eroare la încărcarea task-urilor:', error)
  } finally {
    loading.value = false
  }
}

const todoTasks = computed(() => tasks.value.filter((task) => task.status === 'TODO'))

const inProgressTasks = computed(() => tasks.value.filter((task) => task.status === 'IN_PROGRESS'))

const doneTasks = computed(() => tasks.value.filter((task) => task.status === 'DONE'))

onMounted(() => {
  fetchTasks()
})
</script>

<template>
  <div class="app-layout">
    <TopNavbar />

    <main class="workspace-content">
      <div class="header-actions">
        <RouterLink to="/dashboard" class="back-link">← Înapoi la Proiecte</RouterLink>
      </div>

      <div class="workspace-header">
        <h1>Spațiul de lucru: Proiectul #{{ projectId }}</h1>
        <button class="add-task-btn">+ Task Nou</button>
      </div>

      <p v-if="loading" class="loading-text">Se încarcă tabla de lucru...</p>

      <div v-else class="kanban-board">
        <div class="kanban-column">
          <div class="column-header todo-header">
            <h3>
              De făcut <span>{{ todoTasks.length }}</span>
            </h3>
          </div>
          <div class="task-list">
            <div v-if="todoTasks.length === 0" class="empty-task">Niciun task.</div>
            <div v-for="task in todoTasks" :key="task.id" class="task-card">
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
            </div>
          </div>
        </div>

        <div class="kanban-column">
          <div class="column-header in-progress-header">
            <h3>
              În lucru <span>{{ inProgressTasks.length }}</span>
            </h3>
          </div>
          <div class="task-list">
            <div v-if="inProgressTasks.length === 0" class="empty-task">Niciun task.</div>
            <div v-for="task in inProgressTasks" :key="task.id" class="task-card">
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
            </div>
          </div>
        </div>

        <div class="kanban-column">
          <div class="column-header done-header">
            <h3>
              Finalizate <span>{{ doneTasks.length }}</span>
            </h3>
          </div>
          <div class="task-list">
            <div v-if="doneTasks.length === 0" class="empty-task">Niciun task.</div>
            <div v-for="task in doneTasks" :key="task.id" class="task-card">
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f8fafc;
}
.workspace-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header-actions {
  margin-bottom: 1.5rem;
}
.back-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.back-link:hover {
  color: #2563eb;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.workspace-header h1 {
  margin: 0;
  color: #1e293b;
  font-size: 1.8rem;
}
.add-task-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.add-task-btn:hover {
  background-color: #1d4ed8;
}

.loading-text {
  color: #64748b;
  font-style: italic;
}

/* --- Design Kanban Board --- */
.kanban-board {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start; /* Coloanele cresc doar cât au conținut */
  overflow-x: auto; /* Permite scroll orizontal dacă ecranul e mic */
  padding-bottom: 1rem;
}

.kanban-column {
  flex: 1;
  min-width: 300px;
  background-color: #f1f5f9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: 1rem;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.column-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.column-header span {
  background: white;
  padding: 0.1rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: bold;
}

/* Culori subtile pentru fiecare coloană */
.todo-header {
  border-top: 4px solid #94a3b8;
}
.in-progress-header {
  border-top: 4px solid #eab308;
}
.done-header {
  border-top: 4px solid #22c55e;
}

.task-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 150px;
}

.empty-task {
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
  font-style: italic;
  padding: 1rem 0;
}

/* Cardul de Task */
.task-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  cursor: grab; /* Indică faptul că va putea fi mutat (pe viitor) */
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.task-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.task-card h4 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 0.95rem;
}
.task-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.4;
}
</style>
