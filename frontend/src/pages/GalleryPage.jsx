import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import Lightbox from '../components/Lightbox'

const GalleryPage = () => {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [selected, setSelected] = useState(null)
  const sentinelRef = useRef(null)

  const load = async (p = 1, append = false) => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/images', { params: { page: p, page_size: pageSize } })
      const nextItems = res.data?.items || []
      setItems((prev) => (append ? [...prev, ...nextItems] : nextItems))
      const totalCount = res.data?.total || 0
      setTotal(totalCount)
      setPage(res.data?.page || p)
      setHasMore(p * pageSize < totalCount)
    } catch (e) {
      setError('failed to load images')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        load(page + 1, true)
      }
    }, { rootMargin: '400px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [page, hasMore, loading])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">image gallery</h1>
          <p className="text-gray-400">browse all uploaded images</p>
        </div>

        {loading && <p className="text-center text-gray-300">loading...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}

        {!!items.length && (
          <div className="masonry mt-6">
            {items.map((img) => (
              <div key={img.id} className="masonry-item">
                <button onClick={() => setSelected(img)} className="w-full text-left rounded-xl overflow-hidden card">
                  <img loading="lazy" src={img.s3_url} alt={img.caption || img.filename} className="w-full h-auto object-cover" />
                  <div className="p-3">
                    <p className="text-sm text-white/90 truncate" title={img.caption}>{img.caption || 'no caption'}</p>
                    <p className="text-xs text-white/60">{img.filename}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && !items.length && (
          <div className="text-center mt-12 text-gray-400">
            <p className="text-lg mb-2">no images uploaded yet</p>
            <p className="text-sm">upload some images to see them in the gallery</p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-10" />
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden skeleton aspect-square" />
            ))}
          </div>
        )}

        <Lightbox open={!!selected} image={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  )
}

export default GalleryPage
