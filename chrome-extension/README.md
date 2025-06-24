# TruthLens Chrome Extension

A Chrome extension that allows users to right-click on any image or video online and scan it instantly through the TruthLens deepfake detection system.

## Features

- **Right-click Analysis**: Right-click any image or video on any website to scan for deepfakes
- **Instant Results**: Get immediate notifications with analysis results
- **Secure API**: Uses personal API tokens for secure access
- **Visual Feedback**: Hover effects on scannable media
- **Result History**: View your last analysis result in the popup

## Installation Guide

### Step 1: Download the Extension Files

1. Download all the extension files from the `chrome-extension/` folder
2. Create a new folder on your computer called `truthlens-extension`
3. Copy all the extension files into this folder

### Step 2: Install in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select your `truthlens-extension` folder
5. The extension should now appear in your extensions list

### Step 3: Get Your API Token

1. Go to your TruthLens web application at: **https://fascinating-palmier-5bfe94.netlify.app**
2. Sign up or sign in to your account
3. Navigate to the Dashboard tab
4. Find the "API Token" section
5. Copy your API token (click the "Copy" button)

### Step 4: Configure the Extension

1. Click the TruthLens extension icon in Chrome's toolbar
2. In the popup that opens:
   - **API Base URL**: Enter `https://fascinating-palmier-5bfe94.netlify.app`
   - **API Token**: Paste the token you copied from the dashboard
3. Click "Save Settings"
4. You should see a "Settings saved successfully!" message

## How to Use

### Basic Usage

1. **Navigate to any website** with images or videos
2. **Hover over an image or video** - you'll see a blue outline appear
3. **Right-click** on the media you want to analyze
4. **Select "Scan with TruthLens"** from the context menu
5. **Wait for the notification** with your results

### Understanding Results

- **Green notification**: Media appears to be authentic
- **Red notification**: Potential deepfake detected
- **Confidence percentage**: How certain the AI is about its analysis
- **Click notification**: Opens the full web app for detailed results

## Testing the Extension

### Test 1: Basic Setup
1. Verify extension is loaded - Go to `chrome://extensions/` and confirm the extension is enabled
2. Test API connection - Click extension icon, enter settings, click "Save Settings" - Should show "Settings saved successfully!"

### Test 2: Context Menu
1. Go to any website with images (e.g., news sites, social media)
2. Right-click on an image
3. Verify "Scan with TruthLens" appears in context menu

### Test 3: Analysis Flow
1. Right-click an image and select "Scan with TruthLens"
2. Should see "Analyzing media... Please wait." notification
3. After a few seconds, should see result notification
4. Click notification to open web app

### Test 4: Different Media Types
Test with:
- JPEG images
- PNG images  
- MP4 videos (if available)
- Different websites

## Troubleshooting

### Extension Not Loading
- Check if Developer mode is enabled in Chrome extensions
- Verify all files are in the correct folder structure
- Check Chrome's console for error messages (F12 → Console)
- Make sure the icons folder contains the SVG files

### API Connection Issues
- Verify your API token is correct (copy fresh from dashboard)
- Check the API Base URL is exactly: `https://fascinating-palmier-5bfe94.netlify.app`
- Ensure your web app is accessible
- Check browser's Network tab for failed requests

### Context Menu Not Appearing
- Try refreshing the webpage
- Check if the extension has proper permissions
- Verify the extension is enabled in chrome://extensions/

### No Notifications
- Check if Chrome notifications are enabled for the extension
- Try clicking the extension icon to see if there are any error messages
- Check the browser console for JavaScript errors

## File Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for context menus and API calls
├── content.js            # Content script for page interaction
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons (SVG format)
│   ├── icon16.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md             # This file
```

## API Endpoints Used
- `GET /functions/v1/api-test` - Test API token validity
- `POST /functions/v1/api-analyze` - Analyze media files

## Permissions Required
- `contextMenus` - Add right-click menu items
- `activeTab` - Access current tab information
- `storage` - Store API settings
- `notifications` - Show analysis results
- `host_permissions` - Access to your web app domain and media URLs

## Security Notes

- API tokens are stored securely in Chrome's sync storage
- All API calls use HTTPS in production
- No media files are stored locally - only analysis results
- Extension only accesses media when explicitly requested by user

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your API token is valid in the web app dashboard
3. Check Chrome's developer console for error messages
4. Ensure the correct API Base URL is configured: `https://fascinating-palmier-5bfe94.netlify.app`

For additional help, check the extension popup for current page information and last analysis results.

## Configuration Summary

**Correct Settings:**
- **API Base URL**: `https://fascinating-palmier-5bfe94.netlify.app`
- **API Token**: Get from your dashboard at the web app
- **Web App URL**: https://fascinating-palmier-5bfe94.netlify.app

Make sure to use the exact URL above for the API Base URL setting in the extension.