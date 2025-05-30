import React from 'react'
import UserInfo from './UserInfo'

function Main(): React.ReactElement {
  return (
    <>
      <UserInfo />
      <div className="test">
        <h1>Waiting for update ❤️</h1>
        <div>
          <p>Please enter your Telegram ID to get started.</p>
        </div>
      </div>
    </>
  )
}

export default Main
