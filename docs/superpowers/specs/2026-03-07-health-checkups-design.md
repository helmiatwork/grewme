# Health Checkups (UKS Growth Monitoring)

**Status:** Designed, not yet implemented. Build after COPPA Phase 3 completes.

## Purpose

Track student physical growth over time (weight, height, head circumference) so parents and teachers can spot health issues early. Modeled after Indonesian UKS (Usaha Kesehatan Sekolah) program.

## Design Decisions

- **Teachers only** record measurements (school health check context)
- **Flexible frequency** — no fixed schedule, record whenever measured
- **Lean schema** — weight, height, head circumference, auto-BMI. Skip vision/dental/nutritional for now; add as nullable columns later if needed (YAGNI)
- **Single table** — one row per health check visit (Approach A). A checkup is naturally one event.
- **COPPA compliant** — notes field encrypted, audit logged, requires parental consent

## Schema

```ruby
create_table :health_checkups do |t|
  t.references :student, null: false, foreign_key: true
  t.references :teacher, null: false, foreign_key: true
  t.date :measured_at, null: false
  t.decimal :weight_kg, precision: 5, scale: 2
  t.decimal :height_cm, precision: 5, scale: 1
  t.decimal :head_circumference_cm, precision: 4, scale: 1
  t.decimal :bmi, precision: 4, scale: 1
  t.text :notes
  t.timestamps
end

add_index :health_checkups, [:student_id, :measured_at], unique: true
```

## Model

```ruby
class HealthCheckup < ApplicationRecord
  belongs_to :student
  belongs_to :teacher

  encrypts :notes

  validates :measured_at, presence: true
  validates :weight_kg, numericality: { greater_than: 0 }, allow_nil: true
  validates :height_cm, numericality: { greater_than: 0 }, allow_nil: true
  validates :head_circumference_cm, numericality: { greater_than: 0 }, allow_nil: true

  before_save :calculate_bmi

  private

  def calculate_bmi
    if weight_kg.present? && height_cm.present? && height_cm > 0
      height_m = height_cm / 100.0
      self.bmi = (weight_kg / (height_m ** 2)).round(1)
    end
  end
end
```

## GraphQL

- **Mutation:** `createHealthCheckup(studentId, measuredAt, weightKg, heightCm, headCircumferenceCm, notes)` — teacher only
- **Query:** `studentHealthCheckups(studentId, startDate, endDate)` — teacher + parent (with consent)
- **Type:** HealthCheckupType with all fields + computed `bmiCategory` (underweight/normal/overweight/obese based on WHO standards)

## Future Extensions (not now)

- Vision screening (left/right acuity)
- Dental status
- Nutritional status classification
- WHO growth chart percentile overlay
- Growth velocity alerts (e.g. "no height gain in 6 months")
