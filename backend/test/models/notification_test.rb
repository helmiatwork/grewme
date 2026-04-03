require "test_helper"

class NotificationTest < ActiveSupport::TestCase
  def build_notification(overrides = {})
    Notification.new({
      recipient: teachers(:teacher_alice),
      notifiable: classrooms(:alice_class),
      title: "Test Notification",
      body: "This is a test notification body.",
      kind: "classroom_event_created"
    }.merge(overrides))
  end

  test "valid with required fields" do
    assert build_notification.valid?
  end

  test "validates title presence" do
    notif = build_notification(title: nil)
    assert_not notif.valid?
    assert_includes notif.errors[:title], "can't be blank"
  end

  test "validates body presence" do
    notif = build_notification(body: nil)
    assert_not notif.valid?
    assert_includes notif.errors[:body], "can't be blank"
  end

  test "validates kind inclusion" do
    notif = build_notification(kind: "invalid_kind")
    assert_not notif.valid?
    assert_includes notif.errors[:kind], "is not included in the list"
  end

  test "allows nil kind" do
    notif = build_notification(kind: nil)
    assert notif.valid?
  end

  test "belongs to recipient polymorphically" do
    notif = build_notification(recipient: teachers(:teacher_alice))
    assert_equal teachers(:teacher_alice), notif.recipient
  end

  test "belongs to notifiable polymorphically" do
    notif = build_notification(notifiable: classrooms(:alice_class))
    assert_equal classrooms(:alice_class), notif.notifiable
  end

  test "read? returns false when read_at is nil" do
    notif = build_notification
    assert_not notif.read?
  end

  test "read? returns true when read_at is set" do
    notif = build_notification(read_at: Time.current)
    assert notif.read?
  end

  test "mark_as_read! sets read_at" do
    notif = build_notification
    notif.save!
    notif.mark_as_read!
    assert notif.read?
    assert_not_nil notif.read_at
  end

  test "mark_as_read! does not update already-read notification" do
    time = 1.hour.ago
    notif = build_notification(read_at: time)
    notif.save!
    notif.mark_as_read!
    assert_in_delta time.to_i, notif.read_at.to_i, 1
  end

  test "unread scope returns notifications with nil read_at" do
    notif = build_notification
    notif.save!
    assert_includes Notification.unread, notif
  end

  test "unread scope excludes read notifications" do
    notif = build_notification(read_at: Time.current)
    notif.save!
    assert_not_includes Notification.unread, notif
  end

  test "KINDS constant has expected entries" do
    assert_includes Notification::KINDS, "classroom_event_created"
    assert_includes Notification::KINDS, "new_message"
    assert_includes Notification::KINDS, "exam_submitted"
  end
end
