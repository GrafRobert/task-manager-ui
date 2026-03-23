<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopNavbar from '@/components/TopNavbar.vue'
import apiClient from '@/api/axios'
import TaskForm from '@/components/TaskForm.vue'
import type { Task } from '@/types'
import type { ProjectMember } from '@/types'
import type { User } from '../types'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id
const currentUser = ref<User | null>(null)

const tasks = ref<Task[]>([])
const loading = ref(true)
const showTaskModal = ref(false)

const selectedTask = ref<Task | null>(null)

const showMembersModal = ref(false)
const newMemberEmail = ref('')
const members = ref<ProjectMember[]>([])
const isInviting = ref(false)

const showFeedbackModal = ref(false)
const feedbackText = ref('')
const pendingMove = ref<{ task: Task; newStatus: string } | null>(null)
const expandedFeedbacks = ref<Record<number, boolean>>([])

const toggleFeedback = (taskId: number) => {
  expandedFeedbacks.value[taskId] = !expandedFeedbacks.value[taskId]
}

const openEditModal = (task: Task) => {
  selectedTask.value = task
  showTaskModal.value = true
}

const openNewTaskModal = () => {
  selectedTask.value = null
  showTaskModal.value = true
}

const closeTaskModal = () => {
  showTaskModal.value = false
  selectedTask.value = null
}

const getAssigneeName = (userId: number | string | null) => {
  if (!userId) return null

  // Am pus ': any' ca să putem căuta după 'm.id' fără să primim eroare pe Vercel
  const member = members.value.find(
    (m: any) => m.id == userId || m.user_id == userId || m.user?.id == userId,
  )

  if (member) {
    return member.user?.name || member.name || member.user?.email || member.email || 'Coleg'
  }

  return 'Necunoscut'
}

