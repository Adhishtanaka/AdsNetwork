// src/app.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const userSessions = require('./data/userSessions');
const AdsNetworkService = require('./services/adsNetworkService');
const AdNotifierService = require('./services/adNotifierService');
const AdBoosterService = require('./services/adBoosterService'); // Import new booster service

// Import command handlers
const adBrowsingCommands = require('./commands/adBrowsingCommands');

const adsService = new AdsNetworkService(); // Initialize the API service

console.log('Initializing WhatsApp buyer bot...');

// Initialize the WhatsApp client with session storage
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'whatsapp-ads-buyer-bot' // Unique ID for this bot's session
  }),
  puppeteer: {
    executablePath: "/usr/bin/google-chrome", // Verify this path on your system
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--window-size=1280,720",
    ],
    defaultViewport: null,
  }
});

// Add a state manager to track users awaiting location
const userStates = new Map();

// --- WhatsApp Client Event Handlers ---

client.on('qr', (qr) => {
  console.log('\nQR RECEIVED! Scan this QR code with your phone:');
  qrcode.generate(qr, { small: true }); // Display QR code in the terminal
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED! Your session is now saved.');
});

client.on('auth_failure', msg => {
  console.error('AUTHENTICATION FAILURE!', msg);
  // In a production environment, you might want to:
  // 1. Delete the session file (`.wwebjs_auth/`) and restart the bot.
  // 2. Send an alert to an admin.
});

let adNotifier; // Declare adNotifier outside client.on('ready') scope
let adBooster; // Declare adBooster outside client.on('ready') scope

client.on('ready', async () => {
  console.log('\nClient is ready!');
  console.log(`Your WhatsApp buyer bot is online. Backend: ${adsService.BASE_URL}`);
  console.log('Type `!help` in your WhatsApp chat to see available commands.');

  // Initialize and start AdNotifierService
  // IMPORTANT: Replace 'YOUR_ADMIN_WHATSAPP_ID@c.us' with the actual WhatsApp ID where you want to receive new ad notifications.
  // This could be your own WhatsApp ID, or a group chat ID.
  const notificationTargetId = '120363420900072728@newsletter'; // Placeholder: Replace with your actual WhatsApp ID or Channel ID
  adNotifier = new AdNotifierService(client, adsService, notificationTargetId);
  
  // Start polling immediately - the service will handle initialization internally
  adNotifier.startPolling(5 * 60 * 1000); // Check for new ads every 5 minutes (300000 ms)
  
  // Initialize and start AdBoosterService
  adBooster = new AdBoosterService(client, adsService, notificationTargetId);
  adBooster.startPolling(1 * 60 * 1000); // Check for non-boosted ads every 1 minutes
});

client.on('disconnected', (reason) => {
  console.log('Client was disconnected:', reason);
  // When the bot disconnects, clear any stored user sessions (optional, depends on persistence needs)
  if (client.info && client.info.wid && client.info.wid._serialized) {
    // Attempt to clear the session associated with the bot's own WhatsApp ID
    // (This might not always be necessary or accurate if multiple users connect to the same bot instance)
    // For a single-user bot, client.info.wid is its own ID.
    userSessions.deleteSession(client.info.wid._serialized);
  }
  if (adNotifier) {
    adNotifier.stopPolling(); // Stop polling when disconnected
  }
  if (adBooster) {
    adBooster.stopPolling(); // Stop ad boosting when disconnected
  }
  console.log('Bot disconnected. Please restart the script (`node src/app.js`) to re-connect.');
});

// --- Main Message Handler ---

