<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createConsumer } from '@rails/actioncable';
  import type { Consumer, Subscription } from '@rails/actioncable';

  let { data } = $props();

  // ---- Types ----------------------------------------------------------------
  interface StudentCard {
    studentId: string;
    name: string;
    totalPoints: number;
    positiveCount: number;
    negativeCount: number;
  }

  // ---- State ----------------------------------------------------------------
  let students = $state<StudentCard[]>([]);
  let loading = $state(true);
  let wsConnected = $state(false);
  let glowMap = $state<Map<string, 'positive' | 'negative'>>(new Map());

  let consumer: Consumer | null = null;
  let subscription: Subscription | null = null;

  // ---- Derived --------------------------------------------------------------
  let classMax = $derived(Math.max(...students.map(s => Math.abs(s.totalPoints)), 1));

  // ---- Lifecycle ------------------------------------------------------------
  onMount(async () => {
    await loadData();
    connectWebSocket();
  });

  onDestroy(() => {
    subscription?.unsubscribe();
    consumer?.disconnect();
  });

  async function loadData() {
    loading = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query ClassroomBehaviorToday($classroomId: ID!) {
              classroomBehaviorToday(classroomId: $classroomId) {
                student { id name }
                totalPoints
                positiveCount
                negativeCount
              }
            }
          `,
          variables: { classroomId: data.classroomId }
        })
      });
      const json = await res.json();
      const raw = json?.data?.classroomBehaviorToday ?? [];
      students = raw.map((s: any) => ({
        studentId: s.student.id,
        name: s.student.name,
        totalPoints: s.totalPoints,
        positiveCount: s.positiveCount,
        negativeCount: s.negativeCount
      }));
    } catch {
      // silently retry
    } finally {
      loading = false;
    }
  }

  function connectWebSocket() {
    const cableUrl = data.cableUrl || 'ws://localhost:3004/cable';
    const wsUrl = data.accessToken
      ? `${cableUrl}?token=${encodeURIComponent(data.accessToken)}`
      : cableUrl;

    consumer = createConsumer(wsUrl);
    subscription = consumer.subscriptions.create(
      { channel: 'BehaviorChannel', classroom_id: data.classroomId },
      {
        connected() {
          wsConnected = true;
        },
        disconnected() {
          wsConnected = false;
          // Retry after 3s
          setTimeout(() => {
            if (consumer) {
              consumer.disconnect();
              consumer = null;
              subscription = null;
            }
            connectWebSocket();
          }, 3000);
        },
        rejected() {
          wsConnected = false;
        },
        received(payload: any) {
          handleUpdate(payload);
        }
      }
    );
  }

  function handleUpdate(payload: any) {
    const { studentId, totalPoints, positiveCount, negativeCount, pointValue } = payload;

    students = students.map(s => {
      if (s.studentId !== studentId) return s;
      return { ...s, totalPoints, positiveCount, negativeCount };
    });

    // Trigger glow animation
    const glowType = pointValue > 0 ? 'positive' : 'negative';
    const next = new Map(glowMap);
    next.set(studentId, glowType);
    glowMap = next;

    setTimeout(() => {
      const cleanup = new Map(glowMap);
      cleanup.delete(studentId);
      glowMap = cleanup;
    }, 1200);
  }

  function progressWidth(points: number): number {
    if (classMax === 0) return 0;
    return Math.round((Math.abs(points) / classMax) * 100);
  }

  function pointColor(total: number): string {
    if (total > 0) return '#10b981';
    if (total < 0) return '#ef4444';
    return '#94a3b8';
  }

  function close() {
    if (typeof window !== 'undefined') window.close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:head>
  <title>Behavior Display</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="projection-root">
  <!-- Header bar -->
  <div class="top-bar">
    <div class="header-left">
      <span class="school-icon">⭐</span>
      <span class="header-title">Behavior Points</span>
    </div>
    <div class="header-right">
      {#if !wsConnected}
        <span class="reconnecting-badge">
          <span class="pulse-dot"></span>
          Reconnecting...
        </span>
      {:else}
        <span class="live-badge">
          <span class="live-dot"></span>
          LIVE
        </span>
      {/if}
      <button class="close-btn" onclick={close} aria-label="Close">✕</button>
    </div>
  </div>

  <!-- Student grid -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
    </div>
  {:else}
    <div class="student-grid" style="--col-count: {Math.min(students.length, 6)}">
      {#each students as student (student.studentId)}
        {@const glow = glowMap.get(student.studentId)}
        <div
          class="student-card {glow ? 'glow-' + glow : ''}"
        >
          <div class="student-name">{student.name}</div>
          <div class="student-points" style="color: {pointColor(student.totalPoints)}">
            {student.totalPoints > 0 ? '+' : ''}{student.totalPoints}
          </div>
          <!-- Progress bar -->
          <div class="progress-track">
            <div
              class="progress-fill"
              style="width: {progressWidth(student.totalPoints)}%; background: {pointColor(student.totalPoints)}"
            ></div>
          </div>
          <div class="point-stats">
            <span class="positive-stat">+{student.positiveCount}</span>
            <span class="negative-stat">-{student.negativeCount}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .projection-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    display: flex;
    flex-direction: column;
    color: white;
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .school-icon {
    font-size: 1.5rem;
  }

  .header-title {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.9);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #10b981;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .reconnecting-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #f59e0b;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: #f59e0b;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .loading-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .student-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(var(--col-count, 4), 1fr);
    gap: 1.25rem;
    padding: 1.5rem 2rem;
    align-content: start;
    overflow-y: auto;
  }

  @media (max-width: 900px) {
    .student-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 600px) {
    .student-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .student-card {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 1.25rem 1rem;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .student-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .student-card.glow-positive {
    animation: glow-green 1.2s ease-out;
    border-color: rgba(16, 185, 129, 0.7);
  }

  .student-card.glow-negative {
    animation: glow-red 1.2s ease-out;
    border-color: rgba(239, 68, 68, 0.7);
  }

  .student-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .student-points {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 0.75rem;
    font-variant-numeric: tabular-nums;
    transition: color 0.3s;
  }

  .progress-track {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .point-stats {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .positive-stat { color: #10b981; }
  .negative-stat { color: #ef4444; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes glow-green {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); background: rgba(255,255,255,0.06); }
    30% { box-shadow: 0 0 30px 8px rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.15); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); background: rgba(255,255,255,0.06); }
  }

  @keyframes glow-red {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); background: rgba(255,255,255,0.06); }
    30% { box-shadow: 0 0 30px 8px rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); background: rgba(255,255,255,0.06); }
  }
</style>
