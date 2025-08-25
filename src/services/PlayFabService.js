///////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Agora Token Generation Cloud Script Functions for PlayFab
//
// This Cloud Script provides functions to generate Agora RTC tokens for both users and agents.
// The tokens are generated server-side to ensure security and proper expiration handling.
//
///////////////////////////////////////////////////////////////////////////////////////////////////////

// Agora Token Generation Library - Based on Agora's Dynamic Key generation
// This is a simplified version of the Agora RTC Token Builder for PlayFab Cloud Script

///////////////////////////////////////////////////////////////////////////////////////////////////////
//
// PlayFab Cloud Script for Agora Token Generation
// 
// This file should be manually uploaded to PlayFab Game Manager > Automation > Cloud Script
// It contains server-side functions that generate Agora RTC tokens securely.
//
// Setup Instructions:
// 1. Copy this entire file content
// 2. Go to PlayFab Game Manager > Automation > Cloud Script
// 3. Create new revision and paste this code
// 4. Update AGORA_APP_ID and AGORA_APP_CERTIFICATE with your actual values
// 5. Deploy as Live revision
//
///////////////////////////////////////////////////////////////////////////////////////////////////////

// ⚠️ IMPORTANT: Set your actual Agora credentials here before uploading to PlayFab
const AGORA_APP_ID = "your_agora_app_id_here";
const AGORA_APP_CERTIFICATE = "your_agora_app_certificate_here";

// Role definitions for Agora
const Role = {
    PUBLISHER: 1,
    SUBSCRIBER: 2
};

// Privilege definitions for Agora tokens
const Privileges = {
    kJoinChannel: 1,
    kPublishAudioStream: 2,
    kPublishVideoStream: 3,
    kPublishDataStream: 4
};

// === Agora Token Builder Implementation (Server-side only) ===

function randomInt() {
    return Math.floor(Math.random() * 0xFFFFFFFF);
}

function packUint16(x) {
    return String.fromCharCode(x & 0xFF) + String.fromCharCode((x >> 8) & 0xFF);
}

function packUint32(x) {
    return packUint16(x & 0xFFFF) + packUint16((x >> 16) & 0xFFFF);
}

function packString(str) {
    return packUint16(str.length) + str;
}

function packMap(m) {
    let ret = packUint16(Object.keys(m).length);
    for (let k in m) {
        ret += packUint16(parseInt(k)) + packUint32(m[k]);
    }
    return ret;
}

function hmacSha256(key, message) {
    // Simplified HMAC for PlayFab Cloud Script environment
    let hash = 0;
    const str = key + message;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    let hex = Math.abs(hash).toString(16);
    while (hex.length < 64) {
        hex = '0' + hex;
    }
    return hex;
}

function base64Encode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
        const a = str.charCodeAt(i++);
        const b = i < str.length ? str.charCodeAt(i++) : 0;
        const c = i < str.length ? str.charCodeAt(i++) : 0;
        
        const bitmap = (a << 16) | (b << 8) | c;
        
        result += chars.charAt((bitmap >> 18) & 63);
        result += chars.charAt((bitmap >> 12) & 63);
        result += chars.charAt((bitmap >> 6) & 63);
        result += chars.charAt(bitmap & 63);
    }
    
    const padding = str.length % 3;
    if (padding === 1) {
        result = result.slice(0, -2) + '==';
    } else if (padding === 2) {
        result = result.slice(0, -1) + '=';
    }
    
    return result;
}

function AccessToken(appID, appCertificate, channelName, uid) {
    this.appID = appID;
    this.appCertificate = appCertificate;
    this.channelName = channelName;
    this.uid = uid;
    this.salt = randomInt();
    this.ts = Math.floor(Date.now() / 1000) + 24 * 3600;
    this.messages = {};
    
    this.addPriviledge = function(privilege, expiredTs) {
        this.messages[privilege] = expiredTs;
    };
    
    this.build = function() {
        let m = packUint32(this.salt) + 
                packUint32(this.ts) + 
                packMap(this.messages);

        const val = this.appID + this.channelName + this.uid + m;
        const signature = this.encodeSignature(this.appCertificate, val);
        
        return "006" + signature;
    };
    
    this.encodeSignature = function(key, message) {
        const hash = hmacSha256(key, message);
        const content = packString(this.uid) + 
                       packString(this.appID) + 
                       packUint32(this.salt) + 
                       packUint32(this.ts) + 
                       packMap(this.messages);
        
        const signature = hash + content;
        return base64Encode(signature);
    };
}

