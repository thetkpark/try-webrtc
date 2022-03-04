import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import axios from 'axios'

function App() {
  const [username, setUsername] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [isInMeeting, setIsInMeeting] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)

  const socket = useRef()
  const peerRef = useRef()
  const localVideo = useRef()
  const remoteVideo = useRef()

  useEffect(() => {
    socket.current = io(
      'https://2508-2405-9800-bc11-1509-c4cd-c769-12b9-423b.ap.ngrok.io',
      { transports: ['websocket'] }
    )

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
      stream.getAudioTracks()[0].enabled = isMicOn
      stream.getVideoTracks()[0].enabled = isCameraOn
      remoteVideo.current.srcObject = stream
      remoteVideo.current.src = window.URL.createObjectURL(stream)
    })

    peer.on('connect', () => {
      console.log('Peer connected')
    })

    socket.current.on('new-signal', ({ signal }) => {
      console.log('Recieved signal from socket')
      peer.signal(signal)
    })

    socket.current.on('user-left', () => {
      console.log('user left')
      destroyRemoteStream()
    })

    peerRef.current = peer
  }

  const onJoinMeeting = async e => {
    e.preventDefault()

    socket.current.emit('join-meeting', { id: meetingId })

    // wait for start-peering event
    socket.current.on('start-peering', onStartPeering)
    setIsInMeeting(true)
  }

  const onDisconnectMeeting = () => {
    socket.current.emit('leave-meeting', { id: meetingId })
    destroyRemoteStream()
  }

  const onToggleMic = () => {
    localVideo.current.srcObject.getAudioTracks()[0].enabled = !isMicOn
    setIsMicOn(!isMicOn)
  }

  const onToggleVideo = () => {
    localVideo.current.srcObject.getVideoTracks()[0].enabled = !isCameraOn
    setIsCameraOn(!isCameraOn)
  }

  const destroyRemoteStream = () => {
    peerRef.current.destroy()
    remoteVideo.current.srcObject = null
    remoteVideo.current.src = null
    setIsInMeeting(false)
  }

  const renderInMeetingComponents = () => {
    if (!isInMeeting) return null
    return (
      <div>
        <button onClick={onToggleVideo}>
          {isCameraOn ? 'Close Camera' : 'Open Camera'}
        </button>
        <button onClick={onToggleMic}>{isMicOn ? 'Mute' : 'Unmute'}</button>
        <button onClick={onDisconnectMeeting}>Leave</button>
      </div>
    )
  }

  return (
    <div className="App">
      <video playsInline autoPlay ref={localVideo} muted></video>
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
      {renderInMeetingComponents()}
    </div>
  )
}

export default App
