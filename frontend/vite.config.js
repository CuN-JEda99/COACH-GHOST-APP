import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// NOTA: Actualiza 'base' con el nombre exacto de tu repositorio GitHub
export default defineConfig({
  plugins: [react()],
  base: './',
})
