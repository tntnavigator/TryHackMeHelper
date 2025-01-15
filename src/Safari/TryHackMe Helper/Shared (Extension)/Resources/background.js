let lastMachineCount = 0;
let lastCheck = 0;
const MIN_CHECK_INTERVAL = 60000; // Minimum 1 minute between checks

// Function to check machines
async function checkMachines(force = false) {
    const now = Date.now();
    
    // Don't check if it's been less than MIN_CHECK_INTERVAL, unless forced
    if (!force && (now - lastCheck) < MIN_CHECK_INTERVAL) {
        console.log('Skipping check due to interval limit');
        return;
    }
    
    try {
        console.log('Fetching machines from v2 API...');
        const response = await fetch('https://tryhackme.com/api/v2/vms/running', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch machines:', response.status);
            return;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
            const machines = data.data;
            console.log('Updated machines list:', machines);
            
            // Update badge with number of running machines
            const count = machines.length.toString();
            if (count !== lastMachineCount) {
                console.log('Updating badge count to:', count);
                browser.browserAction.setBadgeText({ text: count === '0' ? '' : count });
                browser.browserAction.setBadgeBackgroundColor({ color: '#00ff9d' });
                lastMachineCount = count;
            }

            // Check for machines about to expire
            machines.forEach(machine => {
                const expiryTime = new Date(machine.expires);
                const timeRemaining = expiryTime - new Date();
                const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
                
                if (minutesRemaining <= 15) {
                    browser.notifications.create(`machine-expiry-${machine.id}`, {
                        type: 'basic',
                        title: 'Machine Expiring Soon',
                        message: `${machine.title} will expire in ${minutesRemaining} minutes`,
                        iconUrl: 'icons/icon128.png'
                    });
                    
                    // If machine is close to expiry, schedule more frequent checks
                    if (minutesRemaining <= 5) {
                        setTimeout(() => checkMachines(true), 30000); // Check every 30s for machines about to expire
                    }
                }
            });
        }
        
        lastCheck = now;
    } catch (error) {
        console.error('Error checking machines:', error);
    }
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
    
    if (message.action === 'checkMachines') {
        checkMachines(true)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep the message channel open for async response
    }
});

// Initial check
console.log('Performing initial machine check...');
checkMachines();

// Set up periodic checks
setInterval(checkMachines, 300000); // Check every 5 minutes 