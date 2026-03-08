<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>{m.terms_page_title()}</title>
</svelte:head>

<div class="min-h-screen bg-background py-12 px-4">
  <div class="max-w-3xl mx-auto">
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8 md:p-12">
      <h1 class="text-3xl font-bold text-text mb-2">{m.terms_title()}</h1>
      <p class="text-text-muted mb-8">{m.terms_last_updated()}</p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s1_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s1_p1()}
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s2_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s2_intro()}
      </p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.terms_s2_li1()}</li>
        <li>{m.terms_s2_li2()}</li>
        <li>{m.terms_s2_li3()}</li>
        <li>{m.terms_s2_li4()}</li>
      </ul>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s2_footer()}
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s3_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s3_intro()}
      </p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.terms_s3_li1()}</li>
        <li>{m.terms_s3_li2()}</li>
        <li>{m.terms_s3_li3()}</li>
        <li>{m.terms_s3_li4()}</li>
        <li>{m.terms_s3_li5()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s4_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s4_intro()}
      </p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.terms_s4_li1()}</li>
        <li>{m.terms_s4_li2()}</li>
        <li>{m.terms_s4_li3()}</li>
        <li>{m.terms_s4_li4()}</li>
        <li>{m.terms_s4_li5()}</li>
        <li>{m.terms_s4_li6()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s5_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s5_p1()}
      </p>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s5_p2()}
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s6_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s6_intro()}
      </p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.terms_s6_li1()}</li>
        <li>{m.terms_s6_li2()}</li>
        <li>{m.terms_s6_li3()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s7_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s7_intro()}
      </p>
      <ul class="list-disc pl-6 text-text-muted mb-4 leading-relaxed space-y-1">
        <li>{m.terms_s7_li1()}</li>
        <li>{m.terms_s7_li2()}</li>
        <li>{m.terms_s7_li3()}</li>
      </ul>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s8_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s8_p1()}
      </p>

      <h2 class="text-xl font-semibold text-text mt-8 mb-3">{m.terms_s9_title()}</h2>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s9_p1()}
      </p>
      <p class="text-text-muted mb-4 leading-relaxed">
        {m.terms_s9_email()} <a href="mailto:privacy@grewme.app" class="text-primary hover:underline">privacy@grewme.app</a>
      </p>
    </div>
  </div>
</div>
