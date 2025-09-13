import { useEffect } from 'react'

const Lightbox = ({ open, onClose, image }) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !image) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <button className="absolute inset-0" onClick={onClose} aria-label="close" />
      <div className="relative max-w-5xl w-[92vw] mx-auto">
        <img src={image.s3_url} alt={image.caption || image.filename} className="w-full h-auto rounded-xl" />
        <div className="mt-3 text-center text-white/80">
          <p className="text-sm">{image.caption || 'no caption'}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default Lightbox

