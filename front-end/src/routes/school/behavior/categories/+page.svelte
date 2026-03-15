<script lang="ts">
  import { Card, Button } from '$lib/components/ui';
  import { addToast } from '$lib/stores/toasts.svelte';
  import {
    CREATE_BEHAVIOR_CATEGORY_MUTATION,
    UPDATE_BEHAVIOR_CATEGORY_MUTATION,
    DELETE_BEHAVIOR_CATEGORY_MUTATION,
    REORDER_BEHAVIOR_CATEGORIES_MUTATION
  } from '$lib/api/queries/behavior';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // ---- Types ----------------------------------------------------------------
  interface BehaviorCategory {
    id: string;
    name: string;
    description: string | null;
    pointValue: number;
    isPositive: boolean;
    icon: string;
    color: string;
    position: number;
  }

  interface FormState {
    name: string;
    pointValue: number;
    icon: string;
    color: string;
    description: string;
    isPositive: boolean;
  }

  const defaultForm: FormState = {
    name: '',
    pointValue: 1,
    icon: '⭐',
    color: '#10b981',
    description: '',
    isPositive: true
  };

  // ---- State ----------------------------------------------------------------
  let categories = $state<BehaviorCategory[]>(data.categories ?? []);
  let showModal = $state(false);
  let editingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);
  let saving = $state(false);
  let deleting = $state(false);
  let form = $state<FormState>({ ...defaultForm });

  // ---- Derived --------------------------------------------------------------
  let positiveCategories = $derived(
    categories.filter(c => c.isPositive).sort((a, b) => a.position - b.position)
  );
  let negativeCategories = $derived(
    categories.filter(c => !c.isPositive).sort((a, b) => a.position - b.position)
  );

  // ---- Helpers --------------------------------------------------------------
  function openCreate(isPositive: boolean) {
    form = { ...defaultForm, isPositive, pointValue: isPositive ? 1 : -1, color: isPositive ? '#10b981' : '#ef4444' };
    editingId = null;
    showModal = true;
  }

  function openEdit(cat: BehaviorCategory) {
    form = {
      name: cat.name,
      pointValue: cat.pointValue,
      icon: cat.icon,
      color: cat.color,
      description: cat.description ?? '',
      isPositive: cat.isPositive
    };
    editingId = cat.id;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingId = null;
  }

  async function saveCategory() {
    if (!form.name.trim()) return;
    saving = true;

    try {
      if (editingId) {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: UPDATE_BEHAVIOR_CATEGORY_MUTATION,
            variables: {
              id: editingId,
              name: form.name.trim(),
              pointValue: Number(form.pointValue),
              icon: form.icon,
              color: form.color,
              description: form.description || null
            }
          })
        });
        const json = await res.json();
        const result = json?.data?.updateBehaviorCategory;

        if (result?.errors?.length) {
          addToast({ title: 'Error', body: result.errors[0].message, variant: 'error' });
          return;
        }

        const updated = result.behaviorCategory;
        categories = categories.map(c => c.id === editingId ? { ...c, ...updated } : c);
        addToast({ title: 'Saved', body: `${form.icon} ${form.name} updated`, variant: 'success', dismissAfterMs: 3000 });
      } else {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: CREATE_BEHAVIOR_CATEGORY_MUTATION,
            variables: {
              schoolId: data.schoolId,
              name: form.name.trim(),
              pointValue: Number(form.pointValue),
              icon: form.icon,
              color: form.color,
              description: form.description || null
            }
          })
        });
        const json = await res.json();
        const result = json?.data?.createBehaviorCategory;

        if (result?.errors?.length) {
          addToast({ title: 'Error', body: result.errors[0].message, variant: 'error' });
          return;
        }

        categories = [...categories, result.behaviorCategory];
        addToast({ title: 'Created', body: `${form.icon} ${form.name} added`, variant: 'success', dismissAfterMs: 3000 });
      }

      closeModal();
    } catch {
      addToast({ title: 'Error', body: 'Failed to save category', variant: 'error' });
    } finally {
      saving = false;
    }
  }

  async function confirmDelete(id: string) {
    deleting = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: DELETE_BEHAVIOR_CATEGORY_MUTATION,
          variables: { id }
        })
      });
      const json = await res.json();
      const result = json?.data?.deleteBehaviorCategory;

      if (result?.errors?.length) {
        addToast({ title: 'Error', body: result.errors[0].message, variant: 'error' });
        return;
      }

      categories = categories.filter(c => c.id !== id);
      addToast({ title: 'Deleted', body: 'Category removed', variant: 'info', dismissAfterMs: 3000 });
    } catch {
      addToast({ title: 'Error', body: 'Failed to delete category', variant: 'error' });
    } finally {
      deleting = false;
      deletingId = null;
    }
  }

  async function reorder(list: BehaviorCategory[], id: string, dir: 'up' | 'down') {
    const idx = list.findIndex(c => c.id === id);
    if (idx < 0) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === list.length - 1) return;

    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const newList = [...list];
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];

    // Update all categories array preserving the other polarity
    const others = categories.filter(c => c.isPositive !== list[0].isPositive);
    categories = [...others, ...newList];

    try {
      const allOrdered = [
        ...positiveCategories,
        ...negativeCategories
      ].map(c => c.id);

      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REORDER_BEHAVIOR_CATEGORIES_MUTATION,
          variables: { categoryIds: allOrdered }
        })
      });
    } catch {
      // Reorder is best-effort
    }
  }

  // Common icon options
  const commonIcons = ['⭐', '😊', '👍', '📚', '🎯', '🏆', '❤️', '💪', '🌟', '✅', '⚠️', '😞', '👎', '📵', '🚫', '😢'];
