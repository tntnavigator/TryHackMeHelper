chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ validationEnabled: false, machineInfoEnabled: false });
  });
  