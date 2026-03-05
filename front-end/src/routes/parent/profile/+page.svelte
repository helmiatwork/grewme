<script lang="ts">
  import { Card, Button, Input, Alert } from '$lib/components/ui';
  import { FilePicker } from '$lib/components/feed';
  import { uploadFile } from '$lib/api/upload';
  import { UPDATE_PROFILE_MUTATION, CHANGE_PASSWORD_MUTATION } from '$lib/api/queries/profile';

  let { data } = $props();

  const profile = data.profile;

  // ── Personal info ──────────────────────────────────────────────────────────
  let name = $state<string>(profile.name ?? '');
  let email = $state<string>(profile.email ?? '');
  let phone = $state<string>(profile.phone ?? '');
  let bio = $state<string>(profile.bio ?? '');
  let birthdate = $state<string>(profile.birthdate ?? '');
  let gender = $state<string>(profile.gender ?? '');
  let qualification = $state<string>(profile.qualification ?? '');

  // ── Address ────────────────────────────────────────────────────────────────
  let addressLine1 = $state<string>(profile.addressLine1 ?? '');
  let addressLine2 = $state<string>(profile.addressLine2 ?? '');
  let city = $state<string>(profile.city ?? '');
  let stateProvince = $state<string>(profile.stateProvince ?? '');
  let postalCode = $state<string>(profile.postalCode ?? '');
  let countryCode = $state<string>(profile.countryCode ?? '');

  // ── Avatar ─────────────────────────────────────────────────────────────────
  let avatarUrl = $state<string>(profile.avatarUrl ?? '');
  let avatarFiles = $state<File[]>([]);
  let avatarBlobId = $state<string | null>(null);
  let uploadingAvatar = $state(false);

  // ── Password ───────────────────────────────────────────────────────────────
  let currentPassword = $state('');
  let newPassword = $state('');
  let newPasswordConfirmation = $state('');

  // ── UI state ───────────────────────────────────────────────────────────────
  let profileLoading = $state(false);
  let profileAlert = $state<{ variant: 'success' | 'error'; message: string } | null>(null);
  let passwordLoading = $state(false);
  let passwordAlert = $state<{ variant: 'success' | 'error'; message: string } | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const initials = $derived(
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleAvatarChange(files: File[]) {
    avatarFiles = files;
    if (files.length === 0) return;

    uploadingAvatar = true;
    try {
      const result = await uploadFile(files[0]);
      avatarBlobId = result.signedBlobId;
      avatarUrl = URL.createObjectURL(files[0]);
    } catch {
      // silently fail — avatar update happens on profile save
    } finally {
      uploadingAvatar = false;
    }
  }

  async function handleProfileSubmit(e: Event) {
    e.preventDefault();
    profileLoading = true;
    profileAlert = null;

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
            qualification: qualification || null,
            addressLine1: addressLine1 || null,
            addressLine2: addressLine2 || null,
            city: city || null,
            stateProvince: stateProvince || null,
            postalCode: postalCode || null,
            countryCode: countryCode || null,
            avatarBlobId
          }
        })
      });

      const json = await res.json();
      const payload = json.data?.updateProfile;

      if (payload?.errors?.length) {
        profileAlert = { variant: 'error', message: payload.errors[0].message };
      } else if (payload?.user) {
        profileAlert = { variant: 'success', message: 'Profile updated successfully!' };
        if (payload.user.avatarUrl) avatarUrl = payload.user.avatarUrl;
        avatarBlobId = null;
        avatarFiles = [];
      } else {
        profileAlert = { variant: 'error', message: 'Something went wrong. Please try again.' };
      }
    } catch {
      profileAlert = { variant: 'error', message: 'Network error. Please try again.' };
    } finally {
      profileLoading = false;
    }
  }

  async function handlePasswordSubmit(e: Event) {
    e.preventDefault();
    passwordLoading = true;
    passwordAlert = null;

    if (newPassword !== newPasswordConfirmation) {
      passwordAlert = { variant: 'error', message: 'New passwords do not match.' };
      passwordLoading = false;
      return;
    }

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

      if (payload?.errors?.length) {
        passwordAlert = { variant: 'error', message: payload.errors[0].message };
      } else if (payload?.success) {
        passwordAlert = { variant: 'success', message: 'Password changed successfully!' };
        currentPassword = '';
        newPassword = '';
        newPasswordConfirmation = '';
      } else {
        passwordAlert = { variant: 'error', message: 'Something went wrong. Please try again.' };
      }
    } catch {
      passwordAlert = { variant: 'error', message: 'Network error. Please try again.' };
    } finally {
      passwordLoading = false;
    }
  }
</script>

