console.log('DEBUG: Background script loaded');

let lastMachineCount = 0;
let lastCheck = 0;
let machines = [];
const MIN_CHECK_INTERVAL = 60000; // Minimum 1 minute between checks

// Listen for tab updates to detect TryHackMe's terminate action
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes('tryhackme.com') && changeInfo.status === 'complete') {
        console.log('TryHackMe page updated, forcing machine check...');
        checkMachines(true);
    }
});

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
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            console.error('Failed to fetch machines:', response.status);
            return;
        }

        // Get the raw text first for debugging
        const rawText = await response.text();
        console.log('Raw response text:', rawText);
        
        let responseData;
        try {
            responseData = JSON.parse(rawText.trim());
            console.log('Parsed response data:', responseData);
        } catch (parseError) {
            console.error('Failed to parse response JSON:', parseError);
            console.error('Raw response was:', rawText);
            return;
        }

        if (responseData.status === 'success' && Array.isArray(responseData.data)) {
            machines = responseData.data;
            console.log('Updated machines list:', machines);
        } else {
            console.error('Invalid response format:', responseData);
            machines = [];
            return;
        }

        lastCheck = now;
        
        // Check for machines about to expire (less than 15 minutes remaining)
        machines.forEach(machine => {
            const expiryTime = new Date(machine.expires);
            const timeRemaining = expiryTime - new Date();
            const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
            
            console.log(`Machine ${machine.title} has ${minutesRemaining} minutes remaining`);
            
            if (minutesRemaining <= 15) {
                chrome.notifications.create(`machine-expiry-${machine.id}`, {
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'Machine Expiring Soon',
                    message: `${machine.title} will expire in ${minutesRemaining} minutes`
                });
                
                // If machine is close to expiry, schedule more frequent checks
                if (minutesRemaining <= 5) {
                    chrome.alarms.create(`expire-check-${machine.id}`, {
                        delayInMinutes: 0.5 // Check every 30 seconds
                    });
                }
            }
        });
        
        // Update badge with number of running machines
        const count = machines.length.toString();
        if (count !== lastMachineCount) {
            console.log('Updating badge count to:', count);
            chrome.action.setBadgeText({ text: count === '0' ? '' : count });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff9d' });
            lastMachineCount = count;
        }
    } catch (error) {
        console.error('Error checking machines:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
    }
}

async function getCsrfToken() {
    try {
        console.log('Background: Fetching CSRF token from v2 API...');
        const response = await fetch('https://tryhackme.com/api/v2/auth/csrf');
        
        console.log('Background: CSRF response status:', response.status);
        console.log('Background: CSRF headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.redirected) {
            console.error('Background: CSRF request was redirected');
            return null;
        }
        
        const data = await response.json();
        console.log('Background: CSRF response:', data);
        
        if (!data.data?.token) {
            console.error('Background: Failed to fetch CSRF token');
            return null;
        }
        
        return data.data.token;
    } catch (error) {
        console.error('Background: Error fetching CSRF token:', error);
        return null;
    }
}

async function terminateMachine(machineId) {
    console.log('DEBUG: Starting terminate operation for machine:', machineId);
    try {
        // Get CSRF token first
        console.log('DEBUG: Fetching CSRF token...');
        const csrfToken = await getCsrfToken();
        if (!csrfToken) {
            console.error('DEBUG: Failed to get CSRF token');
            return { success: false, error: 'Failed to get CSRF token' };
        }
        console.log('DEBUG: Got CSRF token:', csrfToken);
        
        const requestBody = JSON.stringify({ id: machineId });
        console.log('DEBUG: Prepared request body:', requestBody);
        
        console.log('DEBUG: Sending terminate request...');
        const response = await fetch('https://tryhackme.com/api/v2/vms/terminate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'csrf-token': csrfToken
            },
            body: requestBody,
            credentials: 'include'
        });
        
        console.log('DEBUG: Terminate response received');
        console.log('DEBUG: Response status:', response.status);
        console.log('DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.redirected) {
            console.error('DEBUG: Request was redirected to:', response.url);
            return { success: false, error: 'Request was redirected' };
        }
        
        const rawText = await response.text();
        console.log('DEBUG: Raw response text:', rawText);
        
        let responseData;
        try {
            responseData = JSON.parse(rawText.trim());
            console.log('DEBUG: Parsed response data:', responseData);
        } catch (parseError) {
            console.error('DEBUG: Failed to parse response JSON:', parseError);
            console.error('DEBUG: Raw response was:', rawText);
            return { success: false, error: 'Failed to parse response' };
        }
        
        if (!response.ok) {
            console.error('DEBUG: Failed to terminate machine:', responseData);
            return { success: false, error: responseData };
        }
        
        console.log('DEBUG: Machine terminated successfully');
        await checkMachines(true);
        return { success: true };
        
    } catch (error) {
        console.error('DEBUG: Error in terminate operation:', error);
        console.error('DEBUG: Error stack:', error.stack);
        return { success: false, error: error.message };
    }
}

// Modify the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('DEBUG: Message received in background:', message);
    console.log('DEBUG: Sender:', sender);
    
    if (message.action === 'machineStateChanged') {
        console.log('DEBUG: Machine state changed action received');
        checkMachines(true);
    } else if (message.action === 'getMachines') {
        console.log('DEBUG: GetMachines action received');
        checkMachines(true).then(() => {
            console.log('DEBUG: Sending machines to popup:', machines);
            sendResponse({ machines });
        });
        return true;
    } else if (message.action === 'terminateMachine') {
        if (!message.machineId) {
            console.error('DEBUG: No machineId provided in terminate request');
            sendResponse({ success: false, error: 'No machineId provided' });
            return true;
        }
        
        console.log('DEBUG: Terminate action received for machine:', message.machineId);
        
        terminateMachine(message.machineId)
            .then(result => {
                console.log('DEBUG: Terminate operation completed with result:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('DEBUG: Error in terminate operation:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true;
    } else {
        console.error('DEBUG: Unknown action received:', message.action);
    }
});

// Handle alarms for expiring machines
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('expire-check-')) {
        console.log('Expiry check alarm triggered:', alarm.name);
        checkMachines(true);
    }
});

// Initial check
console.log('Performing initial machine check...');
checkMachines();

// Create alarm for regular background checks
chrome.alarms.create('regular-check', {
    periodInMinutes: 5 // Check every 5 minutes
});
  