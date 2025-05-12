// Track if we've found the train
let trainFound = false;
let lastRefreshTime = 0;

// Listen for messages from background
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkForTrain" && !trainFound) {
    try {
      const trainButton = document.querySelector(
        `button[tren="${request.trainNumber}"]`,
      );

      if (trainButton) {
        trainFound = true;
        console.log("Train found! Clicking button...");
        trainButton.click();
        browser.runtime
          .sendMessage({
            action: "trainFound",
            trainNumber: request.trainNumber,
          })
          .catch((error) =>
            console.error("Error reporting train found:", error),
          );
      } else {
        const currentTime = Date.now();
        // Don't refresh too frequently
        if (currentTime - lastRefreshTime > 2000) {
          lastRefreshTime = currentTime;
          console.log("Train not found, refreshing page...");

          // Notify background that we're about to refresh
          browser.runtime
            .sendMessage({
              action: "pageRefreshed",
            })
            .catch((error) => console.error("Error reporting refresh:", error));

          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error in checkForTrain:", error);
    }
  }
});

// Check for "Siguiente" button on page load
function checkForSiguiente() {
  try {
    const siguienteBtn = document.getElementById("submitSiguiente");
    if (siguienteBtn) {
      console.log("Found Siguiente button, clicking...");
      siguienteBtn.click();
      browser.runtime
        .sendMessage({
          action: "siguienteClicked",
        })
        .catch((error) =>
          console.error("Error reporting siguiente click:", error),
        );
    }
  } catch (error) {
    console.error("Error in checkForSiguiente:", error);
  }
}

// Tell the background script that content script is loaded
browser.runtime
  .sendMessage({ action: "contentScriptLoaded" })
  .catch((error) =>
    console.error("Error reporting content script load:", error),
  );

// Run check when page loads
checkForSiguiente();

// Also check periodically in case button appears later
setInterval(checkForSiguiente, 500);

// Alert the background script when we navigate
window.addEventListener("beforeunload", () => {
  browser.runtime
    .sendMessage({ action: "pageNavigating" })
    .catch((error) => console.error("Error reporting navigation:", error));
});
