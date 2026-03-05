<script lang="ts">
  import { getContext } from 'svelte';
  import { line, curveCardinalClosed } from 'd3-shape';
  import type { Readable } from 'svelte/store';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = getContext<Record<string, Readable<any>>>('LayerCake');
  const data = ctx.data;
  const width = ctx.width;
  const height = ctx.height;
  const xGet = ctx.xGet;
  const config = ctx.config;

  interface Props {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    r?: number;
    circleFill?: string;
    circleStroke?: string;
    circleStrokeWidth?: number;
  }

  let {
    fill = '#3B82F6',
    stroke = '#3B82F6',
    strokeWidth = 2,
    fillOpacity = 0.15,
    r = 5,
    circleFill = '#3B82F6',
    circleStroke = '#fff',
    circleStrokeWidth = 1.5
  }: Props = $props();

  let angleSlice = $derived((Math.PI * 2) / $config.x.length);

  let pathGen = $derived(
    line<number>()
      .curve(curveCardinalClosed)
      .x((d, i) => d * Math.cos(angleSlice * i - Math.PI / 2))
      .y((d, i) => d * Math.sin(angleSlice * i - Math.PI / 2))
  );
</script>

<g transform="translate({$width / 2}, {$height / 2})">
  {#each $data as row}
    {@const xVals = $xGet(row)}

    <path
      class="path-line"
      d={pathGen(xVals)}
      {stroke}
      stroke-width={strokeWidth}
      {fill}
      fill-opacity={fillOpacity}
    ></path>

    {#each xVals as circleR, i}
      {@const thisAngle = angleSlice * i - Math.PI / 2}
      <circle
        cx={circleR * Math.cos(thisAngle)}
        cy={circleR * Math.sin(thisAngle)}
        {r}
        fill={circleFill}
        stroke={circleStroke}
        stroke-width={circleStrokeWidth}
      ></circle>
    {/each}
  {/each}
</g>

<style>
  .path-line {
    stroke-linejoin: round;
    stroke-linecap: round;
  }
</style>
