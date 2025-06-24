// Popup script for TruthLens Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
  const apiUrlInput = document.getElementById('api-url');
  const apiTokenInput = document.getElementById('api-token');
  const saveButton = document.getElementById('save-settings');
  const statusDiv = document.getElementById('status');
  const pageInfoDiv = document.getElementById('page-info');
  const resultSection = document.getElementById('result-section');
  const lastResultDiv = document.getElementById('last-result');

  // Load saved settings
  const result = await chrome.storage.sync.get(['apiToken', 'apiBaseUrl']);
  if (result.apiToken) {
    apiTokenInput.value = result.apiToken;
  }
  if (result.apiBaseUrl) {
    apiUrlInput.value = result.apiBaseUrl;
  } else {
    apiUrlInput.value = 'https://fascinating-palmier-5bfe94.netlify.app';
  }

  // Load page information
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' });
    
    pageInfoDiv.innerHTML = `
      <strong>${response.title}</strong><br>
      <small>${response.url}</small><br>
      📷 ${response.images} images, 🎥 ${response.videos} videos
    `;
  } catch (error) {
    pageInfoDiv.innerHTML = 'Unable to scan current page';
  }

  // Load last result
  const lastResult = await chrome.storage.local.get(['lastResult']);
  if (lastResult.lastResult) {
    showLastResult(lastResult.lastResult);
  }

  // Save settings
  saveButton.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim();
    const apiToken = apiTokenInput.value.trim();

    if (!apiUrl || !apiToken) {
      showStatus('Please fill in all fields', 'error');
      return;
    }

    try {
      // Test the API connection
      const testResponse = await fetch(`${apiUrl}/functions/v1/api-test`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (testResponse.ok) {
        // Save settings
        await chrome.storage.sync.set({
          apiBaseUrl: apiUrl,
          apiToken: apiToken
        });

        showStatus('Settings saved successfully!', 'success');
      } else {
        const errorData = await testResponse.json().catch(() => ({}));
        showStatus(`Invalid API token or URL: ${errorData.error || 'Connection failed'}`, 'error');
      }
    } catch (error) {
      // Save anyway for offline testing
      await chrome.storage.sync.set({
        apiBaseUrl: apiUrl,
        apiToken: apiToken
      });
      
      showStatus('Settings saved (connection test failed)', 'success');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  }

  function showLastResult(result) {
    const isDeepfake = result.result === 'deepfake';
    const timeAgo = getTimeAgo(new Date(result.timestamp));
    
    lastResultDiv.innerHTML = `
      <div class="result-header">
        <div class="result-status" style="color: ${isDeepfake ? '#ef4444' : '#22c55e'}">
          ${isDeepfake ? '⚠️ DEEPFAKE' : '✅ AUTHENTIC'}
        </div>
        <div class="result-confidence">${result.confidence}%</div>
      </div>
      <div style="font-size: 11px; opacity: 0.8;">
        ${result.fileName} • ${timeAgo}
      </div>
    `;
    
    resultSection.classList.remove('hidden');
  }

  function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
});