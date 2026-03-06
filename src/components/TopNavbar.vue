<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const emit = defineEmits(['open-new-project'])

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/')
}
</script>

<template>
  <nav class="top-navbar">
    <div class="nav-left">
      <div class="logo">
        <span class="logo-icon">📋</span>
        <span class="logo-text">Mini-project</span>
      </div>
    </div>

    <div class="nav-right">
      <button class="add-btn" @click="emit('open-new-project')" title="Creare Proiect Nou">
        +
      </button>

      <div class="divider"></div>

      <button @click="handleLogout" class="logout-btn" title="Deconectare">Iesire</button>
    </div>
  </nav>
</template>

<style scoped>
.top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  height: 60px;
  padding: 0 2rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100; /* Stă mereu deasupra conținutului */
}

.nav-left .logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Butonul modern de + */
.add-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%; /* Îl face rotund */
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

.add-btn:hover {
  background-color: #1d4ed8;
  transform: scale(1.05); /* Se mărește puțin când pui mouse-ul pe el */
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #e2e8f0;
  margin: 0 0.5rem;
}

.logout-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.logout-btn:hover {
  color: #ef4444;
  background-color: #fef2f2;
}
</style>
