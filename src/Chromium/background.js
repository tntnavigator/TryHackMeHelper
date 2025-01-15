console.log('DEBUG: Background script loaded');

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
                chrome.action.setBadgeText({ text: count === '0' ? '' : count });
                chrome.action.setBadgeBackgroundColor({ color: '#00ff9d' });
                lastMachineCount = count;
            }
        }
        
        lastCheck = now;
    } catch (error) {
        console.error('Error checking machines:', error);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

// Create alarm for regular background checks
chrome.alarms.create('regular-check', {
    periodInMinutes: 5 // Check every 5 minutes
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'regular-check') {
        console.log('Regular check alarm triggered');
        checkMachines();
    }
});
  