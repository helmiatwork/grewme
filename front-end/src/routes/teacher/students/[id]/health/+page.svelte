<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let showForm = $state(false);
</script>

<svelte:head>
  <title>Health Checkups — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">Health Checkups</h1>
    <button
      onclick={() => showForm = !showForm}
      class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
    >
      {showForm ? 'Cancel' : '+ New Checkup'}
    </button>
  </div>

  {#if form?.error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{form.error}</div>
  {/if}

  {#if form?.success}
    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{form.success}</div>
  {/if}

  {#if showForm}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">Record Measurement</h2>
      <form method="POST" action="?/create" use:enhance={() => {
        return async ({ update }) => {
          await update();
          showForm = false;
        };
      }}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="measuredAt" class="block text-sm font-medium text-text mb-1">Date *</label>
            <input type="date" id="measuredAt" name="measuredAt" required
              value={new Date().toISOString().split('T')[0]}
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label for="weightKg" class="block text-sm font-medium text-text mb-1">Weight (kg)</label>
            <input type="number" id="weightKg" name="weightKg" step="0.01" min="0.1" max="200"
              placeholder="e.g. 20.5"
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label for="heightCm" class="block text-sm font-medium text-text mb-1">Height (cm)</label>
            <input type="number" id="heightCm" name="heightCm" step="0.1" min="1" max="250"
              placeholder="e.g. 115.0"
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label for="headCircumferenceCm" class="block text-sm font-medium text-text mb-1">Head Circumference (cm)</label>
            <input type="number" id="headCircumferenceCm" name="headCircumferenceCm" step="0.1" min="1" max="100"
              placeholder="e.g. 51.0"
              class="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <div class="mt-4">
          <label for="notes" class="block text-sm font-medium text-text mb-1">Notes</label>
          <textarea id="notes" name="notes" rows="2" placeholder="Optional observations..."
            class="w-full p-2.5 border border-slate-200 rounded-lg text-sm"></textarea>
        </div>
        <p class="text-xs text-text-muted mt-2">* At least one measurement (weight, height, or head circumference) is required.</p>
        <button type="submit" class="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
          Save Checkup
        </button>
      </form>
    </div>
  {/if}

  <!-- History -->
  <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100">
      <h2 class="text-lg font-semibold text-text">History</h2>
    </div>
    {#if data.checkups?.length > 0}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-text-muted">Date</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Weight (kg)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Height (cm)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">Head (cm)</th>
              <th class="px-4 py-3 text-right font-medium text-text-muted">BMI</th>
              <th class="px-4 py-3 text-left font-medium text-text-muted">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.checkups as checkup}
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 text-text">{new Date(checkup.measuredAt).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.weightKg ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.heightCm ?? '—'}</td>
                <td class="px-4 py-3 text-right text-text">{checkup.headCircumferenceCm ?? '—'}</td>
                <td class="px-4 py-3 text-right">
                  {#if checkup.bmi}
                    <span class="font-medium">{checkup.bmi}</span>
                    <span class="text-xs text-text-muted ml-1">
                      {checkup.bmiCategory === 'normal' ? '' :
                       checkup.bmiCategory === 'underweight' ? '(low)' :
                       checkup.bmiCategory === 'severely_underweight' ? '(very low)' :
                       checkup.bmiCategory === 'overweight' ? '(high)' : '(very high)'}
                    </span>
                  {:else}
                    —
                  {/if}
                </td>
                <td class="px-4 py-3 text-text-muted text-xs">{checkup.notes ?? ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="px-6 py-12 text-center text-text-muted">
        <p>No health checkups recorded yet.</p>
        <p class="text-sm mt-1">Click "+ New Checkup" to record the first measurement.</p>
      </div>
    {/if}
  </div>
</div>
