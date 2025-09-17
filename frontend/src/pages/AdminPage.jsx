import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

const AdminPage = () => {
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const checkStatus = async () => {
    try {
      const res = await api.get('/auth/status')
      setLoggedIn(Boolean(res.data?.logged_in))
    } catch (_) {
      setLoggedIn(false)
    } finally {
      setCheckingStatus(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      await api.post('/auth/login', { username, password })
      setLoggedIn(true)
      setUsername('')
      setPassword('')
    } catch (_) {
      setAuthError('Invalid credentials.')
      setLoggedIn(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (_) {
      // ignore
    }
    setLoggedIn(false)
    setSelectedFile(null)
    setUploadMessage('')
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Select an image first.')
      return
    }

    setUploadError('')
    setUploadMessage('')
    setUploadProgress(0)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', selectedFile)

      const response = await api.post('/upload/single', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percent)
        },
      })

      if (response.data?.success) {
        setUploadMessage('Upload complete.')
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setUploadError(response.data?.error || 'Upload failed.')
      }
    } catch (_) {
      setUploadError('Upload failed.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <section className="admin-page">
      <header className="section-header">
        <h1 className="section-title">Admin Console</h1>
        <p className="section-subtitle">Manage uploads and trigger indexing updates.</p>
      </header>

      {checkingStatus ? (
        <p className="status-message">Checking session...</p>
      ) : (
        <div className="admin-card">
          {!loggedIn ? (
            <form className="form-group" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="text-input"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="text-input"
                  autoComplete="current-password"
                  required
                />
              </div>

              {authError && <p className="status-message error">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="button-primary"
              >
                {authLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <div className="form-group">
              <div className="inline-chip">
                <span>Authenticated. Upload a file to update the gallery.</span>
                <button type="button" onClick={handleLogout} className="button-outline">
                  Log out
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Select an image file</label>
                <div className="form-group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                    onChange={(event) => {
                      const [file] = event.target.files || []
                      setSelectedFile(file || null)
                    }}
                    className="file-input"
                  />

                  {selectedFile && (
                    <div className="inline-chip">
                      <span>{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="remove-button"
                        aria-label="Clear selected file"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {uploadProgress > 0 && uploading && (
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}

                  {uploadError && <p className="status-message error">{uploadError}</p>}
                  {uploadMessage && <p className="status-message success">{uploadMessage}</p>}

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="button-primary"
                  >
                    {uploading ? 'Uploading...' : 'Upload image'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default AdminPage
