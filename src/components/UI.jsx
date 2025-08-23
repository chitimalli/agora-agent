import { useState } from "react";
import { useChat } from "../hooks/useChat";
import { useAgora } from "../hooks/useAgora";
import Settings from "./Settings";
import { CombinedChat } from "./CombinedChat";
import AgoraProductsPanel from "./AgoraProductsPanel";

export const UI = ({ hidden, currentExpression, setCurrentExpression, currentAnimation, setCurrentAnimation, currentAvatar, setCurrentAvatar, ...props }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  // Panel visibility states - Combined animation panel
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const { isConnected, isJoined, joinChannel, leaveChannel, audioLevel, config, agentId } = useAgora();

  // Available avatars
  const availableAvatars = [
    { name: "Aurora", label: "🌟 Aurora", emoji: "🌟", description: "Elegant & Graceful" },
    { name: "Celeste", label: "✨ Celeste", emoji: "✨", description: "Mystical & Enchanting" },
    { name: "Lyra", label: "🎵 Lyra", emoji: "🎵", description: "Musical & Harmonious" },
  ];

  // Available expressions for the avatar
  const availableExpressions = [
    { name: "default", label: "😐 Default", emoji: "😐" },
    { name: "smile", label: "😊 Smile", emoji: "😊" },
    { name: "surprised", label: "😲 Surprised", emoji: "😲" },
    { name: "funnyFace", label: "🤪 Funny", emoji: "🤪" },
    { name: "sad", label: "😢 Sad", emoji: "😢" },
    { name: "angry", label: "😠 Angry", emoji: "😠" },
    { name: "crazy", label: "🤯 Crazy", emoji: "🤯" },
  ];

  // Combined animations with automatic facial expressions
  const availableAnimations = [
    { 
      name: "Idle", 
      label: "🧘 Idle", 
      emoji: "🧘",
      expression: "default" // Default expression for idle
    },
    { 
      name: "Talking_0", 
      label: "💬 Talking 1", 
      emoji: "💬",
      expression: "default" // Neutral talking
    },
    { 
      name: "Talking_1", 
      label: "🗣️ Talking 2", 
      emoji: "🗣️",
      expression: "smile" // Happy talking
    },
    { 
      name: "Talking_2", 
      label: "💭 Talking 3", 
      emoji: "💭",
      expression: "surprised" // Expressive talking
    },
    { 
      name: "Laughing", 
      label: "😂 Laughing", 
      emoji: "😂",
      expression: "smile" // Happy expression for laughing
    },
    { 
      name: "Crying", 
      label: "😭 Crying", 
      emoji: "😭",
      expression: "sad" // Sad expression for crying
    },
    { 
      name: "Angry", 
      label: "😡 Angry", 
      emoji: "😡",
      expression: "angry" // Angry expression for angry animation
    },
    { 
      name: "Terrified", 
      label: "😨 Terrified", 
      emoji: "😨",
      expression: "surprised" // Surprised/shocked expression for terrified
    },
  ];

  // Function to handle animation selection with automatic expression
  const handleAnimationSelect = (animation) => {
    setCurrentAnimation(animation.name);
    // Automatically set the corresponding facial expression
    setCurrentExpression(animation.expression === "default" ? "" : animation.expression);
    console.log(`🎭 Animation: ${animation.name} → Expression: ${animation.expression}`);
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      {/* Top of Page - Horizontal Avatar Control Panel */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className={`backdrop-blur-md bg-white bg-opacity-50 rounded-lg transition-all duration-300 ${
          showAnimationPanel ? 'max-w-4xl' : 'max-w-fit'
        }`}>
          {!showAnimationPanel ? (
            // Compact horizontal view - emojis in a row
            <div className="flex items-center gap-2 p-2">
              <span className="text-xs font-medium">🎭</span>
              
              {/* Current Avatar indicator */}
              <div className="text-lg bg-blue-500 text-white w-8 h-8 rounded-md flex items-center justify-center" title={`Current Avatar: ${currentAvatar}`}>
                {availableAvatars.find(av => av.name === currentAvatar)?.emoji || "👤"}
              </div>
              
              {availableAnimations.slice(0, 5).map((anim) => (
                <button
                  key={anim.name}
                  onClick={() => handleAnimationSelect(anim)}
                  className={`pointer-events-auto w-8 h-8 rounded-md text-lg transition-colors ${
                    currentAnimation === anim.name
                      ? "bg-purple-500 text-white" 
                      : "bg-white bg-opacity-50 hover:bg-purple-200"
                  }`}
                  title={anim.label}
                >
                  {anim.emoji}
                </button>
              ))}
              <button
                onClick={() => setShowAnimationPanel(true)}
                className="pointer-events-auto text-gray-600 hover:text-gray-800 p-1"
                title="Expand avatar panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          ) : (
            // Expanded horizontal view
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-sm">🎭 Avatar Control Center</h3>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-gray-600 flex gap-3">
                    <span>👤 {currentAvatar}</span>
                    <span>🎬 {currentAnimation || "Auto"}</span>
                    <span>😊 {currentExpression || "default"}</span>
                  </div>
                  <button
                    onClick={() => setShowAnimationPanel(false)}
                    className="pointer-events-auto text-gray-600 hover:text-gray-800 p-1"
                    title="Collapse panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Avatar Selection */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">👤 Choose Avatar:</p>
                  <div className="flex gap-2">
                    {availableAvatars.map((avatar) => (
                      <button
                        key={avatar.name}
                        onClick={() => setCurrentAvatar(avatar.name)}
                        className={`pointer-events-auto p-2 rounded text-xs transition-colors flex-1 ${
                          currentAvatar === avatar.name
                            ? "bg-blue-500 text-white" 
                            : "bg-white bg-opacity-70 hover:bg-blue-200"
                        }`}
                        title={avatar.description}
                      >
                        <div className="text-lg">{avatar.emoji}</div>
                        <div className="text-xs leading-tight">{avatar.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Animations */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">🎬 Animations:</p>
                  <div className="grid grid-cols-4 gap-1">
                    {availableAnimations.map((anim) => (
                      <button
                        key={anim.name}
                        onClick={() => handleAnimationSelect(anim)}
                        className={`pointer-events-auto p-1 rounded text-xs transition-colors ${
                          currentAnimation === anim.name
                            ? "bg-purple-500 text-white" 
                            : "bg-white bg-opacity-70 hover:bg-purple-200"
                        }`}
                        title={anim.label}
                      >
                        <div className="text-sm">{anim.emoji}</div>
                        <div className="text-xs leading-tight">
                          {anim.label.split(' ')[1] || anim.name.slice(0, 4)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Manual expressions */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">😊 Expressions:</p>
                  <div className="grid grid-cols-4 gap-1">
                    {availableExpressions.map((expr) => (
                      <button
                        key={expr.name}
                        onClick={() => setCurrentExpression(expr.name === "default" ? "" : expr.name)}
                        className={`pointer-events-auto w-8 h-8 rounded text-sm transition-colors ${
                          (currentExpression === "" && expr.name === "default") || 
                          currentExpression === expr.name
                            ? "bg-pink-500 text-white" 
                            : "bg-white bg-opacity-50 hover:bg-pink-200"
                        }`}
                        title={expr.label}
                      >
                        {expr.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        {/* Top Section with Title and Settings Button */}
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-4">
              {/* Title Panel with Agora Logo */}
              <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  {/* Agora Logo */}
                  <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 100 100" className="text-blue-600">
                      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1"/>
                      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <circle cx="35" cy="35" r="8" fill="currentColor"/>
                      <circle cx="65" cy="35" r="8" fill="currentColor"/>
                      <circle cx="50" cy="65" r="8" fill="currentColor"/>
                      <path d="M35 35 L65 35 L50 65 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h1 className="font-black text-xl">Agora Agent 🤖</h1>
                  </div>
                </div>
                <button
                  onClick={() => setShowConnectionPanel(!showConnectionPanel)}
                  className="pointer-events-auto text-gray-600 hover:text-gray-800 transition-colors"
                  title={showConnectionPanel ? "Hide connection details" : "Show connection details"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-4 h-4 transition-transform ${showConnectionPanel ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
              <p></p>
              {showConnectionPanel && (
                <div className="mt-2 text-sm space-y-1">
                  <p className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? '🟢 Connected to Agora' : '🔴 Not connected'}
                  </p>
                  <p className="text-gray-600">
                    Channel: <span className="font-mono">{config?.channel || 'ConvoAINPC'}</span>
                  </p>
                  <p className="text-gray-600">
                    ConvoAI UID: <span className="font-mono">{config?.convoAIUid || '8888'}</span>
                  </p>
                  {agentId && (
                    <p className="text-green-600">
                      🤖 Agent Active: <span className="font-mono text-xs">{agentId}</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <p className={`text-xs ${config?.hasCredentials ? 'text-green-600' : 'text-red-600'}`}>
                      {config?.hasCredentials ? '✅' : '❌'} Auth
                    </p>
                    <p className={`text-xs ${config?.hasLLMKey ? 'text-green-600' : 'text-red-600'}`}>
                      {config?.hasLLMKey ? '✅' : '❌'} LLM
                    </p>
                    <p className={`text-xs ${config?.hasTTSKey ? 'text-green-600' : 'text-red-600'}`}>
                      {config?.hasTTSKey ? '✅' : '❌'} TTS
                    </p>
                  </div>
                  <p className="text-blue-600">
                    🎤 Audio Level: {(audioLevel * 100).toFixed(1)}%
                  </p>
                  {/* Connect/Disconnect Button - Now inside AgoraAgent panel */}
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    {!isJoined ? (
                      <button
                        onClick={joinChannel}
                        className="pointer-events-auto bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-full justify-center"
                        title="Connect to ConvoAI Channel"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                          />
                        </svg>
                        Connect
                      </button>
                    ) : (
                      <button
                        onClick={leaveChannel}
                        className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-full justify-center"
                        title="Disconnect from ConvoAI Channel"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5.25 7.5A2.25 2.25 0 017.5 9.75V15a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15V9.75A2.25 2.25 0 013.75 7.5H5.25z"
                          />
                        </svg>
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
          
          {/* Settings Button */}
          <div className="flex gap-2">
            {/* Settings Button (Burger Menu) */}
            <button
              onClick={() => setShowSettings(true)}
              className="pointer-events-auto backdrop-blur-md bg-white bg-opacity-50 p-3 rounded-lg hover:bg-opacity-70 transition-colors"
              title="Configuration Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-gray-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 6h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H4.5m0 6h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H1.5"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Right-side controls */}
        <div className="w-full flex flex-col items-end justify-center gap-4">
          <button
            onClick={() => setCameraZoomed(!cameraZoomed)}
            className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md"
            title={cameraZoomed ? "Zoom Out" : "Zoom In"}
          >
            {cameraZoomed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              const body = document.querySelector("body");
              if (body.classList.contains("greenScreen")) {
                body.classList.remove("greenScreen");
              } else {
                body.classList.add("greenScreen");
              }
            }}
            className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Settings Modal */}
      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      {/* Combined Chat Component */}
      <CombinedChat isConnected={isConnected} />
      
      {/* Agora Products Panel - self-positioned at bottom left above chat */}
      <AgoraProductsPanel />
    </>
  );
};
