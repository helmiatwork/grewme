<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';

  const user = $derived(page.data.user);

  $effect(() => {
    if (user) {
      const dashboard = user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard';
      goto(dashboard);
    } else {
      goto('/login');
    }
  });
</script>

<div class="min-h-screen bg-background flex items-center justify-center">
  <div class="animate-pulse text-primary text-xl">{m.common_loading()}</div>
</div>
