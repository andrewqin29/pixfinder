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
    <nav id="nav-bar" className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div id="nav-inner">
        {/* Left: brand + links */}
        <div id="nav-left">
          <span id="nav-brand">PixFind</span>
          <Link to="/" className={`nav-link transition-base ${isActive('/') ? 'text-white' : ''}`}>Search</Link>
          <Link to="/gallery" className={`nav-link transition-base ${isActive('/gallery') ? 'text-white' : ''}`}>Gallery</Link>
        </div>

        {/* Right: admin button */}
        <div id="nav-right">
          <button
            id="nav-admin-btn"
            onClick={() => setShowUploadModal(true)}
            title="Upload (Admin only)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="rounded-xl p-6 max-w-md w-full mx-4 border border-white/10 bg-black/70">
            <h3 className="text-lg font-semibold mb-4">Admin Upload</h3>
            {!loggedIn ? (
              <div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white ring-focus"
                  />
                  <input
                    type="password"
                    placeholder="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white ring-focus"
                  />
                  {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={doLogin} className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-base">login</button>
                  <button onClick={() => setShowUploadModal(false)} className="flex-1 bg-white/5 border border-white/10 py-2 rounded-lg transition-base">close</button>
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
                  <button disabled={!selectedFile || uploading} onClick={doUpload} className="flex-1 bg-blue-600 disabled:opacity-50 hover:bg-blue-700 py-2 rounded-lg transition-base">upload</button>
                  <button onClick={() => setShowUploadModal(false)} className="flex-1 bg-white/5 border border-white/10 py-2 rounded-lg transition-base">close</button>
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
