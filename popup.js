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
    const trainTime = trainInput.value.trim();

    const timeRegex = /^([01]\d|2[0-3]).([0-5]\d)$/; // Validates hour format
    if (!timeRegex.test(trainTime)) {
      statusText.textContent = "Error: Must be a valid time (HH:mm, 00.00-23.59)";
      return;
    }

    browser.storage.local.set({ trainTime: trainTime });

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
