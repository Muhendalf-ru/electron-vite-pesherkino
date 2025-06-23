// src/store/discordSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DiscordState {
  telegramId: string | null
  vpnRunning: boolean
  status: string | null
  isError: boolean
  activeMenu: number // 0 - VPN, 1 - Patch
}

const initialState: DiscordState = {
  telegramId: null,
  vpnRunning: false,
  status: null,
  isError: false,
  activeMenu: 0
}

const discordSlice = createSlice({
  name: 'discord',
  initialState,
  reducers: {
    setTelegramId(state, action: PayloadAction<string>) {
      state.telegramId = action.payload
    },
    setVpnRunning(state, action: PayloadAction<boolean>) {
      state.vpnRunning = action.payload
    },
    setStatus(state, action: PayloadAction<string | null>) {
      state.status = action.payload
    },
    setIsError(state, action: PayloadAction<boolean>) {
      state.isError = action.payload
    },
    setActiveMenu(state, action: PayloadAction<number>) {
      state.activeMenu = action.payload
    },
    resetStatus(state) {
      state.status = null
      state.isError = false
    }
  }
})

export const { setTelegramId, setVpnRunning, setStatus, setIsError, setActiveMenu, resetStatus } =
  discordSlice.actions

export default discordSlice.reducer
