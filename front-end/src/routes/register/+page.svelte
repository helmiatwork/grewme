<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';
  import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
  import * as m from '$lib/paraglide/messages.js';

  let { form } = $props();
  let loading = $state(false);
  let role = $state(form?.role ?? 'teacher');
</script>

<svelte:head>
  <title>Register — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">{m.app_name()}</h1>
      <p class="text-text-muted">{m.register_title()}</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 class="text-xl font-semibold text-text mb-6">{m.register_heading()}</h2>

      {#if form?.error}
        <div class="mb-4">
          <Alert variant="error">{form.error}</Alert>
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
        class="space-y-4"
      >
        <Input
          label={m.register_name()}
          type="text"
          name="name"
          id="name"
          value={form?.name ?? ''}
          placeholder={m.register_name_placeholder()}
          required
        />

        <Input
          label={m.common_email()}
          type="email"
          name="email"
          id="email"
          value={form?.email ?? ''}
          placeholder="you@example.com"
          required
        />

        <Input
          label={m.common_password()}
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          required
        />

        <Input
          label={m.register_confirm_password()}
          type="password"
          name="passwordConfirmation"
          id="passwordConfirmation"
          placeholder="••••••••"
          required
        />

        <div class="space-y-1">
          <label class="block text-sm font-medium text-text">{m.login_role_label()}</label>
          <div class="flex gap-3">
            <label class="flex-1">
              <input type="radio" name="role" value="teacher" bind:group={role} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary
                transition-colors text-sm font-medium">
                {m.role_teacher()}
              </div>
            </label>
            <label class="flex-1">
              <input type="radio" name="role" value="parent" bind:group={role} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-secondary peer-checked:bg-secondary/5 peer-checked:text-secondary
                transition-colors text-sm font-medium">
                {m.role_parent()}
              </div>
            </label>
            <label class="flex-1">
              <input type="radio" name="role" value="school_manager" bind:group={role} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-amber-600 peer-checked:bg-amber-50 peer-checked:text-amber-600
                transition-colors text-sm font-medium">
                {m.role_school_manager?.() ?? 'School'}
              </div>
            </label>
          </div>
        </div>

        {#if role === 'parent'}
          <Input
            label={m.register_phone()}
            type="tel"
            name="phone"
            id="phone"
            placeholder="+62 812 3456 7890"
          />
        {/if}

        {#if role === 'school_manager'}
          <div class="border-t border-slate-100 pt-4 mt-2">
            <p class="text-sm font-medium text-text mb-3">{m.register_school_details?.() ?? 'School Details'}</p>
            <div class="space-y-3">
              <Input
                label={m.register_school_name?.() ?? 'School Name'}
                type="text"
                name="schoolName"
                id="schoolName"
                placeholder={m.register_school_name_placeholder?.() ?? 'e.g. Greenwood Elementary'}
                required
              />
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="minGrade" class="block text-sm font-medium text-text mb-1">{m.register_min_grade?.() ?? 'Min Grade'}</label>
                  <input type="number" id="minGrade" name="minGrade" min="1" max="12" value="1" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label for="maxGrade" class="block text-sm font-medium text-text mb-1">{m.register_max_grade?.() ?? 'Max Grade'}</label>
                  <input type="number" id="maxGrade" name="maxGrade" min="1" max="12" value="6" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <Input
                label={m.register_address?.() ?? 'Address'}
                type="text"
                name="addressLine1"
                id="addressLine1"
                placeholder={m.register_address_placeholder?.() ?? '123 Main Street'}
                required
              />
              <div class="grid grid-cols-2 gap-3">
                <Input
                  label={m.register_city?.() ?? 'City'}
                  type="text"
                  name="city"
                  id="city"
                  required
                />
                <Input
                  label={m.register_state?.() ?? 'State/Province'}
                  type="text"
                  name="stateProvince"
                  id="stateProvince"
                  required
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <Input
                  label={m.register_postal_code?.() ?? 'Postal Code'}
                  type="text"
                  name="postalCode"
                  id="postalCode"
                  required
                />
                <div>
                  <label for="countryCode" class="block text-sm font-medium text-text mb-1">{m.register_country?.() ?? 'Country'}</label>
                  <select id="countryCode" name="countryCode" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="ID">Indonesia</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="SG">Singapore</option>
                    <option value="MY">Malaysia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <Button type="submit" {loading} class="w-full">
          {m.register_submit()}
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-text-muted">
        {m.register_have_account()}
        <a href="/login" class="text-primary hover:underline font-medium">{m.register_login_link()}</a>
      </p>
      <div class="mt-4 text-center text-xs text-text-muted">
        <a href="/privacy" class="hover:underline">{m.login_privacy()}</a>
        <span class="mx-2">·</span>
        <a href="/terms" class="hover:underline">{m.login_terms()}</a>
      </div>
      <div class="mt-2 text-center">
        <select
          value={getLocale()}
          onchange={(e) => setLocale(e.currentTarget.value as "en" | "id")}
          class="text-xs bg-transparent border border-slate-200 rounded px-2 py-0.5 text-text-muted"
        >
          <option value="en">🇬🇧 EN</option>
          <option value="id">🇮🇩 ID</option>
        </select>
      </div>
    </div>
  </div>
</div>