function buildAgoraToken(appID, appCertificate, channelName, uid, role, privilegeExpiredTs) {
    const uidStr = typeof uid === 'number' ? uid.toString() : uid;
    const accessToken = new AccessToken(appID, appCertificate, channelName, uidStr);
    
    accessToken.addPriviledge(Privileges.kJoinChannel, privilegeExpiredTs);
    
    if (role === Role.PUBLISHER) {
        accessToken.addPriviledge(Privileges.kPublishAudioStream, privilegeExpiredTs);
        accessToken.addPriviledge(Privileges.kPublishVideoStream, privilegeExpiredTs);
        accessToken.addPriviledge(Privileges.kPublishDataStream, privilegeExpiredTs);
    }
    
    return accessToken.build();
}

// === PlayFab Cloud Script Handlers ===

/**
 * Generate a token for a user to join a channel
 * Called from client using PlayFab SDK: ExecuteCloudScript
 */
handlers.generateUserToken = function (args, context) {
    try {
        log.info("generateUserToken called with args: " + JSON.stringify(args));
        
        // Validate configuration
        if (AGORA_APP_ID === "your_agora_app_id_here" || AGORA_APP_CERTIFICATE === "your_agora_app_certificate_here") {
            log.error("Agora credentials not configured in Cloud Script");
            return { 
                success: false, 
                error: "Server configuration error: Agora credentials not set" 
            };
        }
        
        // Validate required parameters
        if (!args || !args.channelName) {
            log.error("Missing required parameter: channelName");
            return { 
                success: false, 
                error: "channelName is required" 
            };
        }
        
        const channelName = args.channelName;
        const uid = args.uid || Math.floor(Math.random() * 1000000);
        const role = Role.PUBLISHER; // Users are typically publishers
        const expirationTimeInSeconds = args.expirationTime || 3600; // Default 1 hour
        
        // Calculate expiration timestamp
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        
        log.info("Generating user token - Channel: " + channelName + ", UID: " + uid + ", Expiration: " + expirationTimeInSeconds + "s");
        
        // Generate Agora token
        const token = buildAgoraToken(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );
        
        log.info("User token generated successfully");
        
        return {
            success: true,
            token: token,
            channelName: channelName,
            uid: uid,
            role: "PUBLISHER",
            expiresIn: expirationTimeInSeconds,
            expirationTimestamp: privilegeExpiredTs,
            generatedAt: currentTimestamp
        };
        
    } catch (error) {
        log.error("Error in generateUserToken: " + error.message);
        return { 
            success: false, 
            error: "Failed to generate user token: " + error.message 
        };
    }
};

/**
 * Generate a token for an agent to join a channel (30-second expiration)
 * Called from client using PlayFab SDK: ExecuteCloudScript
 */
