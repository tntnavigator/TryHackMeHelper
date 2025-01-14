document.addEventListener('DOMContentLoaded', async () => {
    const machineList = document.getElementById('machineList');
    
    async function fetchRunningMachines() {
        try {
            // Request machines from background script first
            return new Promise((resolve) => {
                browser.runtime.sendMessage({ action: 'getMachines' }, response => {
                    resolve(response.machines);
                });
            });
        } catch (error) {
            console.error('Error fetching machines:', error);
            return [];
        }
    }

    async function terminateMachine(roomId) {
        try {
            const response = await fetch('https://tryhackme.com/api/vm/terminate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: roomId })
            });
            
            if (!response.ok) throw new Error('Failed to terminate machine');
            
            // Notify background script of state change
            browser.runtime.sendMessage({ action: 'machineStateChanged' });
            await updateMachineList(); // Refresh the list after termination
        } catch (error) {
            console.error('Error terminating machine:', error);
        }
    }

    function formatTimeRemaining(expires) {
        const now = new Date();
        const expiryDate = new Date(expires);
        const diff = expiryDate - now;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m remaining`;
    }

    function createMachineCard(machine) {
        const card = document.createElement('div');
        card.className = 'machine-card';
        
        const title = document.createElement('div');
        title.className = 'machine-title';
        title.textContent = machine.title;
        
        const roomId = document.createElement('div');
        roomId.className = 'machine-info';
        roomId.textContent = `Room: ${machine.roomId}`;
        
        const ip = document.createElement('div');
        ip.className = 'machine-info';
        ip.textContent = `IP: ${machine.internalIP || 'Initializing...'}`;
        
        const timeRemaining = document.createElement('div');
        timeRemaining.className = 'machine-info';
        timeRemaining.textContent = formatTimeRemaining(machine.expires);
        
        const actions = document.createElement('div');
        actions.className = 'machine-actions';
        
        const terminateBtn = document.createElement('button');
        terminateBtn.className = 'terminate';
        terminateBtn.textContent = 'Terminate';
        terminateBtn.onclick = () => terminateMachine(machine.roomId);
        
        const connectBtn = document.createElement('button');
        connectBtn.textContent = 'Connect';
        connectBtn.onclick = () => window.open(`https://tryhackme.com/r/room/${machine.roomId}`);
        
        actions.appendChild(connectBtn);
        actions.appendChild(terminateBtn);
        
        card.appendChild(title);
        card.appendChild(roomId);
        card.appendChild(ip);
        card.appendChild(timeRemaining);
        card.appendChild(actions);
        
        return card;
    }

    async function updateMachineList() {
        const machines = await fetchRunningMachines();
        machineList.innerHTML = '';
        
        if (machines.length === 0) {
            const noMachines = document.createElement('div');
            noMachines.className = 'no-machines';
            noMachines.textContent = 'No active machines found';
            machineList.appendChild(noMachines);
            return;
        }
        
        machines.forEach(machine => {
            machineList.appendChild(createMachineCard(machine));
        });
    }

    // Initial update when popup opens
    await updateMachineList();
}); 