import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const GalleryPage = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchImages = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/images', { params: { page: 1, page_size: 60 } })
      setImages(res.data?.items || [])
    } catch (_) {
      setError('Unable to load the gallery.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  return (
    <section className="gallery-page">
      <header className="section-header">
        <h1 className="section-title">Gallery</h1>
        <p className="section-subtitle">Every image indexed with captions and embeddings.</p>
      </header>

      <div>
        {loading && <p className="results-state">Loading...</p>}
        {error && <p className="results-state error">{error}</p>}

        {!loading && !error && images.length === 0 && (
          <p className="results-state">No images yet.</p>
        )}

        {images.length > 0 && (
          <div className="gallery-grid">
            {images.map((image) => (
              <article key={image.id} className="gallery-card">
                <div className="gallery-image-wrapper">
                  <img
                    src={image.s3_url}
                    alt={image.caption || image.filename}
                    loading="lazy"
                    className="gallery-image"
                  />
                </div>
                <p className="gallery-caption" title={image.caption}>
                  {image.caption || 'Untitled image'}
                </p>
                <p className="gallery-filename">{image.filename}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default GalleryPage
