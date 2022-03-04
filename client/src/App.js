import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import axios from 'axios'

function App() {
  const [username, setUsername] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [isInMeeting, setIsInMeeting] = useState(false)

  const socket = useRef()
  const localVideo = useRef()
  const remoteVideo = useRef()

  useEffect(() => {
    socket.current = io('http://localhost:8080', { transports: ['websocket'] })

    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
      localVideo.current.srcObject = stream
      localVideo.current.src = window.URL.createObjectURL(stream)
    })
  }, [])

  const onSubmitUsername = e => {
    e.preventDefault()
    socket.current.emit('set-username', { username })
  }

  const onStartPeering = isInitiator => {
    const peer = new Peer({
      stream: localVideo.current.srcObject,
      initiator: isInitiator
    })

    peer.on('signal', data => {
      console.log('Got signal data')
      socket.current.emit('user-signal', { id: meetingId, signal: data })
    })

    peer.on('stream', stream => {
      console.log('got stream')
      remoteVideo.current.srcObject = stream
      remoteVideo.current.src = window.URL.createObjectURL(stream)
      setIsInMeeting(true)
    })

    peer.on('connect', () => {
      console.log('Peer connected')
    })

    socket.current.on('new-signal', ({ signal }) => {
      console.log('Recieved signal from socket')
      peer.signal(signal)
    })
  }

  const onJoinMeeting = async e => {
    e.preventDefault()

    const res = await axios.get('http://localhost:8080/api/is-initiator', {
      params: { id: meetingId }
    })

    console.log(res.data)
    socket.current.emit('join-meeting', { id: meetingId })

    // wait for start-peering event
    socket.current.on('start-peering', () => onStartPeering(res.data.isInitiator))
  }

  const onDisconnectMeeting = () => {
    socket.current.emit('user-disconnect', { id: meetingId })
    setIsInMeeting(false)
  }

  return (
    <div className="App">
      <video playsInline autoPlay ref={localVideo}></video>
      <video playsInline autoPlay ref={remoteVideo}></video>
      <form onSubmit={onSubmitUsername}>
        <label>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        <button type="submit">Submit</button>
      </form>
      <form onSubmit={onJoinMeeting}>
        <label>Meeting ID</label>
        <input
          type="text"
          value={meetingId}
          onChange={e => setMeetingId(e.target.value)}
        />
        <button type="submit">Join Meeting</button>
      </form>
      {isInMeeting ? <button onClick={onDisconnectMeeting}>Disconnect</button> : null}
    </div>
  )
}

export default App
