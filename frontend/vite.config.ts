import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replace(/\\/g, "/")

          if (path.includes("/node_modules/react/") || path.includes("/node_modules/react-dom/") || path.includes("/node_modules/scheduler/")) {
            return "react-vendor"
          }
          if (path.includes("/node_modules/lucide-react/")) {
            return "lucide-vendor"
          }
          if (path.includes("/pages/app/StudioPage") || path.includes("/components/Workspace") || path.includes("/components/timeline/") || path.includes("/components/video-bible/")) {
            return "studio"
          }
          if (path.includes("/components/storyboard/")) {
            return "storyboard"
          }
          if (/(HeroStudioShowcase|PipelineDiagram|HubAndSpokeSchematic|ExportShowcase|VideoBibleShowcase|TimelineShowcase)/.test(path)) {
            return "marketing-showcase"
          }
        },
      },
    },
  },
})
