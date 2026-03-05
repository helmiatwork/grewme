<script lang="ts">
  interface Props {
    class?: string;
    lines?: number;
  }

  let { class: className = 'h-4 w-full', lines = 1 }: Props = $props();
</script>

{#each Array(lines) as _}
  <div class="animate-pulse bg-slate-200 rounded {className}"></div>
{/each}
