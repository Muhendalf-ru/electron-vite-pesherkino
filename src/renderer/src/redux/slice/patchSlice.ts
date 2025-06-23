import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PatchState {
  status: string | null
  isError: boolean
  patchRunning: boolean
}

const initialState: PatchState = {
  status: null,
  isError: false,
  patchRunning: false
}

const patchSlice = createSlice({
  name: 'patch',
  initialState,
  reducers: {
    setPatchStatus(state, action: PayloadAction<string | null>) {
      state.status = action.payload
    },
    setPatchIsError(state, action: PayloadAction<boolean>) {
      state.isError = action.payload
    },
    setPatchRunning(state, action: PayloadAction<boolean>) {
      state.patchRunning = action.payload
    },
    resetPatchStatus(state) {
      state.status = null
      state.isError = false
    }
  }
})

export const { setPatchStatus, setPatchIsError, setPatchRunning, resetPatchStatus } = patchSlice.actions
export default patchSlice.reducer 