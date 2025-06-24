// Content script for DeepFake Detector Chrome Extension

// Add visual feedback when hovering over images/videos
let hoverTimeout;

document.addEventListener('mouseover', (event) => {
  const target = event.target;
  
  if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
    clearTimeout(hoverTimeout);
    
    hoverTimeout = setTimeout(() => {
      // Add subtle visual indicator
      target.style.outline = '2px solid #3b82f6';
      target.style.outlineOffset = '2px';
      target.title = 'Right-click to scan with DeepFake Detector';
    }, 500);
  }
});

document.addEventListener('mouseout', (event) => {
  const target = event.target;
  
  if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
    clearTimeout(hoverTimeout);
    target.style.outline = '';
    target.style.outlineOffset = '';
    
    // Don't remove title if it was already there
    if (target.title === 'Right-click to scan with DeepFake Detector') {
      target.title = '';
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    const images = document.querySelectorAll('img').length;
    const videos = document.querySelectorAll('video').length;
    
    sendResponse({
      url: window.location.href,
      title: document.title,
      images,
      videos
    });
  }
});