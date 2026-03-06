<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/axios'

const emit = defineEmits(['project-created'])

const newProjectName = ref('')
const newProjectDescription = ref('')

const createProject = async () => {
  if (!newProjectName.value) return

  try {
    await apiClient.post('/projects', {
      name: newProjectName.value,
      description: newProjectDescription.value,
    })

    newProjectDescription.value = ''
    newProjectName.value = ''

    emit('project-created')
  } catch (error) {
    console.error('Eroare la crearea proiectului:', error)
    alert('A apărut o eroare la salvarea proiectului.')
  }
}
</script>

<template>
  <div class="create-project-section">
    <h3>Adauga un proiect nou</h3>
    <form @submit.prevent="createProject" class="project-form">
      <input type="text" v-model="newProjectName" placeholder="Numele proiectului" required />

      <input type="text" v-model="newProjectDescription" placeholder="Descriere (optional)" />
      <button type="submit" class="create-btn">Creeaza Proiect</button>
    </form>
  </div>
</template>

<style scoped>
.create-project-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  border-left: 5px solid #2c3e50;
}
.create-project-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}
.project-form {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.project-form input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.create-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  white-space: nowrap;
}
.create-btn:hover {
  background-color: #1a252f;
}
</style>