client.on('message', async (msg) => {
  // Function to send a reply back to the chat for consistent usage in handlers,
  // directly calling client.sendMessage and ensuring chat ID is a string.
  const replyCallback = async (message, media = null) => {
    if (media) {
      return await client.sendMessage(String(msg.from), media, { caption: message });
    } else {
      return await client.sendMessage(String(msg.from), message);
    }
  };

  const whatsappId = msg.from; // The WhatsApp ID of the user sending the message
  const commandBody = msg.body.trim();
  const command = commandBody.split(' ')[0].toLowerCase(); // e.g., "!login"
  const args = commandBody.split(' ').slice(1); // e.g., ["user@example.com", "pass", ...]

  console.log(`[RECEIVED] From: ${whatsappId}, Command: ${command}, Args: ${args.join(' ')}`);

  try {
    // Check if this is a location response for a pending nearby request
    if (msg.type === 'location' && userStates.has(whatsappId) && userStates.get(whatsappId).awaitingLocation) {
      const { extractLocationFromMessage } = require('./utils/helpers');
      const location = await extractLocationFromMessage(msg);
      console.log(`[DEBUG] Received location from ${whatsappId}:`, location);
      
      if (location) {
        const userState = userStates.get(whatsappId);
        await adBrowsingCommands.processNearbyAdsWithLocation(
          location.latitude,
          location.longitude, 
          userState.maxDistance,
          adsService,
          replyCallback
        );
        userStates.delete(whatsappId); // Clear the state
      } else {
        await replyCallback("❌ Could not read your location. Please try sharing your location again or use the !location command.");
      }
      return;
    }
    
    // Check for manual location input
    if (command === '!location' && userStates.has(whatsappId) && userStates.get(whatsappId).awaitingLocation) {
      if (args.length < 2) {
        await replyCallback("❌ Invalid location format. Please use: !location <latitude> <longitude>");
        return;
      }
      
      const latitude = parseFloat(args[0]);
      const longitude = parseFloat(args[1]);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        await replyCallback("❌ Invalid coordinates. Latitude and longitude must be valid numbers.");
        return;
      }
      
      const userState = userStates.get(whatsappId);
      await adBrowsingCommands.processNearbyAdsWithLocation(
        latitude,
        longitude, 
        userState.maxDistance,
        adsService,
        replyCallback
      );
      userStates.delete(whatsappId); // Clear the state
      return;
    }

    // Dispatch commands to appropriate handlers
    switch (command) {
      case '!help':
        // The help message is directly in this file for simplicity
        await replyCallback(`*📱 Agriලංකා Buyer Bot Commands 📱*

      *🔍 Browsing Advertisements:*
      • \`!all\` - View all available advertisements
      • \`!view <adId>\` - View detailed information for a specific ad
      • \`!nearby [maxDistance]\` - Find ads near your location (default: 10km radius)
      • \`!search <keyword(s)>\` - Search for ads with specific keywords

      _Type any command to get started!_`);
        break;

      // Advertisement Browsing Commands
      case '!all':
        await adBrowsingCommands.handleAllAds(adsService, replyCallback);
        break;
      case '!view':
        await adBrowsingCommands.handleViewAd(args, adsService, replyCallback);
        break;
      case '!nearby':
        const nearbyResult = await adBrowsingCommands.handleNearbyAds(whatsappId, args, userSessions, adsService, replyCallback);
        if (nearbyResult && nearbyResult.awaitingLocation) {
          userStates.set(whatsappId, nearbyResult);
        }
        break;
      case '!search':
        await adBrowsingCommands.handleSearchAds(args, adsService, replyCallback);
        break;

      default:
        // If the message starts with '!' but is not a recognized command
        if (command.startsWith('!')) {
          await replyCallback(`Unknown command: \`${command}\`. Type \`!help\` for a list of commands.`);
        }
        // If it's a regular chat message, the bot can ignore it or have other behaviors
        break;
    }
  } catch (error) {
    // Catch any unhandled errors from the command handlers
    console.error(`[CRITICAL ERROR] Failed to process message from ${whatsappId} for command ${command}:`, error);
    await replyCallback(`An unexpected error occurred while processing your request. Please try again later. Error: ${error.message}`);
  }
});

// Initialize the client to start the WhatsApp Web connection process
client.initialize();