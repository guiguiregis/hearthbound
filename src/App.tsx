import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CharacterProvider } from './context/CharacterContext'
import { Create } from './pages/Create'
import { Home } from './pages/Home'
import { Roster } from './pages/Roster'
import { Session } from './pages/Session'
import { Sheet } from './pages/Sheet'

export default function App() {
  return (
    <CharacterProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="characters" element={<Roster />} />
            <Route path="characters/:id" element={<Sheet />} />
            <Route path="characters/:id/session" element={<Session />} />
            <Route path="create" element={<Create />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CharacterProvider>
  )
}
