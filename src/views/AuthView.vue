<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '../api/axios'
import axios from 'axios'
import { useRouter } from 'vue-router'

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const name = ref('')

const errorMessage = ref('')
const router = useRouter()

const handleSubmit = async () => {
  errorMessage.value = ''

  try {
    if (isLogin.value) {
      const response = await apiClient.post('/users/login', {
        email: email.value,
        password: password.value,
      })

      const token = response.data.token

      localStorage.setItem('token', token)

      router.push('/dashboard')
    } else {
      await apiClient.post('/users/register', {
        name: name.value,
        email: email.value,
        password: password.value,
      })
      alert('Cont creat cu succes! Acum te poti loga!')

      isLogin.value = true
      password.value = ''
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.error || 'A apărut o eroare la conectare!'
    } else {
      errorMessage.value = 'O eroare neașteptată a apărut.'
    }
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isLogin ? 'Autentificare' : 'Creare Cont' }}</h2>

      <div v-if="errorMessage" class="error-blox">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div v-if="!isLogin" class="form-group">
          <label>Nume</label>
          <input type="text" v-model="name" placeholder="Ex. Alexandru" />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="email" placeholder="nume@gamil.com" required />
        </div>

        <div class="form-group">
          <label>Parola</label>
          <input type="password" v-model="password" placeholder="••••••••" required />
        </div>

        <button type="submit" class="submit-btn">
          {{ isLogin ? 'Intra in cont' : 'Inregistreaza-te' }}
        </button>
      </form>

      <p class="toggle-text" @click="isLogin = !isLogin">
        {{ isLogin ? 'Nu ai un cont? Creeaza unul aici.' : 'Ai deja cont? Logheaza-te.' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
}
.submit-btn:hover {
  background-color: #33a06f;
}
.toggle-text {
  text-align: center;
  margin-top: 1rem;
  color: #42b883;
  cursor: pointer;
  font-size: 0.9rem;
}
.toggle-text:hover {
  text-decoration: underline;
}

.error-box {
  background-color: #ffe6e6;
  color: #d93025;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #ffcccc;
}
</style>
