let lastMachineCount = 0;
let lastCheck = 0;
let machines = [];
const MIN_CHECK_INTERVAL = 60000; // Minimum 1 minute between checks

async function checkMachines(force = false) {
    const now = Date.now();
    
    // Don't check if it's been less than MIN_CHECK_INTERVAL, unless forced
    if (!force && (now - lastCheck) < MIN_CHECK_INTERVAL) {
        return;
    }
    
    try {
        const response = await fetch('https://tryhackme.com/api/vm/running');
        if (!response.ok) return;
        
        machines = await response.json();
        lastCheck = now;
        
        // Check for machines about to expire (less than 15 minutes remaining)
        machines.forEach(machine => {
            const expiryTime = new Date(machine.expires);
            const timeRemaining = expiryTime - new Date();
            const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
            
            if (minutesRemaining <= 15) {
                chrome.notifications.create(`machine-expiry-${machine.roomId}`, {
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'Machine Expiring Soon',
                    message: `${machine.title} will expire in ${minutesRemaining} minutes`
                });
                
                // If machine is close to expiry, schedule more frequent checks
                if (minutesRemaining <= 5) {
                    chrome.alarms.create(`expire-check-${machine.roomId}`, {
                        delayInMinutes: 0.5 // Check every 30 seconds
                    });
                }
            }
        });
        
        // Update badge with number of running machines
        const count = machines.length.toString();
        if (count !== lastMachineCount) {
            chrome.action.setBadgeText({ text: count === '0' ? '' : count });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff9d' });
            lastMachineCount = count;
        }
    } catch (error) {
        console.error('Error checking machines:', error);
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'machineStateChanged') {
        checkMachines(true); // Force check when machine state changes
    } else if (message.action === 'getMachines') {
        // Return cached machines if recent, otherwise fetch new data
        const now = Date.now();
        if (now - lastCheck < MIN_CHECK_INTERVAL) {
            sendResponse({ machines });
        } else {
            checkMachines(true).then(() => sendResponse({ machines }));
            return true; // Will send response asynchronously
        }
    }
});

// Handle alarms for expiring machines
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('expire-check-')) {
        checkMachines(true);
    }
});

// Initial check
checkMachines();

// Create alarm for regular background checks
chrome.alarms.create('regular-check', {
    periodInMinutes: 5 // Check every 5 minutes
});
  