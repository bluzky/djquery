import DjQuery from "./DjQuery.svelte";

var elemDiv = document.createElement("div");
elemDiv.id = "djquery";
elemDiv.style.cssText = "";
elemDiv.innerHTML = "<dj-query></dj-query>";
document.body.appendChild(elemDiv);
