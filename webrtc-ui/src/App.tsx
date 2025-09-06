import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { HomePage } from './pages/home/HomePage'
import { LobbyPage } from './pages/lobby/LobbyPage'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes> 
          <Route path='/' element={<HomePage />}/>
          <Route path='/join' element={<LobbyPage />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
