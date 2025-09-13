import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const GalleryPage = () => {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/images', { params: { page: p, page_size: pageSize } })
      setItems(res.data?.items || [])
      setTotal(res.data?.total || 0)
      setPage(res.data?.page || p)
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((img) => (
              <div key={img.id} className="rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <div className="aspect-square bg-zinc-900">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img src={img.s3_url} alt={img.caption || img.filename} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-left">
                  <p className="text-sm text-white/90 truncate" title={img.caption}>{img.caption || 'no caption'}</p>
                  <p className="text-xs text-white/60">{img.filename}</p>
                </div>
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

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-4 py-2 rounded bg-zinc-700 text-white disabled:opacity-40"
          >
            prev
          </button>
          <span className="text-gray-300">page {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            className="px-4 py-2 rounded bg-zinc-700 text-white disabled:opacity-40"
          >
            next
          </button>
        </div>
      </div>
    </div>
  )
}

export default GalleryPage
