<script lang="ts">
  import { Card, Button, Input, Alert } from '$lib/components/ui';
  import { uploadFile } from '$lib/api/upload';
  import { UPDATE_PROFILE_MUTATION, CHANGE_PASSWORD_MUTATION } from '$lib/api/queries/profile';
  import type { Teacher } from '$lib/api/types';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  const p = data.profile as Teacher;

  // ── Personal info ─────────────────────────────────────────────────────────
  let name = $state(p.name ?? '');
  let email = $state(p.email ?? '');
  let phone = $state(p.phone ?? '');
  let bio = $state(p.bio ?? '');
  let birthdate = $state(p.birthdate ?? '');
  let gender = $state(p.gender ?? '');
  let religion = $state(p.religion ?? '');
  let qualification = $state(p.qualification ?? '');

  // ── Address ───────────────────────────────────────────────────────────────
  let addressLine1 = $state(p.addressLine1 ?? '');
  let addressLine2 = $state(p.addressLine2 ?? '');
  let city = $state(p.city ?? '');
  let stateProvince = $state(p.stateProvince ?? '');
  let postalCode = $state(p.postalCode ?? '');
  let countryCode = $state(p.countryCode ?? '');

  // ── Avatar ────────────────────────────────────────────────────────────────
  let avatarUrl = $state(p.avatarUrl ?? '');
  let avatarUploading = $state(false);
  let avatarError = $state('');
  let avatarBlobId = $state<string | null>(null);

  // ── Profile form ──────────────────────────────────────────────────────────
  let profileSaving = $state(false);
  let profileSuccess = $state('');
  let profileError = $state('');

  // ── Password form ─────────────────────────────────────────────────────────
  let currentPassword = $state('');
  let newPassword = $state('');
  let newPasswordConfirmation = $state('');
  let passwordSaving = $state(false);
  let passwordSuccess = $state('');
  let passwordError = $state('');

  // ── Derived ───────────────────────────────────────────────────────────────
  const initials = $derived(
    name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );

  let fileInputEl: HTMLInputElement = $state()!;

  // ── Avatar upload ─────────────────────────────────────────────────────────
  async function handleAvatarChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    avatarUploading = true;
    avatarError = '';

    try {
      const result = await uploadFile(file);
      avatarBlobId = result.signedBlobId;
      avatarUrl = URL.createObjectURL(file);
    } catch (err) {
      avatarError = err instanceof Error ? err.message : 'Photo upload failed';
    } finally {
      avatarUploading = false;
      input.value = '';
    }
  }

  // ── Profile save ──────────────────────────────────────────────────────────
  async function handleProfileSave(e: SubmitEvent) {
    e.preventDefault();
    profileSaving = true;
    profileSuccess = '';
    profileError = '';

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: UPDATE_PROFILE_MUTATION,
          variables: {
            name,
            email,
            phone: phone || null,
            bio: bio || null,
            birthdate: birthdate || null,
            gender: gender || null,
            religion: religion || null,
            qualification: qualification || null,
            addressLine1: addressLine1 || null,
            addressLine2: addressLine2 || null,
            city: city || null,
            stateProvince: stateProvince || null,
            postalCode: postalCode || null,
            countryCode: countryCode || null,
            ...(avatarBlobId ? { avatarBlobId } : {})
          }
        })
      });

      const json = await res.json();
      const errors = json.data?.updateProfile?.errors;

      if (errors?.length > 0) {
        profileError = errors[0].message;
      } else if (json.errors?.length > 0) {
        profileError = json.errors[0].message;
      } else {
        profileSuccess = m.profile_updated();
        avatarBlobId = null;
        const updatedUser = json.data?.updateProfile?.user;
        if (updatedUser?.avatarUrl) {
          avatarUrl = updatedUser.avatarUrl;
        }
      }
    } catch (err) {
      profileError = err instanceof Error ? err.message : m.profile_something_wrong();
    } finally {
      profileSaving = false;
    }
  }

  // ── Password change ───────────────────────────────────────────────────────
  async function handlePasswordChange(e: SubmitEvent) {
    e.preventDefault();

    if (newPassword !== newPasswordConfirmation) {
      passwordError = m.profile_passwords_not_match();
      return;
    }

    passwordSaving = true;
    passwordSuccess = '';
    passwordError = '';

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: CHANGE_PASSWORD_MUTATION,
          variables: { currentPassword, newPassword, newPasswordConfirmation }
        })
      });

      const json = await res.json();
      const payload = json.data?.changePassword;

      if (payload?.errors?.length > 0) {
        passwordError = payload.errors[0].message;
      } else if (json.errors?.length > 0) {
        passwordError = json.errors[0].message;
      } else if (payload?.success) {
        passwordSuccess = m.profile_password_updated();
        currentPassword = '';
        newPassword = '';
        newPasswordConfirmation = '';
      }
    } catch (err) {
      passwordError = err instanceof Error ? err.message : m.profile_something_wrong();
    } finally {
      passwordSaving = false;
    }
  }
