<style>
</style>

<script>
import { parseCommand, execCommand } from "./command.js";
let textarea;
let message;
let messageType;

function onKeyUp(e) {
  if (e.key === "Enter" || e.keyCode == 13) {
    const command = parseCommand(textarea.value);
    if (command.error) {
      message = command.error;
      messageType = "error";
    } else {
      const rs = execCommand(command);
      if (rs.error) {
        message = rs.error;
        messageType = "error";
      } else {
        message = rs.message || "Success";
        messageType = "success";
      }
    }
  }
}
</script>

<div class="modal micromodal-slide" id="query-modal" aria-hidden="true">
  <div class="modal__overlay" tabindex="-1" data-micromodal-close>
    <div class="modal__container" role="dialog" aria-modal="true">
      <textarea
        id="query-input"
        placeholder="from scope.table where column_a = null"
        rows="4"
        bind:this="{textarea}"
        on:keyup="{onKeyUp}"></textarea>
      {#if message}
        <span class="query-{messageType}">{message}</span>
      {/if}
    </div>
  </div>
</div>
