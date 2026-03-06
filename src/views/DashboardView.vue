<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = () => {
  localStorage.removeItem('token')

  router.push('/')
}
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Panoul meu de Control</h1>
      <button @click="handleLogout" class="logout-btn">Deconectare</button>
    </header>

    <main class="dashboard-container">
      <h2>Proiectele mele</h2>
      <p>Aici vom aduce proiectele</p>
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
</style>
