require "test_helper"

class HealthCheckupTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @teacher = teachers(:teacher_alice)
  end

  test "valid health checkup with all measurements" do
    checkup = HealthCheckup.new(
      student: @student,
      teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.5,
      height_cm: 115.0,
      head_circumference_cm: 51.0
    )
    assert checkup.valid?, checkup.errors.full_messages.join(", ")
  end

  test "valid with only weight" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.5
    )
    assert checkup.valid?
  end

  test "valid with only height" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      height_cm: 115.0
    )
    assert checkup.valid?
  end

  test "invalid without any measurement" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15)
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:base], "At least one measurement (weight, height, or head circumference) is required"
  end

  test "requires measured_at" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      weight_kg: 20.5
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:measured_at], "can't be blank"
  end

  test "weight must be positive" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: -1
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:weight_kg], "must be greater than 0"
  end

  test "height must be positive" do
    checkup = HealthCheckup.new(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      height_cm: 0
    )
    assert_not checkup.valid?
    assert_includes checkup.errors[:height_cm], "must be greater than 0"
  end

  test "unique per student per date" do
    existing = health_checkups(:emma_checkup_jan)
    duplicate = HealthCheckup.new(
      student: existing.student,
      teacher: @teacher,
      measured_at: existing.measured_at,
      weight_kg: 21.0
    )
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "already has a checkup on this date"
  end

  test "calculates BMI from weight and height" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.0,
      height_cm: 100.0
    )
    assert_equal BigDecimal("20.0"), checkup.bmi
  end

  test "BMI is nil when height is missing" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.0
    )
    assert_nil checkup.bmi
  end

  test "BMI is nil when weight is missing" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      height_cm: 100.0
    )
    assert_nil checkup.bmi
  end

  test "belongs to student and teacher" do
    checkup = health_checkups(:emma_checkup_jan)
    assert_equal @student, checkup.student
    assert_equal @teacher, checkup.teacher
  end

  test "encrypts notes" do
    checkup = HealthCheckup.create!(
      student: @student, teacher: @teacher,
      measured_at: Date.new(2026, 3, 15),
      weight_kg: 20.0,
      notes: "Looks healthy"
    )
    assert_equal "Looks healthy", checkup.notes
    raw = HealthCheckup.connection.select_value(
      "SELECT notes FROM health_checkups WHERE id = #{checkup.id}"
    )
    assert_not_equal "Looks healthy", raw
  end
end
