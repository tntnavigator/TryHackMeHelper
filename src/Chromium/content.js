// Feature: Answer Validation
console.log("TRYHACKME HELPER >>>>  Content script loaded on:", window.location.href);

function enableAnswerValidation() {
  console.log("TRYHACKME HELPER >>>> enable Answer Validation loaded on:", window.location.href);

   // Select all inputs with `data-testid="answer-field"`
document.querySelectorAll("input[data-testid='answer-field']").forEach((inputField) => {
  // Get the placeholder pattern after "Answer format: "
  const placeholderText = inputField.getAttribute("placeholder");
  const format = placeholderText.replace("Answer format: ", "").trim(); // Extract the format pattern
  
  // Create a div to show the status message below the input field
  const statusDiv = document.createElement("div");
  statusDiv.style.fontFamily = getComputedStyle(inputField).fontFamily;
  statusDiv.style.fontSize = getComputedStyle(inputField).fontSize;
  statusDiv.style.marginTop = "5px";
  statusDiv.style.display = "none"; // Initially hidden
  
  // Append the status div after the input field in its parent div
  inputField.parentNode.insertBefore(statusDiv, inputField.nextSibling);
  
  // Add event listener for input events
  inputField.addEventListener("input", function () {
      const userInput = inputField.value;
      let hasError = false;
      let isMatched = userInput.length === format.length;
      let errorText = "<span style='color: red;'><strong>Error:</strong></span> ";
      let formattedText = "";

      // Check each character in userInput against the format pattern
      for (let i = 0; i < format.length; i++) {
          const formatChar = format[i];
          const inputChar = userInput[i];

          if (i < userInput.length) {
              if (formatChar === "*") {
                  // Wildcard character: any input is allowed
                  formattedText += `<span style="color: blue;">${inputChar}</span>`;
              } else if (formatChar === inputChar) {
                  // Exact character match
                  formattedText += `<span style="color: blue;">${inputChar}</span>`;
              } else {
                  // Mismatch: highlight in red
                  formattedText += `<span style="color: red;">${inputChar}</span>`;
                  hasError = true;
              }
          } else {
              // Remaining pattern characters in blue
              formattedText += `<span style="color: blue;">${formatChar}</span>`;
          }
      }

      // Update status message
      if (hasError) {
          statusDiv.innerHTML = errorText + formattedText;
          statusDiv.style.display = "block";
      } else if (isMatched) {
          statusDiv.innerHTML = "<strong>Matched</strong>";
          statusDiv.style.color = "green";
          statusDiv.style.display = "block";
      } else {
          // Partial match with remaining pattern shown in blue
          statusDiv.innerHTML = "<strong>Partial:</strong> " + formattedText;
          statusDiv.style.color = "orange";
          statusDiv.style.display = "block";
      }
  });
});

  }
  
  // Feature: Add Target Machine Info
  function enableMachineInfoDuplication() {
    console.log("TRYHACKME HELPER >>>> enableMachineInfoDuplication loaded on:", window.location.href);
  // Select the parent container
const roomContent = document.getElementById("room_content");

// Select the two specific divs to be copied
const targetMachineTitle = document.querySelector('[data-sentry-element="StyledSectionTitle"]');
const activeMachineInfo = document.getElementById("active-machine-info");

// Clone the elements
const targetMachineTitleClone = targetMachineTitle.cloneNode(true);
const activeMachineInfoClone = activeMachineInfo.cloneNode(true);

// Append the cloned elements to the bottom of #room_content
roomContent.appendChild(targetMachineTitleClone);
roomContent.appendChild(activeMachineInfoClone);

// Find buttons in the cloned activeMachineInfo and link them to original buttons
const originalButtons = activeMachineInfo.querySelectorAll("button");
const clonedButtons = activeMachineInfoClone.querySelectorAll("button");

// Link each cloned button to its corresponding original button
clonedButtons.forEach((button, index) => {
    button.onclick = () => {
        originalButtons[index].click(); // Trigger the original button click
    };
});

  }




// Observer for Answer Validation
function observeAnswerValidation() {
  const answerObserver = new MutationObserver(() => {
    const answerFields = document.querySelectorAll("input[data-testid='answer-field']");
    
    if (answerFields.length > 0) {
      console.log("TRYHACKME HELPER >>>> Answer Validation elements detected. Initializing...");
      enableAnswerValidation();
      answerObserver.disconnect(); // Stop observing once elements are found
    } else {
      console.log("TRYHACKME HELPER >>>> Answer Validation elements not yet found.");
    }
  });

  // Start observing the body for changes specific to answer fields
  answerObserver.observe(document.body, { childList: true, subtree: true });
}

