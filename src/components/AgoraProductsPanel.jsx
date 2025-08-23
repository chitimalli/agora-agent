import React, { useState } from 'react';

const AgoraProductsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('core');

  const products = {
    core: [
      {
        name: "Conversational AI Engine",
        description: "Build voice AI agents and integrate into your app",
        url: "https://www.agora.io/en/products/conversational-ai-engine/",
        icon: "🤖",
        badge: "Beta"
      },
      {
        name: "Voice Calling",
        description: "Embed real-time voice chat into any app",
        url: "https://www.agora.io/en/products/voice-call/",
        icon: "🎙️"
      },
      {
        name: "Video Calling", 
        description: "Embed real-time video calling anywhere",
        url: "https://www.agora.io/en/products/video-call/",
        icon: "📹"
      },
      {
        name: "Interactive Live Streaming",
        description: "Ultra-low latency live streaming",
        url: "https://www.agora.io/en/products/interactive-live-streaming/",
        icon: "📺"
      },
      {
        name: "Chat",
        description: "Create customized messaging experiences", 
        url: "https://www.agora.io/en/products/chat/",
        icon: "💬"
      },
      {
        name: "Interactive Whiteboard",
        description: "Custom real-time digital whiteboard",
        url: "https://www.agora.io/en/products/interactive-whiteboard/",
        icon: "📝"
      }
    ],
    extensions: [
      {
        name: "AI Noise Suppression",
        description: "Reduce background noise for real-time audio and video",
        url: "https://www.agora.io/en/products/ai-noise-suppression/",
        icon: "🔇"
      },
      {
        name: "3D Spatial Audio",
        description: "Add dynamic, immersive audio to your real-time experience",
        url: "https://www.agora.io/en/products/3d-spatial-audio/",
        icon: "🎧"
      },
      {
        name: "Recording",
        description: "Record audio streams, video streams, and web pages",
        url: "https://www.agora.io/en/products/recording/",
        icon: "⏺️"
      },
      {
        name: "Agora Analytics",
        description: "Monitor, measure, and improve quality of experience",
        url: "https://www.agora.io/en/products/agora-analytics/",
        icon: "📊"
      },
      {
        name: "Extensions Marketplace",
        description: "Integrate powerful features into your app",
        url: "https://www.agora.io/en/extensions-marketplace/",
        icon: "🛒"
      }
    ],
    tools: [
      {
        name: "App Builder",
        description: "The fastest way to integrate real-time engagement without code",
        url: "https://www.agora.io/en/tools/app-builder/",
        icon: "🔧"
      },
      {
        name: "Flexible Classroom",
        description: "Build full-featured virtual classrooms with low code",
        url: "https://www.agora.io/en/tools/flexible-classroom/",
        icon: "🎓"
      },
      {
        name: "Download SDKs",
        description: "Build your vision with Agora's real-time SDKs",
        url: "https://docs.agora.io/en/sdks/",
        icon: "📦"
      }
    ]
  };

  const categories = [
    { key: 'core', label: 'Core Products', icon: '⚡' },
    { key: 'extensions', label: 'Extensions', icon: '🧩' },
    { key: 'tools', label: 'Tools', icon: '🛠️' }
  ];

  return (
    <>
      {/* Floating Button - positioned bottom left above chat */}
      <div className="fixed bottom-20 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
            isOpen 
              ? 'bg-blue-600 text-white rotate-45' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
          }`}
          title="Explore Agora Products"
        >
          <div className="flex items-center justify-center w-full h-full">
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )}
          </div>
          
          {/* Pulse animation when closed */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"></div>
          )}
        </button>
      </div>

      {/* Products Panel - positioned from bottom left */}
      {isOpen && (
        <div className="fixed bottom-32 left-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 max-h-[70vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center space-x-2">
              <img 
                src="https://www.agora.io/favicon.ico" 
                alt="Agora" 
                className="w-6 h-6"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <h3 className="text-lg font-bold">Agora Products</h3>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Explore real-time engagement solutions
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activeCategory === category.key
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {products[activeCategory].map((product, index) => (
              <a
                key={index}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all duration-200 transform hover:scale-[1.02] group"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {product.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600">
                        {product.name}
                      </h4>
                      {product.badge && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <svg 
                    className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <a
                href="https://www.agora.io/en/products/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Products →
              </a>
              <a
                href="https://sso.agora.io/en/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
              >
                Get Started For Free here
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AgoraProductsPanel;