</script>

<svelte:head>
  <title>{(m as any).behavior_categories?.() ?? 'Behavior Categories'}</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <a href="/school/behavior" class="text-sm text-text-muted hover:text-primary transition-colors">
        ← {(m as any).behavior_dashboard?.() ?? 'Behavior Dashboard'}
      </a>
      <h1 class="text-2xl font-bold text-text mt-1">
        {(m as any).behavior_categories?.() ?? 'Behavior Categories'}
      </h1>
    </div>
  </div>

  {#if !data.schoolId}
    <Card>
      <p class="text-text-muted text-center py-4">School not found. Please contact support.</p>
    </Card>
  {:else}
    <div class="space-y-6">
      <!-- Positive section -->
      <Card>
        {#snippet header()}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 class="text-lg font-semibold text-text">
                {(m as any).behavior_positive_section?.() ?? 'Positive Behaviors'}
                <span class="text-sm font-normal text-text-muted ml-1">({positiveCategories.length})</span>
              </h2>
            </div>
            <Button size="sm" variant="outline" onclick={() => openCreate(true)}>
              + {(m as any).behavior_add_category?.() ?? 'Add Category'}
            </Button>
          </div>
        {/snippet}

        {#if positiveCategories.length === 0}
          <p class="text-text-muted text-center py-6 text-sm">
            No positive behaviors yet. Add one above.
          </p>
        {:else}
          <div class="divide-y divide-slate-100 -mx-6 -my-4">
            {#each positiveCategories as cat, idx (cat.id)}
              <div class="flex items-center gap-3 px-6 py-3">
                <!-- Icon + color swatch -->
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style="background: {cat.color}20; border: 1px solid {cat.color}40"
                >
                  {cat.icon}
                </div>

                <!-- Name + description -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-text">{cat.name}</p>
                  {#if cat.description}
                    <p class="text-xs text-text-muted truncate">{cat.description}</p>
                  {/if}
                </div>

                <!-- Point badge -->
                <span class="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  +{cat.pointValue}
                </span>

                <!-- Color swatch -->
                <div class="w-5 h-5 rounded-full border border-slate-200 flex-shrink-0" style="background: {cat.color}"></div>

                <!-- Order controls -->
                <div class="flex flex-col gap-0.5">
                  <button
                    onclick={() => reorder(positiveCategories, cat.id, 'up')}
                    disabled={idx === 0}
                    class="text-slate-400 hover:text-text disabled:opacity-20 text-xs leading-none"
                    aria-label="Move up"
                  >▲</button>
                  <button
                    onclick={() => reorder(positiveCategories, cat.id, 'down')}
                    disabled={idx === positiveCategories.length - 1}
                    class="text-slate-400 hover:text-text disabled:opacity-20 text-xs leading-none"
                    aria-label="Move down"
                  >▼</button>
                </div>

                <!-- Actions -->
                <button
                  onclick={() => openEdit(cat)}
                  class="text-slate-400 hover:text-primary transition-colors text-sm p-1"
                  aria-label="Edit"
                >✏️</button>
                <button
                  onclick={() => deletingId = cat.id}
                  class="text-slate-400 hover:text-red-500 transition-colors text-sm p-1"
                  aria-label="Delete"
                >🗑️</button>
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <!-- Negative section -->
      <Card>
        {#snippet header()}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <h2 class="text-lg font-semibold text-text">
                {(m as any).behavior_negative_section?.() ?? 'Negative Behaviors'}
                <span class="text-sm font-normal text-text-muted ml-1">({negativeCategories.length})</span>
              </h2>
            </div>
            <Button size="sm" variant="outline" onclick={() => openCreate(false)}>
              + {(m as any).behavior_add_category?.() ?? 'Add Category'}
            </Button>
          </div>
        {/snippet}

        {#if negativeCategories.length === 0}
          <p class="text-text-muted text-center py-6 text-sm">
            No negative behaviors yet. Add one above.
          </p>
        {:else}
          <div class="divide-y divide-slate-100 -mx-6 -my-4">
            {#each negativeCategories as cat, idx (cat.id)}
              <div class="flex items-center gap-3 px-6 py-3">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style="background: {cat.color}20; border: 1px solid {cat.color}40"
                >
                  {cat.icon}
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-medium text-text">{cat.name}</p>
                  {#if cat.description}
                    <p class="text-xs text-text-muted truncate">{cat.description}</p>
                  {/if}
                </div>

                <span class="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  {cat.pointValue}
                </span>

                <div class="w-5 h-5 rounded-full border border-slate-200 flex-shrink-0" style="background: {cat.color}"></div>

                <div class="flex flex-col gap-0.5">
                  <button
                    onclick={() => reorder(negativeCategories, cat.id, 'up')}
                    disabled={idx === 0}
                    class="text-slate-400 hover:text-text disabled:opacity-20 text-xs leading-none"
                  >▲</button>
                  <button
                    onclick={() => reorder(negativeCategories, cat.id, 'down')}
                    disabled={idx === negativeCategories.length - 1}
                    class="text-slate-400 hover:text-text disabled:opacity-20 text-xs leading-none"
                  >▼</button>
                </div>

                <button onclick={() => openEdit(cat)} class="text-slate-400 hover:text-primary transition-colors text-sm p-1">✏️</button>
                <button onclick={() => deletingId = cat.id} class="text-slate-400 hover:text-red-500 transition-colors text-sm p-1">🗑️</button>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    </div>
  {/if}
</div>

<!-- ── Create/Edit Modal ─────────────────────────────────────── -->
{#if showModal}
  <div
    class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" onclick={(e) => e.stopPropagation()}>
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-lg font-semibold text-text">
          {editingId
            ? ((m as any).behavior_edit_category?.() ?? 'Edit Category')
            : ((m as any).behavior_add_category?.() ?? 'Add Category')}
        </h2>
      </div>

      <div class="px-6 py-4 space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-text mb-1" for="cat-name">Name</label>
          <input
            id="cat-name"
            type="text"
            bind:value={form.name}
            placeholder="e.g. Helping Others"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Point value -->
        <div>
          <label class="block text-sm font-medium text-text mb-1" for="cat-points">
            Point Value {form.isPositive ? '(positive)' : '(negative — enter negative number)'}
          </label>
          <input
            id="cat-points"
            type="number"
            bind:value={form.pointValue}
            min={form.isPositive ? 1 : -100}
            max={form.isPositive ? 100 : -1}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Icon picker -->
        <div>
          <label class="block text-sm font-medium text-text mb-1">Icon</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            {#each commonIcons as icon}
              <button
                onclick={() => form.icon = icon}
                class="w-8 h-8 text-xl flex items-center justify-center rounded-lg transition-all
                  {form.icon === icon ? 'bg-primary/10 ring-2 ring-primary scale-110' : 'bg-slate-50 hover:bg-slate-100'}"
              >
                {icon}
              </button>
            {/each}
          </div>
          <input
            type="text"
            bind:value={form.icon}
            maxlength="4"
            placeholder="or type any emoji"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Color -->
        <div>
          <label class="block text-sm font-medium text-text mb-1" for="cat-color">Color</label>
          <div class="flex items-center gap-3">
            <input
              id="cat-color"
              type="color"
              bind:value={form.color}
              class="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            />
            <span class="text-sm font-mono text-text-muted">{form.color}</span>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-text mb-1" for="cat-desc">Description (optional)</label>
          <input
            id="cat-desc"
            type="text"
            bind:value={form.description}
            placeholder="Brief description..."
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
        <Button variant="ghost" onclick={closeModal}>{m.common_cancel()}</Button>
        <Button onclick={saveCategory} loading={saving} disabled={!form.name.trim()}>
          {m.common_save()}
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- ── Delete Confirmation ──────────────────────────────────── -->
{#if deletingId}
  {@const cat = categories.find(c => c.id === deletingId)}
  <div
    class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div class="text-center mb-4">
        <div class="text-4xl mb-3">{cat?.icon ?? '🗑️'}</div>
        <h3 class="text-lg font-semibold text-text mb-1">{m.common_delete()} {cat?.name}</h3>
        <p class="text-sm text-text-muted">
          {(m as any).behavior_delete_confirm?.() ?? 'Delete this category? Existing points will be preserved.'}
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="ghost" class="flex-1" onclick={() => deletingId = null}>{m.common_cancel()}</Button>
        <Button variant="danger" class="flex-1" loading={deleting} onclick={() => confirmDelete(deletingId!)}>
          {m.common_delete()}
        </Button>
      </div>
    </div>
  </div>
{/if}
