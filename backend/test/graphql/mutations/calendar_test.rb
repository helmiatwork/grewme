require "test_helper"

class CalendarMutationsTest < ActiveSupport::TestCase
  # === classroomEvents query ===

  test "teacher queries events for their classrooms" do
    # Create events in alice's classroom
    event = ClassroomEvent.create!(
      classroom: classrooms(:alice_class),
      creator: teachers(:teacher_alice),
      title: "Parent-Teacher Conference",
      event_date: Date.today,
      start_time: Time.zone.parse("14:00"),
      end_time: Time.zone.parse("16:00")
    )

    result = execute_query(
      query: 'query($month: ISO8601Date!) {
        classroomEvents(month: $month) {
          id title description eventDate startTime endTime
          classroom { id name }
          creatorName creatorType isMine
        }
      }',
      variables: { month: Date.today.iso8601 },
      user: teachers(:teacher_alice)
    )

    events = result.dig("data", "classroomEvents")
    assert_not_nil events
    assert events.any? { |e| e["title"] == "Parent-Teacher Conference" }

    found = events.find { |e| e["id"] == event.id.to_s }
    assert_equal "14:00", found["startTime"]
    assert_equal "16:00", found["endTime"]
    assert_equal "Alice Teacher", found["creatorName"]
    assert_equal "Teacher", found["creatorType"]
    assert_equal true, found["isMine"]
  end

  test "parent queries events for their children's classrooms" do
    event = ClassroomEvent.create!(
      classroom: classrooms(:alice_class),
      creator: teachers(:teacher_alice),
      title: "Science Fair",
      event_date: Date.today
    )

    result = execute_query(
      query: 'query($month: ISO8601Date!) {
        classroomEvents(month: $month) {
          id title creatorName isMine
        }
      }',
      variables: { month: Date.today.iso8601 },
      user: parents(:parent_carol)
    )

    events = result.dig("data", "classroomEvents")
    assert_not_nil events
    assert events.any? { |e| e["title"] == "Science Fair" }

    found = events.find { |e| e["id"] == event.id.to_s }
    assert_equal false, found["isMine"]
  end

  test "teacher does not see events from other classrooms" do
    ClassroomEvent.create!(
      classroom: classrooms(:bob_class),
      creator: teachers(:teacher_bob),
      title: "Bob's Event",
      event_date: Date.today
    )

    result = execute_query(
      query: 'query($month: ISO8601Date!) {
        classroomEvents(month: $month) { id title }
      }',
      variables: { month: Date.today.iso8601 },
      user: teachers(:teacher_alice)
    )

    events = result.dig("data", "classroomEvents")
    assert_not events.any? { |e| e["title"] == "Bob's Event" }
  end

  test "events are filtered by month" do
    ClassroomEvent.create!(
      classroom: classrooms(:alice_class),
      creator: teachers(:teacher_alice),
      title: "This Month",
      event_date: Date.today
    )
    ClassroomEvent.create!(
      classroom: classrooms(:alice_class),
      creator: teachers(:teacher_alice),
      title: "Next Month",
      event_date: Date.today + 2.months
    )

    result = execute_query(
      query: 'query($month: ISO8601Date!) {
        classroomEvents(month: $month) { id title }
      }',
      variables: { month: Date.today.iso8601 },
      user: teachers(:teacher_alice)
    )

    events = result.dig("data", "classroomEvents")
    titles = events.map { |e| e["title"] }
    assert_includes titles, "This Month"
    assert_not_includes titles, "Next Month"
  end

  # === createClassroomEvent mutation ===

  test "teacher creates event in their classroom" do
    result = execute_query(
      mutation: 'mutation($classroomId: ID!, $title: String!, $eventDate: ISO8601Date!, $description: String, $startTime: String, $endTime: String) {
        createClassroomEvent(classroomId: $classroomId, title: $title, eventDate: $eventDate, description: $description, startTime: $startTime, endTime: $endTime) {
          classroomEvent { id title description eventDate startTime endTime creatorName creatorType isMine }
          errors { message path }
        }
      }',
      variables: {
        classroomId: classrooms(:alice_class).id.to_s,
        title: "Field Trip",
        eventDate: (Date.today + 7).iso8601,
        description: "Visit to the science museum",
        startTime: "09:00",
        endTime: "15:00"
      },
      user: teachers(:teacher_alice)
    )

    event = result.dig("data", "createClassroomEvent", "classroomEvent")
    errors = result.dig("data", "createClassroomEvent", "errors")
    assert_not_nil event
    assert_empty errors
    assert_equal "Field Trip", event["title"]
    assert_equal "Visit to the science museum", event["description"]
    assert_equal "09:00", event["startTime"]
    assert_equal "15:00", event["endTime"]
    assert_equal "Alice Teacher", event["creatorName"]
    assert_equal "Teacher", event["creatorType"]
    assert_equal true, event["isMine"]
  end

  test "parent creates event in their child's classroom" do
    result = execute_query(
      mutation: 'mutation($classroomId: ID!, $title: String!, $eventDate: ISO8601Date!) {
        createClassroomEvent(classroomId: $classroomId, title: $title, eventDate: $eventDate) {
          classroomEvent { id title creatorName creatorType isMine }
          errors { message path }
        }
      }',
      variables: {
        classroomId: classrooms(:alice_class).id.to_s,
        title: "Bake Sale",
        eventDate: (Date.today + 14).iso8601
      },
      user: parents(:parent_carol)
    )

    event = result.dig("data", "createClassroomEvent", "classroomEvent")
    errors = result.dig("data", "createClassroomEvent", "errors")
    assert_not_nil event
    assert_empty errors
    assert_equal "Bake Sale", event["title"]
    assert_equal "Carol Parent", event["creatorName"]
    assert_equal "Parent", event["creatorType"]
    assert_equal true, event["isMine"]
  end

  test "teacher cannot create event in another teacher's classroom" do
    result = execute_query(
      mutation: 'mutation($classroomId: ID!, $title: String!, $eventDate: ISO8601Date!) {
        createClassroomEvent(classroomId: $classroomId, title: $title, eventDate: $eventDate) {
          classroomEvent { id }
          errors { message }
        }
      }',
      variables: {
        classroomId: classrooms(:bob_class).id.to_s,
        title: "Unauthorized Event",
        eventDate: Date.today.iso8601
      },
      user: teachers(:teacher_alice)
    )

    errors = result["errors"]
    assert_not_nil errors
    assert errors.any? { |e| e["message"].include?("authorized") || e["message"].include?("Authorized") }
  end

  test "create event requires title" do
    result = execute_query(
      mutation: 'mutation($classroomId: ID!, $title: String!, $eventDate: ISO8601Date!) {
        createClassroomEvent(classroomId: $classroomId, title: $title, eventDate: $eventDate) {
          classroomEvent { id }
          errors { message path }
        }
      }',
      variables: {
        classroomId: classrooms(:alice_class).id.to_s,
        title: "",
        eventDate: Date.today.iso8601
      },
      user: teachers(:teacher_alice)
    )

    errors = result.dig("data", "createClassroomEvent", "errors")
    assert errors.any? { |e| e["message"].downcase.include?("title") }
  end

  # === deleteClassroomEvent mutation ===

  test "creator can delete their own event" do
    event = ClassroomEvent.create!(
      classroom: classrooms(:alice_class),
      creator: teachers(:teacher_alice),
      title: "To Delete",
      event_date: Date.today
    )

    result = execute_query(
      mutation: 'mutation($id: ID!) {
        deleteClassroomEvent(id: $id) {
          success
          errors { message }
        }
      }',
      variables: { id: event.id.to_s },
      user: teachers(:teacher_alice)
    )

    assert_equal true, result.dig("data", "deleteClassroomEvent", "success")
    assert_nil ClassroomEvent.find_by(id: event.id)
  end

  test "non-creator cannot delete event" do
    event = ClassroomEvent.create!(
      classroom: classrooms(:alice_class),
      creator: teachers(:teacher_alice),
      title: "Alice's Event",
      event_date: Date.today
    )

    result = execute_query(
      mutation: 'mutation($id: ID!) {
        deleteClassroomEvent(id: $id) {
          success
          errors { message }
        }
      }',
      variables: { id: event.id.to_s },
      user: parents(:parent_carol)
    )

    errors = result["errors"]
    assert_not_nil errors
    assert errors.any? { |e| e["message"].include?("authorized") || e["message"].include?("Authorized") }
    assert_not_nil ClassroomEvent.find_by(id: event.id)
  end

  test "parent who created event can delete it" do
    event = ClassroomEvent.create!(
      classroom: classrooms(:alice_class),
      creator: parents(:parent_carol),
      title: "Carol's Event",
      event_date: Date.today
    )

    result = execute_query(
      mutation: 'mutation($id: ID!) {
        deleteClassroomEvent(id: $id) {
          success
          errors { message }
        }
      }',
      variables: { id: event.id.to_s },
      user: parents(:parent_carol)
    )

    assert_equal true, result.dig("data", "deleteClassroomEvent", "success")
    assert_nil ClassroomEvent.find_by(id: event.id)
  end
end
