import { createApp } from 'vue'
import App from './App.vue'
import { useTema } from './ui/composables/useTema'
// Framework CSS moderno (Pico): se bundlea localmente con Vite (sin CDN).
// Es una importación CSS pura: Vite/Rollup la elimina en el build de
// producción de tests porque happy-dom no procesa CSS.
import '@picocss/pico/css/pico.min.css'
import './estilo/tema.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'

// Aplica el tema (auto/claro/oscuro) al <html> antes de montar la app,
// evitando parpadeo de colores (FOUC).
useTema()

createApp(App).mount('#app')
