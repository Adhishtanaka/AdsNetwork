// src/app.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const userSessions = require('./data/userSessions');
const AdsNetworkService = require('./services/adsNetworkService');
const AdNotifierService = require('./services/adNotifierService'); // Import new service

// Import command handlers
const authCommands = require('./commands/authCommands');
const adBrowsingCommands = require('./commands/adBrowsingCommands');
const commentCommands = require('./commands/commentCommands');

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

client.on('ready', async () => {
  console.log('\nClient is ready!');
  console.log(`Your WhatsApp buyer bot is online. Backend: ${adsService.BASE_URL}`);
  console.log('Type `!help` in your WhatsApp chat to see available commands.');

  // Initialize and start AdNotifierService
  // IMPORTANT: Replace 'YOUR_ADMIN_WHATSAPP_ID@c.us' with the actual WhatsApp ID where you want to receive new ad notifications.
  // This could be your own WhatsApp ID, or a group chat ID.
  const notificationTargetId = '94710559795@c.us'; // Placeholder: Replace with your actual WhatsApp ID or group ID
  adNotifier = new AdNotifierService(client, adsService, notificationTargetId);
  
  // Start polling immediately - the service will handle initialization internally
  adNotifier.startPolling(5 * 60 * 1000); // Check for new ads every 5 minutes (300000 ms)
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
    // Dispatch commands to appropriate handlers
    switch (command) {
      case '!help':
        // The help message is directly in this file for simplicity
        await replyCallback(`*AdsNetwork Buyer Bot Commands:*

*Authentication:*
\`!login <email> <password> <loc_name> <lat> <lng>\` - Log in to your AdsNetwork account.
\`!profile\` - View your AdsNetwork user profile.
\`!logout\` - Log out from your AdsNetwork account.

*Browsing Advertisements:*
\`!all_ads\` - View all available advertisements.
\`!view_ad <adId>\` - View detailed information for a specific advertisement.
\`!nearby [maxDistance]\` - View advertisements near your location (default: 10km radius).

*Interacting with Advertisements:*
\`!add_comment <adId> <sentiment> <description>\` - Add a comment to an ad (sentiment: good, bad, neutral).
\`!view_comments <adId>\` - View comments for a specific advertisement.
\`!all_comments\` - View all comments across all advertisements.

*Important Notes:*
- Replace spaces in location/description names with underscores (e.g., \`Colombo_City\`, \`Great_product_very_satisfied\`).
- Latitude/Longitude must be numbers.
- Ensure your AdsNetwork backend is running at ${adsService.BASE_URL}.`);
        break;

      // Authentication Commands
      case '!login':
        await authCommands.handleLogin(whatsappId, args, userSessions, adsService, replyCallback);
        break;
      case '!logout':
        await authCommands.handleLogout(whatsappId, userSessions, replyCallback);
        break;
      case '!profile':
        await authCommands.handleProfile(whatsappId, userSessions, adsService, replyCallback);
        break;

      // Advertisement Browsing Commands
      case '!all_ads':
        await adBrowsingCommands.handleAllAds(adsService, replyCallback);
        break;
      case '!view_ad':
        await adBrowsingCommands.handleViewAd(args, adsService, replyCallback);
        break;
      case '!nearby':
        await adBrowsingCommands.handleNearbyAds(whatsappId, args, userSessions, adsService, replyCallback);
        break;

      // Comment Commands
      case '!add_comment':
        await commentCommands.handleAddComment(whatsappId, args, userSessions, adsService, replyCallback);
        break;
      case '!view_comments':
        await commentCommands.handleViewComments(args, adsService, replyCallback);
        break;
      case '!all_comments':
        await commentCommands.handleAllComments(adsService, replyCallback);
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