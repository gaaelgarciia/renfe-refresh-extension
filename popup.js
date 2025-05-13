document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startMonitor");
  const stopBtn = document.getElementById("stopMonitor");
  const trainInput = document.getElementById("trainNumber");
  const statusText = document.getElementById("statusText");

  // Load saved train number and check if monitoring is active
  browser.storage.local.get(["trainNumber", "isMonitoring"]).then((result) => {
    if (result.trainTime) {
      trainInput.value = result.trainTime.replace(".", ":");
    }
    if (result.isMonitoring) {
      statusText.textContent = `Monitoring train ${result.trainNumber}...`;
    }
  });

  startBtn.addEventListener("click", () => {
    const uiTime = trainInput.value.trim();       // "21:50"
    const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(uiTime);
    if (!validTime) {
      statusText.textContent = "Error: Must be a valid time (HH:MM)";
      return;
    }

    const trainTime = uiTime.replace(":", ".");

    browser.storage.local.set({ trainTime, isMonitoring: true });

    browser.runtime
      .sendMessage({
        action: "startMonitoring",
        trainTime: trainTime,
      })
      .then(() => {
        statusText.textContent = `Monitoring train at ${trainTime}...`;
      })
      .catch((error) => {
        statusText.textContent = `Error: ${error.message}`;
      });
  });

  stopBtn.addEventListener("click", () => {
    browser.runtime
      .sendMessage({
        action: "stopMonitoring",
      })
      .then(() => {
        browser.storage.local.set({ isMonitoring: false });
        statusText.textContent = "Stopped monitoring";
      })
      .catch((error) => {
        statusText.textContent = `Error: ${error.message}`;
      });
  });

  // Listen for status updates
  browser.runtime.onMessage.addListener((request) => {
    if (request.action === "trainFound") {
      statusText.textContent = `Train ${request.trainNumber} found!`;
    }
    if (request.action === "siguienteClicked") {
      statusText.textContent = "Proceeding to next step...";
    }
    if (request.action === "watchdogTriggered") {
      statusText.textContent = "Watchdog restarted monitoring...";
    }
  });
});
