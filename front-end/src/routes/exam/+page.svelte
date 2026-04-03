<script lang="ts">
  import { goto } from '$app/navigation';
  import * as m from '$lib/paraglide/messages.js';

  let code = $state('');
  let error = $state('');

  function handleSubmit() {
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 6) {
      error = m.exam_entry_invalid_code();
      return;
    }
    error = '';
    goto(`/exam/${cleaned}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md text-center">
    <h1 class="mb-2 text-3xl font-bold text-gray-900">{m.app_name()}</h1>
    <p class="mb-8 text-gray-500">{m.exam_entry_hint()}</p>

    <input
      type="text"
      bind:value={code}
      onkeydown={handleKeydown}
      placeholder={m.exam_entry_placeholder()}
      maxlength="6"
      class="w-full rounded-xl border-2 border-gray-200 p-4 text-center text-2xl font-mono uppercase tracking-widest focus:border-blue-500 focus:outline-none"
      autofocus
    />

    {#if error}
      <p class="mt-2 text-sm text-red-500">{error}</p>
    {/if}

    <button
      onclick={handleSubmit}
      disabled={code.trim().length < 6}
      class="mt-4 w-full rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
    >
      {m.exam_entry_join_btn()}
    </button>
  </div>
</div>
