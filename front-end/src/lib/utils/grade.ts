export function gradeDisplayName(grade: number): string {
  if (grade >= 1 && grade <= 6) return `ELM ${grade}`;
  if (grade >= 7 && grade <= 9) return `JHS ${grade - 6}`;
  if (grade >= 10 && grade <= 12) return `SHS ${grade - 9}`;
  return `Grade ${grade}`;
}

export function gradeOptions(minGrade: number, maxGrade: number): Array<{ value: number; label: string }> {
  const options = [];
  for (let g = minGrade; g <= maxGrade; g++) {
    options.push({ value: g, label: gradeDisplayName(g) });
  }
  return options;
}
