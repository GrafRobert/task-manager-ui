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

const showMembersModal = ref(false)
const newMemberEmail = ref('')
const members = ref<any[]>([])
const isInviting = ref(false)

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

const fetchMembers = async () => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/members`)
    members.value = response.data.members || []
  } catch (error) {
    console.error('Eroare la aducerea membrilor:', error)
  }
}

const inviteMember = async () => {
  if (!newMemberEmail.value) return

  isInviting.value = true

  try {
    await apiClient.post(`/projects/${projectId}/members`, {
      email: newMemberEmail.value,
    })

    newMemberEmail.value = ''

    await fetchMembers()
    alert('Coleg adăugat cu succes!')
  } catch (error: any) {
    console.error('Eroare la invitație:', error)
    if (error.response?.data?.error) {
      alert(error.response.data.error)
    } else {
      alert('Eroare la adăugarea colegului.')
    }
  } finally {
    isInviting.value = false
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

const deleteTask = async (taskId: number) => {
  const isConfirmed = confirm('Esti sigur ca vrei sa stergi acest task?')

  if (!isConfirmed) return

  try {
    await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`)

    await fetchTasks()
  } catch (error) {
    console.error('Eroare la ștergerea task-ului:', error)
    alert('A apărut o eroare și task-ul nu a putut fi șters.')
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
  fetchMembers()
})
</script>

<template>
  <div class="app-layout">
    <TopNavbar @open-new-project="showTaskModal = true" />

    <main class="workspace-content">
      <div class="header-actions">
        <RouterLink to="/dashboard" class="back-link">← Înapoi la Proiecte</RouterLink>
      </div>

      <div class="workspace-header">
        <h1>Spațiul de lucru: Proiectul #{{ projectId }}</h1>
        <div class="header-buttons">
          <button class="team-btn" @click="showMembersModal = true">👥 Echipa</button>
          <button class="add-task-btn" @click="showTaskModal = true">+ Task Nou</button>
        </div>
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
          <TransitionGroup name="task-anim" tag="div" class="task-list">
            <div v-if="todoTasks.length === 0" class="empty-task" key="empty-todo">
              Trage un task aici.
            </div>

            <div
              v-for="task in todoTasks"
              :key="task.id"
              class="task-card"
              draggable="true"
              @dragstart="startDrag($event, task)"
            >
              <div class="card-meta">
                <span :class="['priority-badge', (task.priority || 'MEDIUM').toLowerCase()]">
                  {{
                    task.priority === 'HIGH'
                      ? 'Ridicată'
                      : task.priority === 'LOW'
                        ? 'Scăzută'
                        : 'Medie'
                  }}
                </span>
                <button class="delete-task-btn" @click="deleteTask(task.id)" title="Sterge task">
                  🗑️
                </button>
              </div>

              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>

              <div class="card-footer" v-if="task.assigned_to">
                <span class="assignee">👤 {{ task.assigned_to }}</span>
              </div>
            </div>
          </TransitionGroup>
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
          <TransitionGroup name="task-anim" tag="div" class="task-list">
            <div v-if="inProgressTasks.length === 0" class="empty-task" key="empty-prog">
              Trage un task aici.
            </div>

            <div
              v-for="task in inProgressTasks"
              :key="task.id"
              class="task-card"
              draggable="true"
              @dragstart="startDrag($event, task)"
            >
              <div class="card-meta">
                <span :class="['priority-badge', (task.priority || 'MEDIUM').toLowerCase()]">
                  {{
                    task.priority === 'HIGH'
                      ? 'Ridicată'
                      : task.priority === 'LOW'
                        ? 'Scăzută'
                        : 'Medie'
                  }}
                </span>
                <button class="delete-task-btn" @click="deleteTask(task.id)" title="Sterge task">
                  🗑️
                </button>
              </div>

              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>

              <div class="card-footer" v-if="task.assigned_to">
                <span class="assignee">👤 {{ task.assigned_to }}</span>
              </div>
            </div>
          </TransitionGroup>
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
          <TransitionGroup name="task-anim" tag="div" class="task-list">
            <div v-if="doneTasks.length === 0" class="empty-task" key="empty-done">
              Trage un task aici.
            </div>

            <div
              v-for="task in doneTasks"
              :key="task.id"
              class="task-card"
              draggable="true"
              @dragstart="startDrag($event, task)"
            >
              <div class="card-meta">
                <span :class="['priority-badge', (task.priority || 'MEDIUM').toLowerCase()]">
                  {{
                    task.priority === 'HIGH'
                      ? 'Ridicată'
                      : task.priority === 'LOW'
                        ? 'Scăzută'
                        : 'Medie'
                  }}
                </span>
                <button class="delete-task-btn" @click="deleteTask(task.id)" title="Sterge task">
                  🗑️
                </button>
              </div>

              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>

              <div class="card-footer" v-if="task.assigned_to">
                <span class="assignee">👤 {{ task.assigned_to }}</span>
              </div>
            </div>
          </TransitionGroup>
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

      <div v-if="showMembersModal" class="modal-overlay" @click.self="showMembersModal = false">
        <div class="modal-content team-modal">
          <div class="modal-header">
            <h3>Membrii Echipei</h3>
            <button class="close-btn" @click="showMembersModal = false">✕</button>
          </div>

          <div class="members-list">
            <div v-for="member in members" :key="member.id" class="member-item">
              <span class="member-name">{{ member.name }} ({{ member.email }})</span>
              <span class="member-role">{{
                member.role === 'OWNER' ? '👑 Proprietar' : 'Membru'
              }}</span>
            </div>
          </div>

          <form @submit.prevent="inviteMember" class="invite-form">
            <input
              type="email"
              v-model="newMemberEmail"
              placeholder="Adresa de email a colegului..."
              required
            />
            <button type="submit" :disabled="isInviting">
              {{ isInviting ? 'Se invită...' : 'Invita' }}
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f1f5f9;
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
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
  color: #0f172a;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.add-task-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.add-task-btn:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

