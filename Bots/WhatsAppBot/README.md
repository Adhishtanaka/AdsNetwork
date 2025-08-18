# WhatsApp AdsNetwork Bot

A WhatsApp bot client that interfaces with the AdsNetwork API, allowing users to browse advertisements, view details, and interact with content directly through WhatsApp.

## Features

- **Authentication**: Login, logout, and profile management
- **Advertisement Browsing**: View all ads or details of specific ads
- **Interactive Comments**: Add and view comments on advertisements
- **Convenient WhatsApp Interface**: Access all functionality through simple commands

## Available Commands

### Authentication
- `!login <email> <password> <loc_name> <lat> <lng>` - Log in to your AdsNetwork account
- `!profile` - View your AdsNetwork user profile
- `!logout` - Log out from your AdsNetwork account

### Browsing Advertisements
- `!all_ads` - View all available advertisements
- `!view_ad <adId>` - View detailed information for a specific advertisement

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
- The AdsNetwork API endpoint is configured in the `AdsNetworkService` class

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

### Login to AdsNetwork
```
!login user@example.com password123 Colombo_City 6.927079 79.861244
```

### Browse Advertisements
```
!all_ads
```

### View a Specific Advertisement
```
!view_ad 12345
```

### Add a Comment
```
!add_comment 12345 good This_product_is_excellent
```

## Dependencies

- whatsapp-web.js - WhatsApp Web API client
- qrcode-terminal - For displaying QR codes in terminal
- axios (internal) - For API requests
- puppeteer (internal) - For browser automation

## Troubleshooting

- If authentication fails, try deleting the `.wwebjs_auth/` directory and restart the bot
- Ensure your AdsNetwork backend is running and accessible
- For location names or comment descriptions, replace spaces with underscores (e.g., `Colombo_City`)

## Notes

- User sessions are stored in memory and will be lost if the bot is restarted
- The bot requires an active internet connection and WhatsApp account
- Make sure latitude and longitude values are valid numbers