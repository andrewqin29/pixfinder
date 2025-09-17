import { Link, useLocation } from 'react-router-dom'

const Navigation = () => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <header className="nav-wrapper">
      <nav className="nav-container">
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Search
          </Link>
          <Link to="/gallery" className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}>
            Gallery
          </Link>
        </div>
        <div>
          <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
            Upload
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Navigation
