import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import SearchPage from './pages/SearchPage'
import GalleryPage from './pages/GalleryPage'
import AdminPage from './pages/AdminPage'
import './styles/app.css'

function App() {
  return (
    <Router>
      <div className="page-content">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
