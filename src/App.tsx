import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import { CharacterProvider } from './context/CharacterContext'
import { Create } from './pages/Create'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Roster } from './pages/Roster'
import { Session } from './pages/Session'
import { Sheet } from './pages/Sheet'

export default function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route
                path="characters"
                element={
                  <RequireAuth>
                    <Roster />
                  </RequireAuth>
                }
              />
              <Route
                path="characters/:id"
                element={
                  <RequireAuth>
                    <Sheet />
                  </RequireAuth>
                }
              />
              <Route
                path="characters/:id/session"
                element={
                  <RequireAuth>
                    <Session />
                  </RequireAuth>
                }
              />
              <Route
                path="create"
                element={
                  <RequireAuth>
                    <Create />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CharacterProvider>
    </AuthProvider>
  )
}
