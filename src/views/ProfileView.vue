<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'
import TopNavbar from '@/components/TopNavbar.vue'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)
const errorMessage = ref('')
const projects = ref<any[]>([])

const fetchProjects = async () => {
  try {
    const response = await apiClient.get('/projects')
    projects.value = response.data.projects || []
  } catch (error) {
    console.error('Eroare la aducerea proiectelor')
  }
}

const ownedProjects = computed(() => projects.value.filter((p) => p.role === 'OWNER'))
const memberProjects = computed(() => projects.value.filter((p) => p.role === 'MEMBER'))

const fetchProfile = async () => {
  try {
    const response = await apiClient.get('/users/profile')
    user.value = response.data.user
  } catch (error: any) {
    console.error('Eroare la aducerea profilului:', error)

    if (error.response?.status === 401) {
      alert('Sesiunea a expirat. Te rugăm să te loghezi din nou.')
      localStorage.removeItem('token')
      router.push('/')
    } else {
      errorMessage.value = 'Nu am putut incarca datele profilului.'
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/')
}

onMounted(() => {
  fetchProfile()
  fetchProjects()
})
</script>

<template>
  <div lass="app-layout">
    <TopNavbar />

    <main class="profile-content">
      <div class="header-actions">
        <RouterLink to="/dashboard" class="back-link">← Înapoi la Dashboard</RouterLink>
      </div>

      <div class="profile-container">
        <p v-if="loading" class="loading-text">Se incarca profilul...</p>
        <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <div v-else class="profile-card">
          <div class="profile-header">
            <div class="avatar">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <h2>{{ user.name }}</h2>
            <span class="role-badge">{{ user.role }}</span>
          </div>

          <div class="profile-details">
            <div class="detail-group">
              <label>Email</label>
              <p>📧 {{ user.email }}</p>
            </div>
            <div class="detail-group">
              <label>Membru din</label>
              <p>📅 {{ formatDate(user.created_at) }}</p>
            </div>
          </div>

          <div class="projects-section">
            <div class="project-category">
              <h3>👑 Proiectele mele (Owner)</h3>
              <ul v-if="ownedProjects.length > 0" class="project-list">
                <li v-for="project in ownedProjects" :key="project.id">
                  <RouterLink :to="`/project/${project.id}`">{{ project.name }}</RouterLink>
                </li>
              </ul>
              <p v-else class="no-data">Nu ai creat niciun proiect inca.</p>
            </div>

            <div class="project-category">
              <h3>🤝 Proiecte partajate cu mine</h3>
              <ul v-if="memberProjects.length > 0" class="project-list">
                <li v-for="project in memberProjects" :key="project.id">
                  <RouterLink :to="`/project/${project.id}`">{{ project.name }}</RouterLink>
                </li>
              </ul>
              <p v-else class="no-data">Nu faci parte din alte proiecte momentan.</p>
            </div>
          </div>

          <div class="profile-actions">
            <button class="logout-btn" @click="logout">🚪 Deconectare</button>
          </div>
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

.profile-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header-actions {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.back-link:hover {
  color: #2563eb;
}

.profile-container {
  display: flex;
  justify-content: center;
}

.profile-card {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  text-align: center;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.avatar {
  width: 80px;
  height: 80px;
  background-color: #2563eb;
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);
}

.profile-header h2 {
  margin: 0 0 0.5rem 0;
  color: #0f172a;
}

.role-badge {
  background-color: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
  margin-bottom: 2rem;
}

.detail-group label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-group p {
  margin: 0.25rem 0 0 0;
  font-size: 1.1rem;
  color: #334155;
  font-weight: 500;
}

.profile-actions {
  display: flex;
  justify-content: center;
}

.logout-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #dc2626;
}

.loading-text,
.error-text {
  font-size: 1.1rem;
  color: #64748b;
}
.error-text {
  color: #ef4444;
}

/* Stiluri pentru zona de proiecte */
.projects-section {
  text-align: left;
  width: 100%;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  border-top: 1px dashed #cbd5e1;
  padding-top: 1.5rem;
}

.project-category {
  margin-bottom: 1.5rem;
}

.project-category h3 {
  font-size: 1rem;
  color: #334155;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.project-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-list li {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.project-list li a {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.95rem;
}

.project-list li:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateX(4px);
}

.no-data {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
  margin: 0;
}
</style>
