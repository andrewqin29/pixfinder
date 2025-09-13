import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const Navigation = () => {
  const location = useLocation()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    // Check admin session on mount
    const checkStatus = async () => {
      try {
        const res = await api.get('/auth/status')
        setLoggedIn(!!res.data?.logged_in)
      } catch (_) {
        setLoggedIn(false)
      }
    }
    checkStatus()
  }, [])

  const doLogin = async () => {
    setLoginError('')
    try {
      await api.post('/auth/login', { username: loginUsername, password: loginPassword })
      setLoggedIn(true)
    } catch (_) {
      setLoginError('invalid credentials')
      setLoggedIn(false)
    }
  }

  const doUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadError('')
    setUploadSuccess('')
    setUploadProgress(0)
    try {
      const form = new FormData()
      form.append('file', selectedFile)
      const res = await api.post('/upload/single', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded * 100) / e.total))
          }
        },
      })
      if (res.data?.success) {
        setUploadSuccess('upload complete')
        setSelectedFile(null)
      } else {
        setUploadError(res.data?.error || 'upload failed')
      }
    } catch (e) {
      setUploadError('upload failed')
    } finally {
      setUploading(false)
    }
  }

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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Admin Upload</h3>
            {!loggedIn ? (
              <div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white"
                  />
                  <input
                    type="password"
                    placeholder="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white"
                  />
                  {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={doLogin} className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">login</button>
                  <button onClick={() => setShowUploadModal(false)} className="flex-1 bg-zinc-700 py-2 rounded-lg">close</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-white"
                  />
                  {uploading && (
                    <div className="w-full bg-zinc-700 rounded h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
                  {uploadSuccess && <p className="text-green-400 text-sm">{uploadSuccess}</p>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button disabled={!selectedFile || uploading} onClick={doUpload} className="flex-1 bg-blue-600 disabled:opacity-50 hover:bg-blue-700 py-2 rounded-lg">upload</button>
                  <button onClick={() => setShowUploadModal(false)} className="flex-1 bg-zinc-700 py-2 rounded-lg">close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