</script>

<svelte:head>
  <title>{m.profile_title()} — {m.app_name()}</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6 pb-12">

  <!-- ── Avatar Hero ──────────────────────────────────────────────────────── -->
  <div class="relative rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 60%, #06B6D4 100%);">
    <!-- Decorative circles -->
    <div class="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10"></div>
    <div class="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10"></div>
    <div class="absolute top-4 left-1/3 w-20 h-20 rounded-full bg-white/5"></div>

    <div class="relative flex flex-col items-center py-10 px-6">
      <!-- Avatar circle -->
      <div class="relative group mb-4">
        <div class="w-24 h-24 rounded-full ring-4 ring-white/60 shadow-xl overflow-hidden bg-white/20 flex items-center justify-center">
          {#if avatarUrl}
            <img src={avatarUrl} alt={name} class="w-full h-full object-cover" />
          {:else}
            <span class="text-3xl font-bold text-white tracking-tight">{initials}</span>
          {/if}
        </div>

        <!-- Upload overlay -->
        <button
          type="button"
          onclick={() => fileInputEl.click()}
          disabled={avatarUploading}
          class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
            disabled:cursor-not-allowed"
          aria-label={m.profile_change_photo_aria()}
        >
          {#if avatarUploading}
            <svg class="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          {:else}
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          {/if}
        </button>

        <!-- Pending badge -->
        {#if avatarBlobId}
          <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
            <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        {/if}
      </div>

      <input
        bind:this={fileInputEl}
        type="file"
        accept="image/*"
        class="hidden"
        onchange={handleAvatarChange}
      />

      <h1 class="text-2xl font-bold text-white">{name || m.profile_your_name()}</h1>
      <p class="text-white/70 text-sm mt-0.5">{email}</p>

      <button
        type="button"
        onclick={() => fileInputEl.click()}
        disabled={avatarUploading}
        class="mt-4 px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 text-white
          border border-white/30 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {avatarUploading ? m.profile_uploading() : avatarBlobId ? m.profile_photo_ready() : m.profile_change_photo()}
      </button>

      {#if avatarError}
        <p class="mt-2 text-sm text-red-200">{avatarError}</p>
      {/if}
    </div>
  </div>

  <!-- ── Personal Information ──────────────────────────────────────────────── -->
  <form onsubmit={handleProfileSave}>
    <Card>
      {#snippet header()}
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-text">{m.profile_personal_info()}</h2>
            <p class="text-xs text-text-muted">{m.profile_personal_info_hint()}</p>
          </div>
        </div>
      {/snippet}

      {#snippet children()}
        <div class="space-y-5">
          {#if profileSuccess}
            <Alert variant="success">{profileSuccess}</Alert>
          {/if}
          {#if profileError}
            <Alert variant="error">{profileError}</Alert>
          {/if}

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="name"
              label={m.profile_full_name()}
              bind:value={name}
              required
              placeholder={m.profile_full_name_placeholder()}
              disabled={profileSaving}
            />
            <Input
              id="email"
              label={m.common_email()}
              type="email"
              bind:value={email}
              required
              placeholder={m.profile_email_placeholder()}
              disabled={profileSaving}
            />
            <Input
              id="phone"
              label={m.profile_phone()}
              type="tel"
              bind:value={phone}
              placeholder={m.profile_phone_placeholder()}
              disabled={profileSaving}
            />
            <div class="space-y-1">
              <label for="gender" class="block text-sm font-medium text-text">{m.profile_gender()}</label>
              <select
                id="gender"
                bind:value={gender}
                disabled={profileSaving}
                class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                  disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="">{m.profile_gender_prefer_not()}</option>
                <option value="male">{m.profile_gender_male()}</option>
                <option value="female">{m.profile_gender_female()}</option>
                <option value="other">{m.profile_gender_other()}</option>
              </select>
            </div>
            <Input
              id="birthdate"
              label={m.profile_birthdate()}
              type="date"
              bind:value={birthdate}
              disabled={profileSaving}
            />
            <Input
              id="qualification"
              label={m.profile_qualification()}
              bind:value={qualification}
              placeholder={m.profile_qualification_placeholder()}
              disabled={profileSaving}
            />
            <Input
              id="religion"
              label={m.profile_religion()}
              bind:value={religion}
              placeholder={m.profile_religion_placeholder()}
              disabled={profileSaving}
            />
          </div>

          <div class="space-y-1">
            <label for="bio" class="block text-sm font-medium text-text">{m.profile_bio()}</label>
            <textarea
              id="bio"
              bind:value={bio}
              rows={3}
              placeholder={m.profile_bio_placeholder()}
              disabled={profileSaving}
              class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                disabled:opacity-50 disabled:bg-slate-50"
            ></textarea>
          </div>
        </div>
      {/snippet}
    </Card>

    <!-- ── Address ─────────────────────────────────────────────────────────── -->
    <div class="mt-6">
      <Card>
        {#snippet header()}
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 class="font-semibold text-text">{m.profile_address()}</h2>
              <p class="text-xs text-text-muted">{m.profile_address_hint()}</p>
            </div>
          </div>
        {/snippet}

        {#snippet children()}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <Input
                id="addressLine1"
                label={m.profile_address_line1()}
                bind:value={addressLine1}
                placeholder={m.profile_address_line1_placeholder()}
                disabled={profileSaving}
              />
            </div>
            <div class="sm:col-span-2">
              <Input
                id="addressLine2"
                label={m.profile_address_line2()}
                bind:value={addressLine2}
                placeholder={m.profile_address_line2_placeholder()}
                disabled={profileSaving}
              />
            </div>
            <Input
              id="city"
              label={m.profile_city()}
              bind:value={city}
              placeholder={m.profile_city_placeholder()}
              disabled={profileSaving}
            />
            <Input
              id="stateProvince"
              label={m.profile_state()}
              bind:value={stateProvince}
              placeholder={m.profile_state_placeholder()}
              disabled={profileSaving}
            />
            <Input
              id="postalCode"
              label={m.profile_postal()}
              bind:value={postalCode}
              placeholder={m.profile_postal_placeholder()}
              disabled={profileSaving}
            />
            <Input
              id="countryCode"
              label={m.profile_country()}
              bind:value={countryCode}
              maxlength={2}
              placeholder={m.profile_country_placeholder()}
              disabled={profileSaving}
            />
          </div>
        {/snippet}
      </Card>
    </div>

    <!-- ── Save profile footer ─────────────────────────────────────────────── -->
    <div class="mt-4 flex justify-end">
      <Button type="submit" loading={profileSaving} disabled={profileSaving}>
        {profileSaving ? m.profile_saving() : m.profile_save_btn()}
      </Button>
    </div>
  </form>

  <!-- ── Change Password ───────────────────────────────────────────────────── -->
  <form onsubmit={handlePasswordChange}>
    <Card>
      {#snippet header()}
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-text">{m.profile_change_password()}</h2>
            <p class="text-xs text-text-muted">{m.profile_change_password_hint()}</p>
          </div>
        </div>
      {/snippet}

      {#snippet children()}
        <div class="space-y-4">
          {#if passwordSuccess}
            <Alert variant="success">{passwordSuccess}</Alert>
          {/if}
          {#if passwordError}
            <Alert variant="error">{passwordError}</Alert>
          {/if}

          <Input
            id="currentPassword"
             label={m.profile_current_password()}
            type="password"
            bind:value={currentPassword}
            required
            autocomplete="current-password"
            disabled={passwordSaving}
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="newPassword"
               label={m.profile_new_password()}
              type="password"
              bind:value={newPassword}
              required
              autocomplete="new-password"
              disabled={passwordSaving}
            />
            <Input
              id="newPasswordConfirmation"
               label={m.profile_confirm_new_password()}
              type="password"
              bind:value={newPasswordConfirmation}
              required
              autocomplete="new-password"
              disabled={passwordSaving}
              error={newPasswordConfirmation && newPassword !== newPasswordConfirmation
                ? 'Passwords do not match'
                : ''}
            />
          </div>
        </div>
      {/snippet}

      {#snippet footer()}
        <div class="flex justify-end">
          <Button type="submit" variant="outline" loading={passwordSaving} disabled={passwordSaving}>
            {passwordSaving ? m.profile_updating() : m.profile_update_password()}
          </Button>
        </div>
      {/snippet}
    </Card>
  </form>

</div>
