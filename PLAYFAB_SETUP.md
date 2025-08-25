# PlayFab Agora Token Generation Setup Guide

This guide explains how to set up and use PlayFab Cloud Script for secure server-side Agora token generation using the official PlayFab SDK.

## 📋 Overview

The PlayFab integration provides:

1. **Secure Server-Side Token Generation**: All Agora tokens are generated in PlayFab Cloud Script
2. **User Tokens**: Long-lived tokens for regular users (default: 1 hour)
3. **Agent Tokens**: Short-lived tokens for AI agents (30 seconds as requested)
4. **Official PlayFab SDK**: Uses the official `playfab-sdk` npm package for client communication

## 🚀 Setup Instructions

### Step 1: Install PlayFab SDK

You've already installed the PlayFab SDK:
```bash
npm install playfab-sdk
```

### Step 2: PlayFab Account Setup

1. **Create PlayFab Account**
   - Go to [PlayFab Developer Portal](https://developer.playfab.com/)
   - Create a new account or sign in
   - Create a new Title (game/application)
   - Note your **Title ID** (found in Settings > General)

### Step 3: Upload Cloud Script to PlayFab

1. **Access Cloud Script Editor**
   - In PlayFab Game Manager, go to **Automation** → **Cloud Script**
   - Click **Upload new Revision**

2. **Upload the PlayFab Service**
   - Copy the entire contents of `src/services/PlayFabService.js`
   - Paste it into the Cloud Script editor
   - **⚠️ CRITICAL**: Update the Agora credentials at the top:
     ```javascript
     const AGORA_APP_ID = "your_actual_agora_app_id";
     const AGORA_APP_CERTIFICATE = "your_actual_agora_app_certificate";
     ```

3. **Deploy the Script**
   - Click **Save as Revision**
   - Make the revision **Live**

### Step 4: Get Agora Credentials

1. **Agora Console**
   - Go to [Agora Console](https://console.agora.io/)
   - Create a project or use existing one
   - Enable the RTC service
   - Get your **App ID** and **App Certificate**
   - Update the PlayFab Cloud Script with these credentials

## 📖 Client Integration

### Basic Setup

```javascript
import { AgoraTokenManager } from './services/PlayFabClient.js';

// Initialize with your PlayFab Title ID
const tokenManager = new AgoraTokenManager('YOUR_PLAYFAB_TITLE_ID');

// Initialize the service (this logs into PlayFab)
await tokenManager.initialize();
```

### Generate User Token

```javascript
// Generate a token for a user to join a channel (1 hour expiration)
const channelName = 'my-channel-123';
const userToken = await tokenManager.getUserToken(channelName);

console.log('User Token:', userToken);
// Output:
// {
//   success: true,
//   token: "006ICAgI...",
//   channelName: "my-channel-123",
//   uid: 123456,
//   role: "PUBLISHER",
//   expiresIn: 3600,
//   expirationTimestamp: 1693123456,
//   generatedAt: 1693119856
// }
```

### Generate Agent Token (30-second expiration)

```javascript
// Generate a short-lived token for an AI agent
const agentToken = await tokenManager.getAgentToken(channelName);

console.log('Agent Token:', agentToken);
// Output:
// {
//   success: true,
//   token: "006ICAgI...",
//   channelName: "my-channel-123",
//   agentId: "agent_789",
//   role: "PUBLISHER",
//   expiresIn: 30,
//   expirationTimestamp: 1693119886,
//   generatedAt: 1693119856
// }
```

## 🔧 Integration with Existing Agora Code

### Update Your useAgora Hook

```javascript
// In your useAgora.jsx hook
import { useState, useEffect } from 'react';
import { AgoraTokenManager } from '../services/PlayFabClient.js';
import AgoraRTC from 'agora-rtc-sdk-ng';

const useAgora = () => {
    const [tokenManager, setTokenManager] = useState(null);
    const [agoraEngine, setAgoraEngine] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    useEffect(() => {
        const initServices = async () => {
            // Initialize PlayFab token manager
            const manager = new AgoraTokenManager('YOUR_PLAYFAB_TITLE_ID');
            await manager.initialize();
            setTokenManager(manager);
            
            // Initialize Agora engine
            const engine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
            setAgoraEngine(engine);
        };
        
        initServices().catch(console.error);
    }, []);

    const joinChannel = async (channelName) => {
        if (!tokenManager || !agoraEngine) {
            throw new Error('Services not initialized');
        }
        
        try {
            console.log(`🚀 Joining channel: ${channelName}`);
            
            // Generate user token from PlayFab
            const userTokenData = await tokenManager.getUserToken(channelName);
            
            // Join the channel with the generated token
            await agoraEngine.join(
                userTokenData.token,
                channelName,
                userTokenData.uid
            );
            
            setIsConnected(true);
            console.log('✅ Successfully joined channel');
            
            // If you need an agent token for AI functionality
            const agentTokenData = await tokenManager.getAgentToken(channelName);
            console.log('🤖 Agent token available:', agentTokenData.token);
            
            return {
                userToken: userTokenData,
                agentToken: agentTokenData
            };
            
        } catch (error) {
            console.error('❌ Failed to join channel:', error);
            throw error;
        }
    };
    
    const leaveChannel = async () => {
        if (agoraEngine) {
            await agoraEngine.leave();
            setIsConnected(false);
            console.log('👋 Left channel');
        }
    };
    
    return { 
        joinChannel, 
        leaveChannel, 
        isConnected, 
        tokenManager,
        agoraEngine 
    };
};

export default useAgora;
```

### Example Usage in Component

```javascript
// In your component
import useAgora from '../hooks/useAgora';

const MyComponent = () => {
    const { joinChannel, leaveChannel, isConnected } = useAgora();
    
    const handleJoinChannel = async () => {
        try {
            const tokens = await joinChannel('my-channel-123');
            console.log('Got tokens:', tokens);
        } catch (error) {
            console.error('Failed to join:', error);
        }
    };
    
    return (
        <div>
            {!isConnected ? (
                <button onClick={handleJoinChannel}>Join Channel</button>
            ) : (
                <button onClick={leaveChannel}>Leave Channel</button>
            )}
        </div>
    );
};
```

## 🛡️ Security Features

### Server-Side Token Generation
- All Agora credentials are stored securely in PlayFab Cloud Script
- Client never has access to sensitive App ID or App Certificate
- Tokens are generated with proper expiration times

### Token Expiration
- **User Tokens**: Default 1 hour (configurable up to 24 hours)
- **Agent Tokens**: Fixed 30 seconds (as per your requirement)
- **Custom Tokens**: Configurable with security limits

## 🔍 Testing & Validation

### Validate Configuration

```javascript
// Check if PlayFab Cloud Script is properly configured
try {
    const configResult = await tokenManager.tokenService.validateConfig();
    console.log('Configuration:', configResult.config);
    
    if (configResult.config.isConfigured) {
        console.log('✅ PlayFab is properly configured');
    } else {
        console.warn('⚠️ Please set Agora credentials in Cloud Script');
    }
} catch (error) {
    console.error('❌ Configuration check failed:', error);
}
```

### Error Handling

```javascript
try {
    const token = await tokenManager.getUserToken('test-channel');
    console.log('✅ Token generated:', token);
} catch (error) {
    console.error('❌ Token generation failed:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('not configured')) {
        // Show setup instructions
    } else if (error.message.includes('not logged in')) {
        // Re-initialize the service
    }
}
```

## 📋 Available Cloud Script Functions

Your PlayFab Cloud Script provides these functions:

1. **`generateUserToken`**
   - Purpose: Generate tokens for regular users
   - Parameters: `{ channelName, uid?, expirationTime? }`
   - Default expiration: 1 hour

2. **`generateAgentToken`**
   - Purpose: Generate short-lived tokens for AI agents
   - Parameters: `{ channelName, agentId? }`
   - Fixed expiration: 30 seconds

3. **`generateCustomToken`**
   - Purpose: Generate tokens with custom parameters
   - Parameters: `{ channelName, uid?, role?, expirationTime? }`
   - Max expiration: 24 hours

4. **`validateTokenConfig`**
   - Purpose: Check if Cloud Script is properly configured
   - Parameters: None
   - Returns: Configuration status

## 🚨 Important Notes

### Production Deployment

1. **Secure Credentials**: Never commit your actual Agora App ID and Certificate to version control
2. **Environment Variables**: Consider using PlayFab Title Data for storing credentials
3. **Rate Limiting**: Monitor token generation requests to prevent abuse
4. **Logging**: Use PlayFab logs to monitor token generation and errors

### File Organization

- **`src/services/PlayFabService.js`**: Cloud Script for manual upload to PlayFab (version controlled)
- **`src/services/PlayFabClient.js`**: Client-side service using official PlayFab SDK
- **No local token generation**: All token creation happens server-side for security

## 🔗 Useful Links

- [PlayFab Documentation](https://docs.microsoft.com/en-us/gaming/playfab/)
- [PlayFab SDK for JavaScript](https://github.com/PlayFab/JavaScriptSDK)
- [Agora Token Authentication](https://docs.agora.io/en/video-calling/develop/authentication-workflow)
- [Agora Console](https://console.agora.io/)

## 🆘 Troubleshooting

### Common Issues

1. **"Token manager not initialized"**
   - Ensure you call `await tokenManager.initialize()` before using token functions

2. **"Server configuration error: Agora credentials not set"**
   - Update the Cloud Script with your actual Agora App ID and Certificate
   - Make sure the revision is deployed as Live

3. **"Cloud Script execution failed"**
   - Check PlayFab Game Manager > Automation > Cloud Script > Logs for errors
   - Verify your PlayFab Title ID is correct

4. **Import errors with PlayFab SDK**
   - Ensure `playfab-sdk` is properly installed
   - Check that imports match your module system (ES6 vs CommonJS)

### Debugging

1. **Check PlayFab Logs**
   - Go to Game Manager > Automation > Cloud Script > Logs
   - Look for execution errors and debug information

2. **Validate Configuration**
   - Call `validateTokenConfig` function to check server setup
   - Verify credentials are properly set in Cloud Script

3. **Test Token Generation**
   - Start with simple user token generation
   - Check token format and expiration times
