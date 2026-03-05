<script lang="ts">
  interface Props {
    urls: string[];
  }

  let { urls }: Props = $props();

  function isVideo(url: string): boolean {
    return /\.(mp4|webm|mov)(\?|$)/i.test(url);
  }
</script>

<div class="mb-3 rounded-lg overflow-hidden">
  {#if urls.length === 1}
    {#if isVideo(urls[0])}
      <video src={urls[0]} controls class="w-full max-h-96 object-cover rounded-lg">
        <track kind="captions" />
      </video>
    {:else}
      <img src={urls[0]} alt="Post media" class="w-full max-h-96 object-cover rounded-lg" />
    {/if}
  {:else}
    <div class="grid grid-cols-2 gap-1">
      {#each urls.slice(0, 4) as url, i}
        {#if isVideo(url)}
          <video src={url} controls class="w-full h-48 object-cover">
            <track kind="captions" />
          </video>
        {:else}
          <img src={url} alt="Post media {i + 1}" class="w-full h-48 object-cover" />
        {/if}
      {/each}
    </div>
    {#if urls.length > 4}
      <p class="text-xs text-text-muted mt-1">+{urls.length - 4} more</p>
    {/if}
  {/if}
</div>
