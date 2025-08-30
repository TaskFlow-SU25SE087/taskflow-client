import React from 'react'

interface TutorialImageProps {
  imagePath: string
  title: string
  fallback?: boolean
}

export function TutorialImage({ imagePath, title, fallback = true }: TutorialImageProps) {
  const [imageError, setImageError] = React.useState(false)

  if (fallback || imageError) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <div className="text-sm font-medium mb-2">Demo Screenshot</div>
          <div className="text-xs mb-3">{title} - Interactive Demo</div>
          <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <div className="text-xs text-gray-400">Demo Image</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <img
        src={imagePath}
        alt={`${title} demo`}
        className="w-full h-auto"
        onError={() => setImageError(true)}
        loading="lazy"
      />
      <div className="p-3 bg-gray-50 border-t">
        <div className="text-xs text-gray-600 text-center">
          {title} - Interactive Demo
        </div>
      </div>
    </div>
  )
} 