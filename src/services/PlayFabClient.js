/**
 * PlayFab Client Service for Agora Token Management
 * 
 * This service uses the official PlayFab SDK to call Cloud Script functions
 * that generate Agora RTC tokens securely from the PlayFab server.
 */

import { PlayFab, PlayFabClient } from 'playfab-sdk';

export class AgoraTokenService {
    constructor(titleId) {
        this.titleId = titleId;
        this.isLoggedIn = false;
        this.playerId = null;
        
        // Configure PlayFab
        PlayFab.settings.titleId = titleId;
        
        console.log(`🎮 PlayFab configured with Title ID: ${titleId}`);
    }

    /**
     * Login to PlayFab with a custom ID
     * @param {string} customId - Unique identifier for the user
     * @param {boolean} createAccount - Whether to create account if it doesn't exist
     */
    async login(customId = null, createAccount = true) {
        return new Promise((resolve, reject) => {
            const loginId = customId || `agora_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            const request = {
                CustomId: loginId,
                CreateAccount: createAccount
            };

            console.log(`🔐 Logging into PlayFab with ID: ${loginId}`);

            PlayFabClient.LoginWithCustomID(request, (result, error) => {
                if (result !== null) {
                    this.isLoggedIn = true;
                    this.playerId = result.data.PlayFabId;
                    console.log('✅ PlayFab login successful');
                    console.log(`👤 Player ID: ${this.playerId}`);
                    resolve({
                        success: true,
                        playerId: this.playerId,
                        sessionTicket: result.data.SessionTicket
                    });
                } else {
                    console.error('❌ PlayFab login failed:', error);
                    reject(new Error(error.errorMessage || 'Login failed'));
                }
            });
        });
    }

    /**
     * Execute a PlayFab Cloud Script function
     * @param {string} functionName - Name of the cloud script function
     * @param {object} functionParameters - Parameters to pass to the function
     */
    async executeCloudScript(functionName, functionParameters = {}) {
        if (!this.isLoggedIn) {
            throw new Error('Not logged in to PlayFab. Call login() first.');
        }

        return new Promise((resolve, reject) => {
            const request = {
                FunctionName: functionName,
                FunctionParameter: functionParameters
            };

            console.log(`☁️ Executing Cloud Script: ${functionName}`);
            console.log(`📤 Parameters:`, functionParameters);

            PlayFabClient.ExecuteCloudScript(request, (result, error) => {
                if (result !== null) {
                    console.log(`✅ Cloud Script executed successfully`);
                    console.log(`📥 Result:`, result.data.FunctionResult);
                    
                    // Check for execution errors
                    if (result.data.Error) {
                        console.error('❌ Cloud Script execution error:', result.data.Error);
                        reject(new Error(result.data.Error.Error || 'Cloud Script execution failed'));
                    } else {
                        resolve(result.data.FunctionResult);
                    }
                } else {
                    console.error('❌ Cloud Script call failed:', error);
                    reject(new Error(error.errorMessage || 'Cloud Script execution failed'));
                }
            });
        });
    }

    /**
     * Generate a token for a user to join a channel
     * @param {string} channelName - Name of the channel to join
     * @param {number} uid - User ID (optional, will be generated if not provided)
     * @param {number} expirationTime - Token expiration time in seconds (default: 3600)
     */
    async generateUserToken(channelName, uid = null, expirationTime = 3600) {
        console.log(`🎫 Generating user token for channel: ${channelName}`);
        
        try {
            const result = await this.executeCloudScript('generateUserToken', {
                channelName,
                uid,
                expirationTime
            });

            if (result.success) {
                console.log('✅ User token generated successfully');
                console.log(`⏰ Token expires in ${result.expiresIn} seconds`);
                return result;
            } else {
                throw new Error(result.error || 'Failed to generate user token');
            }
        } catch (error) {
            console.error('❌ Error generating user token:', error);
            throw error;
        }
    }

    /**
     * Generate a token for an agent to join a channel (expires in 30 seconds)
     * @param {string} channelName - Name of the channel to join (same as user channel)
     * @param {string} agentId - Agent ID (optional, will be generated if not provided)
     */
    async generateAgentToken(channelName, agentId = null) {
        console.log(`🤖 Generating agent token for channel: ${channelName}`);
        
        try {
            const result = await this.executeCloudScript('generateAgentToken', {
                channelName,
                agentId
            });

            if (result.success) {
                console.log('✅ Agent token generated successfully (expires in 30 seconds)');
                console.log(`🔑 Agent ID: ${result.agentId}`);
                return result;
            } else {
                throw new Error(result.error || 'Failed to generate agent token');
            }
        } catch (error) {
            console.error('❌ Error generating agent token:', error);
            throw error;
        }
    }

    /**
     * Generate a custom token with specific parameters
     * @param {string} channelName - Name of the channel to join
     * @param {number} uid - User ID (optional)
     * @param {string} role - Role: "PUBLISHER" or "SUBSCRIBER" (default: "PUBLISHER")
     * @param {number} expirationTime - Token expiration time in seconds (default: 3600, max: 86400)
     */
    async generateCustomToken(channelName, uid = null, role = "PUBLISHER", expirationTime = 3600) {
        console.log(`🎫 Generating custom token for channel: ${channelName}, role: ${role}`);
        
        try {
            const result = await this.executeCloudScript('generateCustomToken', {
                channelName,
                uid,
                role,
                expirationTime
            });

            if (result.success) {
                console.log('✅ Custom token generated successfully');
                console.log(`👤 UID: ${result.uid}, Role: ${result.role}`);
                return result;
            } else {
                throw new Error(result.error || 'Failed to generate custom token');
            }
        } catch (error) {
            console.error('❌ Error generating custom token:', error);
            throw error;
        }
    }

    /**
     * Validate PlayFab Cloud Script configuration
     */
    async validateConfig() {
        console.log('🔍 Validating PlayFab Cloud Script configuration...');
        
        try {
            const result = await this.executeCloudScript('validateTokenConfig');

            if (result.success) {
                console.log('✅ Configuration validation completed');
                console.log(`🔧 Configuration status:`, result.config);
                
                if (!result.config.isConfigured) {
                    console.warn('⚠️ Agora credentials not properly configured in Cloud Script');
                }
                
                return result;
            } else {
                throw new Error(result.error || 'Failed to validate configuration');
            }
        } catch (error) {
            console.error('❌ Error validating configuration:', error);
            throw error;
        }
    }
}

/**
 * High-level Agora Token Manager that simplifies token operations
 */
export class AgoraTokenManager {
    constructor(playFabTitleId) {
        this.tokenService = new AgoraTokenService(playFabTitleId);
        this.isInitialized = false;
    }

    /**
     * Initialize the token manager by logging into PlayFab
     * @param {string} userId - Custom user identifier (optional)
     */
    async initialize(userId = null) {
        try {
            console.log('🚀 Initializing Agora Token Manager...');
            
            await this.tokenService.login(userId);
            
            // Validate the server configuration
            const configResult = await this.tokenService.validateConfig();
            
            if (!configResult.config.isConfigured) {
                console.warn('⚠️ Warning: PlayFab Cloud Script is not properly configured with Agora credentials');
                console.warn('Please update the Cloud Script with your Agora App ID and App Certificate');
            }
            
            this.isInitialized = true;
            console.log('✅ Agora Token Manager initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Agora Token Manager:', error);
            return false;
        }
    }

    /**
     * Get a user token for joining a channel
     * @param {string} channelName - Channel name (same for user and agent)
     * @param {number} uid - User ID (optional)
     * @param {number} expirationTime - Token expiration in seconds (default: 1 hour)
     */
    async getUserToken(channelName, uid = null, expirationTime = 3600) {
        this._ensureInitialized();
        return await this.tokenService.generateUserToken(channelName, uid, expirationTime);
    }

    /**
     * Get an agent token for joining a channel (30-second expiration)
     * @param {string} channelName - Channel name (same as user channel)
     * @param {string} agentId - Agent ID (optional)
     */
    async getAgentToken(channelName, agentId = null) {
        this._ensureInitialized();
        return await this.tokenService.generateAgentToken(channelName, agentId);
    }

    /**
     * Get a custom token with specific parameters
     * @param {string} channelName - Channel name
     * @param {number} uid - User ID (optional)
     * @param {string} role - "PUBLISHER" or "SUBSCRIBER"
     * @param {number} expirationTime - Expiration time in seconds
     */
    async getCustomToken(channelName, uid = null, role = "PUBLISHER", expirationTime = 3600) {
        this._ensureInitialized();
        return await this.tokenService.generateCustomToken(channelName, uid, role, expirationTime);
    }

    /**
     * Check if the token manager is initialized
     */
    _ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Token manager not initialized. Call initialize() first.');
        }
    }
}

// Example usage:
/*
import { AgoraTokenManager } from './services/PlayFabClient.js';

// Initialize the token manager
const tokenManager = new AgoraTokenManager('YOUR_PLAYFAB_TITLE_ID');
await tokenManager.initialize();

// Generate tokens
const userToken = await tokenManager.getUserToken('my-channel-123');
const agentToken = await tokenManager.getAgentToken('my-channel-123');

console.log('User Token:', userToken.token);
console.log('Agent Token:', agentToken.token);
*/
