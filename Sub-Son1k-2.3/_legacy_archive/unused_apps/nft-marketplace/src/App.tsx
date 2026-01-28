import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Heart,
  Share2,
  Search,
  Filter,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Play,
  Pause,
  Eye,
  Copy,
  ExternalLink,
  Wallet,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NFTTrack {
  id: string
  title: string
  artist: string
  image: string
  audioUrl: string
  price: number
  currency: string
  likes: number
  plays: number
  duration: string
  genre: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  owner: string
  createdAt: string
  description: string
}

interface Collection {
  id: string
  name: string
  description: string
  image: string
  totalVolume: number
  floorPrice: number
  items: number
  owners: number
}

export function NFTMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [nftTracks, setNftTracks] = useState<NFTTrack[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFTTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [showNFTDetails, setShowNFTDetails] = useState(false)

  useEffect(() => {
    loadNFTTracks()
    loadCollections()
  }, [])

  const loadNFTTracks = async () => {
    // Simulate loading NFT tracks
    const mockNFTs: NFTTrack[] = [
      {
        id: '1',
        title: 'Digital Rebellion',
        artist: 'Son1kVers3',
        image: '/nft-cover-1.jpg',
        audioUrl: '/track-1.mp3',
        price: 0.5,
        currency: 'ETH',
        likes: 1247,
        plays: 5689,
        duration: '3:42',
        genre: 'Electronic',
        rarity: 'Legendary',
        owner: '0x742d35Cc6635C0532...',
        createdAt: new Date().toISOString(),
        description: 'A revolutionary electronic track that captures the essence of digital rebellion.'
      },
      {
        id: '2',
        title: 'Neon Dreams',
        artist: 'Pixel AI',
        image: '/nft-cover-2.jpg',
        audioUrl: '/track-2.mp3',
        price: 0.3,
        currency: 'ETH',
        likes: 892,
        plays: 3421,
        duration: '4:15',
        genre: 'Ambient',
        rarity: 'Epic',
        owner: '0x8ba1f109551b...',
        createdAt: new Date().toISOString(),
        description: 'Ethereal ambient soundscapes that transport you to neon-lit dream worlds.'
      },
      {
        id: '3',
        title: 'Cyber Soul',
        artist: 'AI Maestro',
        image: '/nft-cover-3.jpg',
        audioUrl: '/track-3.mp3',
        price: 0.8,
        currency: 'ETH',
        likes: 2156,
        plays: 8934,
        duration: '3:28',
        genre: 'Synthwave',
        rarity: 'Rare',
        owner: '0x1a2b3c4d5e6f...',
        createdAt: new Date().toISOString(),
        description: 'Futuristic synthwave with soulful undertones and cyberpunk aesthetics.'
      }
    ]
    setNftTracks(mockNFTs)
  }

  const loadCollections = async () => {
    // Simulate loading collections
    const mockCollections: Collection[] = [
      {
        id: '1',
        name: 'Son1kVers3 Genesis',
        description: 'The original collection of AI-generated music NFTs',
        image: '/collection-1.jpg',
        totalVolume: 15.7,
        floorPrice: 0.3,
        items: 100,
        owners: 89
      },
      {
        id: '2',
        name: 'Pixel AI Masters',
        description: 'Exclusive AI-generated tracks with unique visual art',
        image: '/collection-2.jpg',
        totalVolume: 8.9,
        floorPrice: 0.2,
        items: 50,
        owners: 45
      }
    ]
    setCollections(mockCollections)
  }

  const filteredNFTs = nftTracks.filter(nft => {
    const matchesSearch = nft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.artist.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || nft.genre.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'popular':
        return b.likes - a.likes
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const handlePlay = (nftId: string) => {
    setIsPlaying(isPlaying === nftId ? null : nftId)
    toast.success(isPlaying === nftId ? 'Paused' : 'Playing preview')
  }

  const handlePurchase = (nft: NFTTrack) => {
    toast.success(`Purchasing ${nft.title} for ${nft.price} ${nft.currency}`)
  }

  const handleLike = (nft: NFTTrack) => {
    toast.success(`Liked ${nft.title}!`)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-yellow-400 border-yellow-400'
      case 'Epic': return 'text-purple-400 border-purple-400'
      case 'Rare': return 'text-blue-400 border-blue-400'
      default: return 'text-gray-400 border-gray-400'
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
            <ShoppingCart size={32} />
            NFT Marketplace
          </h1>
          <p className="text-gray-400">
            Discover and collect unique AI-generated music NFTs
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#00FFE7] mb-2">
              <TrendingUp size={20} />
              <span className="text-sm font-medium">Total Volume</span>
            </div>
            <div className="text-2xl font-bold">24.6 ETH</div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#00FFE7] mb-2">
              <Users size={20} />
              <span className="text-sm font-medium">Total Owners</span>
            </div>
            <div className="text-2xl font-bold">134</div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#00FFE7] mb-2">
              <DollarSign size={20} />
              <span className="text-sm font-medium">Floor Price</span>
            </div>
            <div className="text-2xl font-bold">0.2 ETH</div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#00FFE7] mb-2">
              <Clock size={20} />
              <span className="text-sm font-medium">Items</span>
            </div>
            <div className="text-2xl font-bold">150</div>
          </div>
        </motion.div>

        {/* Collections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-[#00FFE7] mb-6">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collections.map((collection) => (
              <motion.div
                key={collection.id}
                whileHover={{ scale: 1.02 }}
                className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden"
              >
                <div className="aspect-video bg-[#333] flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="w-16 h-16 bg-[#00FFE7] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-black font-bold text-lg">🎵</span>
                    </div>
                    <p className="text-sm">{collection.name}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{collection.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{collection.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Volume</p>
                      <p className="text-[#00FFE7] font-medium">{collection.totalVolume} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Floor</p>
                      <p className="text-[#00FFE7] font-medium">{collection.floorPrice} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Items</p>
                      <p className="text-white font-medium">{collection.items}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Owners</p>
                      <p className="text-white font-medium">{collection.owners}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search NFTs..."
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFE7] w-64"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00FFE7]"
              >
                <option value="all">All Categories</option>
                <option value="electronic">Electronic</option>
                <option value="ambient">Ambient</option>
                <option value="synthwave">Synthwave</option>
                <option value="classical">Classical</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00FFE7]"
            >
              <option value="recent">Recently Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Liked</option>
            </select>
          </div>
        </motion.div>

        {/* NFT Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedNFTs.map((nft) => (
            <motion.div
              key={nft.id}
              whileHover={{ scale: 1.02 }}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => {
                setSelectedNFT(nft)
                setShowNFTDetails(true)
              }}
            >
              {/* NFT Image */}
              <div className="aspect-square bg-[#333] relative overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#00FFE7] rounded-full flex items-center justify-center mb-2">
                      <span className="text-black font-bold">🎵</span>
                    </div>
                    <p className="text-sm">{nft.title}</p>
                  </div>
                </div>

                {/* Rarity Badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium border ${getRarityColor(nft.rarity)}`}>
                  {nft.rarity}
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlay(nft.id)
                    }}
                    className="w-12 h-12 bg-[#00FFE7] rounded-full flex items-center justify-center text-black"
                  >
                    {isPlaying === nft.id ? <Pause size={20} /> : <Play size={20} />}
                  </motion.button>
                </div>
              </div>

              {/* NFT Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{nft.title}</h3>
                  <div className="flex items-center gap-1">
                    <Heart size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">{nft.likes}</span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-2">by {nft.artist}</p>
                <p className="text-gray-400 text-sm mb-3">{nft.genre} • {nft.duration}</p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs">Price</p>
                    <p className="text-[#00FFE7] font-semibold">{nft.price} {nft.currency}</p>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike(nft)
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Heart size={16} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePurchase(nft)
                      }}
                      className="bg-[#00FFE7] text-black px-3 py-1 rounded text-sm font-medium hover:bg-[#00FFE7]/90 transition-colors"
                    >
                      Buy
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* NFT Details Modal */}
        {showNFTDetails && selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
            onClick={() => setShowNFTDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#00FFE7]">{selectedNFT.title}</h2>
                  <button
                    onClick={() => setShowNFTDetails(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NFT Image */}
                  <div className="aspect-square bg-[#333] rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="w-24 h-24 bg-[#00FFE7] rounded-full flex items-center justify-center mb-4">
                        <span className="text-black font-bold text-2xl">🎵</span>
                      </div>
                      <p className="text-lg font-semibold">{selectedNFT.title}</p>
                      <p className="text-sm">by {selectedNFT.artist}</p>
                    </div>
                  </div>

                  {/* NFT Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Artist:</span>
                          <span>{selectedNFT.artist}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Genre:</span>
                          <span>{selectedNFT.genre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration:</span>
                          <span>{selectedNFT.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rarity:</span>
                          <span className={getRarityColor(selectedNFT.rarity)}>{selectedNFT.rarity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Owner:</span>
                          <span className="text-xs">{selectedNFT.owner}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-gray-300 text-sm">{selectedNFT.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Price</h3>
                      <div className="text-2xl font-bold text-[#00FFE7]">
                        {selectedNFT.price} {selectedNFT.currency}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePurchase(selectedNFT)}
                        className="flex-1 bg-[#00FFE7] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#00FFE7]/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={20} />
                        Purchase NFT
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#333] text-white p-3 rounded-lg hover:bg-[#444] transition-colors"
                      >
                        <Share2 size={20} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default NFTMarketplace
