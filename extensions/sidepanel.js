document.addEventListener('DOMContentLoaded', () => {
  console.log("Veritas AI Sidepanel Loaded");

  const API_URL = "http://127.0.0.1:8000/analyze";

  // DOM Elements
  const buttons = document.querySelectorAll('.action-btn');
  const resultsPlaceholder = document.getElementById('resultsPlaceholder');
  const resultsActive = document.getElementById('resultsActive');
  const resultsStatus = document.getElementById('resultsStatus');
  const scanningTool = document.getElementById('scanningTool');
  const blockchainBtn = document.querySelector('.blockchain-btn');
  const scanningText = document.querySelector('.scanning-text');

  // Add Click Listeners
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      runAnalysis(button);
    });
  });

  if (blockchainBtn) {
    blockchainBtn.addEventListener('click', () => animateButton(blockchainBtn));
  }

  // --- CORE LOGIC (Hybrid Engine) ---

  function runAnalysis(clickedButton) {
    // 1. UI Updates
    buttons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    const toolName = clickedButton.getAttribute('data-tool');
    
    // Show "Processing" UI
    resultsPlaceholder.classList.add('hidden');
    resultsActive.classList.add('show');
    
    if (scanningText) scanningText.style.display = 'block'; 
    resultsStatus.textContent = 'Processing';
    resultsStatus.className = 'results-status scanning';
    scanningTool.innerHTML = `🕵️ Gathering Intelligence...`;

    // 2. Get the Active Tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length === 0) return;
      const activeTabId = tabs[0].id;

      // 3. DECISION MATRIX: Text vs. Vision
      const textTools = ["Legal Decoder", "News Audit", "Sub Tracker"];
      const isTextTool = textTools.includes(toolName);

      if (isTextTool) {
        // STRATEGY A: TEXT ONLY (Faster, accurate for reading)
        chrome.tabs.sendMessage(activeTabId, {action: "extractContent"}, (response) => {
          if (chrome.runtime.lastError || !response) {
            console.warn("Content script not ready. Asking user to refresh.");
            showError("Please refresh the web page and try again.");
            return;
          }
          sendToServer(toolName, response.content, response.url, null);
        });

      } else {
        // STRATEGY B: HYBRID (Vision + Text)
        // Tools: Site Health, Finfluencer Audit, AI Gen or Real
        
        // Step 1: Try to get Text/URL context
        chrome.tabs.sendMessage(activeTabId, {action: "extractContent"}, (textResponse) => {
           // (We ignore errors here; if text fails, we still have the screenshot)
           const txt = textResponse ? textResponse.content : "";
           const url = textResponse ? textResponse.url : "";

           // Step 2: Capture Screenshot
           scanningTool.innerHTML = `📸 Capturing Visuals...`;
           chrome.tabs.captureVisibleTab(null, {format: 'png'}, (imgData) => {
             if (chrome.runtime.lastError) {
               showError("Screenshot Failed");
               return;
             }
             sendToServer(toolName, txt, url, imgData);
           });
        });
      }
    });
  }

  async function sendToServer(toolName, contentText, pageUrl, imageBase64) {
    resultsStatus.textContent = 'Analyzing';
    scanningTool.innerHTML = `🧠 Analyzing with Gemini 2.0...<br><small>One moment...</small>`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: toolName,
          content: contentText || "", // Text Content
          url: pageUrl || "",         // Page URL (for WHOIS)
          image_data: imageBase64     // Screenshot (optional)
        })
      });

      const data = await response.json();

      if (data.status === "error") {
        showError(data.message);
      } else {
        finishScan(data);
      }

    } catch (error) {
      console.error(error);
      showError("Connection Failed. Is Server Running?");
    }
  }

  function finishScan(data) {
    resultsStatus.textContent = 'Complete';
    resultsStatus.classList.remove('scanning');
    
    if (scanningText) scanningText.style.display = 'none';

    // Clean up markdown stars
    const cleanMessage = data.message.replace(/\*\*/g, "");
    
    // Render Result (with Bullet Point Support)
    scanningTool.innerHTML = `
      <div style="border-left: 3px solid #00e676; padding-left: 10px; margin-top: 5px;">
        <div style="color: #00e676; font-weight: bold; font-size: 14px; margin-bottom:4px;">✅ Verdict</div>
        <div style="color: #e2e8f0; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${cleanMessage}</div>
      </div>
    `;
  }

  function showError(msg) {
    resultsStatus.textContent = 'Error';
    resultsStatus.classList.remove('scanning');
    
    if (scanningText) scanningText.style.display = 'none';

    scanningTool.innerHTML = `
      <div style="color: #ef4444; font-weight: bold;">❌ ${msg}</div>
    `;
  }

  function animateButton(btn) {
    btn.style.transform = "scale(0.95)";
    setTimeout(() => btn.style.transform = "scale(1)", 150);
  }
});