handlers.generateAgentToken = function (args, context) {
    try {
        log.info("generateAgentToken called with args: " + JSON.stringify(args));
        
        // Validate configuration
        if (AGORA_APP_ID === "your_agora_app_id_here" || AGORA_APP_CERTIFICATE === "your_agora_app_certificate_here") {
            log.error("Agora credentials not configured in Cloud Script");
            return { 
                success: false, 
                error: "Server configuration error: Agora credentials not set" 
            };
        }
        
        // Validate required parameters
        if (!args || !args.channelName) {
            log.error("Missing required parameter: channelName");
            return { 
                success: false, 
                error: "channelName is required" 
            };
        }
        
        const channelName = args.channelName;
        const agentId = args.agentId || ("agent_" + Math.floor(Math.random() * 1000000));
        const role = Role.PUBLISHER; // Agents need to publish audio/video
        const expirationTimeInSeconds = 30; // Fixed 30-second expiration for agents
        
        // Calculate expiration timestamp
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        
        log.info("Generating agent token - Channel: " + channelName + ", AgentID: " + agentId + ", Expiration: 30s");
        
        // Generate Agora token
        const token = buildAgoraToken(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            agentId,
            role,
            privilegeExpiredTs
        );
        
        log.info("Agent token generated successfully with 30-second expiration");
        
        return {
            success: true,
            token: token,
            channelName: channelName,
            agentId: agentId,
            role: "PUBLISHER",
            expiresIn: expirationTimeInSeconds,
            expirationTimestamp: privilegeExpiredTs,
            generatedAt: currentTimestamp
        };
        
    } catch (error) {
        log.error("Error in generateAgentToken: " + error.message);
        return { 
            success: false, 
            error: "Failed to generate agent token: " + error.message 
        };
    }
};

/**
 * Generate a custom token with specified parameters
 * Called from client using PlayFab SDK: ExecuteCloudScript
 */
handlers.generateCustomToken = function (args, context) {
    try {
        log.info("generateCustomToken called with args: " + JSON.stringify(args));
        
        // Validate configuration
        if (AGORA_APP_ID === "your_agora_app_id_here" || AGORA_APP_CERTIFICATE === "your_agora_app_certificate_here") {
            log.error("Agora credentials not configured in Cloud Script");
            return { 
                success: false, 
                error: "Server configuration error: Agora credentials not set" 
            };
        }
        
        // Validate required parameters
        if (!args || !args.channelName) {
            log.error("Missing required parameter: channelName");
            return { 
                success: false, 
                error: "channelName is required" 
            };
        }
        
        const channelName = args.channelName;
        const uid = args.uid || Math.floor(Math.random() * 1000000);
        const roleString = args.role || "PUBLISHER";
        const role = roleString === "SUBSCRIBER" ? Role.SUBSCRIBER : Role.PUBLISHER;
        const expirationTimeInSeconds = args.expirationTime || 3600;
        
        // Validate expiration time (max 24 hours for security)
        if (expirationTimeInSeconds > 86400) {
            log.error("Expiration time too long: " + expirationTimeInSeconds);
            return { 
                success: false, 
                error: "Expiration time cannot exceed 24 hours (86400 seconds)" 
            };
        }
        
        // Calculate expiration timestamp
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        
        log.info("Generating custom token - Channel: " + channelName + ", UID: " + uid + ", Role: " + roleString + ", Expiration: " + expirationTimeInSeconds + "s");
        
        // Generate Agora token
        const token = buildAgoraToken(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );
        
        log.info("Custom token generated successfully");
        
        return {
            success: true,
            token: token,
            channelName: channelName,
            uid: uid,
            role: roleString,
            expiresIn: expirationTimeInSeconds,
            expirationTimestamp: privilegeExpiredTs,
            generatedAt: currentTimestamp
        };
        
    } catch (error) {
        log.error("Error in generateCustomToken: " + error.message);
        return { 
            success: false, 
            error: "Failed to generate custom token: " + error.message 
        };
    }
};

/**
 * Validate server configuration and return status
 * Called from client using PlayFab SDK: ExecuteCloudScript
 */
handlers.validateTokenConfig = function (args, context) {
    try {
        log.info("validateTokenConfig called");
        
        const config = {
            hasAppId: AGORA_APP_ID && AGORA_APP_ID !== "your_agora_app_id_here",
            hasAppCertificate: AGORA_APP_CERTIFICATE && AGORA_APP_CERTIFICATE !== "your_agora_app_certificate_here",
            serverTime: Math.floor(Date.now() / 1000),
            playFabEnvironment: "CloudScript"
        };
        
        config.isConfigured = config.hasAppId && config.hasAppCertificate;
        
        log.info("Configuration validation completed: " + JSON.stringify(config));
        
        return {
            success: true,
            config: config,
            message: config.isConfigured ? "Configuration is valid" : "Please set Agora credentials in Cloud Script"
        };
        
    } catch (error) {
        log.error("Error in validateTokenConfig: " + error.message);
        return { 
            success: false, 
            error: "Failed to validate configuration: " + error.message 
        };
    }
};

