import React from 'react'
import DiscordRpcToggle from './DiscordRPC'
import OpenFolders from './OpenFolders'
const Settings: React.FC = () => {
  return (
    <div>
      <div>
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
      </div>
      <OpenFolders />

      <p className="warning-text-user">⚡️ Скоро: Возможность менять PORT вашего Proxy</p>
    </div>
  )
}

export default Settings
