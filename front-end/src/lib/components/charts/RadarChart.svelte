<script lang="ts">
  import { Radar } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
  } from 'chart.js';
  import type { RadarSkills } from '$lib/api/types';
  import { SKILL_LABELS, SKILL_COLORS } from '$lib/utils/constants';
  import type { SkillCategory } from '$lib/api/types';

  ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

  interface Props {
    skills: RadarSkills;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { skills, label = 'Skills', size = 'md' }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: 'w-48 h-48',
    md: 'w-80 h-80',
    lg: 'w-96 h-96'
  };

  const skillKeys = ['reading', 'math', 'writing', 'logic', 'social'] as const;
  const labels = skillKeys.map((k) => SKILL_LABELS[k.toUpperCase() as SkillCategory]);
  const colors = skillKeys.map((k) => SKILL_COLORS[k.toUpperCase() as SkillCategory]);

  const chartData = $derived({
    labels,
    datasets: [
      {
        label,
        data: skillKeys.map((k) => skills[k] ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          display: true,
          backdropColor: 'transparent',
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        pointLabels: {
          font: { size: 13, weight: '600' as const },
          color: (ctx: { index: number }) => colors[ctx.index]
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => `${ctx.raw}/100`
        }
      }
    },
    animation: {
      duration: 800
    }
  };
</script>

<div class="{sizeClasses[size]} mx-auto">
  <Radar data={chartData} {options} />
</div>
