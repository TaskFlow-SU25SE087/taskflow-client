/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-in-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'drag-preview': 'dragPreview 0.2s ease-in-out',
        'drop-zone': 'dropZone 0.3s ease-in-out',
        'task-hover': 'taskHover 0.2s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' }
        },
        dragPreview: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '100%': { transform: 'scale(1.05) rotate(2deg)' }
        },
        dropZone: {
          '0%': { transform: 'scale(1)', borderColor: 'transparent' },
          '100%': { transform: 'scale(1.02)', borderColor: 'var(--drop-zone-color)' }
        },
        taskHover: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(-2px) scale(1.02)' }
        }
      },
      colors: {
        // Enhanced lavender palette
        'lavender-50': '#F6F4FF',
        'lavender-100': '#EDE9FE',
        'lavender-200': '#DDD4FE',
        'lavender-300': '#C4B5FD',
        'lavender-400': '#A78BFA',
        'lavender-500': '#8B5CF6',
        'lavender-600': '#7C3AED',
        'lavender-700': '#6D28D9',
        'lavender-800': '#5B21B6',
        'lavender-900': '#4C1D95',
        'lavender-950': '#2E1065',
        
        // Board status colors
        'status-todo': '#64748B',
        'status-progress': '#3B82F6',
        'status-review': '#F59E0B',
        'status-done': '#10B981',
        'status-blocked': '#EF4444',
        
        // Board background colors
        'board-todo': '#F1F5F9',
        'board-progress': '#EFF6FF',
        'board-review': '#FFFBEB',
        'board-done': '#ECFDF5',
        'board-blocked': '#FEF2F2',
        
        // Board accent colors
        'board-todo-accent': '#E2E8F0',
        'board-progress-accent': '#DBEAFE',
        'board-review-accent': '#FEF3C7',
        'board-done-accent': '#D1FAE5',
        'board-blocked-accent': '#FECACA',
        
        // Task priority colors
        'priority-low': '#06B6D4',
        'priority-medium': '#F59E0B',
        'priority-high': '#EF4444',
        'priority-urgent': '#DC2626',
        
        // Drag and drop colors
        'drag-active': '#8B5CF6',
        'drag-over': '#A78BFA',
        'drop-zone': '#C4B5FD'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
