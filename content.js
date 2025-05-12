// Track if we've found the train
let trainFound = false;
let lastRefreshTime = 0;


// Listen for messages from background
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkForTrain" && !trainFound) {
    try {
      const trainRows = Array.from(document.querySelectorAll("td[data-label='Salida']"));
      console.log ("Train rows found: ", trainRows);

      const trainRow = trainRows.find((cell) => {
        const departureTime = cell.textContent.trim().replace(/\s+/g, '');
        const userTime = request.trainTime.trim().replace(/\s+/g, ''); 
        console.log("Checking departure time: ", departureTime, "against user time: ", userTime);
        return departureTime === userTime; 
      });
      
      if (trainRow) {
        // Encontrar la fila completa y luego buscar el botón
        const trainButton = trainRow.closest("tr").querySelector("button.btn.btn-sm.btn-purple.no-width.margin-right-extra");
        if (trainButton) {
          trainFound = true;
          console.log("Train found! Clicking button...");
          trainButton.click();
          browser.runtime
            .sendMessage({
              action: "trainFound",
              trainTime: request.trainTime,
            })
            .catch((error) =>
              console.error("Error reporting train found:", error),
            );
        } else {
          console.error("Button not found in the row!");
        }
      } else {
        const currentTime = Date.now();
        if (currentTime - lastRefreshTime > 2000) {
          lastRefreshTime = currentTime;
          console.log("Train not found, refreshing page...");
          browser.runtime
            .sendMessage({ action: "pageRefreshed" })
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
