import { VERSION, SETTINGS } from './constants.js';

document.addEventListener('DOMContentLoaded', () => {
    const settingsSection = document.querySelector('.settings-section');

    // Create settings categories
    const categories = [
        {
            title: 'Room Features',
            settings: [
                {
                    id: 'toggle-validation',
                    title: 'Answer Format Helper',
                    description: 'Shows a warning if your answer doesn\'t match the required format (e.g., flag{...}, ***) before submitting',
                    key: SETTINGS.VALIDATION_ENABLED
                },
                {
                    id: 'toggle-copy-command',
                    title: 'Quick Command Copy',
                    description: 'Adds copy buttons next to command blocks in room write-ups for easy copying',
                    key: SETTINGS.COPY_COMMAND_ENABLED
                }
            ]
        }
    ];

    // Create header
    const header = document.createElement('div');
    header.className = 'header';
    
    const title = document.createElement('h1');
    title.textContent = 'TryHackMe Helper Settings';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Configure your extension preferences. Settings are automatically saved.';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    settingsSection.appendChild(header);

    // Create category elements
    categories.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'settings-category';
        
        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category.title;
        categorySection.appendChild(categoryTitle);
        
        category.settings.forEach(setting => {
            const item = createSettingItem(setting);
            categorySection.appendChild(item);
        });
        
        settingsSection.appendChild(categorySection);
    });

    // Add version number
    const version = document.createElement('div');
    version.className = 'version-info';
    version.textContent = VERSION;
    settingsSection.appendChild(version);

    // Load saved settings
    chrome.storage.local.get(
        categories.flatMap(cat => cat.settings).map(s => s.key),
        (data) => {
            categories.forEach(category => {
                category.settings.forEach(setting => {
                    const toggle = document.getElementById(setting.id);
                    if (toggle) {
                        toggle.checked = data[setting.key] ?? true; // Default to enabled
                    }
                });
            });
        }
    );

    // Save settings
    categories.forEach(category => {
        category.settings.forEach(setting => {
            const toggle = document.getElementById(setting.id);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    chrome.storage.local.set({ [setting.key]: e.target.checked });
                    showToast(`${setting.title} ${e.target.checked ? 'enabled' : 'disabled'}`);
                });
            }
        });
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