// Observer for Target Machine Info
function observeTargetMachineInfo() {
  const machineInfoObserver = new MutationObserver(() => {
    const roomContent = document.getElementById("room_content");
    const targetMachineTitle = document.querySelector('[data-sentry-element="StyledSectionTitle"]');
    const activeMachineInfo = document.getElementById("active-machine-info");

    if (roomContent && targetMachineTitle && activeMachineInfo) {
      console.log("TRYHACKME HELPER >>>> Target Machine Info elements detected. Initializing...");
      enableMachineInfoDuplication();
      machineInfoObserver.disconnect(); // Stop observing once elements are found
    } else {
      console.log("TRYHACKME HELPER >>>> Target Machine Info elements not yet found.");
    }
  });

  // Start observing the body for changes specific to machine info
  machineInfoObserver.observe(document.body, { childList: true, subtree: true });
}

// Feature: Command Copy Functionality
function enableCommandCopy() {
  const commandContainers = document.querySelectorAll(".terminal-container .terminal-code");

  commandContainers.forEach((container) => {
    // Check if the copy button already exists to prevent duplication
    if (container.querySelector(".copy-command-button")) return;

    // Locate the spans that make up the command
    const userPromptSpan = container.querySelector(".token.user");
    const dollarSignSpan = container.querySelector(".token.shell-symbol.important");
    const commandSpan = container.querySelector(".token.bash.language-bash");

    if (!userPromptSpan || !dollarSignSpan || !commandSpan) {
      console.log("TRYHACKME HELPER >>>> Skipping container, missing expected spans.");
      return;
    }

    // Extract the command text (skip the prompt and `$`)
    const commandText = commandSpan.innerText.trim();
    console.log("TRYHACKME HELPER >>>> Found command:", commandText);

    // Create the copy button
    const copyButton = document.createElement("button");
    copyButton.innerText = "Copy";
    copyButton.className = "copy-command-button";
    copyButton.style.marginLeft = "10px";
    copyButton.style.backgroundColor = "#1E90FF";
    copyButton.style.color = "#FFF";
    copyButton.style.border = "none";
    copyButton.style.padding = "5px 10px";
    copyButton.style.cursor = "pointer";
    copyButton.style.borderRadius = "5px";

    // Add the click event to copy the command
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(commandText)
        .then(() => {
          console.log("TRYHACKME HELPER >>>> Command copied to clipboard:", commandText);
        })
        .catch((err) => {
          console.error("TRYHACKME HELPER >>>> Failed to copy command: ", err);
        });
    });

    // Insert the copy button inline after the command span
    commandSpan.appendChild(copyButton);
    console.log("TRYHACKME HELPER >>>> Added copy button to command container.");
  });
}

// Observer for Command Copy Feature
function observeTerminalCommands() {
  const terminalObserver = new MutationObserver(() => {
    console.log("TRYHACKME HELPER >>>> Observing terminal containers...");
    enableCommandCopy();
  });

  // Start observing the body for changes specific to terminal containers
  terminalObserver.observe(document.body, { childList: true, subtree: true });
}

// Initialize Observers Based on Toggle States
chrome.storage.local.get(["validationEnabled", "machineInfoEnabled", "copyCommandEnabled"], (data) => {
  console.log("TRYHACKME HELPER >>>> Loaded settings:", data);

  // Initialize Answer Validation observer if enabled
  if (data.validationEnabled) {
    console.log("TRYHACKME HELPER >>>> Answer Validation is enabled. Starting observer...");
    observeAnswerValidation();
  } else {
    console.log("TRYHACKME HELPER >>>> Answer Validation is disabled.");
  }

  // Initialize Target Machine Info observer if enabled
  if (data.machineInfoEnabled) {
    console.log("TRYHACKME HELPER >>>> Target Machine Info is enabled. Starting observer...");
    observeTargetMachineInfo();
  } else {
    console.log("TRYHACKME HELPER >>>> Target Machine Info is disabled.");
  }

  // Initialize Command Copy observer if enabled
  if (data.copyCommandEnabled) {
    console.log("TRYHACKME HELPER >>>> Copy Command feature is enabled. Starting observer...");
    observeTerminalCommands();
  } else {
    console.log("TRYHACKME HELPER >>>> Copy Command feature is disabled.");
  }
});