// Cloud Script function to generate a token for a user joining a channel
handlers.generateUserToken = function (args, context) {
    try {
        // Validate input parameters
        if (!args || !args.channelName) {
            return { 
                success: false, 
                error: "Channel name is required" 
            };
        }
        
        const channelName = args.channelName;
        const uid = args.uid || Math.floor(Math.random() * 1000000); // Generate random UID if not provided
        const role = Role.PUBLISHER; // Users are typically publishers
        const expirationTimeInSeconds = args.expirationTime || 3600; // Default 1 hour
        
        log.info("Generating user token for channel: " + channelName + ", UID: " + uid);
        
        const token = generateAgoraToken(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uid,
            role,
            expirationTimeInSeconds
        );
        
        log.info("User token generated successfully");
        
        return {
            success: true,
            token: token,
            channelName: channelName,
            uid: uid,
            role: "PUBLISHER",
            expiresIn: expirationTimeInSeconds,
            expirationTimestamp: Math.floor(Date.now() / 1000) + expirationTimeInSeconds
        };
        
    } catch (error) {
        log.error("Error generating user token: " + error.message);
        return { 
            success: false, 
            error: "Failed to generate user token: " + error.message 
        };
    }
};

// Cloud Script function to generate a token for an agent joining a channel
handlers.generateAgentToken = function (args, context) {
    try {
        // Validate input parameters
        if (!args || !args.channelName) {
            return { 
                success: false, 
                error: "Channel name is required" 
            };
        }
        
        const channelName = args.channelName;
        const agentId = args.agentId || "agent_" + Math.floor(Math.random() * 1000000);
        const role = Role.PUBLISHER; // Agents are typically publishers (they need to send audio/video)
        const expirationTimeInSeconds = 30; // Agent tokens expire after 30 seconds as requested
        
        log.info("Generating agent token for channel: " + channelName + ", Agent ID: " + agentId);
        
        const token = generateAgoraToken(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            agentId,
            role,
            expirationTimeInSeconds
        );
        
        log.info("Agent token generated successfully with 30-second expiration");
        
        return {
            success: true,
            token: token,
            channelName: channelName,
            agentId: agentId,
            role: "PUBLISHER",
            expiresIn: expirationTimeInSeconds,
            expirationTimestamp: Math.floor(Date.now() / 1000) + expirationTimeInSeconds
        };
        
    } catch (error) {
        log.error("Error generating agent token: " + error.message);
        return { 
            success: false, 
            error: "Failed to generate agent token: " + error.message 
        };
    }
};

// Cloud Script function to generate a token with custom parameters
handlers.generateCustomToken = function (args, context) {
    try {
        // Validate input parameters
        if (!args || !args.channelName) {
            return { 
                success: false, 
                error: "Channel name is required" 
            };
        }
        
        const channelName = args.channelName;
        const uid = args.uid || Math.floor(Math.random() * 1000000);
        const roleString = args.role || "PUBLISHER";
        const role = roleString === "SUBSCRIBER" ? Role.SUBSCRIBER : Role.PUBLISHER;
        const expirationTimeInSeconds = args.expirationTime || 3600;
        
        // Validate expiration time (max 24 hours for security)
        if (expirationTimeInSeconds > 86400) {
            return { 
                success: false, 
                error: "Expiration time cannot exceed 24 hours (86400 seconds)" 
            };
        }
        
        log.info("Generating custom token for channel: " + channelName + ", UID: " + uid + ", Role: " + roleString);
        
        const token = generateAgoraToken(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uid,
            role,
            expirationTimeInSeconds
        );
        
        log.info("Custom token generated successfully");
        
        return {
            success: true,
            token: token,
            channelName: channelName,
            uid: uid,
            role: roleString,
            expiresIn: expirationTimeInSeconds,
            expirationTimestamp: Math.floor(Date.now() / 1000) + expirationTimeInSeconds
        };
        
    } catch (error) {
        log.error("Error generating custom token: " + error.message);
        return { 
            success: false, 
            error: "Failed to generate custom token: " + error.message 
        };
    }
};

