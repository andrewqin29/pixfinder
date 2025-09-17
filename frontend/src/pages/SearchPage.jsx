import { useState } from 'react'
import { api } from '../lib/api'

const quickTerms = ['Mountains', 'Ocean', 'Ducklings']

const SearchPage = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])

  const runSearch = async (value) => {
    const nextQuery = value ?? query
    const trimmed = nextQuery.trim()
    if (!trimmed) return
    setQuery(nextQuery)
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/search', { params: { q: trimmed } })
      setResults(res.data?.results || [])
    } catch (_) {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      runSearch()
    }
  }

  return (
    <section className="search-page">
      <div className="search-hero">
        <h1 className="search-title">Pique</h1>
        <p className="search-subtext">
          An intelligent photo gallery enabling semantic text-to-image retrieval using CLIP embeddings.
        </p>

        <div className="search-bar-row">
          <div className="search-bar">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for an image in the gallery..."
              className="search-input"
              aria-label="Search"
            />
            <button
              type="button"
              className="search-button"
              aria-label="Run search"
              onClick={() => runSearch()}
            >
              <i className="bi bi-search" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="search-hints">
          <span className="search-hints-label">Try searching for</span>
          <div className="quick-terms">
            {quickTerms.map((term) => (
              <button
                key={term}
                onClick={() => runSearch(term)}
                className="quick-term"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="results-container">
        {loading && <p className="results-state">Searching...</p>}
        {error && <p className="results-state error">{error}</p>}

        {results.length > 0 && (
          <div className="results-grid">
            {results.map((item) => (
              <article key={item.id} className="result-card">
                <div className="result-image-wrapper">
                  <img
                    src={item.s3_url}
                    alt={item.caption || item.filename}
                    loading="lazy"
                    className="result-image"
                  />
                </div>
                <p className="result-caption" title={item.caption}>
                  {item.caption || 'Untitled image'}
                </p>
                <p className="result-filename">{item.filename}</p>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="results-state">Start a search to explore the gallery.</div>
        )}
      </div>
    </section>
  )
}

export default SearchPage
