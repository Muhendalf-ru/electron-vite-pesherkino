import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface LogsState {
  logs: string
  loading: boolean
  error: string | null
}

const initialState: LogsState = {
  logs: '',
  loading: false,
  error: null
}

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setLogs(state, action: PayloadAction<string>) {
      state.logs = action.payload
    },
    appendLogs(state, action: PayloadAction<string>) {
      state.logs += '\n' + action.payload
    },
    clearLogs(state) {
      state.logs = ''
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    }
  }
})

export const { setLogs, appendLogs, clearLogs, setLoading, setError } = logsSlice.actions

export default logsSlice.reducer
