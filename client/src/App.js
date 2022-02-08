import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

function App() {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)

  const socket = useRef()
  const localVideo = useRef()
  const remoteVideo = useRef()

  useEffect(() => {
    socket.current = io('http://localhost:8080', { transports: ['websocket'] })
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
      setLocalStream(stream)
      localVideo.current.srcObject = stream
    })
  }, [])

  return (
    <div className="App">
      <video playsInline autoPlay ref={localVideo}></video>
    </div>
  )
}

export default App
