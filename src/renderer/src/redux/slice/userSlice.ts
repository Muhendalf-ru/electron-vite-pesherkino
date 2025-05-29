import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export type AdminLink = {
  link: string
  expiryTime: string
  location: string
  _id: string
}

export type UserInfoType = {
  telegramId: string
  staticLink: string
  email?: string
  uuid?: string
  vlessLinks: AdminLink[]
  vlessLinksLite: AdminLink[]
  promoLinks: AdminLink[]
  adminLinks: AdminLink[]
}

export interface UserInfoState {
  data: UserInfoType | null
  loading: boolean
  error: string | null
}

const initialState: UserInfoState = {
  data: null,
  loading: false,
  error: null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
// Асинхронный thunk для загрузки данных
export const fetchUserInfo = createAsyncThunk<
  UserInfoType,
  string,
  { rejectValue: string }
>('userInfo/fetchUserInfo', async (telegramId, thunkAPI) => {
  try {
    const res = await fetch(`${API_BASE_URL}/info/${telegramId}`)
    if (!res.ok) {
      return thunkAPI.rejectWithValue(`Ошибка HTTP: ${res.status} ${res.statusText}`)
    }
    const json = await res.json()
    if (!json) {
      return thunkAPI.rejectWithValue('Пустой ответ от сервера')
    }
    return json as UserInfoType
  } catch (error) {
    if (error instanceof Error) {
      return thunkAPI.rejectWithValue(error.message)
    }
    return thunkAPI.rejectWithValue('Неизвестная ошибка')
  }
})

export const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    clearUserInfo(state) {
      state.data = null
      state.loading = false
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true
        state.error = null
        state.data = null
      })
      .addCase(fetchUserInfo.fulfilled, (state, action: PayloadAction<UserInfoType>) => {
        state.loading = false
        state.error = null
        state.data = action.payload
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Неизвестная ошибка'
        state.data = null
      })
  }
})

export const { clearUserInfo } = userInfoSlice.actions

export default userInfoSlice.reducer
