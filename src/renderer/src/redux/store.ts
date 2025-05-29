import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slice/uiSlice'
import userInfoReducer from './slice/userSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    userInfo: userInfoReducer
  }
})

// Типы для useSelector и useDispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
