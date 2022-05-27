<style>
</style>

<script>
import { parseQuery } from "./parser.js";
let textarea;
let errorMessage;

function onKeyUp(e) {
  if (e.key === "Enter" || e.keyCode == 13) {
    const query = parseQuery(textarea.value);
    if (query.error) {
      errorMessage = query.error;
    } else {
      const url = new URL(window.location.href);
      url.pathname = query.path;
      url.search = `?${query.query}`;
      window.location.href = url.href;
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
      {#if errorMessage}
        <span class="query-error">{errorMessage}</span>
      {/if}
    </div>
  </div>
</div>
