import MicroModal from "micromodal";
import DjQuery from "./DjQuery.svelte";

// Inject html model
function injectHtml() {
  var elemDiv = document.createElement("div");
  elemDiv.id = "djquery";
  elemDiv.style.cssText = "";
  document.body.appendChild(elemDiv);

  try {
    new DjQuery({
      target: elemDiv,
    });
  } catch (e) {
    console.log(e);
  }
}

// binding hotkey to toggle query input
function bindHotkey() {
  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "j") {
      MicroModal.show("query-modal");
    }
  });
}

function init() {
  injectHtml();
  bindHotkey();
  MicroModal.init();
}

init();
