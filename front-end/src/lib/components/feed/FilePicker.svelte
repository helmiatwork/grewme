<script lang="ts">
  interface Props {
    files: File[];
    onchange: (files: File[]) => void;
    disabled?: boolean;
    maxFiles?: number;
    accept?: string;
  }

  let { files, onchange, disabled = false, maxFiles = 4, accept = 'image/*,video/*' }: Props = $props();

  let inputEl: HTMLInputElement = $state()!;

  function handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = [...files, ...Array.from(input.files)].slice(0, maxFiles);
    onchange(newFiles);
    input.value = '';
  }

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    onchange(newFiles);
  }

  function isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
</script>

<div class="space-y-3">
  {#if files.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each files as file, i}
        <div class="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          {#if isImage(file)}
            <img src={URL.createObjectURL(file)} alt={file.name} class="w-full h-full object-cover" />
          {:else}
            <div class="flex flex-col items-center justify-center h-full p-1">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="text-[10px] text-slate-500 truncate w-full text-center mt-1">{formatSize(file.size)}</span>
            </div>
          {/if}
          <button
            type="button"
            onclick={() => removeFile(i)}
            class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove {file.name}"
          >
            &times;
          </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if files.length < maxFiles}
    <button
      type="button"
      onclick={() => inputEl.click()}
      {disabled}
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      Attach media ({files.length}/{maxFiles})
    </button>
    <input
      bind:this={inputEl}
      type="file"
      {accept}
      multiple
      class="hidden"
      onchange={handleChange}
    />
  {/if}
</div>
