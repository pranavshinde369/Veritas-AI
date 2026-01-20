document.addEventListener('DOMContentLoaded', () => {
  console.log("Veritas AI Sidepanel Loaded");

  // 1. Select DOM elements based on your new HTML classes
  const buttons = document.querySelectorAll('.action-btn');
  const resultsPlaceholder = document.getElementById('resultsPlaceholder');
  const resultsActive = document.getElementById('resultsActive');
  const resultsStatus = document.getElementById('resultsStatus');
  const scanningTool = document.getElementById('scanningTool');
  const blockchainBtn = document.querySelector('.blockchain-btn');

  // 2. Add Click Listeners to Feature Buttons
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      handleScan(button);
    });
  });

  // 3. Add Click Listener to Blockchain Button
  if (blockchainBtn) {
    blockchainBtn.addEventListener('click', () => {
      console.log("[Web3] User requested blockchain save");
      animateButton(blockchainBtn);
    });
  }

  // --- Core Functions ---

  function handleScan(clickedButton) {
    // A. Visual Reset: Remove 'active' class from all buttons
    buttons.forEach(btn => btn.classList.remove('active'));

    // B. Activate the clicked button
    clickedButton.classList.add('active');

    // C. Get the tool name from the HTML data attribute
    const toolName = clickedButton.getAttribute('data-tool');
    console.log(`[User Action] Selected tool: ${toolName}`);

    // D. Update the Results Card UI
    resultsPlaceholder.classList.add('hidden'); // Hide "Select a tool..."
    resultsActive.classList.add('show');        // Show "Scanning..."
    
    // Update text
    resultsStatus.textContent = 'Scanning';
    resultsStatus.className = 'results-status scanning'; // Adds the pulsing dot
    scanningTool.innerHTML = `Running <strong>${toolName}</strong>...`;

    // E. (Temporary) Simulate a scan completing after 2 seconds
    // This proves the logic loop is working before we add Python
    setTimeout(() => {
      finishScan(toolName);
    }, 2000);
  }

  function finishScan(toolName) {
    resultsStatus.textContent = 'Complete';
    resultsStatus.classList.remove('scanning');
    
    // Show a fake result for now
    scanningTool.innerHTML = `
      <div style="color: #00e676; font-weight: bold;">✅ Analysis Complete</div>
      <div style="color: #94a3b8; font-size: 12px; margin-top:4px;">
        Veritas has verified this content. <br>
        <span style="opacity:0.7">Result: Safe</span>
      </div>
    `;
  }

  function animateButton(btn) {
    // Simple click animation for the Web3 button
    btn.style.transform = "scale(0.95)";
    setTimeout(() => btn.style.transform = "scale(1)", 150);
  }
});