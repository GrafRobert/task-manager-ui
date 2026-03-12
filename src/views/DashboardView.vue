<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'
import ProjectForm from '@/components/ProjectForm.vue'
import TopNavbar from '@/components/TopNavbar.vue'
import type { Project } from '@/types'

const projects = ref<Project[]>([])
const loading = ref(true)
const errorMessage = ref('')
const showModal = ref(false)
const router = useRouter()

const showRoleModal = ref(false)
const selectedRole = ref('Developer')
const isSavingRole = ref(false)

const checkUserRole = async () => {
  try {
    const response = await apiClient.get('/users/profile')
    const user = response.data.user

    if (!user.role || user.role === 'NEALOCAT') {
      showRoleModal.value = true
    }
  } catch (error) {
    console.error('Eroare la verificarea rolului:', error)
  }
}

const saveRole = async () => {
  try {
    isSavingRole.value = true

    await apiClient.put('/users/role', { role: selectedRole.value })
    showRoleModal.value = false
  } catch (error) {
    console.error('Eroare la salvarea rolului:', error)
    alert('A apărut o eroare la salvarea rolului.')
  } finally {
    isSavingRole.value = false
  }
}

const goToProject = (projectId: number) => {
  router.push(`/project/${projectId}`)
}

const fetchProjects = async () => {
  try {
    const response = await apiClient.get('/projects')

    projects.value = response.data.projects
  } catch (error) {
    console.error('Eroare la încărcarea proiectelor:', error)
    errorMessage.value = 'Nu am putut încărca proiectele.'
  } finally {
    loading.value = false
  }
}

const onProjectCreated = async () => {
  showModal.value = false
  loading.value = true
  await fetchProjects()
}

onMounted(() => {
  checkUserRole()
  fetchProjects()
})
</script>

<template>
  <div class="app-layout">
    <TopNavbar @open-new-project="showModal = true" />

    <main class="dashboard-content">
      <div class="section-header">
        <h2>Proiectele mele</h2>
      </div>

      <p v-if="loading" class="loading-text">Se încarcă proiectele...</p>
      <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div v-else-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>Niciun proiect găsit</h3>
        <p>
          Apasă pe butonul albastru "+" din dreapta-sus pentru a crea primul tău spațiu de lucru.
        </p>
      </div>

      <div v-else class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <div class="card-header">
            <h3>{{ project.name }}</h3>
          </div>
          <p class="card-desc">{{ project.description || 'Fără descriere.' }}</p>
          <div class="card-footer">
            <span class="date">Creat: {{ new Date(project.created_at).toLocaleDateString() }}</span>
            <button class="view-btn" @click="goToProject(project.id)">Deschide →</button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <ProjectForm @project-created="onProjectCreated" @cancel="showModal = false" />
      </div>
    </div>
  </div>

  <div v-if="showRoleModal" class="modal-overlay">
    <div class="modal-content">
      <h2>Bun venit in echipa!</h2>
      <p>Pentru a-ți personaliza experiența, te rugăm să ne spui care este rolul tău principal.</p>

      <div class="input-group">
        <label>Selecteaza rolul tau:</label>
        <select v-model="selectedRole">
          <option value="Developer">👨‍💻 Developer</option>
          <option value="Manager">📊 Manager</option>
          <option value="Tester">🐛 Tester</option>
          <option value="Business Analyst">📈 Business Analyst</option>
        </select>
      </div>
      <button class="save-btn" @click="saveRole" :disabled="isSavingRole">
        {{ isSavingRole ? 'Se salvează...' : 'Continuă către Dashboard 🚀' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* --- FUNDALUL ANIMAT (Living Background) --- */
.app-layout {
  min-height: 100vh;
  background-color: #f1f5f9;
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.app-layout::before,
.app-layout::after {
  content: '';
  position: absolute;
  width: 50vw;
  height: 50vw;
  border-radius: 50%;
  z-index: -1;
  filter: blur(120px);
  opacity: 0.6;
  animation: floatOrbs 15s infinite alternate ease-in-out;
}

.app-layout::before {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  top: -10%;
  left: -10%;
}

.app-layout::after {
  background: linear-gradient(135deg, #10b981, #f59e0b);
  bottom: -10%;
  right: -10%;
  animation-delay: -7s;
}

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

/* --- CONTINUTUL DASHBOARD-ULUI --- */
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.section-header {
  margin-bottom: 2.5rem;
}

.section-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.loading-text {
  color: #64748b;
  font-style: italic;
  font-size: 1.1rem;
}

.error-text {
  color: #ef4444;
  font-weight: 600;
  background-color: #fef2f2;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #f87171;
}

/* --- STAREA FĂRĂ PROIECTE (Glassmorphism) --- */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  /* Transparență și blur ca să se vadă norii prin ea */
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 2px dashed rgba(203, 213, 225, 0.8);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;
  opacity: 0.8;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 700;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* --- GRILA DE CARDURI --- */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

/* --- CARDURILE DE PROIECTE (Efect de Sticlă) --- */
.project-card {
  /* Alb transparent pentru efectul de sticlă */
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  padding: 1.75rem;
  border-radius: 12px;
  /* Margine albă, fină, care dă reflexia de sticlă */
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 4px 6px -1px rgba(31, 38, 135, 0.05),
    0 2px 4px -1px rgba(31, 38, 135, 0.03);
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s,
    border-color 0.2s;
}

.project-card:hover {
  transform: translateY(-4px);
  /* Devine un pic mai alb când treci cu mouse-ul peste */
  background: rgba(255, 255, 255, 0.85);
  box-shadow:
    0 12px 20px -5px rgba(31, 38, 135, 0.1),
    0 4px 6px -2px rgba(31, 38, 135, 0.05);
  border-color: #ffffff;
}

.card-header h3 {
  margin: 0 0 0.75rem 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
}

.card-desc {
  color: #475569;
  font-size: 0.95rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  flex-grow: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed rgba(203, 213, 225, 0.7);
  padding-top: 1.25rem;
  margin-top: auto;
}

.date {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.view-btn {
  background: rgba(239, 246, 255, 0.8);
  border: 1px solid #bfdbfe;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.view-btn:hover {
  background: #dbeafe;
  color: #1d4ed8;
  transform: translateX(4px);
}

/* --- MODAL PENTRU PROIECTE / ONBOARDING --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content h2 {
  margin-top: 0;
  color: #1e293b;
  font-size: 1.5rem;
}

.modal-content p {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.input-group {
  text-align: left;
  margin-bottom: 2rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #334155;
}

.input-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.input-group select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.save-btn {
  width: 100%;
  padding: 0.875rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.save-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}
</style>
