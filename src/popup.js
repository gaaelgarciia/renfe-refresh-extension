document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startMonitor");
  const stopBtn = document.getElementById("stopMonitor");
  const trainSelect = document.getElementById("trainSelect");
  const statusText = document.getElementById("statusText");

  function renderTrainOptions(trainTimes) {
    trainSelect.textContent = "";
    const fragment = document.createDocumentFragment();

    if (trainTimes.length === 0) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "No se encontraron trenes";
      fragment.appendChild(emptyOption);
    } else {
      for (const time of trainTimes) {
        const option = document.createElement("option");
        const safeTime = String(time);
        option.value = safeTime;
        option.textContent = safeTime;
        fragment.appendChild(option);
      }
    }

    trainSelect.appendChild(fragment);
  }

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
            renderTrainOptions(response.trainTimes);
          } else {
            renderTrainOptions([]);
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
