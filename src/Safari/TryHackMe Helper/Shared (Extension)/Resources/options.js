document.addEventListener('DOMContentLoaded', () => {
    const settingsSection = document.querySelector('.settings-section');

    // Create settings
    const settings = [
        {
            id: 'toggle-validation',
            title: 'Input Validation',
            description: 'Validates if your answer matches the hint format (e.g., ***) before submission',
            key: 'validationEnabled'
        },
        {
            id: 'toggle-copy-command',
            title: 'Quick Copy Commands',
            description: 'Enables easy copying of commands from room write-ups for later use',
            key: 'copyCommandEnabled'
        }
    ];

    // Create setting elements
    settings.forEach(setting => {
        const item = createSettingItem(setting);
        settingsSection.appendChild(item);
    });

    // Load saved settings
    // Safari-specific: Use browser.storage.local
    browser.storage.local.get(
        settings.map(s => s.key)
    ).then((data) => {
        settings.forEach(setting => {
            const checkbox = document.getElementById(setting.id);
            if (checkbox) {
                checkbox.checked = data[setting.key] ?? true; // Default to enabled
            }
        });
    });

    // Save settings
    settings.forEach(setting => {
        const checkbox = document.getElementById(setting.id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                // Safari-specific: Use browser.storage.local
                browser.storage.local.set({ [setting.key]: e.target.checked }).then(() => {
                    showToast(`${setting.title} ${e.target.checked ? 'enabled' : 'disabled'}`);
                });
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