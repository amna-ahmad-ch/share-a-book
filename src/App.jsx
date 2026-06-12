import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import AboutPage from './pages/AboutPage'
import DonatePage from './pages/DonatePage'
import AdminPage from './pages/AdminPage'
import BlockedPage from './pages/BlockedPage'
import BrowsePage from './pages/BrowsePage'
import ListingDetailPage from './pages/ListingDetailPage'
import LoginPage from './pages/LoginPage'
import MyBooksPage from './pages/MyBooksPage'
import OnboardingPage from './pages/OnboardingPage'
import PostPage from './pages/PostPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/blocked" element={<BlockedPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          <Route element={<Layout />}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route element={<ProtectedRoute />}>
              <Route index element={<BrowsePage />} />
              <Route path="listing/:id" element={<ListingDetailPage />} />
              <Route path="post" element={<PostPage />} />
              <Route path="my-books" element={<MyBooksPage />} />
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
