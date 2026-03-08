<script lang="ts">
  import { Badge } from '$lib/components/ui';
  import type { SessionUser } from '$lib/api/types';
  import { getNotifications } from '$lib/stores/notifications.svelte';
  import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    user: SessionUser;
  }

  let { user }: Props = $props();

  const notifs = getNotifications();
  let showDropdown = $state(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  async function markAsRead(id: string) {
    await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation MarkNotificationRead($id: ID!) {
          markNotificationRead(id: $id) {
            notification { id read }
            errors { message }
          }
        }`,
        variables: { id }
      })
    });
  }
</script>

<header class="bg-surface border-b border-slate-100 px-6 py-3 flex items-center justify-between">
  <div></div>
  <div class="flex items-center gap-4">
    {#if user.type === 'Parent' || user.type === 'Teacher'}
      <!-- Notification Bell -->
      <div class="relative">
        <button
          onclick={toggleDropdown}
          class="relative p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-slate-100 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {#if notifs.unreadCount > 0}
            <span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {notifs.unreadCount > 99 ? '99+' : notifs.unreadCount}
            </span>
          {/if}
        </button>

        {#if showDropdown}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="fixed inset-0 z-40" onclick={() => showDropdown = false}></div>
          <div class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-semibold text-text">{m.common_notifications()}</h3>
            </div>
            <div class="max-h-80 overflow-y-auto">
              {#if notifs.items.length === 0}
                <div class="px-4 py-8 text-center text-sm text-text-muted">
                  {m.common_no_notifications()}
                </div>
              {:else}
                {#each notifs.items as notif (notif.id)}
                  <button
                    class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    onclick={() => {
                      markAsRead(notif.id);
                      const dest = user.type === 'Teacher' ? '/teacher/calendar' : '/parent/dashboard';
                      window.location.href = dest;
                    }}
                  >
                    <p class="text-sm font-medium text-text">{notif.title}</p>
                    <p class="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.body}</p>
                    <p class="text-[10px] text-text-muted mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                  </button>
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <select
      value={getLocale()}
      onchange={(e) => setLocale(e.currentTarget.value as "en" | "id")}
      class="text-sm bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-text-muted hover:text-text cursor-pointer"
    >
      <option value="en">🇬🇧 EN</option>
      <option value="id">🇮🇩 ID</option>
    </select>

    <Badge variant={user.type === 'Teacher' ? 'primary' : user.type === 'SchoolManager' ? 'warning' : 'success'}>
      {user.type === 'SchoolManager' ? m.role_school_manager() : user.type === 'Teacher' ? m.role_teacher() : m.role_parent()}
    </Badge>
    <span class="text-sm text-text">{user.email}</span>
    <button
      onclick={logout}
      class="text-sm text-text-muted hover:text-red-500 transition-colors"
    >
      {m.common_sign_out()}
    </button>
  </div>
</header>