<svelte:head>
  <title>My Profile — GrewMe</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6 pb-12">

  <!-- ── Page Header ──────────────────────────────────────────────────────── -->
  <div class="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/90 to-secondary/80 px-8 pt-10 pb-16 text-white shadow-md">
    <!-- decorative circles -->
    <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5"></div>
    <div class="absolute -bottom-12 -left-6 w-56 h-56 rounded-full bg-white/5"></div>

    <div class="relative text-center">
      <h1 class="text-2xl font-bold tracking-tight">My Profile</h1>
      <p class="text-white/70 text-sm mt-1">Manage your account information</p>
    </div>
  </div>

  <!-- ── Avatar ────────────────────────────────────────────────────────────── -->
  <!-- pulled up to overlap the header -->
  <div class="-mt-20 flex flex-col items-center gap-3 relative z-10">
    <div class="relative">
      <!-- Avatar circle -->
      <div class="w-24 h-24 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        {#if avatarUrl}
          <img src={avatarUrl} alt={name} class="w-full h-full object-cover" />
        {:else}
          <span class="text-3xl font-bold text-white select-none">{initials}</span>
        {/if}
      </div>
      <!-- Upload indicator -->
      {#if uploadingAvatar}
        <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
          <svg class="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      {/if}
    </div>

    <!-- Hidden FilePicker trigger -->
    <div class="hidden">
      <FilePicker
        files={avatarFiles}
        onchange={handleAvatarChange}
        disabled={uploadingAvatar}
        maxFiles={1}
        accept="image/*"
      />
    </div>

    <!-- Custom "Change Photo" button overlaying the FilePicker trigger -->
    <label
      class="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-primary border border-primary/30 bg-white rounded-full shadow-sm hover:bg-primary hover:text-white transition-colors cursor-pointer"
      for="avatar-input"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
    </label>
    <!-- Real file input with matching id -->
    <input
      id="avatar-input"
      type="file"
      accept="image/*"
      class="hidden"
      disabled={uploadingAvatar}
      onchange={(e) => {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) handleAvatarChange([input.files[0]]);
        input.value = '';
      }}
    />

    <div class="text-center">
      <p class="font-semibold text-text text-lg">{name || 'Your Name'}</p>
      <p class="text-sm text-text-muted">{email}</p>
    </div>
  </div>

  <!-- ── Profile Update Form ───────────────────────────────────────────────── -->
  <form onsubmit={handleProfileSubmit} class="space-y-6">

    <!-- Personal Information -->
    <Card>
      {#snippet header()}
        <div class="flex items-center gap-2">
          <span class="text-lg">👤</span>
          <h2 class="font-semibold text-text">Personal Information</h2>
        </div>
      {/snippet}

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="name"
            label="Full Name"
            placeholder="Your full name"
            required
            bind:value={name}
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            required
            bind:value={email}
          />
          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            placeholder="+1 234 567 8900"
            bind:value={phone}
          />
          <Input
            id="qualification"
            label="Qualification"
            placeholder="e.g. Bachelor's in Education"
            bind:value={qualification}
          />
          <Input
            id="birthdate"
            label="Date of Birth"
            type="date"
            bind:value={birthdate}
          />
          <div class="space-y-1">
            <label class="block text-sm font-medium text-text" for="gender">Gender</label>
            <select
              id="gender"
              bind:value={gender}
              class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white transition-colors
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <!-- Bio spans full width -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-text" for="bio">Bio</label>
          <textarea
            id="bio"
            rows="3"
            placeholder="Tell us a little about yourself…"
            bind:value={bio}
            class="w-full px-3 py-2 rounded-lg border border-slate-200 transition-colors resize-none
                   focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
          ></textarea>
        </div>
      </div>
    </Card>

    <!-- Address -->
    <Card>
      {#snippet header()}
        <div class="flex items-center gap-2">
          <span class="text-lg">🏠</span>
          <h2 class="font-semibold text-text">Address</h2>
        </div>
      {/snippet}

      <div class="space-y-4">
        <Input
          id="addressLine1"
          label="Address Line 1"
          placeholder="Street address"
          bind:value={addressLine1}
        />
        <Input
          id="addressLine2"
          label="Address Line 2"
          placeholder="Apartment, suite, etc. (optional)"
          bind:value={addressLine2}
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="city"
            label="City"
            placeholder="City"
            bind:value={city}
          />
          <Input
            id="stateProvince"
            label="State / Province"
            placeholder="State or Province"
            bind:value={stateProvince}
          />
          <Input
            id="postalCode"
            label="Postal Code"
            placeholder="12345"
            bind:value={postalCode}
          />
          <Input
            id="countryCode"
            label="Country Code"
            placeholder="US"
            maxlength={2}
            bind:value={countryCode}
          />
        </div>
      </div>
    </Card>

    <!-- Profile Alert -->
    {#if profileAlert}
      <Alert variant={profileAlert!.variant}>
        {#snippet children()}
          {profileAlert!.message}
        {/snippet}
      </Alert>
    {/if}

    <!-- Save Button -->
    <div class="flex justify-end">
      <Button type="submit" size="lg" loading={profileLoading}>
        {#snippet children()}
          Save Changes
        {/snippet}
      </Button>
    </div>

  </form>

  <!-- ── Change Password ───────────────────────────────────────────────────── -->
  <form onsubmit={handlePasswordSubmit}>
    <Card>
      {#snippet header()}
        <div class="flex items-center gap-2">
          <span class="text-lg">🔒</span>
          <h2 class="font-semibold text-text">Change Password</h2>
        </div>
      {/snippet}

      <div class="space-y-4">
        <Input
          id="currentPassword"
          label="Current Password"
          type="password"
          placeholder="Enter your current password"
          required
          bind:value={currentPassword}
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="newPassword"
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            required
            minlength={8}
            bind:value={newPassword}
          />
          <Input
            id="newPasswordConfirmation"
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            required
            bind:value={newPasswordConfirmation}
          />
        </div>

        {#if passwordAlert}
          <Alert variant={passwordAlert!.variant}>
            {#snippet children()}
              {passwordAlert!.message}
            {/snippet}
          </Alert>
        {/if}

        <div class="flex justify-end pt-2">
          <Button type="submit" variant="outline" size="lg" loading={passwordLoading}>
            {#snippet children()}
              Update Password
            {/snippet}
          </Button>
        </div>
      </div>
    </Card>
  </form>

</div>
