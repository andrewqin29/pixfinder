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
      <div className="w-3/4">
        {/* centered pill search */}
        <div className="relative w-full mx-auto">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="search your images..."
            className="w-full h-[50px] pl-[10px] pr-5 rounded-full bg-white/5 border border-white/10 text-white placeholder-zinc-500 placeholder:opacity-100 text-lg ring-focus"
          />
        </div>

        <div className="text-center text-white/70 mt-[60px] text-sm">
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

        <div className="flex flex-wrap justify-center gap-[10px] mt-10">
          {quickTerms.map((term) => (
            <button
              key={term}
              onClick={() => { setQ(term) }}
              className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white transition-base"
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
