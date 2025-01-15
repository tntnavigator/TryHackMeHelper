import { VERSION, API, SETTINGS } from './constants.js';
import { makeRequest } from './utils/api.js';

/**
 * TryHackMe Helper Popup
 * Manages the display and interaction with running machines and user settings.
 * 
 * Features:
 * - Displays running machines with status
 * - Allows machine termination
 * - Provides quick access to machine IP and room
 * - Manages user settings
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Clear existing content
    document.body.innerHTML = '';

    // Create header with logo and refresh button
    const header = document.createElement('div');
    header.className = 'header';
    
    const logo = document.createElement('img');
    logo.src = 'icons/icon48.png';
    logo.alt = 'TryHackMe Helper';
    logo.style.width = '32px';
    logo.style.height = '32px';
    
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Running Machines';
    
    // Create refresh button with icon
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-button';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt refresh-icon"></i>';
    refreshButton.title = 'Refresh machines';
    
    header.appendChild(logo);
    header.appendChild(title);
    header.appendChild(refreshButton);

    // Create features section
    const features = document.createElement('div');
    features.className = 'settings';
    
    const featuresTitle = document.createElement('div');
    featuresTitle.className = 'settings-title';
    featuresTitle.textContent = 'Features';
    
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'toggle-group';

    // Define features with their storage keys
    const featureToggles = [
        {
            id: 'toggle-validation',
            label: 'Answer Validation',
            key: SETTINGS.VALIDATION_ENABLED
        },
        {
            id: 'toggle-machine-info',
            label: 'Machine Info at Bottom',
            key: SETTINGS.MACHINE_INFO_ENABLED
        },
        {
            id: 'toggle-copy-command',
            label: 'Copy Command Buttons',
            key: SETTINGS.COPY_COMMAND_ENABLED
        }
    ];

    // Load saved settings
    const savedSettings = await chrome.storage.local.get(
        featureToggles.map(toggle => toggle.key)
    );

    // Create toggle switches
    featureToggles.forEach(toggle => {
        const item = document.createElement('div');
        item.className = 'toggle-item';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = toggle.id;
        input.checked = savedSettings[toggle.key] ?? true; // Default to enabled
        
        input.addEventListener('change', (e) => {
            chrome.storage.local.set({ [toggle.key]: e.target.checked });
        });
        
        const label = document.createElement('label');
        label.htmlFor = toggle.id;
        label.textContent = toggle.label;
        
        item.appendChild(input);
        item.appendChild(label);
        toggleGroup.appendChild(item);
    });

    features.appendChild(featuresTitle);
    features.appendChild(toggleGroup);
    
    // Create machine list container
    const machineList = document.createElement('div');
    machineList.id = 'machineList';
    machineList.className = 'machine-list';
    machineList.innerHTML = '<div class="loading">Loading machines...</div>';
    
    // Add elements to body
    document.body.appendChild(header);
    document.body.appendChild(features);
    document.body.appendChild(machineList);

    /**
     * Creates a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Optional type for styling ('success' or 'error')
     */
    function showToast(message, type = '') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Fetches and displays running machines from TryHackMe API
     * Handles loading, error, and empty states
     * Updates the machine list UI with current machine status
     */
    async function checkMachines() {
        try {
            refreshButton.classList.add('refreshing');
            
            // Fetch running machines
            const response = await fetch(API.RUNNING_MACHINES, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch machines: ${response.status}`);
            }
            
            // Parse and display machines
            const data = await response.json();
            const machines = data.data || [];
            machineList.innerHTML = '';
            
            if (machines.length > 0) {
                machines.forEach(machine => {
                    machineList.appendChild(createMachineCard(machine));
                });
            } else {
                const noMachines = document.createElement('div');
                noMachines.className = 'no-machines';
                noMachines.textContent = 'No running machines found';
                machineList.appendChild(noMachines);
            }
        } catch (error) {
            console.error('Error checking machines:', error);
            showToast('Error fetching machines', 'error');
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'no-machines';
            errorMessage.textContent = 'Failed to load machines. Please try again.';
            machineList.innerHTML = '';
            machineList.appendChild(errorMessage);
        } finally {
            refreshButton.classList.remove('refreshing');
        }
    }

    /**
     * Creates a machine card element
     * @param {Object} machine - Machine data from API
     * @param {string} machine.id - Machine ID
     * @param {string} machine.name - Machine name
     * @param {string} machine.roomCode - Room code
     * @param {string} machine.internalIP - Machine IP when running
     * @returns {HTMLElement} The machine card element
     */
    function createMachineCard(machine) {
        const card = document.createElement('div');
        card.className = 'machine-card';
        
        // Create card header with title and status
        const header = document.createElement('div');
        header.className = 'machine-header';
        
        const title = document.createElement('div');
        title.className = 'machine-title';
        title.textContent = machine.name || machine.title;
        
        const status = document.createElement('div');
        status.className = `machine-status ${machine.internalIP ? 'running' : 'initializing'}`;
        
        header.appendChild(title);
        header.appendChild(status);
        
        // Create machine info section
        const info = document.createElement('div');
        info.className = 'machine-info';
        
        if (machine.roomCode) {
            info.appendChild(createInfoLine(`Room: ${machine.roomCode}`));
        }
        
        if (machine.internalIP) {
            const ipContainer = document.createElement('div');
            ipContainer.className = 'ip-container';
            ipContainer.textContent = `IP: ${machine.internalIP}`;
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.onclick = () => {
                navigator.clipboard.writeText(machine.internalIP);
                showToast('IP copied to clipboard', 'success');
            };
            
            ipContainer.appendChild(copyButton);
            info.appendChild(ipContainer);
        }
        
        // Create machine actions
        const actions = document.createElement('div');
        actions.className = 'machine-actions';
        
        // Add connect button with dropdown for running machines
        if (machine.internalIP) {
            const connectWrapper = document.createElement('div');
            connectWrapper.className = 'connect-wrapper';
            
            const connectButton = document.createElement('button');
            connectButton.innerHTML = '<i class="fas fa-link"></i> Connect';
            
            const connectMenu = document.createElement('div');
            connectMenu.className = 'connect-menu';
            
            // Add HTTPS and HTTP connection options
            ['HTTPS', 'HTTP'].forEach(protocol => {
                const option = document.createElement('button');
                option.className = 'connect-option';
                option.textContent = protocol;
                option.onclick = () => {
                    window.open(`${protocol.toLowerCase()}://${machine.internalIP}`);
                };
                connectMenu.appendChild(option);
            });
            
            connectButton.onclick = (e) => {
                e.stopPropagation();
                connectMenu.classList.toggle('show');
            };
            
            connectWrapper.appendChild(connectButton);
            connectWrapper.appendChild(connectMenu);
            actions.appendChild(connectWrapper);
        }
        
        // Add room button if room code is available
        if (machine.roomCode) {
            const roomButton = document.createElement('button');
            roomButton.innerHTML = '<i class="fas fa-book"></i> Room';
            roomButton.onclick = () => {
                window.open(`https://tryhackme.com/room/${machine.roomCode}`);
            };
            actions.appendChild(roomButton);
        }
        
        // Add terminate button
        const terminateButton = document.createElement('button');
        terminateButton.className = 'terminate';
        terminateButton.innerHTML = '<i class="fas fa-power-off"></i> Terminate';
        terminateButton.onclick = async () => {
            try {
                console.group('Terminate Machine Request');
                console.log('Starting terminate for machine:', {
                    id: machine.id,
                    name: machine.name,
                    roomCode: machine.roomCode
                });

                terminateButton.disabled = true;

                // Make the terminate request using our API utility
                const result = await makeRequest(API.TERMINATE_MACHINE, {
                    method: 'POST',
                    body: JSON.stringify({ id: machine.id })
                });

                console.log('Terminate response:', result);
                
                showToast('Machine terminated successfully', 'success');
                await checkMachines();
            } catch (error) {
                console.error('Terminate error:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                showToast(error.message || 'Error terminating machine', 'error');
            } finally {
                console.groupEnd();
                terminateButton.disabled = false;
            }
        };
        actions.appendChild(terminateButton);
        
        // Assemble the card
        card.appendChild(header);
        card.appendChild(info);
        card.appendChild(actions);
        
        return card;
    }

    function createInfoLine(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div;
    }

    // Add click handler to close dropdowns
    document.addEventListener('click', () => {
        document.querySelectorAll('.connect-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });

    // Add refresh button handler
    refreshButton.addEventListener('click', () => {
        if (!refreshButton.classList.contains('refreshing')) {
            checkMachines();
        }
    });

    // Initial check for machines
    checkMachines();

    // Set up auto-refresh
    const autoRefreshInterval = setInterval(checkMachines, 30000);

    // Clean up interval when popup closes
    window.addEventListener('unload', () => {
        clearInterval(autoRefreshInterval);
    });
});

  