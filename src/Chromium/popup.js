// Load the saved states from storage
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["validationEnabled", "machineInfoEnabled"], (data) => {
      document.getElementById("toggle-validation").checked = data.validationEnabled || false;
      document.getElementById("toggle-machine-info").checked = data.machineInfoEnabled || false;
      document.getElementById("toggle-copy-command").checked = data.copyCommandEnabled || false;
    });
  
    // Save toggle states
    document.getElementById("toggle-validation").addEventListener("change", (e) => {
      chrome.storage.local.set({ validationEnabled: e.target.checked });
    });
  
    document.getElementById("toggle-machine-info").addEventListener("change", (e) => {
      chrome.storage.local.set({ machineInfoEnabled: e.target.checked });
    });
  
    document.getElementById("toggle-copy-command").addEventListener("change", (e) => {
      chrome.storage.local.set({ copyCommandEnabled: e.target.checked });
     });
});

  