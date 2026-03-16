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
        <span class="logo-text hide-on-mobile">Project-planner</span>
      </div>
    </div>

    <div class="nav-right">
      <button class="add-btn" @click="emit('open-new-project')" title="Creare Proiect Nou">
        +
      </button>

      <RouterLink to="/profiles" class="profile-link" title="Profilul meu">
        <span class="icon">👤</span>
        <span class="hide-on-mobile">Profil</span>
      </RouterLink>

      <div class="divider"></div>

      <button @click="handleLogout" class="logout-btn" title="Deconectare">
        <span class="hide-on-mobile">Iesire</span>
        <span class="show-on-mobile" style="display: none">🚪</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* --- NAVBAR PRINCIPAL (Efect de sticlă) --- */
.top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;

  /* Magia Glassmorphism: Alb transparent + Blur puternic */
  background-color: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  height: 64px;
  padding: 0 2rem;

  /* O margine de jos foarte fină și o umbră subtilă */
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);

  position: sticky;
  top: 0;
  z-index: 100;
}

/* --- ZONA LOGO --- */
.nav-left .logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  transition: opacity 0.2s;
  cursor: pointer;
}

.nav-left .logo:hover {
  opacity: 0.8;
}

/* --- ZONA DREAPTĂ (Meniul) --- */
.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* --- BUTONUL DE ADAUGARE (+) --- */
.add-btn {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.add-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 15px rgba(37, 99, 235, 0.4);
}

.add-btn:active {
  transform: translateY(0) scale(0.95);
}

/* --- LINK-UL DE PROFIL --- */
.profile-link {
  text-decoration: none;
  color: #475569;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  background-color: transparent;
  transition: all 0.2s ease;
}

.profile-link:hover {
  background-color: rgba(255, 255, 255, 0.8);
  color: #0f172a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

/* --- LINIA DESPĂRȚITOARE --- */
.divider {
  width: 1px;
  height: 24px;
  background-color: rgba(203, 213, 225, 0.6);
  margin: 0 0.25rem;
}

/* --- BUTONUL DE DECONECTARE --- */
.logout-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.logout-btn:hover {
  color: #ef4444;
  background-color: rgba(254, 242, 242, 0.8);
}

/* =======================================================
   MAGIA PENTRU TELEFOANE MOBILIE (Responsive Design)
   ======================================================= */
@media (max-width: 768px) {
  .top-navbar {
    padding: 0 1rem; /* Margini mai mici pe telefon */
  }

  /* Ascundem clasa textelor pe mobil */
  .hide-on-mobile {
    display: none !important;
  }

  /* Afișăm elementele care apar doar pe mobil (ex: ușa de la ieșire) */
  .show-on-mobile {
    display: inline-block !important;
    font-size: 1.25rem; /* Facem ușa vizibilă */
  }

  /* Micșorăm un pic distanțele între butoane */
  .nav-right {
    gap: 0.5rem;
  }

  /* Butonul de plus un pic mai mic să încapă elegant */
  .add-btn {
    width: 32px;
    height: 32px;
    font-size: 1.3rem;
  }

  /* Reducem padding-ul pentru că au mai rămas doar iconițele */
  .profile-link,
  .logout-btn {
    padding: 0.4rem 0.5rem;
  }
}
</style>
