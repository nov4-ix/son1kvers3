import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Users,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Share2,
  Circle,
  StopCircle,
  Eye,
  Heart,
  Send
} from 'lucide-react'
import toast from 'react-hot-toast'

interface LiveStream {
  id: string
  title: string
  streamer: string
  viewers: number
  isLive: boolean
  thumbnail: string
  category: string
  startedAt: string
}

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: string
  type: 'message' | 'system' | 'donation'
}

export function LaTerminal() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [viewers, setViewers] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [streamTitle, setStreamTitle] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLiveStreams()
    setupChatSimulation()
  }, [])

  const loadLiveStreams = async () => {
    // Simulate loading live streams
    const mockStreams: LiveStream[] = [
      {
        id: '1',
        title: '🎵 Live Music Creation Session',
        streamer: 'Son1kVers3',
        viewers: 1247,
        isLive: true,
        thumbnail: '/stream-thumb-1.jpg',
        category: 'Music Production',
        startedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '🎤 AI Music Live Performance',
        streamer: 'Pixel AI',
        viewers: 892,
        isLive: true,
        thumbnail: '/stream-thumb-2.jpg',
        category: 'Live Performance',
        startedAt: new Date().toISOString()
      }
    ]
    setLiveStreams(mockStreams)
  }

  const setupChatSimulation = () => {
    // Simulate chat messages
    const messages: ChatMessage[] = [
      { id: '1', user: 'MusicLover123', message: '¡Esta canción es increíble! 🎵', timestamp: new Date().toISOString(), type: 'message' },
      { id: '2', user: 'AIEnthusiast', message: '¿Cómo hiciste ese efecto vocal?', timestamp: new Date().toISOString(), type: 'message' },
      { id: '3', user: 'System', message: '🎵 Son1kVers3 se unió al stream', timestamp: new Date().toISOString(), type: 'system' }
    ]
    setChatMessages(messages)

    // Simulate new messages
    setInterval(() => {
      if (Math.random() > 0.7) {
        const randomMessages = [
          '¡Suena genial! 🔥',
          '¿Cuál es el próximo tema?',
          'Me encanta esta vibe ✨',
          '¿Puedes tocar algo más upbeat?',
          '¡Eres increíble! 👏'
        ]
        const newMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          user: `User${Math.floor(Math.random() * 1000)}`,
          message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
          timestamp: new Date().toISOString(),
          type: 'message'
        }
        setChatMessages(prev => [...prev, newMsg])
      }
    }, 5000)
  }

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      streamRef.current = stream
      setIsStreaming(true)
      setViewers(Math.floor(Math.random() * 100) + 10)

      // Simulate viewer count
      const interval = setInterval(() => {
        setViewers(prev => prev + Math.floor(Math.random() * 5) - 2)
      }, 10000)

      toast.success('Stream started successfully!')
    } catch (error) {
      toast.error('Failed to start stream')
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setIsStreaming(false)
    setViewers(0)
    toast.success('Stream stopped')
  }

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsCameraOn(videoTrack.enabled)
      }
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    toast.success(isRecording ? 'Recording stopped' : 'Recording started')
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        user: 'You',
        message: newMessage,
        timestamp: new Date().toISOString(),
        type: 'message'
      }
      setChatMessages(prev => [...prev, message])
      setNewMessage('')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#00FFE7] mb-2 flex items-center justify-center gap-2">
            <Mic size={32} />
            La Terminal
          </h1>
          <p className="text-gray-400">
            Live streaming platform for music creators
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-3">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
              {/* Stream Controls */}
              <div className="p-4 border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Stream title..."
                    className="bg-[#333] border border-[#555] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFE7]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-red-400">
                    <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">LIVE</span>
                  </div>

                  <div className="flex items-center gap-1 text-[#00FFE7]">
                    <Eye size={16} />
                    <span className="text-sm">{viewers}</span>
                  </div>
                </div>
              </div>

              {/* Video Area */}
              <div className="relative aspect-video bg-[#000] flex items-center justify-center">
                {isStreaming && videoRef.current ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Camera size={48} className="mx-auto mb-4" />
                    <p>Start streaming to see your video here</p>
                  </div>
                )}

                {/* Stream Overlay */}
                {isStreaming && (
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stream Controls */}
              <div className="p-4 border-t border-[#333]">
                <div className="flex items-center justify-center gap-4">
                  {!isStreaming ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startStream}
                      className="bg-[#00FFE7] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#00FFE7]/90 transition-colors flex items-center gap-2"
                    >
                      <Play size={20} />
                      Start Stream
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleMute}
                        className={`p-3 rounded-lg transition-colors ${isMuted ? 'bg-red-500' : 'bg-[#333]'} hover:opacity-80`}
                      >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleCamera}
                        className={`p-3 rounded-lg transition-colors ${!isCameraOn ? 'bg-red-500' : 'bg-[#333]'} hover:opacity-80`}
                      >
                        {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleRecording}
                        className={`p-3 rounded-lg transition-colors ${isRecording ? 'bg-red-500' : 'bg-[#333]'} hover:opacity-80`}
                      >
                        {isRecording ? <StopCircle size={20} /> : <Circle size={20} />}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleFullscreen}
                        className="p-3 bg-[#333] rounded-lg hover:opacity-80 transition-colors"
                      >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={stopStream}
                        className="bg-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Pause size={20} />
                        Stop Stream
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Streams */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4 text-[#00FFE7] flex items-center gap-2">
                <Users size={20} />
                Live Streams
              </h3>

              <div className="space-y-3">
                {liveStreams.map((stream) => (
                  <motion.div
                    key={stream.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStream?.id === stream.id
                        ? 'bg-[#00FFE7]/10 border border-[#00FFE7]'
                        : 'bg-[#333] hover:bg-[#444]'
                    }`}
                    onClick={() => setSelectedStream(stream)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#333] rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{stream.title}</h4>
                        <p className="text-xs text-gray-400">{stream.streamer}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="text-xs text-gray-400">{stream.viewers}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4 text-[#00FFE7] flex items-center gap-2">
                <MessageSquare size={20} />
                Live Chat
              </h3>

              <div
                ref={chatRef}
                className="h-64 overflow-y-auto mb-4 space-y-2"
              >
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    {msg.type === 'system' ? (
                      <p className="text-[#00FFE7] italic">{msg.message}</p>
                    ) : (
                      <div>
                        <span className="text-[#00FFE7] font-medium">{msg.user}: </span>
                        <span className="text-gray-300">{msg.message}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#333] border border-[#555] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFE7] text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  className="bg-[#00FFE7] text-black p-2 rounded-lg hover:bg-[#00FFE7]/90 transition-colors"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LaTerminal
