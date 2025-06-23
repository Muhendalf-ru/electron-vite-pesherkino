import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slice/uiSlice'
import userInfoReducer from './slice/userSlice'
import logsReducer from './slice/logsSlice'
import discordReducer from './slice/discordSlice'
import patchReducer from './slice/patchSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    discord: discordReducer,
    userInfo: userInfoReducer,
    logs: logsReducer,
    patch: patchReducer
  }
})

// Типы для useSelector и useDispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
