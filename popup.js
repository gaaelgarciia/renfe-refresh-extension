document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startMonitor");
  const stopBtn = document.getElementById("stopMonitor");
  const trainSelect = document.getElementById("trainSelect");
  const statusText = document.getElementById("statusText");

  // Get hours of departure from content.js
  function fetchTrainTimes() {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.tabs.sendMessage(
        tabs[0].id,
        { action: "getTrainTimes" },
        (response) => {
          if (
            response &&
            response.trainTimes &&
            response.trainTimes.length > 0
          ) {
            trainSelect.innerHTML = response.trainTimes
              .map((time) => `<option value="${time}">${time}</option>`)
              .join("");
          } else {
            trainSelect.innerHTML =
              '<option value="">No se encontraron trenes</option>';
          }
        },
      );
    });
  }

  fetchTrainTimes();

  // Load saved train number and check if monitoring is active
  browser.storage.local.get(["trainNumber", "isMonitoring"]).then((result) => {
    if (result.trainNumber) trainSelect.value = result.trainNumber;
    if (result.isMonitoring) {
      statusText.textContent = `Monitoring train ${result.trainNumber}...`;
    }
  });

  startBtn.addEventListener("click", () => {
    const trainTime = trainSelect.value;
    if (!trainTime) {
      statusText.textContent = "Selecciona una hora de tren válida";
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