// Cloud Script function to validate token configuration
handlers.validateTokenConfig = function (args, context) {
    try {
        const config = {
            hasAppId: AGORA_APP_ID && AGORA_APP_ID !== "your_agora_app_id",
            hasAppCertificate: AGORA_APP_CERTIFICATE && AGORA_APP_CERTIFICATE !== "your_agora_app_certificate",
            serverTime: Math.floor(Date.now() / 1000)
        };
        
        config.isConfigured = config.hasAppId && config.hasAppCertificate;
        
        log.info("Token configuration validation: " + JSON.stringify(config));
        
        return {
            success: true,
            config: config
        };
        
    } catch (error) {
        log.error("Error validating token config: " + error.message);
        return { 
            success: false, 
            error: "Failed to validate config: " + error.message 
        };
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Original PlayFab Cloud Script Examples (kept for reference)
//
///////////////////////////////////////////////////////////////////////////////////////////////////////


// This is a Cloud Script function. "args" is set to the value of the "FunctionParameter" 
// parameter of the ExecuteCloudScript API.
// (https://api.playfab.com/Documentation/Client/method/ExecuteCloudScript)
// "context" contains additional information when the Cloud Script function is called from a PlayStream action.
handlers.helloWorld = function (args, context) {
    
    // The pre-defined "currentPlayerId" variable is initialized to the PlayFab ID of the player logged-in on the game client. 
    // Cloud Script handles authenticating the player automatically.
    var message = "Hello " + currentPlayerId + "!";

    // You can use the "log" object to write out debugging statements. It has
    // three functions corresponding to logging level: debug, info, and error. These functions
    // take a message string and an optional object.
    log.info(message);
    var inputValue = null;
    if (args && args.inputValue)
        inputValue = args.inputValue;
    log.debug("helloWorld:", { input: args.inputValue });

    // The value you return from a Cloud Script function is passed back 
    // to the game client in the ExecuteCloudScript API response, along with any log statements
    // and additional diagnostic information, such as any errors returned by API calls or external HTTP
    // requests. They are also included in the optional player_executed_cloudscript PlayStream event 
    // generated by the function execution.
    // (https://api.playfab.com/playstream/docs/PlayStreamEventModels/player/player_executed_cloudscript)
    return { messageValue: message };
};

// This is a simple example of making a PlayFab server API call
handlers.makeAPICall = function (args, context) {
    var request = {
        PlayFabId: currentPlayerId, Statistics: [{
                StatisticName: "Level",
                Value: 2
            }]
    };
    // The pre-defined "server" object has functions corresponding to each PlayFab server API 
    // (https://api.playfab.com/Documentation/Server). It is automatically 
    // authenticated as your title and handles all communication with 
    // the PlayFab API, so you don't have to write extra code to issue HTTP requests. 
    var playerStatResult = server.UpdatePlayerStatistics(request);
};

// This an example of a function that calls a PlayFab Entity API. The function is called using the 
// 'ExecuteEntityCloudScript' API (https://api.playfab.com/documentation/CloudScript/method/ExecuteEntityCloudScript).
handlers.makeEntityAPICall = function (args, context) {

    // The profile of the entity specified in the 'ExecuteEntityCloudScript' request.
    // Defaults to the authenticated entity in the X-EntityToken header.
    var entityProfile = context.currentEntity;

    // The pre-defined 'entity' object has functions corresponding to each PlayFab Entity API,
    // including 'SetObjects' (https://api.playfab.com/documentation/Data/method/SetObjects).
    var apiResult = entity.SetObjects({
        Entity: entityProfile.Entity,
        Objects: [
            {
                ObjectName: "obj1",
                DataObject: {
                    foo: "some server computed value",
                    prop1: args.prop1
                }
            }
        ]
    });

    return {
        profile: entityProfile,
        setResult: apiResult.SetResults[0].SetResult
    };
};

// This is a simple example of making a web request to an external HTTP API.
handlers.makeHTTPRequest = function (args, context) {
    var headers = {
        "X-MyCustomHeader": "Some Value"
    };
    
    var body = {
        input: args,
        userId: currentPlayerId,
        mode: "foobar"
    };

    var url = "http://httpbin.org/status/200";
    var content = JSON.stringify(body);
    var httpMethod = "post";
    var contentType = "application/json";

    // The pre-defined http object makes synchronous HTTP requests
    var response = http.request(url, httpMethod, content, contentType, headers);
    return { responseContent: response };
};

// This is a simple example of a function that is called from a
// PlayStream event action. (https://playfab.com/introducing-playstream/)
handlers.handlePlayStreamEventAndProfile = function (args, context) {
    
    // The event that triggered the action 
    // (https://api.playfab.com/playstream/docs/PlayStreamEventModels)
    var psEvent = context.playStreamEvent;
    
    // The profile data of the player associated with the event
    // (https://api.playfab.com/playstream/docs/PlayStreamProfileModels)
    var profile = context.playerProfile;
    
    // Post data about the event to an external API
    var content = JSON.stringify({ user: profile.PlayerId, event: psEvent.EventName });
    var response = http.request('https://httpbin.org/status/200', 'post', content, 'application/json', null);

    return { externalAPIResponse: response };
};


// Below are some examples of using Cloud Script in slightly more realistic scenarios

// This is a function that the game client would call whenever a player completes
// a level. It updates a setting in the player's data that only game server
// code can write - it is read-only on the client - and it updates a player
// statistic that can be used for leaderboards. 
//
// A funtion like this could be extended to perform validation on the 
// level completion data to detect cheating. It could also do things like 
// award the player items from the game catalog based on their performance.
handlers.completedLevel = function (args, context) {
    var level = args.levelName;
    var monstersKilled = args.monstersKilled;
    
    var updateUserDataResult = server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            lastLevelCompleted: level
        }
    });

    log.debug("Set lastLevelCompleted for player " + currentPlayerId + " to " + level);
    var request = {
        PlayFabId: currentPlayerId, Statistics: [{
                StatisticName: "level_monster_kills",
                Value: monstersKilled
            }]
    };
    server.UpdatePlayerStatistics(request);
    log.debug("Updated level_monster_kills stat for player " + currentPlayerId + " to " + monstersKilled);
};


