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
        browser.runtime.sendMessage({ action: 'machineStateChanged' });
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
            const response = await browser.runtime.sendMessage({ action: 'getMachines' });
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
            browser.runtime.sendMessage({ action: 'machineStateChanged' });
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