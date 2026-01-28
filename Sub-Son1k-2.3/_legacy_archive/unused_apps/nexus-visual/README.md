# Nexus Visual - Adaptive Pixels

> **Behavior-driven adaptive visual system with machine learning**

Nexus Visual implements an advanced adaptive pixel system that learns from user interactions and reflects them in real-time visuals. The system combines realistic behavior tracking, simple heuristic adaptation, and optional machine learning to create personalized visual experiences.

## ✨ Features

### 🧠 **Adaptive Learning System**
- **Real-time Behavior Tracking**: Click, hover, scroll, and keyboard interaction monitoring
- **Grid-based Heatmap**: Spatial analysis of user interaction patterns
- **Pixel Adaptation**: 10,000 pixels that adapt based on user behavior
- **Confidence Scoring**: Machine learning confidence metrics

### 🎨 **Visual Adaptation**
- **Color Shifting**: Dynamic color adaptation based on context and preferences
- **Speed Modulation**: Movement speed adaptation based on interaction patterns
- **Glow Intensity**: Visual feedback intensity based on user engagement
- **Size Scaling**: Pixel size adaptation for different interaction styles

### 🤖 **Machine Learning Integration**
- **TensorFlow.js**: Optional ML model training and prediction
- **Behavior Prediction**: Predicts user preferences from interaction patterns
- **Model Persistence**: Saves trained models to localStorage
- **Feature Flag Control**: ML features only load when enabled

### 📊 **Analytics Dashboard**
- **Real-time Stats**: Live adaptation metrics and confidence scores
- **Heatmap Visualization**: Interactive heatmap of user activity
- **Preference Controls**: Manual adaptation controls and theme switching
- **ML Model Management**: Train, predict, and manage ML models

## 🛠️ Technical Stack

- **React 18** - Component framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animations
- **Zustand** - State management
- **Canvas API** - High-performance rendering
- **TensorFlow.js** - Machine learning (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd apps/nexus-visual
npm install
```

### Environment Setup
```bash
cp .env.local.example .env.local
```

Configure environment variables:
```env
# Feature Flags
VITE_ENABLE_PIXEL_LEARNING=true
VITE_ENABLE_PIXEL_ML=false

# Optional Supabase Integration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development
```bash
npm run dev
```

Visit `http://localhost:3004` to see the adaptive pixels in action.

## 🎮 Usage

### Basic Interaction
- **Click**: Interact with pixels to trigger adaptation
- **Hover**: Influence nearby pixels with mouse movement
- **Scroll**: Affect global pixel behavior patterns
- **Keyboard**: Track keyboard interaction patterns

### Keyboard Shortcuts
- **P**: Toggle pause/play animation
- **R**: Reset pixel learning
- **D**: Toggle dashboard visibility

### Dashboard Controls
- **Stats Tab**: View adaptation metrics and confidence scores
- **Heatmap Tab**: See interaction patterns and activity zones
- **Preferences Tab**: Apply manual adaptations and themes
- **ML Tab**: Train and manage machine learning models

## 🔧 Configuration

### Feature Flags
```env
# Enable behavior learning system
VITE_ENABLE_PIXEL_LEARNING=true

# Enable machine learning features (requires TensorFlow.js)
VITE_ENABLE_PIXEL_ML=false
```

### Pixel Configuration
```typescript
// Adjust pixel count and density
const PIXEL_COUNT = 10000
const ADAPTATION_RADIUS = 100
const GRID_SIZE = 50
```

### Context Modes
- **ghost-studio**: Purple theme (#B84DFF)
- **nova-pilot**: Cyan theme (#00FFE7)
- **nexus**: Accent theme (#9AF7EE)

## 📊 Data Model

### User Behavior
```typescript
interface UserBehavior {
  clickHeatmap: Map<string, number>
  hoverAreas: Map<string, number>
  scrollSpeed: number
  timeOnPage: Record<string, number>
  interactions: {
    buttons: string[]
    features: string[]
    timeOfDay: string
  }
}
```

### Pixel Preferences
```typescript
interface PixelPreferences {
  colorShift: number        // -1..1
  speedMultiplier: number   // 0.5..2
  size: number              // 0.5..1.5
  opacity: number           // 0.3..1
  glowIntensity: number     // 0.5..2
}
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Test specific modules
npm run test behaviorTracker
npm run test adaptivePixels
npm run test storage
```

### Test Coverage
- **Behavior Tracker**: Heatmap bucketing, notification radius
- **Adaptive Pixels**: Preference changes on interactions
- **Storage**: Persistence get/set roundtrip
- **ML Integration**: Model training and prediction

## 🔌 Integration

### Embedding in Other Apps
```tsx
import { AdaptivePixels } from '@/components/AdaptivePixels'

function MyApp() {
  return (
    <div>
      <MyAppContent />
      <AdaptivePixels 
        mode="real"
        context="nova-pilot"
        density={0.5}
      />
    </div>
  )
}
```

### Initialization Helper
```typescript
import { initAdaptivePixels } from '@/lib/adaptivePixels'

// Initialize with specific configuration
initAdaptivePixels({
  mode: 'real',
  context: 'ghost-studio',
  enableLearning: true,
  enableML: false
})
```

## 📈 Performance

### Optimization Features
- **RequestAnimationFrame**: Smooth 60fps animation
- **Canvas Rendering**: Hardware-accelerated graphics
- **Throttled Events**: Optimized interaction tracking
- **Lazy Loading**: ML features load only when needed
- **Memory Management**: Efficient pixel data structures

### Performance Metrics
- **Target**: 60fps with 10,000 pixels
- **Memory**: < 50MB for full system
- **Bundle Size**: < 2MB (without ML features)
- **ML Bundle**: +3MB when enabled

## 🔒 Privacy & Security

### Data Handling
- **Local Storage**: Primary data persistence
- **Optional Supabase**: Cloud backup for pro users
- **No Tracking**: No external analytics or tracking
- **User Control**: Full data export and deletion

### Security Features
- **Input Validation**: All user inputs validated
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Request token validation
- **Environment Variables**: Secure configuration

## 🚀 Deployment

### Build
```bash
npm run build
```

### Environment Variables
```env
# Production
VITE_ENABLE_PIXEL_LEARNING=true
VITE_ENABLE_PIXEL_ML=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deployment Platforms
- **Vercel**: Automatic deployment with environment variables
- **Netlify**: Static site deployment
- **Docker**: Containerized deployment
- **CDN**: Static asset optimization

## 📚 API Reference

### Hooks
- `useBehaviorTracker()`: Track user interactions
- `useAdaptivePixels()`: Manage pixel adaptation
- `useSimpleAdaptation()`: Apply heuristic adaptations
- `usePixelML()`: Machine learning integration

### Components
- `AdaptivePixelsCanvas`: Main rendering canvas
- `PixelLearningDashboard`: Analytics and controls
- `HeatmapCanvas`: Interaction visualization

### Utilities
- `pixelStorage`: Local storage management
- `pixelSupabase`: Cloud persistence
- `utils`: Color, math, and helper functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines
- Use TypeScript strict mode
- Follow existing code patterns
- Add tests for new features
- Update documentation
- Ensure performance targets

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: This README
- **Examples**: See `/examples` directory
- **Community**: Discord server

---

**Built with ❤️ for the Son1kVers3 ecosystem**