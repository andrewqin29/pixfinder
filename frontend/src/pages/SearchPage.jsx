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
    <div className="min-h-screen bg-zinc-800 flex flex-col items-center px-6">
      <div className="w-full max-w-5xl mt-24">
        <div className="relative mb-8 w-full max-w-2xl mx-auto">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="search your images..."
            className="w-full px-5 py-4 pr-16 rounded-2xl bg-zinc-700/80 border border-zinc-600/50 text-white placeholder-zinc-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
          <button
            onClick={onSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            search
          </button>
        </div>

        <div className="text-center text-gray-400 mb-6">
          {!results.length && !loading && !error && (
            <p>try searching for something like "sunset over mountains"</p>
          )}
          {loading && <p>searching...</p>}
          {error && <p className="text-red-400">{error}</p>}
        </div>

        {!!results.length && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((item) => (
              <div key={item.id} className="rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <div className="aspect-square bg-zinc-900 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.s3_url} alt={item.caption || item.filename} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-left">
                  <p className="text-sm text-white/90 truncate" title={item.caption}>{item.caption || 'no caption'}</p>
                  <p className="text-xs text-white/60">{item.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {quickTerms.map((term) => (
            <button
              key={term}
              onClick={() => { setQ(term); }}
              className="px-4 py-2 rounded-full bg-zinc-700/50 border border-zinc-600/50 text-zinc-300 hover:text-white hover:bg-zinc-600/50"
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
