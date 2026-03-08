<script lang="ts">
  import { Card, Button, Alert, Badge } from '$lib/components/ui';
  import { CREATE_CLASSROOM_EVENT_MUTATION, DELETE_CLASSROOM_EVENT_MUTATION } from '$lib/api/queries/calendar';
  import type { ClassroomEvent } from '$lib/api/types';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // ── Calendar state ─────────────────────────────────────────────────────────
  const todayDate = new Date();
  let viewYear = $state(todayDate.getFullYear());
  let viewMonth = $state(todayDate.getMonth()); // 0-indexed
  let selectedDay: number | null = $state(null);

  // ── Modal state ────────────────────────────────────────────────────────────
  let showModal = $state(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  let formClassroomId = $state('');
  let formTitle = $state('');
  let formDate = $state('');
  let formStartTime = $state('');
  let formEndTime = $state('');
  let formDescription = $state('');
  let formError = $state('');
  let submitting = $state(false);
  let deletingId: string | null = $state(null);

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const calendarDays = $derived.by(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{ day: number; currentMonth: boolean }> = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrev - i, currentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, currentMonth: true });
    }
    let trailing = 1;
    while (cells.length < 42) {
      cells.push({ day: trailing++, currentMonth: false });
    }
    return cells;
  });

  const eventDaysInView = $derived.by(() => {
    const set = new Set<number>();
    for (const ev of data.events) {
      const d = new Date(ev.eventDate);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        set.add(d.getDate());
      }
    }
    return set;
  });

  const visibleEvents = $derived.by((): ClassroomEvent[] => {
    if (selectedDay === null) return data.events;
    const pad = (n: number) => String(n).padStart(2, '0');
    const dayStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(selectedDay)}`;
    return data.events.filter((ev) => ev.eventDate === dayStr);
  });

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goNextMonth() {
    selectedDay = null;
    if (viewMonth === 11) { viewMonth = 0; viewYear += 1; }
    else { viewMonth += 1; }
  }

  function goPrevMonth() {
    if (viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()) return;
    selectedDay = null;
    if (viewMonth === 0) { viewMonth = 11; viewYear -= 1; }
    else { viewMonth -= 1; }
  }

  function goToday() {
    selectedDay = null;
    viewYear = todayDate.getFullYear();
    viewMonth = todayDate.getMonth();
  }

  function toggleDay(day: number, currentMonth: boolean) {
    if (!currentMonth) return;
    selectedDay = selectedDay === day ? null : day;
  }

  function isToday(day: number, currentMonth: boolean) {
    return currentMonth &&
      day === todayDate.getDate() &&
      viewMonth === todayDate.getMonth() &&
      viewYear === todayDate.getFullYear();
  }

  const isCurrentMonth = $derived(
    viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()
  );

  // ── Formatting ──────────────────────────────────────────────────────────────
  function formatEventDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatTime(t: string | null): string {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function formatTimeRange(start: string | null, end: string | null): string {
    if (!start && !end) return '';
    if (start && end) return `${formatTime(start)} – ${formatTime(end)}`;
    if (start) return `From ${formatTime(start)}`;
    return `Until ${formatTime(end)}`;
  }

  function creatorLabel(type: string): string {
    return type === 'Teacher' ? '👩‍🏫 Teacher' : '👨‍👩‍👧 Parent';
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openModal() {
    formClassroomId = '';
    formTitle = '';
    formDate = '';
    formStartTime = '';
    formEndTime = '';
    formDescription = '';
    formError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  // ── Create event ────────────────────────────────────────────────────────────
  async function handleCreate(e: SubmitEvent) {
    e.preventDefault();
    if (!formClassroomId || !formTitle.trim() || !formDate) {
      formError = 'Classroom, title and date are required.';
      return;
    }
    submitting = true;
    formError = '';
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: CREATE_CLASSROOM_EVENT_MUTATION,
          variables: {
            classroomId: formClassroomId,
            title: formTitle.trim(),
            eventDate: formDate,
            startTime: formStartTime || null,
            endTime: formEndTime || null,
            description: formDescription.trim() || null
          }
        })
      });
      const json = await res.json();
      const errors = json.data?.createClassroomEvent?.errors;
      if (errors?.length > 0) {
        formError = errors[0].message;
      } else {
        showModal = false;
        window.location.reload();
      }
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Something went wrong.';
    } finally {
      submitting = false;
    }
  }

  // ── Delete event ─────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    deletingId = id;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: DELETE_CLASSROOM_EVENT_MUTATION,
          variables: { id }
        })
      });
      const json = await res.json();
      if (json.data?.deleteClassroomEvent?.success) {
        window.location.reload();
      }
    } catch {
      // silently ignore
    } finally {
      deletingId = null;
    }
  }
</script>

<svelte:head>
  <title>{m.calendar_title()} — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">{m.calendar_title()}</h1>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- ── Left column: Calendar Grid ──────────────────────────────────── -->
    <div>
      <Card>
        {#snippet header()}
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <div class="flex gap-1">
              <Button variant="ghost" size="sm" onclick={goPrevMonth} disabled={isCurrentMonth}>{m.calendar_prev()}</Button>
              <Button variant="ghost" size="sm" onclick={goToday}>{m.calendar_today()}</Button>
              <Button variant="ghost" size="sm" onclick={goNextMonth}>{m.calendar_next()}</Button>
              <Button size="sm" onclick={openModal}>{m.calendar_add_event()}</Button>
            </div>
          </div>
        {/snippet}
        {#snippet children()}
          <!-- Day labels -->
          <div class="grid grid-cols-7 mb-1">
            {#each DAY_LABELS as label}
              <div class="text-center text-xs font-medium text-text-muted py-1">{label}</div>
            {/each}
          </div>

          <!-- Day cells -->
          <div class="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden">
            {#each calendarDays as cell (cell.day + '-' + cell.currentMonth)}
              <button
                type="button"
                onclick={() => toggleDay(cell.day, cell.currentMonth)}
                disabled={!cell.currentMonth}
                class="
                  relative flex flex-col items-center pt-1.5 pb-2 min-h-[52px] bg-white transition-colors
                  {!cell.currentMonth ? 'text-slate-300 cursor-default' : 'cursor-pointer hover:bg-slate-50'}
                  {cell.currentMonth && selectedDay === cell.day ? 'bg-primary/10 hover:bg-primary/15' : ''}
                "
              >
                <span
                  class="
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                    {isToday(cell.day, cell.currentMonth) ? 'ring-2 ring-primary ring-offset-1 text-primary font-bold' : ''}
                    {cell.currentMonth && selectedDay === cell.day ? 'bg-primary text-white' : ''}
                  "
                >
                  {cell.day}
                </span>
                {#if cell.currentMonth && eventDaysInView.has(cell.day)}
                  <span class="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
                {/if}
              </button>
            {/each}
          </div>
        {/snippet}
      </Card>
    </div>

    <!-- ── Right column: Event List ────────────────────────────────────── -->
    <div>
      <h2 class="text-lg font-semibold text-text mb-3">
        {#if selectedDay !== null}
          {m.calendar_events_for({ month: MONTH_NAMES[viewMonth], day: selectedDay })}
          <button
            type="button"
            onclick={() => selectedDay = null}
            class="ml-2 text-sm font-normal text-text-muted hover:text-text underline"
          >
            {m.calendar_show_all()}
          </button>
        {:else}
          {m.calendar_all_events()}
        {/if}
      </h2>

      {#if visibleEvents.length === 0}
        <div class="text-center py-10 text-text-muted bg-slate-50 rounded-xl border border-slate-100">
          <p class="text-4xl mb-2">📅</p>
          <p class="text-sm">{selectedDay !== null ? m.calendar_no_events_day() : m.calendar_no_events()}</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each visibleEvents as event (event.id)}
            <Card>
              {#snippet children()}
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="font-semibold text-text truncate">{event.title}</span>
                      <Badge variant="primary">
                        {#snippet children()}{event.classroom.name}{/snippet}
                      </Badge>
                    </div>

                    <div class="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-text-muted">
                      <span>📅 {formatEventDate(event.eventDate)}</span>
                      {#if event.startTime || event.endTime}
                        <span>🕐 {formatTimeRange(event.startTime, event.endTime)}</span>
                      {/if}
                      <span>{creatorLabel(event.creatorType)} {event.creatorName}</span>
                    </div>

                    {#if event.description}
                      <p class="mt-1.5 text-sm text-text-muted line-clamp-2">{event.description}</p>
                    {/if}
                  </div>

                  {#if event.isMine}
                    <button
                      type="button"
                      onclick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      aria-label="Delete event"
                      class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {#if deletingId === event.id}
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                        </svg>
                      {:else}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      {/if}
                    </button>
                  {/if}
                </div>
              {/snippet}
            </Card>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- ── Add Event Modal ──────────────────────────────────────────────────── -->
{#if showModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}
  >
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0" onclick={closeModal}></div>

    <!-- Modal content -->
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text">{m.calendar_add_modal_title()}</h2>
        <button
          type="button"
          onclick={closeModal}
          class="p-1 rounded-lg text-text-muted hover:text-text hover:bg-slate-100 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {#if formError}
        <div class="mb-4">
          <Alert variant="error">{formError}</Alert>
        </div>
      {/if}

      <form onsubmit={handleCreate} class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label for="modal-classroomId" class="block text-sm font-medium text-text mb-1">{m.calendar_classroom_label()}</label>
          <select
            id="modal-classroomId"
            bind:value={formClassroomId}
            required
            disabled={submitting}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
              <option value="">{m.calendar_select_classroom()}</option>
            {#each data.classrooms as classroom}
              <option value={classroom.id}>{classroom.name}</option>
            {/each}
          </select>
        </div>

        <div class="sm:col-span-2">
          <label for="modal-title" class="block text-sm font-medium text-text mb-1">{m.calendar_event_title_label()}</label>
          <input
            id="modal-title"
            type="text"
            bind:value={formTitle}
            required
            disabled={submitting}
            placeholder={m.calendar_event_title_placeholder()}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label for="modal-eventDate" class="block text-sm font-medium text-text mb-1">{m.calendar_date_label()}</label>
          <input
            id="modal-eventDate"
            type="date"
            bind:value={formDate}
            required
            disabled={submitting}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label for="modal-startTime" class="block text-sm font-medium text-text mb-1">
            {m.calendar_start_time()}
          </label>
          <input
            id="modal-startTime"
            type="time"
            bind:value={formStartTime}
            disabled={submitting}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label for="modal-endTime" class="block text-sm font-medium text-text mb-1">
            {m.calendar_end_time()}
          </label>
          <input
            id="modal-endTime"
            type="time"
            bind:value={formEndTime}
            disabled={submitting}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div class="sm:col-span-2">
          <label for="modal-description" class="block text-sm font-medium text-text mb-1">
            {m.calendar_description_label()}
          </label>
          <textarea
            id="modal-description"
            bind:value={formDescription}
            disabled={submitting}
            rows={2}
            placeholder={m.calendar_description_placeholder()}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          ></textarea>
        </div>

        <div class="sm:col-span-2 flex gap-3 justify-end">
          <Button variant="ghost" type="button" onclick={closeModal} disabled={submitting}>{m.common_cancel()}</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? m.calendar_saving_event() : m.calendar_save_event()}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
