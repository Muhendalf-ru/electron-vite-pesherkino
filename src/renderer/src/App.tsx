import { Routes, Route, HashRouter } from 'react-router-dom'
import Main from './pages/Main'
import Discord from './pages/Discord'
import Header from './components/Header'
import { TelegramProvider } from './context/TelegramProvider'
import TitleBar from './components/TitleBar'
import { Footer } from './components/Footer'
import LogsViewer from './pages/LogsViewer'
import Settings from './pages/Settings'

function App(): React.ReactElement {
  return (
    <TelegramProvider>
      <TitleBar />
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/discord-fix" element={<Discord />} />
          <Route path="/logs" element={<LogsViewer />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </HashRouter>
      <Footer />
    </TelegramProvider>
  )
}

export default App
