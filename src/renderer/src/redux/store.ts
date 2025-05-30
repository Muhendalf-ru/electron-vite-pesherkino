import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slice/uiSlice'
import userInfoReducer from './slice/userSlice'
import logsReducer from './slice/logsSlice'
import discordReducer from './slice/discordSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    discord: discordReducer,
    userInfo: userInfoReducer,
    logs: logsReducer
  }
})

// Типы для useSelector и useDispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
