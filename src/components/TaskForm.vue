<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '../api/axios'
import type { ProjectMember, Task } from '@/types'

const props = defineProps<{
  projectId: string | string[]
  task?: Task | null
}>()

const emit = defineEmits(['saved', 'cancel'])

const taskTitle = ref(props.task?.title || '')
const taskDescription = ref(props.task?.description || '')
const taskPriority = ref(props.task?.priority || 'MEDIUM')
const taskAssignedTo = ref(props.task?.assigned_to || '')

const members = ref<ProjectMember[]>([])
const isSubmitting = ref(false)

const fetchMembers = async () => {
  try {
    const response = await apiClient.get(`/projects/${props.projectId}/members`)
    members.value = response.data.members || []
  } catch (error) {
    console.error('Eroare la aducerea membrilor:', error)
  }
}

onMounted(() => {
  fetchMembers()
})

const saveTask = async () => {
  if (!taskTitle.value) return

  isSubmitting.value = true

  try {
    const payload = {
      title: taskTitle.value,
      description: taskDescription.value,
      priority: taskPriority.value,
      assigned_to: taskAssignedTo.value || null,
      status: props.task?.status || 'TODO',
    }

    if (props.task?.id) {
      await apiClient.patch(`/projects/${props.projectId}/tasks/${props.task.id}`, payload)
    } else {
      await apiClient.post(`/projects/${props.projectId}/tasks`, payload)
    }

    emit('saved')
  } catch (error) {
    console.error('Eroare la salvarea task-ului:', error)
    alert('A apărut o eroare la salvarea task-ului.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="form-container">
    <h3>{{ task ? 'Editează Task-ul' : 'Adaugă un Task Nou' }}</h3>
    <p class="subtitle">
      {{ task ? 'Modifică detaliile acestui task.' : 'Descrie ce trebuie făcut în acest task.' }}
    </p>

    <form @submit.prevent="saveTask" class="project-form">
      <div class="input-group">
        <label>Titlu Task <span class="required">*</span></label>
        <input type="text" v-model="taskTitle" placeholder="Ex: Rezolva bug ul de login" required />
      </div>

      <div class="input-group">
        <label>Descriere</label>
        <textarea
          v-model="taskDescription"
          placeholder="Detalii suplimentare..."
          rows="3"
        ></textarea>
      </div>

      <div class="input-row">
        <div class="input-group half-width">
          <label>Prioritate</label>
          <select v-model="taskPriority">
            <option value="LOW">Scăzută</option>
            <option value="MEDIUM">Medie</option>
            <option value="HIGH">Ridicată</option>
          </select>
        </div>

        <div class="input-group half-width">
          <label>Asignat lui</label>
          <select v-model="taskAssignedTo">
            <option value="">-- Neasignat --</option>

            <option
              v-for="member in members"
              :key="member.user_id || member.id"
              :value="member.user_id || member.id || member.user?.id"
            >
              {{ member.name || member.user?.name || 'Fără nume' }}
              ({{ member.email || member.user?.email || 'Fără email' }})
            </option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-btn" @click="emit('cancel')">Anulează</button>
        <button type="submit" class="create-btn" :disabled="isSubmitting">
          {{ isSubmitting ? 'Se salvează...' : task ? 'Salvează Modificările' : 'Creează Task' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-container {
  width: 100%;
}
h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #1e293b;
  font-size: 1.5rem;
}
.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.project-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
}
.required {
  color: #ef4444;
}
.input-group input,
.input-group textarea {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: inherit;
  transition: border-color 0.2s;
}
.input-group input:focus,
.input-group textarea:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
.cancel-btn {
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  font-weight: 600;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.create-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.create-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}
.create-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.input-row {
  display: flex;
  gap: 1rem;
}
.half-width {
  flex: 1;
}
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: inherit;
  background-color: white;
}
select:focus {
  outline: none;
  border-color: #42b883;
}
</style>
