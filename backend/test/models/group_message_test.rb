require "test_helper"

class GroupMessageTest < ActiveSupport::TestCase
  def setup
    @gc = GroupConversation.create!(classroom: classrooms(:alice_class))
    @teacher = teachers(:teacher_alice)
  end

  test "valid with group_conversation, sender, and body" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: "Hello class")
    assert msg.valid?
  end

  test "validates body presence" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: nil)
    assert_not msg.valid?
    assert_includes msg.errors[:body], "can't be blank"
  end

  test "validates body not blank" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: "")
    assert_not msg.valid?
  end

  test "belongs to group_conversation" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: "Hi")
    assert_equal @gc, msg.group_conversation
  end

  test "belongs to sender polymorphically" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: "Hi")
    assert_equal @teacher, msg.sender
  end

  test "chronological scope orders by created_at ascending" do
    msg1 = GroupMessage.create!(group_conversation: @gc, sender: @teacher, body: "First")
    msg2 = GroupMessage.create!(group_conversation: @gc, sender: @teacher, body: "Second")
    ordered = @gc.group_messages.chronological.to_a
    assert_equal msg1, ordered.first
    assert_equal msg2, ordered.last
  end

  test "sender_name returns sender name" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: "Hi")
    assert_equal @teacher.name, msg.sender_name
  end

  test "mine? returns true when sender matches user" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: "Hi")
    msg.sender_type = "Teacher"
    msg.sender_id = @teacher.id
    assert msg.mine?(@teacher)
  end

  test "mine? returns false for different user" do
    msg = GroupMessage.new(group_conversation: @gc, sender: @teacher, body: "Hi")
    msg.sender_type = "Teacher"
    msg.sender_id = @teacher.id
    assert_not msg.mine?(teachers(:teacher_bob))
  end
end
