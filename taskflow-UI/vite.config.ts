import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // ======= CẤU HÌNH BUILD ĐỂ TỐI ƯU BUNDLE =======
  build: {
    chunkSizeWarningLimit: 600, // tăng giới hạn cảnh báo kích thước lên 600KB

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Tách riêng thư viện UI nặng (Material UI & Emotion)
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui'
            }
            // Tách riêng thư viện vẽ biểu đồ nặng (Recharts)
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts'
            }
            // Giữ chung React và các thư viện nhỏ khác ở vendor để tránh lỗi vòng lặp phụ thuộc (Circular Chunk)
            return 'vendor'
          }
        }
      }
    }

  }
})
