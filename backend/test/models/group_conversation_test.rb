require "test_helper"

class GroupConversationTest < ActiveSupport::TestCase
  test "valid with a classroom" do
    gc = GroupConversation.new(classroom: classrooms(:alice_class))
    assert gc.valid?
  end

  test "validates classroom_id uniqueness" do
    GroupConversation.create!(classroom: classrooms(:alice_class))
    duplicate = GroupConversation.new(classroom: classrooms(:alice_class))
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:classroom_id], "has already been taken"
  end

  test "belongs to classroom" do
    gc = GroupConversation.create!(classroom: classrooms(:alice_class))
    assert_equal classrooms(:alice_class), gc.classroom
  end

  test "has many group_messages" do
    gc = GroupConversation.create!(classroom: classrooms(:alice_class))
    msg = GroupMessage.create!(group_conversation: gc, sender: teachers(:teacher_alice), body: "Hello class")
    assert_includes gc.group_messages, msg
  end

  test "destroying group_conversation destroys group_messages" do
    gc = GroupConversation.create!(classroom: classrooms(:alice_class))
    GroupMessage.create!(group_conversation: gc, sender: teachers(:teacher_alice), body: "Hello")
    assert_difference "GroupMessage.count", -1 do
      gc.destroy
    end
  end

  test "name returns classroom name" do
    gc = GroupConversation.new(classroom: classrooms(:alice_class))
    assert_equal classrooms(:alice_class).name, gc.name
  end

  test "last_message returns most recent group message" do
    gc = GroupConversation.create!(classroom: classrooms(:alice_class))
    msg1 = GroupMessage.create!(group_conversation: gc, sender: teachers(:teacher_alice), body: "First")
    msg2 = GroupMessage.create!(group_conversation: gc, sender: teachers(:teacher_alice), body: "Second")
    assert_equal msg2, gc.last_message
  end
end
