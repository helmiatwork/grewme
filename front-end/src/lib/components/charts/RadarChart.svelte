<script lang="ts">
  import { LayerCake, Svg } from 'layercake';
  import RadarArea from './_radar/RadarArea.svelte';
  import AxisRadial from './_radar/AxisRadial.svelte';
  import type { RadarSkills, SkillCategory } from '$lib/api/types';
  import { SKILL_LABELS, SKILL_COLORS } from '$lib/utils/constants';

  interface Props {
    skills: RadarSkills;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { skills, label = 'Skills', size = 'md' }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: 'h-48 w-48',
    md: 'h-80 w-80',
    lg: 'h-96 w-96'
  };

  const skillKeys = ['READING', 'MATH', 'WRITING', 'LOGIC', 'SOCIAL'] as const;
  const xKey = skillKeys.map((k) => k.toLowerCase()) as unknown as string[];
  const axisLabels = skillKeys.map((k) => SKILL_LABELS[k as SkillCategory]);
  const axisColors = skillKeys.map((k) => SKILL_COLORS[k as SkillCategory]);

  // Layer Cake expects data as array of objects with the xKey fields
  const data = $derived([
    {
      name: label,
      reading: skills.reading ?? 0,
      math: skills.math ?? 0,
      writing: skills.writing ?? 0,
      logic: skills.logic ?? 0,
      social: skills.social ?? 0
    }
  ]);
</script>

<div class="{sizeClasses[size]} mx-auto">
  <LayerCake
    padding={{ top: 30, right: 10, bottom: 10, left: 10 }}
    x={xKey}
    xDomain={[0, 100]}
    xRange={({ height }: { height: number }) => [0, height / 2]}
    {data}
  >
    <Svg>
      <AxisRadial colors={axisColors} labels={axisLabels} />
      <RadarArea />
    </Svg>
  </LayerCake>
</div>
