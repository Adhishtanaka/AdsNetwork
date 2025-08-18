# WhatsApp AgriLanka Bot

A WhatsApp bot client that interfaces with the AgriLanka API, allowing users to browse agricultural advertisements, view details, and interact with content directly through WhatsApp.

## Features

- **Authentication**: Login, logout, and profile management
- **Advertisement Browsing**: View all ads or details of specific agricultural products
- **Location-Based Search**: Find advertisements near your location
- **Interactive Comments**: Add and view comments on advertisements
- **Convenient WhatsApp Interface**: Access all functionality through simple commands
- **Ad Notifications**: Receive notifications about new advertisements
- **Ad Boosting**: Automatically identify and boost important advertisements that haven't been promoted

## Available Commands

### Authentication
- `!login <email> <password> <loc_name> <lat> <lng>` - Log in to your AgriLanka account
- `!profile` - View your AgriLanka user profile
- `!logout` - Log out from your AgriLanka account

### Browsing Advertisements
- `!all_ads` - View all available agricultural advertisements
- `!view_ad <adId>` - View detailed information for a specific advertisement
- `!nearby [maxDistance]` - View advertisements near your location (default: 10km radius)
- `!search <keyword(s)>` - Search for ads containing specific keywords in title or description

### Interacting with Advertisements
- `!add_comment <adId> <sentiment> <description>` - Add a comment to an ad (sentiment: good, bad, neutral)
- `!view_comments <adId>` - View comments for a specific advertisement
- `!all_comments` - View all comments across all advertisements

### Help
- `!help` - Display all available commands

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd WhatsAppBot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make sure Google Chrome is installed on your system (used by Puppeteer for WhatsApp Web)

## Configuration

- The bot uses Google Chrome for the WhatsApp Web session. Ensure the path is correct in `src/app.js` (default: `/usr/bin/google-chrome`)
- The AgriLanka API endpoint is configured in the `AdsNetworkService` class in `src/services/adsNetworkService.js`
- Ad notification and boosting services can be configured by changing the polling intervals in `src/app.js`

## Background Services

The bot includes two background services that run automatically:

1. **Ad Notification Service**: Polls the API at regular intervals to check for new advertisements and sends notifications to a configured WhatsApp ID or channel.
   - Default interval: 5 minutes

2. **Ad Boosting Service**: Periodically identifies non-boosted advertisements that should be promoted and automatically boosts them to increase visibility.
   - Default interval: 10 minutes
   - Helps ensure important agricultural products get proper visibility

## Running the Bot

Start the bot with:

```
npm start # or 'node src/app.js'
```

When you first run the bot, a QR code will be displayed in the terminal. Scan this QR code with your WhatsApp mobile app to connect the bot:
1. Open WhatsApp on your phone
2. Tap Menu or Settings and select "Linked Devices"
3. Tap on "Link a Device"
4. Scan the QR code displayed in your terminal

## Usage Examples

### Login to AgriLanka
```
!login farmer@example.com password123 Anuradhapura 8.311339 80.403656
```

### Browse Agricultural Advertisements
```
!all_ads
```

### View a Specific Advertisement
```
!view_ad 12345
```

### Find Nearby Agricultural Products
```
!nearby 5km
```

### Add a Comment
```
!add_comment 12345 good Quality_rice_at_reasonable_price
```

### Search for Agricultural Products
```
!search lettuce
```

## Dependencies

- whatsapp-web.js - WhatsApp Web API client
- qrcode-terminal - For displaying QR codes in terminal
- axios - For API requests to AgriLanka backend
- puppeteer (internal) - For browser automation
- geohash/ngeohash - For location-based searches

## Troubleshooting

- If authentication fails, try deleting the `.wwebjs_auth/` directory and restart the bot
- Ensure your AgriLanka backend is running and accessible
- For location names or comment descriptions, replace spaces with underscores (e.g., `Colombo_City`)
- If ad notifications or boosting don't appear to be working:
  - Check that the notification target ID is correctly configured
  - Verify the bot has proper permissions in the target chat/channel
  - Check server logs for any API connection errors

## Notes

- User sessions are stored in memory and will be lost if the bot is restarted
- The bot requires an active internet connection and WhatsApp account
- Make sure latitude and longitude values are valid numbers
- This bot is designed specifically for connecting farmers and buyers in the agricultural sector
- The ad notification and boosting services will automatically run in the background while the bot is active
- For production deployment, consider implementing persistent storage for user sessions