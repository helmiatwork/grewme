<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  let { data } = $props();
</script>

<svelte:head>
  <title>Health History — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <h1 class="text-2xl font-bold text-text mb-6">{m.health_history_title()}</h1>

  {#if data.error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{data.error}</div>
  {/if}

  {#if data.checkups?.length > 0}
    <!-- Growth Summary -->
    {@const latest = data.checkups[0]}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">{m.health_latest_weight()}</p>
        <p class="text-2xl font-bold text-text mt-1">{latest.weightKg ?? '—'}<span class="text-sm font-normal text-text-muted"> kg</span></p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">{m.health_latest_height()}</p>
        <p class="text-2xl font-bold text-text mt-1">{latest.heightCm ?? '—'}<span class="text-sm font-normal text-text-muted"> cm</span></p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">{m.health_bmi()}</p>
        <p class="text-2xl font-bold text-text mt-1">{latest.bmi ?? '—'}</p>
        {#if latest.bmiCategory && latest.bmiCategory !== 'normal'}
          <p class="text-xs text-amber-600 mt-0.5">{latest.bmiCategory.replace('_', ' ')}</p>
        {:else if latest.bmiCategory === 'normal'}
          <p class="text-xs text-green-600 mt-0.5">normal</p>
        {/if}
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">{m.health_checkup_count()}</p>
        <p class="text-2xl font-bold text-text mt-1">{data.checkups.length}</p>
      </div>
    </div>

    <!-- History Table -->
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-lg font-semibold text-text">{m.health_all_measurements()}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-text-muted">{m.health_col_date()}</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">{m.health_col_weight()}</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">{m.health_col_height()}</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">{m.health_col_head()}</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">{m.health_col_bmi()}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.checkups as checkup}
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 text-text">{new Date(checkup.measuredAt).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.weightKg ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.heightCm ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.headCircumferenceCm ?? '—'}</td>
                <td class="px-4 py-3 text-right font-medium text-text">{checkup.bmi ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 px-6 py-12 text-center">
      <p class="text-text-muted">{m.health_no_checkups()}</p>
      <p class="text-sm text-text-muted mt-1">{m.health_no_checkups_parent_hint()}</p>
    </div>
  {/if}
</div>
