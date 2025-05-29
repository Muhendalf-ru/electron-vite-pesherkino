import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UIState {
  showLinks: boolean
}

const initialState: UIState = {
  showLinks: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowLinks(state, action: PayloadAction<boolean>) {
      state.showLinks = action.payload
    },
    toggleShowLinks(state) {
      state.showLinks = !state.showLinks
    }
  }
})

export const { setShowLinks, toggleShowLinks } = uiSlice.actions

export default uiSlice.reducer
