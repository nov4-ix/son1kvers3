# 🎵 SON1K-HEART: Music Generation Research Lab

> Production-ready laboratory for evaluating HeartMuLa as the core music generation engine

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-orange)](https://pytorch.org/)
[![CUDA](https://img.shields.io/badge/CUDA-Enabled-green)](https://developer.nvidia.com/cuda-toolkit)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

## 📐 Architecture

```
music-lab/
├── config.py                     # Centralized configuration
├── main.py                       # CLI entry point
│
├── generators/                   # 🎹 Music Generation
│   ├── heartmula_generator.py    # HeartMuLa model integration
│   └── section_composer.py       # Structural composition
│
├── post_processing/              # 🎛️ DSP Pipeline
│   ├── normalizer.py             # LUFS normalization (-14 LUFS)
│   ├── compressor.py             # Multiband compression
│   ├── stereo_enhancer.py        # Stereo widening + harmonic excitation
│   └── mastering_chain.py        # Full mastering pipeline
│
├── metrics/                      # 📊 Analysis & Reporting
│   ├── loudness.py               # LUFS, RMS, Peak analysis
│   ├── spectral.py               # Spectral centroid, bandwidth, DR
│   └── report.py                 # JSON report generation
│
├── utils/                        # 🔧 Utilities
│   ├── audio_io.py               # Load/Save/Convert audio
│   └── logging.py                # Performance tracking
│
└── outputs/
    ├── raw/                      # Generated audio
    ├── processed/                # Mastered audio
    └── reports/                  # Metrics JSON reports
```

### Data Flow

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Prompt    │───▶│ Section Composer │───▶│ HeartMuLa Gen   │
│ (genre/mood)│    │ (intro/verse/...) │    │ (GPU/CPU)       │
└─────────────┘    └──────────────────┘    └────────┬────────┘
                                                     │
                                                     ▼
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Report    │◀───│ Metrics Analysis │◀───│ Mastering Chain │
│   (JSON)    │    │ (LUFS/Spectral)  │    │ (DSP Pipeline)  │
└─────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🌍 Social Objective

### Democratizing Music Creation

**SON1K-HEART** aims to lower the barriers to music creation by providing:

1. **Accessibility** - Professional-grade music generation without expensive studios or instruments
2. **Education** - Open research platform for understanding AI music generation
3. **Creativity** - Tool for artists to explore new sounds and compositions
4. **Innovation** - Benchmark for improving AI music quality

### Target Communities

- 🎧 **Independent Artists** - Generate backing tracks, demos, inspiration
- 🎓 **Researchers** - Study AI music generation patterns and quality
- 🏫 **Educators** - Teach music production and AI concepts
- 🌱 **Beginners** - Explore music creation without technical knowledge

### Ethical Considerations

- All generated music is royalty-free for users
- Transparent about AI-generated content
- Open-source for community improvement
- Respect for human musicians and composers

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Current)

- [x] Core HeartMuLa integration
- [x] Section-based composition
- [x] DSP mastering pipeline
- [x] Metrics and reporting system
- [x] CLI interface

### Phase 2: Enhancement (Q2 2026)

- [ ] Multi-model support (MusicGen, AudioLDM2)
- [ ] Real-time generation preview
- [ ] Web UI dashboard
- [ ] Batch processing mode
- [ ] Custom model fine-tuning

### Phase 3: Integration (Q3 2026)

- [ ] REST API server
- [ ] WebSocket streaming
- [ ] SON1KVERS3 frontend integration
- [ ] VST plugin wrapper
- [ ] DAW integration (Ableton, FL Studio)

### Phase 4: Scale (Q4 2026)

- [ ] Distributed GPU processing
- [ ] Cloud deployment templates
- [ ] Model optimization (quantization, distillation)
- [ ] Multi-language lyrics support
- [ ] Genre-specific fine-tuned models

### Phase 5: Research (2027)

- [ ] Academic paper publication
- [ ] Community model contributions
- [ ] Benchmark dataset release
- [ ] Collaborative generation features
- [ ] Real-time collaboration

---

## 📈 Benchmark Plan

### Objective Metrics

| Metric | Target | Method |
|--------|--------|--------|
| **Loudness** | -14 LUFS ± 1 | pyloudnorm |
| **True Peak** | ≤ -1 dB | Digital peak detection |
| **Dynamic Range** | ≥ 8 dB | RMS percentile analysis |
| **Spectral Centroid** | Genre-appropriate | Librosa analysis |
| **Duration Accuracy** | ≥ 95% | Time measurement |

### Quality Metrics

| Metric | Description | Evaluation |
|--------|-------------|------------|
| **FAD Score** | Fréchet Audio Distance | Reference dataset comparison |
| **KL Divergence** | Spectral distribution match | Against genre references |
| **MOS** | Mean Opinion Score | Human evaluation (1-5) |

### Performance Metrics

| Metric | Target (GPU) | Target (CPU) |
|--------|--------------|--------------|
| Generation Time (3min) | < 30s | < 5min |
| VRAM Usage | < 8GB | N/A |
| RAM Usage | < 16GB | < 8GB |
| First Token Latency | < 2s | < 10s |

### Benchmark Datasets

1. **Genre Reference Set**
   - 100 tracks per genre (Pop, Rock, Electronic, Jazz, Classical)
   - Professional mastering quality
   - 30-second clips for comparison

2. **Quality Evaluation Set**
   - Generated vs Human comparison pairs
   - Double-blind evaluation protocol
   - Statistical significance testing

### Evaluation Protocol

```bash
# Run benchmark suite
python benchmarks/run_benchmark.py \
  --models heartmula-3b,musicgen-large \
  --genres pop,electronic,jazz \
  --samples 50 \
  --output results/benchmark_$(date +%Y%m%d).json
```

### Reporting

Results will be published as:
- JSON reports in `outputs/reports/`
- Markdown summaries for GitHub
- Visual dashboards (Phase 2)
- Academic paper format (Phase 5)

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/nov4-ix/son1k-heart.git
cd son1k-heart

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage

```bash
# Generate a 3-minute Latin pop song
python main.py --genre "latin pop" --mood "romantic" --language "spanish" --duration 180

# With custom BPM
python main.py --genre "edm" --mood "energetic" --language "english" --duration 180 --bpm 128

# Dry-run (section plan only)
python main.py --genre "jazz" --mood "calm" --language "instrumental" --duration 120 --dry-run
```

### CLI Options

| Option | Description | Required |
|--------|-------------|----------|
| `--genre, -g` | Music genre | ✅ |
| `--mood, -m` | Emotional mood | ✅ |
| `--language, -l` | Lyrics language | ✅ |
| `--duration, -d` | Duration in seconds | ✅ |
| `--bpm, -b` | Beats per minute | ❌ |
| `--lyrics` | Custom lyrics text | ❌ |
| `--title, -t` | Song title | ❌ |
| `--skip-mastering` | Skip DSP processing | ❌ |
| `--dry-run` | Show plan only | ❌ |

---

## 🛠️ Technical Requirements

### Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | GTX 1080 (8GB) | RTX 3090 (24GB) |
| RAM | 16GB | 32GB |
| Storage | 20GB SSD | 50GB NVMe |
| CPU | 8 cores | 16 cores |

### Software

- Python 3.10+
- CUDA 11.8+ (for GPU)
- cuDNN 8.6+

---

## 📊 SON1KVERS3 Frontend Stack

The production frontend at [son1kvers3.com](https://son1kvers3.com) uses:

### Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React | 18.2 |
| **Build Tool** | Vite | 7.1 |
| **Language** | TypeScript | 5.3 |
| **Styling** | Tailwind CSS | 3.4 |

### Key Libraries

| Library | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing |
| `zustand` | State management |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `@supabase/supabase-js` | Backend/Auth |
| `@stripe/stripe-js` | Payments |
| `react-hook-form` + `zod` | Form handling |
| `react-hot-toast` | Notifications |

### Typography

| Font | Usage |
|------|-------|
| Orbitron | Headlines, branding |
| Inter | Body text |
| Space Mono | Code, technical |

### Architecture

```
son1kvers3.com (Frontend)
     │
     ├── Vite (Build)
     ├── React 18 (UI)
     ├── TypeScript (Type safety)
     ├── Tailwind CSS (Styling)
     │
     └── Backend Services
          ├── Supabase (Database/Auth)
          ├── Stripe (Payments)
          └── Music Lab API (Generation) ← Future integration
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- HeartMuLa team for the base model
- HuggingFace for model hosting
- Librosa for audio analysis
- PyLoudNorm for loudness standards

---

<p align="center">
  <strong>Built with ❤️ for the future of AI music</strong>
</p>
