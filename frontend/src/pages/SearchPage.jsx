import { useState } from 'react'
import { api } from '../lib/api'

const SearchPage = () => {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])

  const onSearch = async () => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/search', { params: { q } })
      setResults(res.data?.results || [])
    } catch (e) {
      setError('search failed')
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') onSearch()
  }

  const quickTerms = ['sunset', 'mountains', 'ocean', 'city', 'nature']

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-1/2">
        {/* centered pill search */}
        <div className="relative w-full mx-auto">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="search your images..."
            className="w-full h-[10vh] pl-5 pr-14 rounded-full bg-white/5 border border-white/10 text-white placeholder-white/60 text-base ring-focus"
          />
          <button
            aria-label="search"
            onClick={onSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-base"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
            </svg>
          </button>
        </div>

        <div className="text-center text-white/70 mt-6 text-sm">
          {!results.length && !loading && !error && (
            <p>try something like "a sunset over mountains"</p>
          )}
          {loading && <p>searching...</p>}
          {error && <p className="text-red-400">{error}</p>}
        </div>

        {!!results.length && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {results.map((item) => (
              <div key={item.id} className="rounded-lg overflow-hidden border border-white/10 bg-black/30">
                <img loading="lazy" src={item.s3_url} alt={item.caption || item.filename} className="w-full h-48 object-cover" />
                <div className="p-3 text-left">
                  <p className="text-sm text-white/90 truncate" title={item.caption}>{item.caption || 'no caption'}</p>
                  <p className="text-xs text-white/50">{item.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {quickTerms.map((term) => (
            <button
              key={term}
              onClick={() => { setQ(term) }}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white transition-base"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