const fetchTasks = async () => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/tasks`)
    tasks.value = response.data.tasks || []
  } catch (error) {
    console.error('Eroare la încărcarea task-urilor:', error)
    const err = error as { response?: { status: number } }
    if (err.response?.status === 401) {
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
  } catch (error) {
    console.error('Eroare la invitație:', error)
    const err = error as { response?: { status: number; data?: { error?: string } } }
    if (err.response?.data?.error) {
      alert(err.response.data.error)
    } else {
      alert('Eroare la adăugarea colegului.')
    }
  } finally {
    isInviting.value = false
  }
}

const startDrag = (evt: DragEvent, task: Task) => {
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('taskId', task.id.toString())
  }
}

const executeTaskMove = async (task: Task, newStatus: string, feedback: string | null) => {
  const oldStatus = task.status
  const oldFeedback = task.feedback || null

  task.status = newStatus
  task.feedback = feedback

  try {
    await apiClient.patch(`/projects/${projectId}/tasks/${task.id}`, {
      status: newStatus,
      feedback: feedback,
    })
  } catch (error) {
    console.error('Eroare la actualizarea statusului:', error)
    task.status = oldStatus
    task.feedback = oldFeedback
    alert('Nu am putut muta task-ul pe server. Te rugăm să încerci din nou.')
  }
}

const onDrop = async (evt: DragEvent, newStatus: string) => {
  const taskIdStr = evt.dataTransfer?.getData('taskId')
  if (!taskIdStr) return

  const taskId = parseInt(taskIdStr)
  const task = tasks.value.find((t) => t.id === taskId)

  if (task && task.status !== newStatus) {
    if (newStatus === 'DONE') {
      if (currentUser.value?.role !== 'Tester') {
        alert('⛔ Acces interzis! Doar persoanele cu rolul de "Tester" pot finaliza un task.')
        return
      }
    }

    const oldStatus = task.status

    if (oldStatus === 'TESTING' && newStatus === 'TODO') {
      pendingMove.value = { task, newStatus }
      feedbackText.value = ''
      showFeedbackModal.value = true
      return
    }

    let noulFeedback = task.feedback || null

    if (newStatus === 'TESTING') {
      noulFeedback = null
    }

    await executeTaskMove(task, newStatus, noulFeedback)
  }
}

const confirmFeedback = async () => {
  if (!pendingMove.value) return
  if (!feedbackText.value.trim()) {
    alert('Te rog să introduci un motiv pentru care întorci task-ul.')
    return
  }

  const { task, newStatus } = pendingMove.value
  showFeedbackModal.value = false
  pendingMove.value = null

  await executeTaskMove(task, newStatus, feedbackText.value)
}

const cancelFeedback = () => {
  showFeedbackModal.value = false
  pendingMove.value = null
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

const onTaskSaved = async () => {
  closeTaskModal()
  loading.value = true
  await fetchTasks()
}

const todoTasks = computed(() => tasks.value.filter((task) => task.status === 'TODO'))
const inProgressTasks = computed(() => tasks.value.filter((task) => task.status === 'IN_PROGRESS'))
const testingTasks = computed(() => tasks.value.filter((task) => task.status === 'TESTING'))
const doneTasks = computed(() => tasks.value.filter((task) => task.status === 'DONE'))

const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get('/users/profile')
    currentUser.value = response.data.user
  } catch (error) {
    console.error('Nu am putut aduce profilul utilizatorului.', error)
  }
}

onMounted(() => {
  fetchCurrentUser()
  fetchTasks()
  fetchMembers()
})
</script>

<template>
  <div class="app-layout">
    <TopNavbar @open-new-project="openNewTaskModal" />

    <main class="workspace-content">
      <div class="header-actions">
        <RouterLink to="/dashboard" class="back-link">← Înapoi la Proiecte</RouterLink>
      </div>

      <div class="workspace-header">
        <h1>Spațiul de lucru: Proiectul #{{ projectId }}</h1>
        <div class="header-buttons">
          <button class="team-btn" @click="showMembersModal = true">👥 Echipa</button>
          <button class="add-task-btn" @click="openNewTaskModal">+ Task Nou</button>
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
                <div style="display: flex; gap: 0.25rem">
                  <button
                    class="delete-task-btn"
                    @click="openEditModal(task)"
                    title="Editeaza task"
                  >
                    ✏️
                  </button>
                  <button class="delete-task-btn" @click="deleteTask(task.id)" title="Sterge task">
                    🗑️
                  </button>
                </div>
              </div>

              <h4>{{ task.title }}</h4>
              <!-- <pre style="font-size: 10px; color: red; background: #fee2e2; padding: 5px">{{
                task
              }}</pre> -->
              <p>{{ task.description }}</p>

              <div
                v-if="task.feedback"
                class="feedback-badge"
                :class="{ expanded: expandedFeedbacks[task.id] }"
              >
                <span class="feedback-icon">⚠️</span>
                <div class="feedback-content">
                  <div class="feedback-header-inline">
                    <strong>Task Respins</strong>
                    <button @click.stop="toggleFeedback(task.id)" class="toggle-feedback-btn">
                      {{ expandedFeedbacks[task.id] ? 'Restrânge' : 'Vezi tot' }}
                    </button>
                  </div>
                  <p class="feedback-text" :class="{ expanded: expandedFeedbacks[task.id] }">
                    {{ task.feedback }}
                  </p>
                </div>
              </div>

              <div class="card-footer" v-if="task.assigned_to">
                <span class="assignee">👤 {{ getAssigneeName(task.assigned_to) }}</span>
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
                <div style="display: flex; gap: 0.25rem">
                  <button
                    class="delete-task-btn"
                    @click="openEditModal(task)"
                    title="Editeaza task"
                  >
                    ✏️
                  </button>
                  <button class="delete-task-btn" @click="deleteTask(task.id)" title="Sterge task">
                    🗑️
                  </button>
                </div>
              </div>

              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>

              <div
                v-if="task.feedback"
                class="feedback-badge"
                :class="{ expanded: expandedFeedbacks[task.id] }"
              >
                <span class="feedback-icon">⚠️</span>
                <div class="feedback-content">
                  <div class="feedback-header-inline">
                    <strong>Task Respins</strong>
                    <button @click.stop="toggleFeedback(task.id)" class="toggle-feedback-btn">
                      {{ expandedFeedbacks[task.id] ? 'Restrânge' : 'Vezi tot' }}
                    </button>
                  </div>
                  <p class="feedback-text" :class="{ expanded: expandedFeedbacks[task.id] }">
                    {{ task.feedback }}
                  </p>
                </div>
              </div>

              <div class="card-footer" v-if="task.assignee_name">
                <span class="assignee">👤 {{ task.assignee_name }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <div
          class="kanban-column"
          @drop="onDrop($event, 'TESTING')"
          @dragover.prevent
          @dragenter.prevent
        >
          <div class="column-header testing-header">
            <h3>
              De testat <span>{{ testingTasks.length }}</span>
            </h3>
          </div>
          <TransitionGroup name="task-anim" tag="div" class="task-list">
            <div v-if="testingTasks.length === 0" class="empty-task" key="empty-test">
              Trage un task aici.
            </div>

            <div
              v-for="task in testingTasks"
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
                <div style="display: flex; gap: 0.25rem">
                  <button
                    class="delete-task-btn"
                    @click="openEditModal(task)"
                    title="Editeaza task"
                  >
                    ✏️
                  </button>
                  <button class="delete-task-btn" @click="deleteTask(task.id)" title="Sterge task">
                    🗑️
                  </button>
                </div>
              </div>

              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>

              <div
                v-if="task.feedback"
                class="feedback-badge"
                :class="{ expanded: expandedFeedbacks[task.id] }"
              >
                <span class="feedback-icon">⚠️</span>
                <div class="feedback-content">
                  <div class="feedback-header-inline">
                    <strong>Task Respins</strong>
                    <button @click.stop="toggleFeedback(task.id)" class="toggle-feedback-btn">
                      {{ expandedFeedbacks[task.id] ? 'Restrânge' : 'Vezi tot' }}
                    </button>
                  </div>
                  <p class="feedback-text" :class="{ expanded: expandedFeedbacks[task.id] }">
                    {{ task.feedback }}
                  </p>
                </div>
              </div>

              <div class="card-footer" v-if="task.assignee_name">
                <span class="assignee">👤 {{ task.assignee_name }}</span>
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
                <div style="display: flex; gap: 0.25rem">
                  <button
                    class="delete-task-btn"
                    @click="openEditModal(task)"
                    title="Editeaza task"
                  >
                    ✏️
                  </button>
                  <button class="delete-task-btn" @click="deleteTask(task.id)" title="Sterge task">
                    🗑️
                  </button>
                </div>
              </div>

              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>

              <div
                v-if="task.feedback"
                class="feedback-badge"
                :class="{ expanded: expandedFeedbacks[task.id] }"
              >
                <span class="feedback-icon">⚠️</span>
                <div class="feedback-content">
                  <div class="feedback-header-inline">
                    <strong>Task Respins</strong>
                    <button @click.stop="toggleFeedback(task.id)" class="toggle-feedback-btn">
                      {{ expandedFeedbacks[task.id] ? 'Restrânge' : 'Vezi tot' }}
                    </button>
                  </div>
                  <p class="feedback-text" :class="{ expanded: expandedFeedbacks[task.id] }">
                    {{ task.feedback }}
                  </p>
                </div>
              </div>

              <div class="card-footer" v-if="task.assignee_name">
                <span class="assignee">👤 {{ task.assignee_name }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
        <div class="modal-content">
          <TaskForm
            :projectId="projectId as string"
            :task="selectedTask"
            @saved="onTaskSaved"
            @cancel="closeTaskModal"
          />
        </div>
      </div>

      <div v-if="showFeedbackModal" class="modal-overlay" @click.self="cancelFeedback">
        <div class="modal-content feedback-modal">
          <div class="feedback-header">
            <div class="warning-icon-wrapper">
              <span class="warning-icon">⚠️</span>
            </div>
            <h3 class="feedback-title">Task Respins</h3>
          </div>

          <p class="feedback-subtitle">
            Te rugăm să descrii problema găsită pentru ca programatorul să știe exact ce are de
            reparat.
          </p>

          <textarea
            v-model="feedbackText"
            class="feedback-textarea"
            rows="4"
            placeholder="Ex: Butonul de login nu reacționează pe varianta de mobil..."
          ></textarea>

          <div class="form-actions">
            <button class="cancel-btn" @click="cancelFeedback">Anulează</button>
            <button class="danger-btn" @click="confirmFeedback">Trimite înapoi</button>
          </div>
        </div>
      </div>

      <div v-if="showMembersModal" class="modal-overlay" @click.self="showMembersModal = false">
        <div class="modal-content team-modal">
          <div class="modal-header">
            <h3>Membrii Echipei</h3>
            <button class="close-btn" @click="showMembersModal = false">✕</button>
          </div>

          <div class="members-list">
            <div v-for="member in members" :key="member.user_id" class="member-item">
              <span class="member-name"
                >{{ member.name || 'Coleg' }} ({{ member.email || member.user?.email }})</span
              >
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
/* Containerul principal */
.app-layout {
  min-height: 100vh;
  background-color: #f1f5f9; /* Culoarea de bază */
  position: relative;
  overflow: hidden; /* Nu lăsăm culorile să iasă din pagină */
  z-index: 0;
}

/* Magia: Creăm 2 "nori" uriași de culoare care se mișcă */
.app-layout::before,
.app-layout::after {
  content: '';
  position: absolute;
  width: 50vw;
  height: 50vw;
  border-radius: 50%;
  z-index: -1; /* Îi punem în spatele aplicației */
  filter: blur(120px); /* Asta îi face să pară ca un gradient foarte fin */
  opacity: 0.6;
  animation: floatOrbs 15s infinite alternate ease-in-out;
}

/* Norul 1: Albastru spre Mov (Stânga-Sus) */
.app-layout::before {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  top: -10%;
  left: -10%;
}

/* Norul 2: Verde spre Portocaliu (Dreapta-Jos) */
.app-layout::after {
  background: linear-gradient(135deg, #10b981, #f59e0b);
  bottom: -10%;
  right: -10%;
  animation-delay: -7s; /* Îl facem să se miște asimetric față de primul */
}

/* Animația care le face să plutească "respire" pe ecran */
@keyframes floatOrbs {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(15%, 10%) scale(1.2);
  }
  100% {
    transform: translate(-10%, 15%) scale(0.9);
  }
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

  /* AICI E SECRETUL: Alb cu 60% opacitate */
  background-color: rgba(255, 255, 255, 0.6);

  /* Asta încețoșează fundalul animat exact în spatele coloanei (Glassmorphism) */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  /* O margine foarte fină, albă, care dă senzația de sticlă */
  border: 1px solid rgba(255, 255, 255, 0.8);

  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
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
.testing-header {
  border-top: 4px solid #f59e0b;
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

@media (max-width: 1024px) {
  .kanban-board {
    flex-direction: column;
    align-items: stretch;
    overflow-x: visible;
  }

  .kanban-column {
    width: 100%;
    min-width: auto;
    max-height: none;
    margin-bottom: 1rem;
  }

  .task-list {
    max-height: 400px;
    overflow-y: auto;
  }
}

/* --- STILURI MODAL FEEDBACK TESTER --- */

.feedback-modal {
  max-width: 480px; /* Un pic mai lat pentru a lăsa textul să respire */
  padding: 2rem;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.warning-icon-wrapper {
  background-color: #fee2e2; /* Un roșu foarte pal */
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* Face iconița rotundă perfect */
  border: 4px solid #fef2f2;
}

.warning-icon {
  font-size: 1.3rem;
}

.feedback-title {
  color: #b91c1c; /* Un roșu închis, profi */
  font-size: 1.4rem;
  margin: 0;
  font-weight: 700;
}

.feedback-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
  padding-left: 0.2rem;
}

.feedback-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px; /* Mai rotunjit, modern */
  font-family: inherit;
  font-size: 0.95rem;
  color: #334155;
  background-color: #f8fafc;
  resize: vertical;
  min-height: 100px;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

/* Efectul de Focus când dai click să scrii */
.feedback-textarea:focus {
  outline: none;
  border-color: #ef4444; /* Roșu la selecție */
  background-color: #ffffff;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15); /* Un halo subtil */
}

.feedback-textarea::placeholder {
  color: #94a3b8;
}

/* Butonul de respingere (Roșu) */
.danger-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
}

.danger-btn:hover {
  background-color: #dc2626;
  transform: translateY(-2px); /* Se ridică puțin la hover */
  box-shadow: 0 6px 8px -1px rgba(239, 68, 68, 0.3);
}

.danger-btn:active {
  transform: translateY(0); /* Coboară când faci click efectiv */
}

/* Butonul de Anulare (Secundar / Gri) */
.cancel-btn {
  background-color: transparent;
  color: #64748b; /* Un gri elegant */
  border: 2px solid #e2e8f0; /* O margine subtilă, dar prezentă */
  padding: 0.75rem 1.5rem;
  border-radius: 8px; /* Exact aceeași rotunjire ca butonul roșu */
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #f8fafc; /* Se luminează foarte puțin la hover */
  color: #0f172a; /* Textul devine mai închis/vizibil */
  border-color: #cbd5e1; /* Marginea se conturează mai bine */
}

.cancel-btn:active {
  background-color: #f1f5f9; /* Efect de apăsare fizică */
  transform: translateY(1px);
}

/* --- STILURI MODIFICATE PENTRU FEEDBACK ACORDEON --- */
.feedback-badge {
  display: flex;
  gap: 0.5rem;
  background-color: #fee2e2;
  border-left: 4px solid #ef4444;
  padding: 0.6rem 0.75rem;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  position: relative; /* Pentru a poziționa efectul de fade */
  transition: all 0.3s ease-in-out; /* Animație fină la expandare */
}

/* Când e expandat, scoatem limitarea de înălțime a bazei */
.feedback-badge.expanded {
  padding-bottom: 0.6rem;
}

.feedback-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.toggle-feedback-btn {
  background: transparent;
  border: none;
  color: #ef4444; /* Roșu ca eticheta */
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-feedback-btn:hover {
  text-decoration: underline;
}

.feedback-text {
  color: #7f1d1d;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;

  /* --- CODUL MAGIC DE TĂIERE A TEXTULUI --- */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Arată maximum 2 rânduri implicit */
  -webkit-box-orient: vertical;
  overflow: hidden; /* Ascunde restul */
  text-overflow: ellipsis; /* Pune puncte puncte (...) */

  position: relative;
  transition: max-height 0.3s ease;
}

/* --- CÂND TEXTUL E EXPANDAT --- */
.feedback-text.expanded {
  display: block; /* Dezactivăm tăierea automată a rândurilor */
  overflow: visible;
  -webkit-line-clamp: unset; /* Scoatem limita de 2 rânduri */
  max-height: 1000px; /* O înălțime suficient de mare pentru orice text */
}

/* Efectul opțional de fade-out când e restrâns (arata mai bine textul tăiat) */
.feedback-text:not(.expanded)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 15px;
  background: linear-gradient(to bottom, rgba(254, 226, 226, 0), rgba(254, 226, 226, 1));
}
</style>
