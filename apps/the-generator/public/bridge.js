// Cross-App Communication Bridge for The Generator
// Enables communication with other Son1kVerse applications

class Son1kVerseBridge {
  constructor() {
    this.apps = {
      'web-classic': 'https://web-classic.son1kvers3.com',
      'ghost-studio': 'https://ghost-studio.son1kvers3.com',
      'nova-post-pilot': 'https://nova-post-pilot.son1kvers3.com',
      'the-generator': 'https://the-generator.son1kvers3.com',
      'la-terminal': 'https://la-terminal.son1kvers3.com',
      'el-santuario': 'https://el-santuario.son1kvers3.com'
    }

    this.init()
  }

  init() {
    // Listen for messages from other apps
    window.addEventListener('message', this.handleMessage.bind(this))

    // Notify parent about our presence
    this.notifyAppReady()

    // Check for new tracks from other apps
    this.checkForNewTracks()
  }

  handleMessage(event) {
    // Verify origin for security
    if (!Object.values(this.apps).includes(event.origin)) {
      return
    }

    const { type, data } = event.data

    switch (type) {
      case 'NEW_TRACK':
        this.onNewTrack(data)
        break
      case 'TRACK_UPDATE':
        this.onTrackUpdate(data)
        break
      case 'APP_READY':
        this.onAppReady(data)
        break
    }
  }

  notifyAppReady() {
    // Notify other apps that The Generator is ready
    Object.values(this.apps).forEach(url => {
      if (url !== window.location.origin) {
        window.parent.postMessage({
          type: 'APP_READY',
          data: {
            app: 'the-generator',
            url: window.location.href,
            timestamp: Date.now()
          }
        }, url)
      }
    })
  }

  checkForNewTracks() {
    // Check localStorage for tracks from other apps
    const newTrackData = localStorage.getItem('new-track-generated')
    if (newTrackData) {
      try {
        const { track, timestamp } = JSON.parse(newTrackData)
        // Only process if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          this.onNewTrack(track)
        }
        localStorage.removeItem('new-track-generated')
      } catch (error) {
        console.error('Error parsing new track data:', error)
      }
    }
  }

  onNewTrack(track) {
    // Handle new track from other apps
    console.log('🎵 New track received:', track)

    // You can add custom logic here to handle incoming tracks
    // For example, auto-import to Ghost Studio for cover generation
  }

  onTrackUpdate(track) {
    // Handle track updates
    console.log('📝 Track updated:', track)
  }

  onAppReady(data) {
    // Handle when other apps are ready
    console.log('🚀 App ready:', data.app)
  }

  // Methods to communicate with other apps
  sendTrackToApp(appName, track) {
    const appUrl = this.apps[appName]
    if (appUrl) {
      // Try to send via postMessage
      const popup = window.open(appUrl, '_blank')
      setTimeout(() => {
        popup.postMessage({
          type: 'NEW_TRACK',
          data: track
        }, appUrl)
      }, 1000)
    }
  }

  broadcastTrackUpdate(track) {
    // Broadcast track updates to all apps
    Object.values(this.apps).forEach(url => {
      if (url !== window.location.origin) {
        try {
          window.parent.postMessage({
            type: 'TRACK_UPDATE',
            data: track
          }, url)
        } catch (error) {
          console.error('Error broadcasting to', url, error)
        }
      }
    })
  }
}

// Initialize bridge when DOM is ready
if (typeof window !== 'undefined') {
  window.son1kVerseBridge = new Son1kVerseBridge()
  window.ghostStudioBridge = {
    onNewTrack: (track) => {
      console.log('🎤 Sending track to Ghost Studio for cover generation:', track)
      // Auto-navigate to Ghost Studio with the track
      window.open(`https://ghost-studio.son1kvers3.com?import=${encodeURIComponent(JSON.stringify(track))}`, '_blank')
    }
  }
}

export default Son1kVerseBridge
