import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MessageSquare,
  Share2,
  Settings,
  Play,
  Pause,
  Volume2,
  VolumeX,
  UserPlus,
  Crown,
  Music,
  Send,
  Plus,
  Save,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Collaborator {
  id: string
  name: string
  avatar: string
  role: 'host' | 'collaborator' | 'viewer'
  isActive: boolean
  instrument?: string
  color: string
}

interface CollaborationSession {
  id: string
  name: string
  host: string
  collaborators: Collaborator[]
  maxCollaborators: number
  isActive: boolean
  createdAt: string
  genre: string
  bpm: number
  key: string
}

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: string
  type: 'message' | 'system' | 'music'
}

export function LiveCollaboration() {
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [availableSessions, setAvailableSessions] = useState<CollaborationSession[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [maxCollaborators, setMaxCollaborators] = useState(4)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    loadAvailableSessions()
    setupWebSocket()
  }, [])

  const loadAvailableSessions = async () => {
    // Simulate loading available sessions
    const mockSessions: CollaborationSession[] = [
      {
        id: '1',
        name: '🎵 Jazz Fusion Session',
        host: 'Son1kVers3',
        collaborators: [
          {
            id: '1',
            name: 'Son1kVers3',
            avatar: '/avatar-1.jpg',
            role: 'host',
            isActive: true,
            instrument: 'Piano',
            color: '#00FFE7'
          }
        ],
        maxCollaborators: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
        genre: 'Jazz Fusion',
        bpm: 120,
        key: 'C'
      },
      {
        id: '2',
        name: '🎸 Rock Collaboration',
        host: 'Pixel AI',
        collaborators: [
          {
            id: '2',
            name: 'Pixel AI',
            avatar: '/avatar-2.jpg',
            role: 'host',
            isActive: true,
            instrument: 'Guitar',
            color: '#B84DFF'
          }
        ],
        maxCollaborators: 6,
        isActive: true,
        createdAt: new Date().toISOString(),
        genre: 'Rock',
        bpm: 140,
        key: 'E'
      }
    ]
    setAvailableSessions(mockSessions)
  }

  const setupWebSocket = () => {
    // Simulate WebSocket connection
    const ws = new WebSocket('ws://localhost:3001/collaboration')
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      toast.success('Connected to collaboration server')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    ws.onclose = () => {
      setIsConnected(false)
      toast.error('Disconnected from collaboration server')
    }
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'NEW_MESSAGE':
        setChatMessages(prev => [...prev, data.message])
        break
      case 'USER_JOINED':
        toast.success(`${data.user} joined the session`)
        break
      case 'USER_LEFT':
        toast.success(`${data.user} left the session`)
        break
      case 'MUSIC_UPDATE':
        // Handle music collaboration updates
        break
    }
  }

  const createSession = () => {
    if (!sessionName.trim()) return

    const newSession: CollaborationSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: sessionName,
      host: 'You',
      collaborators: [
        {
          id: '1',
          name: 'You',
          avatar: '/avatar-you.jpg',
          role: 'host',
          isActive: true,
          instrument: 'Piano',
          color: '#00FFE7'
        }
      ],
      maxCollaborators,
      isActive: true,
      createdAt: new Date().toISOString(),
      genre: 'Electronic',
      bpm: 120,
      key: 'C'
    }

    setCurrentSession(newSession)
    setIsHost(true)
    setShowCreateModal(false)
    setSessionName('')
    toast.success('Session created successfully!')
  }

  const joinSession = (session: CollaborationSession) => {
    if (session.collaborators.length >= session.maxCollaborators) {
      toast.error('Session is full')
      return
    }

    const updatedSession = {
      ...session,
      collaborators: [
        ...session.collaborators,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: 'You',
          avatar: '/avatar-you.jpg',
          role: 'collaborator' as const,
          isActive: true,
          instrument: 'Guitar',
          color: '#B84DFF'
        }
      ]
    }

    setCurrentSession(updatedSession)
    toast.success(`Joined session: ${session.name}`)
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !currentSession) return

    const message: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      user: 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message'
    }

    setChatMessages(prev => [...prev, message])
    setNewMessage('')

    // Send via WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'NEW_MESSAGE',
        message
      }))
    }
  }

  const leaveSession = () => {
    setCurrentSession(null)
    setIsHost(false)
    toast.success('Left session')
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
            <Users size={32} />
            Live Collaboration
          </h1>
          <p className="text-gray-400">
            Create music together in real-time with other artists
          </p>
        </motion.div>

        {!currentSession ? (
          /* Session Selection */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Available Sessions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold text-[#00FFE7] mb-6">Available Sessions</h2>
              <div className="space-y-4">
                {availableSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{session.name}</h3>
                        <p className="text-gray-400">Hosted by {session.host}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-sm">LIVE</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {session.collaborators.length}/{session.maxCollaborators}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Genre: {session.genre}</span>
                        <span>BPM: {session.bpm}</span>
                        <span>Key: {session.key}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {session.collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: collaborator.color }}
                          >
                            {collaborator.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm">{collaborator.name}</p>
                            <p className="text-xs text-gray-400">{collaborator.instrument}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => joinSession(session)}
                      className="w-full bg-[#00FFE7] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[#00FFE7]/90 transition-colors"
                    >
                      Join Session
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Create Session */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[#00FFE7] mb-6">Create New Session</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Session Name
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="w-full bg-[#333] border border-[#555] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00FFE7]"
                      placeholder="My Awesome Session"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Collaborators
                    </label>
                    <select
                      value={maxCollaborators}
                      onChange={(e) => setMaxCollaborators(Number(e.target.value))}
                      className="w-full bg-[#333] border border-[#555] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00FFE7]"
                    >
                      <option value={2}>2 Collaborators</option>
                      <option value={4}>4 Collaborators</option>
                      <option value={6}>6 Collaborators</option>
                      <option value={8}>8 Collaborators</option>
                    </select>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(true)}
                    className="w-full bg-[#B84DFF] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#B84DFF]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Create Session
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Active Session */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Collaboration Area */}
            <div className="lg:col-span-3">
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                {/* Session Header */}
                <div className="p-4 border-b border-[#333] flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{currentSession.name}</h2>
                    <p className="text-gray-400 text-sm">
                      Host: {currentSession.host} • {currentSession.genre} • {currentSession.bpm} BPM • {currentSession.key}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">LIVE</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {currentSession.collaborators.length} collaborators
                    </div>
                  </div>
                </div>

                {/* Video Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Local Video */}
                    <div className="relative">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full aspect-video bg-[#333] rounded-lg object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        You (Host)
                      </div>
                    </div>

                    {/* Remote Videos */}
                    {currentSession.collaborators
                      .filter(collab => collab.id !== '1')
                      .map((collaborator) => (
                        <div key={collaborator.id} className="relative">
                          <video
                            ref={el => {
                              if (el) remoteVideoRefs.current[collaborator.id] = el
                            }}
                            autoPlay
                            playsInline
                            className="w-full aspect-video bg-[#333] rounded-lg object-cover"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {collaborator.name}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Music Controls */}
                <div className="p-4 border-t border-[#333]">
                  <div className="flex items-center justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#00FFE7] text-black p-3 rounded-lg hover:bg-[#00FFE7]/90 transition-colors"
                    >
                      <Play size={20} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#333] text-white p-3 rounded-lg hover:bg-[#444] transition-colors"
                    >
                      <Save size={20} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#333] text-white p-3 rounded-lg hover:bg-[#444] transition-colors"
                    >
                      <Download size={20} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={leaveSession}
                      className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Leave Session
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Collaborators */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-4 text-[#00FFE7] flex items-center gap-2">
                  <Users size={20} />
                  Collaborators
                </h3>

                <div className="space-y-3">
                  {currentSession.collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: collaborator.color }}
                      >
                        {collaborator.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{collaborator.name}</p>
                          {collaborator.role === 'host' && (
                            <Crown size={14} className="text-yellow-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{collaborator.instrument}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${collaborator.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-4 text-[#00FFE7] flex items-center gap-2">
                  <MessageSquare size={20} />
                  Session Chat
                </h3>

                <div className="h-64 overflow-y-auto mb-4 space-y-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="text-[#00FFE7] font-medium">{msg.user}: </span>
                      <span className="text-gray-300">{msg.message}</span>
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
        )}

        {/* Create Session Modal */}
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-semibold mb-4 text-[#00FFE7]">
                Create Collaboration Session
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full bg-[#333] border border-[#555] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00FFE7]"
                    placeholder="My Awesome Session"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Collaborators
                  </label>
                  <select
                    value={maxCollaborators}
                    onChange={(e) => setMaxCollaborators(Number(e.target.value))}
                    className="w-full bg-[#333] border border-[#555] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00FFE7]"
                  >
                    <option value={2}>2 Collaborators</option>
                    <option value={4}>4 Collaborators</option>
                    <option value={6}>6 Collaborators</option>
                    <option value={8}>8 Collaborators</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={createSession}
                    className="flex-1 bg-[#00FFE7] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[#00FFE7]/90 transition-colors"
                  >
                    Create Session
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-[#333] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#444] transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LiveCollaboration
