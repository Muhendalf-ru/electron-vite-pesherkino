import { Routes, Route, HashRouter } from 'react-router-dom'
import Main from './components/Main'
import Discord from './components/Discord'
import Header from './components/Header'
import { TelegramProvider } from './context/TelegramProvider'
import TitleBar from './components/TitleBar'
import { Footer } from './components/Footer'

function App(): React.ReactElement {
  return (
    <TelegramProvider>
      <TitleBar />
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/discord-fix" element={<Discord />} />
        </Routes>
      </HashRouter>
      <Footer />
    </TelegramProvider>
  )
}

export default App
