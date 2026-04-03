require "test_helper"

class ClassroomEventTest < ActiveSupport::TestCase
  def build_event(overrides = {})
    ClassroomEvent.new({
      classroom: classrooms(:alice_class),
      creator: teachers(:teacher_alice),
      title: "Sports Day",
      event_date: Date.new(2026, 5, 1)
    }.merge(overrides))
  end

  test "valid with all required fields" do
    assert build_event.valid?
  end

  test "validates title presence" do
    event = build_event(title: nil)
    assert_not event.valid?
    assert_includes event.errors[:title], "can't be blank"
  end

  test "validates event_date presence" do
    event = build_event(event_date: nil)
    assert_not event.valid?
    assert_includes event.errors[:event_date], "can't be blank"
  end

  test "belongs to classroom" do
    event = build_event
    assert_equal classrooms(:alice_class), event.classroom
  end

  test "belongs to creator polymorphically" do
    event = build_event(creator: teachers(:teacher_alice))
    assert_equal teachers(:teacher_alice), event.creator
  end

  test "for_month scope returns events in the given month" do
    event = build_event(event_date: Date.new(2026, 5, 15))
    event.save!

    results = ClassroomEvent.for_month(Date.new(2026, 5, 1))
    assert_includes results, event
  end

  test "for_month scope excludes events outside the month" do
    event = build_event(event_date: Date.new(2026, 6, 1))
    event.save!

    results = ClassroomEvent.for_month(Date.new(2026, 5, 1))
    assert_not_includes results, event
  end

  test "for_classroom_ids scope filters by classroom ids" do
    event = build_event
    event.save!

    results = ClassroomEvent.for_classroom_ids([ classrooms(:alice_class).id ])
    assert_includes results, event
  end
end
