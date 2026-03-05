<script lang="ts">
  import { Badge } from '$lib/components/ui';
  import type { SessionUser } from '$lib/api/types';

  interface Props {
    user: SessionUser;
  }

  let { user }: Props = $props();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }
</script>

<header class="bg-surface border-b border-slate-100 px-6 py-3 flex items-center justify-between">
  <div></div>
  <div class="flex items-center gap-4">
    <Badge variant={user.type === 'Teacher' ? 'primary' : 'success'}>
      {user.type}
    </Badge>
    <span class="text-sm text-text">{user.email}</span>
    <button
      onclick={logout}
      class="text-sm text-text-muted hover:text-red-500 transition-colors"
    >
      Sign out
    </button>
  </div>
</header>
