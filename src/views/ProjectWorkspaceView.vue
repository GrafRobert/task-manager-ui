<script setup lang="ts">
import { useRoute } from 'vue-router'
import TopNavbar from '@/components/TopNavbar.vue'

const route = useRoute()
const projectId = route.params.id
</script>

<template>
  <div class="app-layout">
    <TopNavbar />

    <main class="workspace-content">
      <div class="header-actions">
        <RouterLink to="/dashboard" class="black-link">← Inapoi la Proiecte</RouterLink>
      </div>

      <h1>Spatiul de lucru: Proiectul #{{ projectId }}</h1>
      <p class="subtitle">(To Do, In Progress, Done)</p>
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

h1 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 2rem;
}
.subtitle {
  color: #64748b;
  font-size: 1rem;
}
</style>
