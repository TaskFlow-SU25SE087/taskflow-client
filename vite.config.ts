import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Cấu hình cổng duy nhất cho development server
  const devPort = parseInt(env.VITE_DEV_SERVER_PORT || '5173')
  
  // Cấu hình proxy cho API duy nhất
  const proxyConfig: Record<string, any> = {
    '/api': {
      target: env.VITE_API_BASE_URL || '',
      changeOrigin: true,
      secure: false,
      timeout: parseInt(env.VITE_API_TIMEOUT || '30000')
    },
    '/signalr': {
      target: env.VITE_SIGNALR_HUB_URL || '',
      changeOrigin: true,
      secure: false,
      ws: true, // Hỗ trợ WebSocket cho SignalR
      timeout: parseInt(env.VITE_API_TIMEOUT || '30000')
    }
  }
  
  return {
    plugins: [react()],
    server: {
      port: devPort,
      host: true, // Cho phép truy cập từ network
      strictPort: true, // Không tự động tìm cổng khác nếu cổng đã được sử dụng
      proxy: proxyConfig
    },
    css: {
      devSourcemap: true
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    // Tối ưu hóa build
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast']
          }
        }
      }
    }
  }
})
