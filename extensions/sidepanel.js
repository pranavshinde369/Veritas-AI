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

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      captureAndAnalyze(button);
    });
  });

  if (blockchainBtn) {
    blockchainBtn.addEventListener('click', () => animateButton(blockchainBtn));
  }

  // --- CORE LOGIC ---

  function captureAndAnalyze(clickedButton) {
    buttons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    const toolName = clickedButton.getAttribute('data-tool');
    
    resultsPlaceholder.classList.add('hidden');
    resultsActive.classList.add('show');
    
    if (scanningText) scanningText.style.display = 'block'; 
    resultsStatus.textContent = 'Capturing';
    resultsStatus.className = 'results-status scanning';
    scanningTool.innerHTML = `📸 Taking Screenshot...`;

    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error("Screenshot failed:", chrome.runtime.lastError);
        showError("Screenshot Failed");
        return;
      }
      sendToBrain(toolName, dataUrl);
    });
  }

  async function sendToBrain(toolName, imageBase64) {
    resultsStatus.textContent = 'Analyzing';
    scanningTool.innerHTML = `🧠 Analyzing with Gemini 2.0...<br><small>One moment...</small>`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: toolName,
          content: "User Viewport Screenshot", 
          image_data: imageBase64
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

    const cleanMessage = data.message.replace(/\*\*/g, "");
    
    // --- FORMATTING FIX ---
    // 'white-space: pre-wrap' ensures the bullet points appear on new lines!
    scanningTool.innerHTML = `
      <div style="border-left: 3px solid #00e676; padding-left: 10px; margin-top: 5px;">
        <div style="color: #00e676; font-weight: bold; font-size: 14px; margin-bottom:4px;">✅ Analysis Result</div>
        <div style="color: #e2e8f0; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${cleanMessage}</div>
      </div>
    `;
  }

  function showError(msg) {
    resultsStatus.textContent = 'Error';
    resultsStatus.classList.remove('scanning');
    if (scanningText) scanningText.style.display = 'none';
    scanningTool.innerHTML = `<div style="color: #ef4444; font-weight: bold;">❌ ${msg}</div>`;
  }

  function animateButton(btn) {
    btn.style.transform = "scale(0.95)";
    setTimeout(() => btn.style.transform = "scale(1)", 150);
  }
});