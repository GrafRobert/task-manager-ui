<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopNavbar from '@/components/TopNavbar.vue'
import apiClient from '@/api/axios'
import TaskForm from '@/components/TaskForm.vue'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id

const tasks = ref<any[]>([])
const loading = ref(true)
const showTaskModal = ref(false)

const fetchTasks = async () => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/tasks`)
    tasks.value = response.data.tasks || []
  } catch (error: any) {
    console.error('Eroare la încărcarea task-urilor:', error)
    if (error.response?.status === 401) {
      alert('Sesiunea a expirat. Te rugăm să te loghezi din nou.')
      localStorage.removeItem('token')
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}

const startDrag = (evt: DragEvent, task: any) => {
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('taskId', task.id.toString())
  }
}

const onDrop = async (evt: DragEvent, newStatus: string) => {
  const taskIdStr = evt.dataTransfer?.getData('taskId')
  if (!taskIdStr) return

  const taskId = parseInt(taskIdStr)
  const task = tasks.value.find((t) => t.id === taskId)

  if (task && task.status !== newStatus) {
    const oldStatus = task.status
    task.status = newStatus
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, {
        status: newStatus,
      })
    } catch (error) {
      console.error('Eroare la actualizarea statusului:', error)
      task.status = oldStatus
      alert('Nu am putut muta task-ul pe server. Te rugăm să încerci din nou.')
    }
  }
}

const onTaskCreated = async () => {
  showTaskModal.value = false
  loading.value = true
  await fetchTasks()
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
        <button class="add-task-btn" @click="showTaskModal = true">+ Task Nou</button>
      </div>

      <p v-if="loading" class="loading-text">Se încarcă tabla de lucru...</p>

      <div v-else class="kanban-board">
        <div
          class="kanban-column"
          @drop="onDrop($event, 'TODO')"
          @dragover.prevent
          @dragenter.prevent
        >
          <div class="column-header todo-header">
            <h3>
              De făcut <span>{{ todoTasks.length }}</span>
            </h3>
          </div>
          <div class="task-list">
            <div v-if="todoTasks.length === 0" class="empty-task">Trage un task aici.</div>
            <div
              v-for="task in todoTasks"
              :key="task.id"
              class="task-card"
              draggable="true"
              @dragstart="startDrag($event, task)"
            >
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
            </div>
          </div>
        </div>
        <div
          class="kanban-column"
          @drop="onDrop($event, 'IN_PROGRESS')"
          @dragover.prevent
          @dragenter.prevent
        >
          <div class="column-header in-progress-header">
            <h3>
              În lucru <span>{{ inProgressTasks.length }}</span>
            </h3>
          </div>
          <div class="task-list">
            <div v-if="inProgressTasks.length === 0" class="empty-task">Trage un task aici.</div>
            <div
              v-for="task in inProgressTasks"
              :key="task.id"
              class="task-card"
              draggable="true"
              @dragstart="startDrag($event, task)"
            >
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
            </div>
          </div>
        </div>
        <div
          class="kanban-column"
          @drop="onDrop($event, 'DONE')"
          @dragover.prevent
          @dragenter.prevent
        >
          <div class="column-header done-header">
            <h3>
              Finalizate <span>{{ doneTasks.length }}</span>
            </h3>
          </div>
          <div class="task-list">
            <div v-if="doneTasks.length === 0" class="empty-task">Trage un task aici.</div>
            <div
              v-for="task in doneTasks"
              :key="task.id"
              class="task-card"
              draggable="true"
              @dragstart="startDrag($event, task)"
            >
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showTaskModal" class="modal-overlay" @click.self="showTaskModal = false">
        <div class="modal-content">
          <TaskForm
            :projectId="projectId as string"
            @task-created="onTaskCreated"
            @cancel="showTaskModal = false"
          />
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

.kanban-board {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  overflow-x: auto;
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

.task-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  cursor: grab;
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

/* --- CSS PENTRU MODAL --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
