document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startMonitor");
  const stopBtn = document.getElementById("stopMonitor");
  const trainInput = document.getElementById("trainNumber");
  const statusText = document.getElementById("statusText");

  // Load saved train number and check if monitoring is active
  browser.storage.local.get(["trainNumber", "isMonitoring"]).then((result) => {
    if (result.trainNumber) trainInput.value = result.trainNumber;
    if (result.isMonitoring) {
      statusText.textContent = `Monitoring train ${result.trainNumber}...`;
    }
  });

  startBtn.addEventListener("click", () => {
    const trainNumber = trainInput.value.trim();

    if (!/^\d+$/.test(trainNumber)) {
      statusText.textContent = "Error: Must be a number";
      return;
    }

    browser.storage.local.set({ trainNumber: trainNumber });

    browser.runtime
      .sendMessage({
        action: "startMonitoring",
        trainNumber: trainNumber,
      })
      .then(() => {
        statusText.textContent = `Monitoring train ${trainNumber}...`;
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
