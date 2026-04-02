# Design: Parameterized Exam Questions

**Date:** 2026-03-10
**Status:** Approved

## Problem

All students currently see identical exam questions with the same values. Teachers want the ability to give each student the same *type* of question but with *different values* — e.g., "Calculate the area of a 10x7 rectangle" vs "Calculate the area of a 5x8 rectangle". This reduces cheating and tests understanding rather than memorization.

## Core Concept

Questions become **templates with variables**. When assigned to students, each gets a **question instance** with concrete values — either teacher-picked (same for all) or system-generated (unique per student). The system auto-calculates the correct answer per student using a formula.

## Data Model Changes

### Modified: `exam_questions`

New columns:

| Column | Type | Description |
|---|---|---|
| `parameterized` | boolean, default false | Whether this question uses templates |
| `template_text` | string | Template with placeholders: `"Calculate area of rectangle {width} x {height}"` |
| `variables` | jsonb | Variable definitions: `[{ "name": "width", "min": 1, "max": 20 }, ...]` |
| `formula` | string | Expression to compute correct answer: `"width * height"` |
| `value_mode` | enum (:fixed, :shuffled) | Same values for all vs unique per student |
| `fixed_values` | jsonb | Values when mode=fixed: `{ "width": 10, "height": 7 }` |

Non-parameterized questions (`parameterized: false`) continue using existing `question_text`, `options`, `correct_answer` fields unchanged.

### New: `question_templates` (pre-built library)

| Column | Type | Description |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | "Rectangle Area" |
| `category` | string | "geometry", "arithmetic", "algebra", etc. |
| `grade_min` | integer | Minimum grade level |
| `grade_max` | integer | Maximum grade level |
| `template_text` | string | Template with placeholders |
| `variables` | jsonb | Variable definitions with default ranges |
| `formula` | string | Expression to compute answer |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### New: `student_questions` (generated per student)

| Column | Type | Description |
|---|---|---|
| `id` | bigint PK | |
| `exam_question_id` | references | Links to the template question |
| `student_id` | references | The student |
| `classroom_exam_id` | references | The specific classroom exam assignment |
| `values` | jsonb | Concrete values: `{ "width": 10, "height": 7 }` |
| `generated_text` | string | Rendered question: "Calculate area of rectangle 10 x 7" |
| `correct_answer` | string | Computed: "70" |
| `created_at` | datetime | |
| `updated_at` | datetime | |

Unique index on `(exam_question_id, student_id, classroom_exam_id)`.

### Modified: `exam_answers`

`ExamAnswer` gains an optional `student_question_id` reference. For parameterized questions, auto-grading compares against `StudentQuestion#correct_answer` instead of `ExamQuestion#correct_answer`.

## Generation Flow

```
Teacher creates exam
  -> Adds parameterized question (from template library or custom)
  -> Sets value_mode: :fixed or :shuffled
  -> If fixed: enters specific values

Exam assigned to classroom
  -> For each student in classroom:
     -> If shuffled: generate unique random value combo within variable ranges
     -> If fixed: copy teacher's fixed_values
     -> Evaluate formula with values -> compute correct_answer
     -> Create StudentQuestion record

Student takes exam
  -> Fetch their StudentQuestion records
  -> See personalized question text with their values
  -> Submit answer
  -> Auto-graded against their specific correct_answer
```

### Uniqueness Guarantee (Shuffled Mode)

When generating values for a class, the system:
1. Calculates total possible combinations from variable ranges
2. If combinations >= student count: generate unique combos (reject duplicates)
3. If combinations < student count: allow overlap (warn teacher during setup)

## Pre-built Template Library

### Arithmetic (Grade 1-6)
- Addition: `{a} + {b}`
- Subtraction: `{a} - {b}` (ensures a >= b)
- Multiplication: `{a} x {b}`
- Division: `{a} / {b}` (ensures clean division)

### Geometry (Grade 3-9)
- Rectangle Area: `{width} x {height}`
- Rectangle Perimeter: `2 x ({width} + {height})`
- Triangle Area: `{base} x {height} / 2`
- Triangle Perimeter: `{a} + {b} + {c}`

### Fractions (Grade 3-6)
- Fraction Addition: `{a}/{b} + {c}/{d}`
- Fraction of Number: `{a}/{b} of {c}`

### Percentages (Grade 5-9)
- Percentage of Number: `{percent}% of {number}`
- Discount Calculation: `{price} - {discount}%`

### Algebra (Grade 6-9)
- Simple Linear Equation: `{a}x + {b} = {c}` (solve for x)
- Expression Evaluation: evaluate `{a}x^2 + {b}x + {c}` at `x = {d}`

### Volume (Grade 5-9)
- Rectangular Prism: `{length} x {width} x {height}`

## Teacher UX

1. Create question -> toggle "Parameterized" ON
2. Choose: pick from template library OR write custom template with `{variable}` placeholders
3. Define variable ranges (or accept template defaults)
4. Choose value mode: "Same values for all" (enter values) or "Unique per student"
5. Preview shows an example generated question with sample values

## Formula Evaluation

Use a safe math expression evaluator (no `eval`). Options:
- Ruby: `Dentaku` gem (safe math expression parser)
- Supports: `+`, `-`, `*`, `/`, `^`, `sqrt()`, `round()`, `abs()`
- Variables substituted before evaluation

## Applies To

All exam types (SCORE_BASED, MULTIPLE_CHOICE, RUBRIC, PASS_FAIL) can have parameterized questions. For MULTIPLE_CHOICE, the options are also generated from variables/formula (e.g., correct answer + distractors based on common mistakes).