.loading-text {
  color: #64748b;
  font-style: italic;
  font-size: 1.1rem;
}

.kanban-board {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 2rem;
}

.kanban-column {
  flex: 1;
  min-width: 320px;
  background-color: #e2e8f0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
}

.column-header {
  padding: 1.25rem 1rem 1rem 1rem;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.column-header h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
}

.column-header span {
  background: #cbd5e1;
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #1e293b;
  font-weight: 800;
}

.todo-header {
  border-top: 4px solid #94a3b8;
}

.in-progress-header {
  border-top: 4px solid #3b82f6;
}

.done-header {
  border-top: 4px solid #22c55e;
}

.task-list {
  padding: 0 1rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 150px;
  overflow-y: auto;
  position: relative;
}

.empty-task {
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 2rem 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.5);
}

.task-card {
  background: white;
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #cbd5e1;
  cursor: grab;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.task-card:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-left-color: #3b82f6;
}

.task-card:active {
  cursor: grabbing;
  transform: scale(0.98) rotate(1deg);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
}

.task-card h4 {
  margin: 0 0 0.5rem 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
}

.task-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.task-anim-move,
.task-anim-enter-active,
.task-anim-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.task-anim-enter-from,
.task-anim-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.95);
}

.task-anim-leave-active {
  position: absolute;
  width: calc(100% - 2rem);
}

/* Containerul de sus al cardului */
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

/* Forma generală a insignei de prioritate */
.priority-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
}

/* Culorile pentru fiecare tip de prioritate (care sunt generate dinamic de Vue) */
.priority-badge.low {
  background-color: #dbeafe;
  color: #1e40af;
}
.priority-badge.medium {
  background-color: #fef3c7;
  color: #b45309;
}
.priority-badge.high {
  background-color: #fee2e2;
  color: #b91c1c;
}

/* Bara de jos a cardului */
.card-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  justify-content: flex-end; /* Împinge numele persoanei în dreapta */
}

/* Cum arată eticheta cu persoana alocată */
.assignee {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 600;
  background-color: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

/* Gruparea butoanelor sus */
.header-buttons {
  display: flex;
  gap: 1rem;
}

/* Butonul Echipă */
.team-btn {
  background-color: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.team-btn:hover {
  background-color: #e2e8f0;
  color: #0f172a;
}

/* Modalul de echipă */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
}
.modal-header h3 {
  margin: 0;
  color: #0f172a;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
}
.close-btn:hover {
  color: #ef4444;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  max-height: 250px;
  overflow-y: auto;
}
.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}
.member-name {
  font-weight: 600;
  color: #334155;
  font-size: 0.9rem;
}
.member-role {
  font-size: 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.invite-form {
  display: flex;
  gap: 0.5rem;
}
.invite-form input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
}
.invite-form input:focus {
  border-color: #42b883;
}
.invite-form button {
  background: #10b981;
  color: white;
  border: none;
  padding: 0 1.25rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.invite-form button:hover:not(:disabled) {
  background: #059669;
}
.invite-form button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.delete-task-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.2s;
  padding: 0.2rem;
  border-radius: 4px;
}

.delete-task-btn:hover {
  opacity: 1;
  background-color: #fee2e2;
  transform: scale(1.1);
}
</style>
