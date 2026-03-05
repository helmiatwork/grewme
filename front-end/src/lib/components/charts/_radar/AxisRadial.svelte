<script lang="ts">
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = getContext<Record<string, Readable<any>>>('LayerCake');
  const width = ctx.width;
  const height = ctx.height;
  const xScale = ctx.xScale;
  const extents = ctx.extents;
  const config = ctx.config;

  interface Props {
    lineLengthFactor?: number;
    labelPlacementFactor?: number;
    colors?: string[];
    labels?: string[];
  }

  let {
    lineLengthFactor = 1.1,
    labelPlacementFactor = 1.25,
    colors = [],
    labels = []
  }: Props = $props();

  let max = $derived($xScale(Math.max(...$extents.x)));
  let lineLength = $derived(max * lineLengthFactor);
  let labelPlacement = $derived(max * labelPlacementFactor);
  let angleSlice = $derived((Math.PI * 2) / $config.x.length);

  function anchor(total: number, i: number): string {
    if (i === 0 || i === total / 2) return 'middle';
    if (i < total / 2) return 'start';
    return 'end';
  }
</script>

<g transform="translate({$width / 2}, {$height / 2})">
  <!-- Grid rings -->
  {#each [0.2, 0.4, 0.6, 0.8, 1.0] as pct}
    <circle
      cx="0"
      cy="0"
      r={max * pct}
      stroke="#e2e8f0"
      stroke-width="1"
      fill="none"
    ></circle>
  {/each}

  <!-- Axis lines + labels -->
  {#each $config.x as _key, i}
    {@const label = labels[i] || _key}
    {@const thisAngle = angleSlice * i - Math.PI / 2}
    <line
      x1="0"
      y1="0"
      x2={lineLength * Math.cos(thisAngle)}
      y2={lineLength * Math.sin(thisAngle)}
      stroke="#e2e8f0"
      stroke-width="1"
    ></line>
    <text
      text-anchor={anchor($config.x.length, i)}
      dy="0.35em"
      font-size="12px"
      font-weight="600"
      fill={colors[i] || '#64748b'}
      transform="translate(
        {labelPlacement * Math.cos(thisAngle)},
        {labelPlacement * Math.sin(thisAngle)}
      )"
    >{label}</text>
  {/each}

  <!-- Scale labels -->
  {#each [20, 40, 60, 80, 100] as val, i}
    <text
      x="2"
      y={-(max * (i + 1) / 5)}
      font-size="9px"
      fill="#94a3b8"
      text-anchor="start"
      dy="0.35em"
    >{val}</text>
  {/each}
</g>
