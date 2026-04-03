require "test_helper"

class ConversationTest < ActiveSupport::TestCase
  def build_conversation(overrides = {})
    Conversation.new({
      student: students(:student_emma),
      parent: parents(:parent_carol),
      teacher: teachers(:teacher_alice)
    }.merge(overrides))
  end

  test "valid with student, parent, and teacher" do
    assert build_conversation.valid?
  end

  test "validates uniqueness of student/parent/teacher trio" do
    build_conversation.save!
    duplicate = build_conversation
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "has already been taken"
  end

  test "belongs to student, parent, and teacher" do
    conv = build_conversation
    assert_equal students(:student_emma), conv.student
    assert_equal parents(:parent_carol), conv.parent
    assert_equal teachers(:teacher_alice), conv.teacher
  end

  test "has many messages" do
    conv = build_conversation
    conv.save!
    msg = Message.create!(conversation: conv, sender: teachers(:teacher_alice), body: "Hello")
    assert_includes conv.messages, msg
  end

  test "destroying conversation destroys messages" do
    conv = build_conversation
    conv.save!
    Message.create!(conversation: conv, sender: teachers(:teacher_alice), body: "Hello")
    assert_difference "Message.count", -1 do
      conv.destroy
    end
  end

  test "other_participant returns parent for teacher" do
    conv = build_conversation
    assert_equal parents(:parent_carol), conv.other_participant(teachers(:teacher_alice))
  end

  test "other_participant returns teacher for parent" do
    conv = build_conversation
    assert_equal teachers(:teacher_alice), conv.other_participant(parents(:parent_carol))
  end

  test "last_message returns most recent message" do
    conv = build_conversation
    conv.save!
    msg1 = Message.create!(conversation: conv, sender: teachers(:teacher_alice), body: "First")
    msg2 = Message.create!(conversation: conv, sender: teachers(:teacher_alice), body: "Second")
    assert_equal msg2, conv.last_message
  end

  test "unread_count_for returns count of unread messages not sent by user" do
    conv = build_conversation
    conv.save!
    teacher = teachers(:teacher_alice)
    parent = parents(:parent_carol)
    Message.create!(conversation: conv, sender: teacher, body: "Hi", read_at: nil)
    Message.create!(conversation: conv, sender: parent, body: "Reply", read_at: nil)
    assert_equal 1, conv.unread_count_for(parent)
  end

  test "for_user scope returns teacher conversations" do
    conv = build_conversation
    conv.save!
    teacher = teachers(:teacher_alice)
    results = Conversation.for_user(teacher)
    assert_includes results, conv
  end

  test "for_user scope returns parent conversations" do
    conv = build_conversation
    conv.save!
    parent = parents(:parent_carol)
    results = Conversation.for_user(parent)
    assert_includes results, conv
  end
end
