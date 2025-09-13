const GalleryPage = () => {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Image Gallery</h1>
          <p className="text-gray-400">Browse all your uploaded images</p>
        </div>

        {/* Gallery Grid Placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Placeholder Cards */}
          {Array(8).fill(0).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-white/10 backdrop-blur-sm border border-white/20
                         flex items-center justify-center hover:bg-white/20 transition-all duration-200
                         cursor-pointer group"
            >
              <div className="text-center text-gray-400 group-hover:text-gray-300 transition-colors">
                <svg 
                  className="w-12 h-12 mx-auto mb-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1} 
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" 
                  />
                </svg>
                <p className="text-sm">Image {i + 1}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="text-center mt-12 text-gray-400">
          <p className="text-lg mb-2">No images uploaded yet</p>
          <p className="text-sm">Upload some images to see them in the gallery</p>
        </div>
      </div>
    </div>
  )
}

export default GalleryPage
