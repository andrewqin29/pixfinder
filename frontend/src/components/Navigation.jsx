import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Navigation = () => {
  const location = useLocation()
  const [showUploadModal, setShowUploadModal] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-zinc-900/80 border-b border-zinc-700/50 shadow-2xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Left - Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white tracking-wider">PixFinder</h1>
          </div>
          
          {/* Center - Navigation Links */}
          <div className="flex items-center space-x-12">
            <Link
              to="/"
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive('/') 
                  ? 'bg-white/20 text-white shadow-xl border border-white/30 backdrop-blur-sm' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm'
              }`}
            >
              Search
            </Link>
            <Link
              to="/gallery"
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive('/gallery') 
                  ? 'bg-white/20 text-white shadow-xl border border-white/30 backdrop-blur-sm' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm'
              }`}
            >
              Gallery
            </Link>
          </div>

          {/* Right - Upload Button */}
          <div className="flex items-center">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 
                         backdrop-blur-sm border border-white/30 flex items-center justify-center 
                         hover:from-blue-500/30 hover:to-purple-600/30 hover:scale-105 
                         transition-all duration-300 shadow-xl hover:shadow-2xl"
              title="Upload (Admin only)"
            >
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Admin Upload</h3>
            <p className="text-gray-300 mb-4">Upload functionality coming soon!</p>
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
