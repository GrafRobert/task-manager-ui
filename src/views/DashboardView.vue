<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'
import ProjectForm from '@/components/ProjectForm.vue'
import TopNavbar from '@/components/TopNavbar.vue'

const projects = ref<any[]>([])
const loading = ref(true)
const errorMessage = ref('')
const showModal = ref(false)
const router = useRouter()

const goToProject = (projectId: number) => {
  router.push(`/project/${projectId}`)
}

const fetchProjects = async () => {
  try {
    const response = await apiClient.get('/projects')

    projects.value = response.data.projects
  } catch (error: any) {
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
</template>

<style scoped>
/* Resetăm fundalul pentru întreaga aplicație */
.app-layout {
  min-height: 100vh;
  background-color: #f8fafc;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.section-header {
  margin-bottom: 2rem;
}
.section-header h2 {
  margin: 0;
  color: #0f172a;
}

/* ... Restul stilurilor rămân exact la fel ... */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}
.empty-state p {
  margin: 0;
  color: #64748b;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}
.project-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}
.card-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}
.card-desc {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0 0 1.5rem 0;
  flex-grow: 1;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}
.date {
  font-size: 0.8rem;
  color: #94a3b8;
}
.view-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.view-btn:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

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