// Get CSRF token from the page
function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
}

// Function to terminate a machine
async function terminateMachine(roomId) {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        console.error('CSRF token not found');
        return;
    }

    try {
        const response = await fetch('/api/vm/terminate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'csrf-token': csrfToken
            },
            body: JSON.stringify({ code: roomId })
        });

        if (!response.ok) throw new Error('Failed to terminate machine');
        
        // Notify background script of state change
        chrome.runtime.sendMessage({ action: 'machineStateChanged' });
        return true;
    } catch (error) {
        console.error('Error terminating machine:', error);
        return false;
    }
}

// Function to enhance machine information display
function enhanceMachineDisplay() {
    const machineInfoElements = document.querySelectorAll('.machine-info');
    
    machineInfoElements.forEach(async element => {
        const roomId = element.getAttribute('data-room-id');
        if (!roomId) return;

        try {
            // Get machine data from background script
            const response = await chrome.runtime.sendMessage({ action: 'getMachines' });
            const machines = response.machines;
            const machine = machines.find(m => m.roomId === roomId);
            
            if (machine) {
                const infoContainer = document.createElement('div');
                infoContainer.className = 'enhanced-machine-info';
                infoContainer.innerHTML = `
                    <div class="machine-status">
                        <span class="status-dot active"></span>
                        Active Machine
                    </div>
                    <div class="machine-details">
                        <div>Room: ${machine.title}</div>
                        <div>IP: ${machine.internalIP || 'Initializing...'}</div>
                        <div>Time Remaining: ${formatTimeRemaining(machine.expires)}</div>
                    </div>
                    <div class="machine-actions">
                        <button class="thm-btn" onclick="window.location.href='/r/room/${machine.roomId}'">
                            Open Room
                        </button>
                        <button class="thm-btn terminate" data-room-id="${machine.roomId}">
                            Terminate
                        </button>
                    </div>
                `;

                // Add custom styles
                const style = document.createElement('style');
                style.textContent = `
                    .enhanced-machine-info {
                        background: #2a2a2a;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 16px 0;
                    }
                    .machine-status {
                        display: flex;
                        align-items: center;
                        margin-bottom: 12px;
                    }
                    .status-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        margin-right: 8px;
                    }
                    .status-dot.active {
                        background: #00ff9d;
                        box-shadow: 0 0 8px #00ff9d;
                    }
                    .machine-details {
                        margin-bottom: 12px;
                    }
                    .machine-details div {
                        margin-bottom: 4px;
                    }
                    .machine-actions {
                        display: flex;
                        gap: 8px;
                    }
                    .thm-btn {
                        background: #00ff9d;
                        color: #000;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                    }
                    .thm-btn.terminate {
                        background: #ff4444;
                        color: white;
                    }
                `;
                document.head.appendChild(style);

                // Replace existing content with enhanced display
                element.innerHTML = '';
                element.appendChild(infoContainer);

                // Add terminate button handler
                const terminateBtn = infoContainer.querySelector('.terminate');
                terminateBtn.addEventListener('click', async () => {
                    if (await terminateMachine(machine.roomId)) {
                        element.remove();
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching machine info:', error);
        }
    });
}

function formatTimeRemaining(expires) {
    const now = new Date();
    const expiryDate = new Date(expires);
    const diff = expiryDate - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
}

// Watch for machine state changes
const startMachineButtons = document.querySelectorAll('[id^="start-machine-button"]');
startMachineButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Wait a bit for the machine to start, then notify background script
        setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'machineStateChanged' });
        }, 5000);
    });
});

// Run enhancement when page loads
document.addEventListener('DOMContentLoaded', enhanceMachineDisplay);

// Also run enhancement when content is dynamically loaded
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            // Check if any added nodes contain machine-related elements
            const hasMachineElements = Array.from(mutation.addedNodes).some(node => {
                return node.querySelector && (
                    node.querySelector('.machine-info') ||
                    node.querySelector('[id^="start-machine-button"]')
                );
            });
            
            if (hasMachineElements) {
                enhanceMachineDisplay();
                break;
            }
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});








  