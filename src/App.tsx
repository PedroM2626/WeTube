import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Search from './pages/Search';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import MyVideos from './pages/MyVideos';
import EditVideo from './pages/EditVideo';
import WatchLater from './pages/WatchLater';
import Playlists from './pages/Playlists';
import VideoPlayer from './components/VideoPlayer';
import Notifications from './pages/Notifications';
import History from './pages/History';
import Liked from './pages/Liked';
import Channel from './pages/Channel';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen">
                  <Header onMenuClick={handleMenuClick} onSearch={handleSearch} />
                  <div className="flex flex-1 overflow-hidden">
                    <Sidebar isOpen={sidebarOpen} />
                    <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
                      sidebarOpen ? 'ml-64' : 'ml-16'
                    }`}>
                      <Routes>
                        <Route path="/" element={<Home searchQuery={searchQuery} />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/my-videos" element={<MyVideos />} />
                        <Route path="/edit-video/:id" element={<EditVideo />} />
                        <Route path="/watch-later" element={<WatchLater />} />
                        <Route path="/playlists" element={<Playlists />} />
                        <Route path="/watch/:id" element={<VideoPlayer />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/liked" element={<Liked />} />
                        <Route path="/channel/:id" element={<Channel />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;