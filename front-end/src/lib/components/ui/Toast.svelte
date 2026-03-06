<script lang="ts">
  import type { Toast } from '$lib/stores/toasts.svelte';
  import { removeToast } from '$lib/stores/toasts.svelte';
  import { fly, fade } from 'svelte/transition';

  interface Props {
    toast: Toast;
  }

  let { toast }: Props = $props();

  const variantStyles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const variantBarColors: Record<string, string> = {
    info: 'bg-blue-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-red-400',
  };

  const variantIcons: Record<string, string> = {
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  function handleClose(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    removeToast(toast.id);
  }

  function handleDismiss() {
    removeToast(toast.id);
  }

  const baseClass = `w-80 border rounded-lg shadow-lg transition-shadow overflow-hidden`;
  const duration = `${toast.dismissAfterMs}ms`;
</script>

{#snippet toastContent()}
  <div class="flex items-start gap-3 p-4">
    <!-- Icon -->
    <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={variantIcons[toast.variant]} />
    </svg>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold">{toast.title}</p>
      <p class="text-sm mt-0.5 opacity-80 line-clamp-2">{toast.body}</p>
    </div>

    <!-- Close button -->
    <button
      class="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
      onclick={handleClose}
      aria-label="Dismiss notification"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  <!-- Progress bar -->
  <div class="h-1 w-full bg-black/5">
    <div
      class="h-full {variantBarColors[toast.variant]} toast-progress"
      style="animation-duration: {duration};"
    ></div>
  </div>
{/snippet}

{#if toast.href}
  <a
    href={toast.href}
    class="{baseClass} {variantStyles[toast.variant]} cursor-pointer hover:shadow-xl block no-underline"
    in:fly={{ x: 320, duration: 300 }}
    out:fade={{ duration: 200 }}
    onclick={handleDismiss}
  >
    {@render toastContent()}
  </a>
{:else}
  <div
    class="{baseClass} {variantStyles[toast.variant]}"
    in:fly={{ x: 320, duration: 300 }}
    out:fade={{ duration: 200 }}
    role="alert"
  >
    {@render toastContent()}
  </div>
{/if}

<style>
  .toast-progress {
    animation-name: shrink;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
</style>
