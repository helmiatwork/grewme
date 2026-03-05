<script lang="ts">
  import { scaleLinear, scalePoint } from 'd3-scale';
  import { line, curveMonotoneX } from 'd3-shape';
  import type { ProgressData, SkillCategory } from '$lib/api/types';
  import { SKILL_LABELS, SKILL_COLORS } from '$lib/utils/constants';

  interface Props {
    progress: ProgressData;
  }

  let { progress }: Props = $props();

  const skillKeys = ['reading', 'math', 'writing', 'logic', 'social'] as const;
  const margin = { top: 20, right: 20, bottom: 50, left: 40 };
  const width = 600;
  const height = 256;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const periods = $derived(progress.weeks.map((w) => w.period));

  const xScale = $derived(
    scalePoint<string>().domain(periods).range([0, innerW]).padding(0.1)
  );

  const yScale = scaleLinear().domain([0, 100]).range([innerH, 0]);

  const yTicks = [0, 20, 40, 60, 80, 100];

  const lines = $derived(
    skillKeys.map((key) => {
      const upper = key.toUpperCase() as SkillCategory;
      const pathGen = line<{ x: number; y: number }>()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(curveMonotoneX);

      const points = progress.weeks.map((w) => ({
        x: xScale(w.period) ?? 0,
        y: yScale(w.skills[key] ?? 0)
      }));

      return {
        key,
        label: SKILL_LABELS[upper],
        color: SKILL_COLORS[upper],
        d: pathGen(points) ?? '',
        points
      };
    })
  );
</script>

<div class="w-full">
  <svg viewBox="0 0 {width} {height}" class="w-full h-64">
    <g transform="translate({margin.left}, {margin.top})">
      <!-- Y grid lines -->
      {#each yTicks as tick}
        <line
          x1="0"
          y1={yScale(tick)}
          x2={innerW}
          y2={yScale(tick)}
          stroke="#e2e8f0"
          stroke-width="1"
        />
        <text
          x="-8"
          y={yScale(tick)}
          text-anchor="end"
          dy="0.35em"
          font-size="10"
          fill="#94a3b8"
        >{tick}</text>
      {/each}

      <!-- X axis labels -->
      {#each periods as period}
        <text
          x={xScale(period)}
          y={innerH + 20}
          text-anchor="middle"
          font-size="10"
          fill="#94a3b8"
        >{period}</text>
      {/each}

      <!-- Lines + dots -->
      {#each lines as { key, d, color, points }}
        <path
          {d}
          fill="none"
          stroke={color}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        {#each points as pt}
          <circle
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill={color}
            stroke="white"
            stroke-width="1.5"
          />
        {/each}
      {/each}
    </g>
  </svg>

  <!-- Legend -->
  <div class="flex flex-wrap justify-center gap-4 mt-2">
    {#each lines as { label, color }}
      <div class="flex items-center gap-1.5 text-xs">
        <span class="w-3 h-3 rounded-full" style="background-color: {color}"></span>
        <span class="text-slate-600">{label}</span>
      </div>
    {/each}
  </div>
</div>
