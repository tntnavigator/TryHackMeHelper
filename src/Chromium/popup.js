document.addEventListener('DOMContentLoaded', () => {
    // Clear existing content
    document.body.innerHTML = '';

    // Create header
    const header = document.createElement('div');
    header.className = 'header';
    
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Running Machines';
    
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-button';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt refresh-icon"></i>';
    refreshButton.title = 'Refresh machines';
    
    header.appendChild(title);
    header.appendChild(refreshButton);
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'content';
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'footer';
    const settingsLink = document.createElement('a');
    settingsLink.href = chrome.runtime.getURL('options.html');
    settingsLink.target = '_blank';
    settingsLink.textContent = 'Settings';
    footer.appendChild(settingsLink);
    
    // Add elements to body
    document.body.appendChild(header);
    document.body.appendChild(content);
    document.body.appendChild(footer);

    // Function to show toast message
    function showToast(message, type = '') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Function to check running machines
    async function checkMachines() {
        try {
            refreshButton.classList.add('refreshing');
            
            const response = await fetch('https://tryhackme.com/api/v2/vms/running', {
                credentials: 'include' // Add credentials to handle auth
            });
            console.log('Checking machines response:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch machines: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Running machines:', data);
            
            content.innerHTML = '';
            
            if (data && Array.isArray(data) && data.length > 0) {
                // Group machines by roomCode and sort by expiry
                const groupedMachines = data.reduce((acc, machine) => {
                    if (!acc[machine.roomCode]) {
                        acc[machine.roomCode] = [];
                    }
                    acc[machine.roomCode].push(machine);
                    return acc;
                }, {});

                // Sort machines within each group by creation time (newest first)
                Object.values(groupedMachines).forEach(machines => {
                    machines.sort((a, b) => new Date(b.created) - new Date(a.created));
                });

                // Create cards for all machines, sorted by expiry
                const sortedMachines = data.sort((a, b) => new Date(a.expires) - new Date(b.expires));
                
                sortedMachines.forEach(machine => {
                    content.appendChild(createMachineCard(machine));
                });
            } else {
                const noMachines = document.createElement('div');
                noMachines.className = 'no-machines';
                noMachines.textContent = 'No running machines found';
                content.appendChild(noMachines);
            }
        } catch (error) {
            console.error('Error checking machines:', error);
            showToast('Error fetching machines', 'error');
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'no-machines';
            errorMessage.textContent = 'Failed to load machines. Please try again.';
            content.innerHTML = '';
            content.appendChild(errorMessage);
        } finally {
            refreshButton.classList.remove('refreshing');
        }
    }

    // Update the time remaining display
    function updateTimeRemaining(timeInfo, expires) {
        const expiryDate = new Date(expires);
        const now = new Date();
        const diff = expiryDate - now;
        
        if (diff <= 0) {
            timeInfo.textContent = 'Expired';
            return false;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeInfo.textContent = `${hours}h ${minutes}m remaining`;
        return true;
    }

    // Function to create machine card
    function createMachineCard(machine) {
        const card = document.createElement('div');
        card.className = 'machine-card';
        
        const header = document.createElement('div');
        header.className = 'machine-header';
        
        const title = document.createElement('div');
        title.className = 'machine-title';
        title.textContent = machine.name || machine.title; // Support both name formats
        
        const status = document.createElement('div');
        status.className = 'machine-status';
        if (!machine.internalIP && machine.waitTime) {
            status.classList.add('initializing');
            status.title = 'Initializing';
        } else if (machine.internalIP) {
            status.classList.add('running');
            status.title = 'Running';
        }
        
        header.appendChild(title);
        header.appendChild(status);
        
        const info = document.createElement('div');
        info.className = 'machine-info';
        
        // Add room info if available
        if (machine.roomCode) {
            const roomInfo = document.createElement('div');
            roomInfo.textContent = `Room: ${machine.roomCode}`;
            info.appendChild(roomInfo);
        }
        
        // Add time remaining with live update
        if (machine.expires) {
            const timeInfo = document.createElement('div');
            timeInfo.className = 'time-info';
            updateTimeRemaining(timeInfo, machine.expires);
            
            // Update countdown every minute
            const countdownInterval = setInterval(() => {
                const isValid = updateTimeRemaining(timeInfo, machine.expires);
                if (!isValid) {
                    clearInterval(countdownInterval);
                    checkMachines(); // Refresh the list when a machine expires
                }
            }, 60000);
            
            info.appendChild(timeInfo);
        }
        
        if (machine.internalIP) {
            const ipContainer = document.createElement('div');
            ipContainer.className = 'ip-container';
            ipContainer.textContent = `IP: ${machine.internalIP}`;
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy IP';
            copyButton.onclick = () => {
                navigator.clipboard.writeText(machine.internalIP);
                showToast('IP copied to clipboard', 'success');
            };
            
            ipContainer.appendChild(copyButton);
            info.appendChild(ipContainer);
        } else if (machine.waitTime) {
            const waitInfo = document.createElement('div');
            waitInfo.textContent = 'Machine is initializing...';
            info.appendChild(waitInfo);
        }
        
        const actions = document.createElement('div');
        actions.className = 'machine-actions';
        
        // Connect button with dropdown
        const connectWrapper = document.createElement('div');
        connectWrapper.className = 'connect-wrapper';
        
        const connectButton = document.createElement('button');
        connectButton.innerHTML = '<i class="fas fa-link icon"></i> Connect';
        connectButton.disabled = !machine.internalIP;
        
        const connectMenu = document.createElement('div');
        connectMenu.className = 'connect-menu';
        
        ['https', 'http'].forEach(protocol => {
            const option = document.createElement('button');
            option.className = 'connect-option';
            option.textContent = protocol.toUpperCase();
            option.onclick = () => {
                window.open(`${protocol}://${machine.internalIP}`);
            };
            connectMenu.appendChild(option);
        });
        
        connectButton.onclick = (e) => {
            e.stopPropagation();
            connectMenu.classList.toggle('show');
        };
        
        connectWrapper.appendChild(connectButton);
        connectWrapper.appendChild(connectMenu);
        
        // Room button
        const roomButton = document.createElement('button');
        roomButton.innerHTML = '<i class="fas fa-book icon"></i> Room';
        roomButton.onclick = () => {
            window.open(`https://tryhackme.com/room/${machine.roomCode}`);
        };
        
        // Terminate button
        const terminateButton = document.createElement('button');
        terminateButton.className = 'terminate';
        terminateButton.innerHTML = '<i class="fas fa-power-off icon"></i> Terminate';
        terminateButton.onclick = async () => {
            try {
                terminateButton.disabled = true;
                const response = await fetch(`https://tryhackme.com/api/v2/vms/terminate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ machineId: machine.id })
                });
                
                console.log('Terminate response:', response.status, await response.text());
                
                if (response.ok) {
                    showToast('Machine terminated successfully', 'success');
                    await checkMachines();
                } else {
                    showToast('Failed to terminate machine', 'error');
                }
            } catch (error) {
                console.error('Terminate error:', error);
                showToast('Error terminating machine', 'error');
            } finally {
                terminateButton.disabled = false;
            }
        };
        
        actions.appendChild(connectWrapper);
        if (machine.roomCode) {
            actions.appendChild(roomButton);
        }
        actions.appendChild(terminateButton);
        
        card.appendChild(header);
        card.appendChild(info);
        card.appendChild(actions);
        
        return card;
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

    // Add keyboard shortcut for refresh
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (!refreshButton.classList.contains('refreshing')) {
                checkMachines();
            }
        }
    });

    // Set up auto-refresh
    let autoRefreshInterval = setInterval(checkMachines, 30000); // Check every 30 seconds

    // Clear interval when popup closes
    window.addEventListener('unload', () => {
        clearInterval(autoRefreshInterval);
    });

    // Initial check
    checkMachines();
});

  