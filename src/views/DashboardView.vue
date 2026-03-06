<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import apiClient from '@/api/axios'
import ProjectForm from '@/components/ProjectForm.vue'

const router = useRouter()

const projects = ref<any[]>([])
const loading = ref(true)
const errorMessage = ref('')

const handleLogout = () => {
  localStorage.removeItem('token')

  router.push('/')
}

const fetchProjects = async () => {
  try {
    const response = await apiClient.get('/projects')

    projects.value = response.data.projects
  } catch (error: any) {
    console.error('Eroare la încărcarea proiectelor:', error)
    errorMessage.value = 'Nu am putut încărca proiectele.'

    if (error.response?.status === 401) {
      handleLogout()
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Panoul meu de Control</h1>
      <button @click="handleLogout" class="logout-btn">Deconectare</button>
    </header>

    <main class="dashboard-container">
      <ProjectForm @project-created="fetchProjects" />
      <hr class="divider" />
      <h2>Proiectele mele</h2>

      <p v-if="loading" class="loading-text">Se incarca proiectele...</p>
      <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div v-else-if="projects.length === 0" class="empty-state">
        <p>Nu ai niciun proiect momentan. Hai să creăm unul!</p>
      </div>

      <div v-else class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <h3>{{ project.name }}</h3>
          <p>{{ project.description }}</p>
          <span class="date"
            >Creat la: {{ new Date(project.created_at).toLocaleDateString() }}</span
          >
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #ddd;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}
.logout-btn {
  background-color: #d93025;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.logout-btn:hover {
  background-color: #b3241c;
}
.divider {
  border: 0;
  height: 1px;
  background: #ddd;
  margin: 2rem 0;
}

.loading-text {
  color: #666;
  font-style: italic;
}
.error-text {
  color: #d93025;
  font-weight: bold;
}
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  color: #666;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
.project-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  cursor: pointer;
  border-left: 5px solid #42b883;
}
.project-card:hover {
  transform: translateY(-5px);
}
.project-card h3 {
  margin-top: 0;
  color: #42b883;
}
.project-card p {
  color: #555;
  font-size: 0.95rem;
  margin-bottom: 0;
}
.date {
  display: block;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #999;
}
</style>
