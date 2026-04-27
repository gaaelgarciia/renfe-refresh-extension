let monitorInterval;
let currentTrain = null;
let watchdogTimer;
let lastRefreshTime = 0;
let monitoringTabId = null;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startMonitoring") {
    const trainTime = request.trainTime;
    currentTrain = trainTime;
    lastRefreshTime = Date.now();

    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        monitoringTabId = tabs[0].id;
        startMonitoring(monitoringTabId, trainTime);
        startWatchdog();
      })
      .catch((error) => {
        console.error("Error starting monitoring:", error);
      });

    return Promise.resolve({ status: "Monitoring started" });
  }

  if (request.action === "stopMonitoring") {
    stopMonitoring();
    return Promise.resolve({ status: "Monitoring stopped" });
  }

  if (request.action === "trainFound") {
    stopMonitoring();
  }

  if (request.action === "pageRefreshed") {
    lastRefreshTime = Date.now();
    return Promise.resolve({ status: "Refresh acknowledged" });
  }
});

function startMonitoring(tabId) {
  // Save monitoring state
  browser.storage.local.set({
    isMonitoring: true,
    trainNumber: currentTrain,
    tabId: tabId,
  });

  // Initial check
  checkForTrain(tabId);

  // Set up regular checking
  monitorInterval = setInterval(() => {
    checkForTrain(tabId);
  }, 5000);
}

function checkForTrain(tabId) {
  browser.tabs
    .sendMessage(tabId, {
      action: "checkForTrain",
      trainTime: currentTrain,
    })
    .catch((error) => {
      console.error("Error communicating with tab:", error);
      // Content script might be gone, try to reinject it
      reinjectContentScript(tabId);
    });
}

function reinjectContentScript(tabId) {
  browser.tabs
    .executeScript(tabId, {
      file: "content.js",
    })
    .catch((error) => {
      console.error("Failed to reinject content script:", error);
    });
}

function startWatchdog() {
  // Clear any existing watchdog
  if (watchdogTimer) clearInterval(watchdogTimer);

  // Set up a watchdog to ensure refreshes are happening
  watchdogTimer = setInterval(() => {
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;

    // If it's been more than 10 seconds since last refresh, something's wrong
    if (timeSinceLastRefresh > 10000 && monitoringTabId) {
      console.log("Watchdog triggered: Refreshes appear to have stopped");

      // Check if tab still exists
      browser.tabs
        .get(monitoringTabId)
        .then((tab) => {
          if (tab) {
            // Force a refresh of the page
            browser.tabs.reload(monitoringTabId);
            lastRefreshTime = Date.now();
          }
        })
        .catch((error) => {
          console.error("Tab no longer exists:", error);
          stopMonitoring();
        });
    }
  }, 5000);
}

function stopMonitoring() {
  clearInterval(monitorInterval);
  clearInterval(watchdogTimer);
  currentTrain = null;
  monitoringTabId = null;

  // Clear monitoring state
  browser.storage.local.set({
    isMonitoring: false,
  });
}

// Check for existing monitoring on startup
browser.runtime.onStartup.addListener(() => {
  browser.storage.local
    .get(["isMonitoring", "trainNumber", "tabId"])
    .then((data) => {
      if (data.isMonitoring && data.trainNumber && data.tabId) {
        currentTrain = data.trainNumber;
        monitoringTabId = data.tabId;

        // Verify tab still exists
        browser.tabs
          .get(data.tabId)
          .then((tab) => {
            startMonitoring(data.tabId);
            startWatchdog();
          })
          .catch((error) => {
            console.log("Monitoring tab no longer exists, stopping monitoring");
            stopMonitoring();
          });
      }
    });
});
