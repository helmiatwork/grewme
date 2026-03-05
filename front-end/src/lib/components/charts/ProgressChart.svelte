<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
  } from 'chart.js';
  import type { ProgressData, SkillCategory } from '$lib/api/types';
  import { SKILL_LABELS, SKILL_COLORS } from '$lib/utils/constants';

  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

  interface Props {
    progress: ProgressData;
  }

  let { progress }: Props = $props();

  const skillKeys = ['reading', 'math', 'writing', 'logic', 'social'] as const;

  const chartData = $derived({
    labels: progress.weeks.map((w) => w.period),
    datasets: skillKeys.map((key) => ({
      label: SKILL_LABELS[key.toUpperCase() as SkillCategory],
      data: progress.weeks.map((w) => w.skills[key] ?? 0),
      borderColor: SKILL_COLORS[key.toUpperCase() as SkillCategory],
      backgroundColor: SKILL_COLORS[key.toUpperCase() as SkillCategory] + '20',
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, padding: 16 }
      }
    }
  };
</script>

<div class="h-64">
  <Line data={chartData} {options} />
</div>