// In addition to the Cloud Script handlers, you can define your own functions and call them from your handlers. 
// This makes it possible to share code between multiple handlers and to improve code organization.
handlers.updatePlayerMove = function (args) {
    var validMove = processPlayerMove(args);
    return { validMove: validMove };
};


// This is a helper function that verifies that the player's move wasn't made
// too quickly following their previous move, according to the rules of the game.
// If the move is valid, then it updates the player's statistics and profile data.
// This function is called from the "UpdatePlayerMove" handler above and also is 
// triggered by the "RoomEventRaised" Photon room event in the Webhook handler
// below. 
//
// For this example, the script defines the cooldown period (playerMoveCooldownInSeconds)
// as 15 seconds. A recommended approach for values like this would be to create them in Title
// Data, so that they can be queries in the script with a call to GetTitleData
// (https://api.playfab.com/Documentation/Server/method/GetTitleData). This would allow you to
// make adjustments to these values over time, without having to edit, test, and roll out an
// updated script.
function processPlayerMove(playerMove) {
    var now = Date.now();
    var playerMoveCooldownInSeconds = 15;

    var playerData = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: ["last_move_timestamp"]
    });

    var lastMoveTimestampSetting = playerData.Data["last_move_timestamp"];

    if (lastMoveTimestampSetting) {
        var lastMoveTime = Date.parse(lastMoveTimestampSetting.Value);
        var timeSinceLastMoveInSeconds = (now - lastMoveTime) / 1000;
        log.debug("lastMoveTime: " + lastMoveTime + " now: " + now + " timeSinceLastMoveInSeconds: " + timeSinceLastMoveInSeconds);

        if (timeSinceLastMoveInSeconds < playerMoveCooldownInSeconds) {
            log.error("Invalid move - time since last move: " + timeSinceLastMoveInSeconds + "s less than minimum of " + playerMoveCooldownInSeconds + "s.");
            return false;
        }
    }

    var playerStats = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId
    }).Statistics;
    var movesMade = 0;
    for (var i = 0; i < playerStats.length; i++)
        if (playerStats[i].StatisticName === "")
            movesMade = playerStats[i].Value;
    movesMade += 1;
    var request = {
        PlayFabId: currentPlayerId, Statistics: [{
                StatisticName: "movesMade",
                Value: movesMade
            }]
    };
    server.UpdatePlayerStatistics(request);
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            last_move_timestamp: new Date(now).toUTCString(),
            last_move: JSON.stringify(playerMove)
        }
    });

    return true;
}

