require "test_helper"

class MessageTest < ActiveSupport::TestCase
  def setup
    @conversation = Conversation.create!(
      student: students(:student_emma),
      parent: parents(:parent_carol),
      teacher: teachers(:teacher_alice)
    )
    @teacher = teachers(:teacher_alice)
  end

  test "valid with conversation, sender, and body" do
    msg = Message.new(conversation: @conversation, sender: @teacher, body: "Hello")
    assert msg.valid?
  end

  test "validates body presence" do
    msg = Message.new(conversation: @conversation, sender: @teacher, body: nil)
    assert_not msg.valid?
    assert_includes msg.errors[:body], "can't be blank"
  end

  test "validates body not blank string" do
    msg = Message.new(conversation: @conversation, sender: @teacher, body: "")
    assert_not msg.valid?
  end

  test "belongs to conversation" do
    msg = Message.new(conversation: @conversation, sender: @teacher, body: "Hi")
    assert_equal @conversation, msg.conversation
  end

  test "belongs to sender polymorphically" do
    msg = Message.new(conversation: @conversation, sender: @teacher, body: "Hi")
    assert_equal @teacher, msg.sender
  end

  test "chronological scope orders by created_at ascending" do
    msg1 = Message.create!(conversation: @conversation, sender: @teacher, body: "First")
    msg2 = Message.create!(conversation: @conversation, sender: @teacher, body: "Second")
    ordered = @conversation.messages.chronological.to_a
    assert_equal msg1, ordered.first
    assert_equal msg2, ordered.last
  end

  test "sender_name returns sender name" do
    msg = Message.new(conversation: @conversation, sender: @teacher, body: "Hi")
    assert_equal @teacher.name, msg.sender_name
  end

  test "mine? returns true when sender matches user" do
    msg = Message.new(conversation: @conversation, body: "Hi")
    msg.sender_type = "Teacher"
    msg.sender_id = @teacher.id
    assert msg.mine?(@teacher)
  end

  test "mine? returns false for different user" do
    msg = Message.new(conversation: @conversation, body: "Hi")
    msg.sender_type = "Teacher"
    msg.sender_id = @teacher.id
    assert_not msg.mine?(parents(:parent_carol))
  end
end
