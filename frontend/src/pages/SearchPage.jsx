const SearchPage = () => {
  return (
    <div className="min-h-screen bg-zinc-800 flex items-center justify-center px-6">
      {/* Main Search Container */}
      <div className="w-full max-w-2xl">
        
        {/* Search Bar */}
        <div className="relative mb-12 w-96 max-w-[50vw] mx-auto">
          <div className="relative w-full" style={{ paddingBottom: '10%' }}>
            <input
              type="text"
              placeholder="Search your images..."
              className="absolute inset-0 w-full h-full pl-10 pr-[12%] rounded-full bg-zinc-600/90 backdrop-blur-lg 
                         border border-zinc-500/50 text-white placeholder-zinc-300 text-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                         focus:bg-zinc-500/90 transition-all duration-300 shadow-2xl
                         font-mono tracking-wide"
            />
            <button className="absolute right-[1%] top-1/2 transform -translate-y-1/2 w-[8%] aspect-square rounded-full 
                             bg-gradient-to-br from-blue-500/30 to-purple-600/30 backdrop-blur-sm 
                             flex items-center justify-center hover:from-blue-500/50 hover:to-purple-600/50 
                             transition-all duration-300 border border-white/20 shadow-xl hover:shadow-2xl hover:scale-105">
              <svg 
                className="w-[60%] h-[60%] text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Results Placeholder */}
        <div className="text-center text-gray-400 space-y-4">
          <div className="space-y-2">
            <p className="text-xl font-medium">Start typing to search your images</p>
            <p className="text-base opacity-75">Try searching for "sunset", "mountains", or "people"</p>
          </div>
          
          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['sunset', 'mountains', 'ocean', 'city', 'nature'].map((term) => (
              <button
                key={term}
                className="px-4 py-2 rounded-full bg-zinc-700/50 border border-zinc-600/50 
                           text-zinc-300 hover:text-white hover:bg-zinc-600/50 
                           transition-all duration-200 text-sm font-mono"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage
