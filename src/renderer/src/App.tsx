import { Routes, Route, HashRouter } from 'react-router-dom'
import Main from './components/Main'
import Discord from './components/Discord'
import Header from './components/Header'
import { TelegramProvider } from './context/TelegramProvider'
import TitleBar from './components/TitleBar'
import { Footer } from './components/Footer'
import LogsViewer from './components/LogsViewer'
import DiscordRpcToggle from './components/Settings'

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
          <Route
            path="/settings"
            element={
              <DiscordRpcToggle
                onToggle={(enabled) => {
                  console.log('Discord RPC включён:', enabled)
                  if (enabled) {
                    window.electronAPI.startVpnWatcher()
                  } else {
                    window.electronAPI.stopVpnWatcher()
                  }
                }}
              />
            }
          />
        </Routes>
      </HashRouter>
      <Footer />
    </TelegramProvider>
  )
}

export default App
