<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>{m.privacy_page_title()}</title>
</svelte:head>

<div class="min-h-screen bg-background py-12 px-4">
  <div class="max-w-3xl mx-auto">
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8 md:p-12">
      <h1 class="text-3xl font-bold text-text mb-2">{m.privacy_title()}</h1>
      <p class="text-text-muted mb-8">{m.privacy_last_updated()}</p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s1_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s1_p1()}
      </p>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s1_p2()} <a href="mailto:privacy@grewme.app" class="text-primary hover:underline">privacy@grewme.app</a>
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s2_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">{m.privacy_s2_intro()}</p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s2_li1()}</li>
        <li>{m.privacy_s2_li2()}</li>
        <li>{m.privacy_s2_li3()}</li>
      </ul>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s2_footer()}
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s3_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">{m.privacy_s3_intro()}</p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s3_li1()}</li>
        <li>{m.privacy_s3_li2()}</li>
        <li>{m.privacy_s3_li3()}</li>
        <li>{m.privacy_s3_li4()}</li>
      </ul>
      <p class="text-text-muted mb-4 leading-relaxed">
        <strong>{m.privacy_s3_footer()}</strong>
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s4_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s4_p1()}
      </p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s4_li1()}</li>
        <li>{m.privacy_s4_li2()}</li>
        <li>{m.privacy_s4_li3()}</li>
        <li>{m.privacy_s4_li4()}</li>
        <li>{m.privacy_s4_li5()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s5_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">{m.privacy_s5_intro()}</p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s5_li1()}</li>
        <li>{m.privacy_s5_li2()}</li>
        <li>{m.privacy_s5_li3()}</li>
        <li>{m.privacy_s5_li4()}</li>
        <li>{m.privacy_s5_li5()}</li>
      </ul>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s5_footer()} <a href="mailto:privacy@grewme.app" class="text-primary hover:underline">privacy@grewme.app</a>.
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s6_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        <strong>{m.privacy_s6_p1()}</strong>
      </p>
      <p class="text-text-muted mb-4 leading-relaxed">{m.privacy_s6_intro()}</p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s6_li1()}</li>
        <li>{m.privacy_s6_li2()}</li>
        <li>{m.privacy_s6_li3()}</li>
      </ul>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s6_footer()}
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s7_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">{m.privacy_s7_intro()}</p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s7_li1()}</li>
        <li>{m.privacy_s7_li2()}</li>
        <li>{m.privacy_s7_li3()}</li>
        <li>{m.privacy_s7_li4()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s8_title()}</h2>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s8_li1()}</li>
        <li>{m.privacy_s8_li2()}</li>
        <li>{m.privacy_s8_li3()}</li>
        <li>{m.privacy_s8_li4()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s9_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">{m.privacy_s9_intro()}</p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.privacy_s9_li1()}</li>
        <li>{m.privacy_s9_li2()}</li>
        <li>{m.privacy_s9_li3()}</li>
        <li>{m.privacy_s9_li4()}</li>
        <li>{m.privacy_s9_li5()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s10_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s10_p1()}
      </p>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s10_p2()}
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.privacy_s11_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s11_p1()}
      </p>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.privacy_s11_email()} <a href="mailto:privacy@grewme.app" class="text-primary hover:underline">privacy@grewme.app</a>
      </p>
    </div>
  </div>
</div>
