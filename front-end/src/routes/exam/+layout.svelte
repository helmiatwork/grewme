<script lang="ts">
  let { children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  {@render children()}
</div>
