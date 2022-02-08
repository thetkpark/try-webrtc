import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

function App() {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [username, setUsername] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])

  const socket = useRef()
  const localVideo = useRef()
  const remoteVideo = useRef()

  useEffect(() => {
    socket.current = io('http://localhost:8080', { transports: ['websocket'] })
    socket.current.on('online-users', ({ users }) => {
      console.log(users)
      setOnlineUsers(users)
    })

    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
      setLocalStream(stream)
      localVideo.current.srcObject = stream
    })
  }, [])

  const onSubmitUsername = e => {
    e.preventDefault()
    socket.current.emit('set-username', { username })
  }

  const onCallUser = id => {
    console.log(`Calling ${id}`)
  }

  const renderOnlineUsers = () => {
    return (
      <div>
        <ul>
          {onlineUsers.map(user => (
            <span>
              <li key={user.id}>{user.username}</li>
              <button onClick={() => onCallUser(user.id)}>Call</button>
            </span>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="App">
      <video playsInline autoPlay ref={localVideo}></video>
      <form onSubmit={onSubmitUsername}>
        <label>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        <button type="submit">Submit</button>
      </form>
      {renderOnlineUsers()}
    </div>
  )
}

export default App