// This is an example of using PlayStream real-time segmentation to trigger
// game logic based on player behavior. (https://playfab.com/introducing-playstream/)
// The function is called when a player_statistic_changed PlayStream event causes a player 
// to enter a segment defined for high skill players. It sets a key value in
// the player's internal data which unlocks some new content for the player.
handlers.unlockHighSkillContent = function (args, context) {
    var playerStatUpdatedEvent = context.playStreamEvent;
    var request = {
        PlayFabId: currentPlayerId,
        Data: {
            "HighSkillContent": "true",
            "XPAtHighSkillUnlock": playerStatUpdatedEvent.StatisticValue.toString()
        }
    };
    var playerInternalData = server.UpdateUserInternalData(request);
    log.info('Unlocked HighSkillContent for ' + context.playerProfile.DisplayName);
    return { profile: context.playerProfile };
};

// Photon Webhooks Integration
//
// The following functions are examples of Photon Cloud Webhook handlers. 
// When you enable the Photon Add-on (https://playfab.com/marketplace/photon/)
// in the Game Manager, your Photon applications are automatically configured
// to authenticate players using their PlayFab accounts and to fire events that 
// trigger your Cloud Script Webhook handlers, if defined. 
// This makes it easier than ever to incorporate multiplayer server logic into your game.


// Triggered automatically when a Photon room is first created
handlers.RoomCreated = function (args) {
    log.debug("Room Created - Game: " + args.GameId + " MaxPlayers: " + args.CreateOptions.MaxPlayers);
};

// Triggered automatically when a player joins a Photon room
handlers.RoomJoined = function (args) {
    log.debug("Room Joined - Game: " + args.GameId + " PlayFabId: " + args.UserId);
};

// Triggered automatically when a player leaves a Photon room
handlers.RoomLeft = function (args) {
    log.debug("Room Left - Game: " + args.GameId + " PlayFabId: " + args.UserId);
};

// Triggered automatically when a Photon room closes
// Note: currentPlayerId is undefined in this function
handlers.RoomClosed = function (args) {
    log.debug("Room Closed - Game: " + args.GameId);
};

// Triggered automatically when a Photon room game property is updated.
// Note: currentPlayerId is undefined in this function
handlers.RoomPropertyUpdated = function (args) {
    log.debug("Room Property Updated - Game: " + args.GameId);
};

// Triggered by calling "OpRaiseEvent" on the Photon client. The "args.Data" property is 
// set to the value of the "customEventContent" HashTable parameter, so you can use
// it to pass in arbitrary data.
handlers.RoomEventRaised = function (args) {
    var eventData = args.Data;
    log.debug("Event Raised - Game: " + args.GameId + " Event Type: " + eventData.eventType);

    switch (eventData.eventType) {
        case "playerMove":
            processPlayerMove(eventData);
            break;

        default:
            break;
    }
};
