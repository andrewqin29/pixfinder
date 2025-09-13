import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import SearchPage from './pages/SearchPage'
import GalleryPage from './pages/GalleryPage'
import './App.css'
import './styles/custom.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-14">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
