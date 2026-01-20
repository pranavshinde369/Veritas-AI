// extension/content.js
console.log("Veritas AI Extractor Ready");

// Listen for the "extractContent" command from sidepanel.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractContent") {
    
    // 1. Get all visible text from the page
    const rawText = document.body.innerText;
    
    // 2. Clean it up: 
    // - Replace multiple spaces/newlines with a single space
    // - Limit to 20,000 characters (to prevent overloading Gemini)
    const cleanText = rawText.replace(/\s+/g, ' ').trim().substring(0, 20000);

    // 3. Prepare the data payload
    const pageData = {
      url: window.location.href,          // The full link (e.g., https://amazon.com/...)
      domain: window.location.hostname,   // The domain (e.g., amazon.com)
      content: cleanText                  // The readable text
    };

    // 4. Send it back to the Sidepanel
    sendResponse(pageData);
  }
  
  // Important: Return true to keep the message channel open for async responses
  return true;
});