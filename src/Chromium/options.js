document.addEventListener('DOMContentLoaded', () => {
    const settingsSection = document.querySelector('.settings-section');

    // Create settings
    const settings = [
        {
            id: 'toggle-validation',
            title: 'Answer Format Validation',
            description: 'Checks if your answer matches the required format (e.g., flag{...}, ***) mentioned in the question hints before submitting',
            key: 'validationEnabled'
        },
        {
            id: 'toggle-copy-command',
            title: 'Command Copy Buttons',
            description: 'Adds copy buttons to command blocks in room write-ups, making it easier to copy and run commands',
            key: 'copyCommandEnabled'
        }
    ];

    // Create setting elements
    settings.forEach(setting => {
        const item = createSettingItem(setting);
        settingsSection.appendChild(item);
    });

    // Load saved settings
    chrome.storage.local.get(
        settings.map(s => s.key),
        (data) => {
            settings.forEach(setting => {
                const checkbox = document.getElementById(setting.id);
                if (checkbox) {
                    checkbox.checked = data[setting.key] ?? true; // Default to enabled
                }
            });
        }
    );

    // Save settings
    settings.forEach(setting => {
        const checkbox = document.getElementById(setting.id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                chrome.storage.local.set({ [setting.key]: e.target.checked });
                showToast(`${setting.title} ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
        }
    });
});

function createSettingItem({ id, title, description }) {
    const setting = document.createElement('div');
    setting.className = 'setting-item';
    
    const info = document.createElement('div');
    info.className = 'setting-info';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'setting-title';
    titleDiv.textContent = title;
    
    const desc = document.createElement('div');
    desc.className = 'setting-description';
    desc.textContent = description;
    
    info.appendChild(titleDiv);
    info.appendChild(desc);
    
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'checkbox-wrapper';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.className = 'setting-checkbox';
    
    checkboxWrapper.appendChild(checkbox);
    
    setting.appendChild(info);
    setting.appendChild(checkboxWrapper);
    
    return setting;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
} 