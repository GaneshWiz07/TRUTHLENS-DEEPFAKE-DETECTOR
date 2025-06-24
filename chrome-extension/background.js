// Background script for TruthLens Chrome Extension

let API_BASE_URL = 'https://fascinating-palmier-5bfe94.netlify.app'; // Default to production
let API_TOKEN = '';

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'truthlens-detector',
    title: 'Scan with TruthLens',
    contexts: ['image', 'video']
  });

  // Load saved settings
  chrome.storage.sync.get(['apiToken', 'apiBaseUrl'], (result) => {
    if (result.apiToken) {
      API_TOKEN = result.apiToken;
    }
    if (result.apiBaseUrl) {
      API_BASE_URL = result.apiBaseUrl;
    } else {
      // Set default URL if not configured
      API_BASE_URL = 'https://fascinating-palmier-5bfe94.netlify.app';
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'truthlens-detector') {
    if (!API_TOKEN) {
      // Show popup to set API token
      chrome.action.openPopup();
      return;
    }

    // Get the media URL
    const mediaUrl = info.srcUrl;
    if (mediaUrl) {
      analyzeMedia(mediaUrl, tab.id);
    }
  }
});

// Analyze media function
async function analyzeMedia(mediaUrl, tabId) {
  try {
    // Show loading notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.svg',
      title: 'TruthLens',
      message: 'Analyzing media... Please wait.'
    });

    // Download the media file
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error('Failed to download media');
    }

    const blob = await response.blob();
    const fileName = getFileNameFromUrl(mediaUrl);
    
    // Create FormData for API call
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('analysis_type', 'media');

    // Make API call to analyze
    const analysisResponse = await fetch(`${API_BASE_URL}/functions/v1/api-analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: formData
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Analysis failed:', errorText);
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }

    const result = await analysisResponse.json();
    
    // Show result notification
    const isDeepfake = result.result === 'deepfake';
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.svg',
      title: `TruthLens - ${isDeepfake ? 'DEEPFAKE' : 'AUTHENTIC'}`,
      message: `Confidence: ${result.confidence}% - Click to view details`,
      buttons: [
        { title: 'View Details' },
        { title: 'Dismiss' }
      ]
    });

    // Store result for popup display
    chrome.storage.local.set({
      lastResult: {
        ...result,
        fileName,
        timestamp: new Date().toISOString(),
        sourceUrl: mediaUrl
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.svg',
      title: 'TruthLens - Error',
      message: 'Failed to analyze media. Please check your API token and try again.'
    });
  }
}

// Helper function to extract filename from URL
function getFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'unknown';
    
    // Add extension if missing
    if (!filename.includes('.')) {
      return filename + '.jpg'; // Default to jpg
    }
    
    return filename;
  } catch {
    return 'media-file.jpg';
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.apiToken) {
      API_TOKEN = changes.apiToken.newValue || '';
    }
    if (changes.apiBaseUrl) {
      API_BASE_URL = changes.apiBaseUrl.newValue || 'https://fascinating-palmier-5bfe94.netlify.app';
    }
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open the web app
  chrome.tabs.create({ url: API_BASE_URL });
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // View Details
    chrome.tabs.create({ url: API_BASE_URL });
  }
  chrome.notifications.clear(notificationId);
});