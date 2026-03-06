# frozen_string_literal: true

require "test_helper"

class CurriculumQueriesTest < ActiveSupport::TestCase
  SUBJECT_QUERY = <<~GQL
    query($id: ID!) {
      subject(id: $id) {
        id name description
        topics { id name position learningObjectives { id name examPassThreshold dailyScoreThreshold } }
      }
    }
  GQL

  TOPIC_QUERY = <<~GQL
    query($id: ID!) {
      topic(id: $id) {
        id name description position
        subject { id name }
        learningObjectives { id name }
        exams { id title examType }
      }
    }
  GQL

  EXAM_QUERY = <<~GQL
    query($id: ID!) {
      exam(id: $id) {
        id title examType maxScore durationMinutes
        topic { id name }
        examQuestions { id questionText correctAnswer points }
        rubricCriteria { id name maxScore }
      }
    }
  GQL

  CLASSROOM_EXAMS_QUERY = <<~GQL
    query($classroomId: ID!, $status: ClassroomExamStatusEnum) {
      classroomExams(classroomId: $classroomId, status: $status) {
        id status scheduledAt dueAt
        exam { id title }
      }
    }
  GQL

  SUBMISSION_QUERY = <<~GQL
    query($id: ID!) {
      examSubmission(id: $id) {
        id status score passed teacherNotes
        student { id name }
        examAnswers { id selectedAnswer correct pointsAwarded }
        rubricScores { id score feedback }
      }
    }
  GQL

  MASTERIES_QUERY = <<~GQL
    query($studentId: ID!, $subjectId: ID) {
      studentMasteries(studentId: $studentId, subjectId: $subjectId) {
        id examMastered dailyMastered mastered
        learningObjective { id name }
      }
    }
  GQL

  # --- Subject query ---

  test "returns subject with nested topics and objectives" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: SUBJECT_QUERY,
      variables: { id: subjects(:math).id.to_s },
      user: teacher
    )
    subject = result["data"]["subject"]
    assert_equal "Mathematics", subject["name"]
    assert subject["topics"].size >= 2  # fractions, algebra

    fractions = subject["topics"].find { |t| t["name"] == "Fractions" }
    assert fractions["learningObjectives"].size >= 2
  end

  test "unauthenticated user cannot view subject" do
    result = execute_query(
      query: SUBJECT_QUERY,
      variables: { id: subjects(:math).id.to_s }
    )
    assert result["errors"].present?
  end

  # --- Topic query ---

  test "returns topic with subject, objectives, and exams" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: TOPIC_QUERY,
      variables: { id: topics(:fractions).id.to_s },
      user: teacher
    )
    topic = result["data"]["topic"]
    assert_equal "Fractions", topic["name"]
    assert_equal "Mathematics", topic["subject"]["name"]
    assert topic["learningObjectives"].size >= 2
    assert topic["exams"].size >= 2  # fractions_score_exam, fractions_mc_exam
  end

  # --- Exam query ---

  test "returns MC exam with questions" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: EXAM_QUERY,
      variables: { id: exams(:fractions_mc_exam).id.to_s },
      user: teacher
    )
    exam = result["data"]["exam"]
    assert_equal "Fractions Multiple Choice", exam["title"]
    assert_equal "MULTIPLE_CHOICE", exam["examType"]
    assert exam["examQuestions"].size >= 2
  end

  test "returns rubric exam with criteria" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: EXAM_QUERY,
      variables: { id: exams(:poetry_rubric_exam).id.to_s },
      user: teacher
    )
    exam = result["data"]["exam"]
    assert_equal "RUBRIC", exam["examType"]
    assert exam["rubricCriteria"].size >= 2
  end

  # --- Classroom exams query ---

  test "returns classroom exams" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: CLASSROOM_EXAMS_QUERY,
      variables: { classroomId: classrooms(:alice_class).id.to_s },
      user: teacher
    )
    exams = result["data"]["classroomExams"]
    assert exams.size >= 2
  end

  test "filters classroom exams by status" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: CLASSROOM_EXAMS_QUERY,
      variables: { classroomId: classrooms(:alice_class).id.to_s, status: "DRAFT" },
      user: teacher
    )
    exams = result["data"]["classroomExams"]
    assert exams.all? { |e| e["status"] == "DRAFT" }
  end

  # --- Exam submission query ---

  test "returns exam submission with details" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: SUBMISSION_QUERY,
      variables: { id: exam_submissions(:emma_fractions_quiz).id.to_s },
      user: teacher
    )
    sub = result["data"]["examSubmission"]
    assert_equal "SUBMITTED", sub["status"]
    assert_equal 85.0, sub["score"]
    assert sub["passed"]
  end

  # --- Student masteries query ---

  test "returns student masteries" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: MASTERIES_QUERY,
      variables: { studentId: students(:student_emma).id.to_s },
      user: teacher
    )
    masteries = result["data"]["studentMasteries"]
    assert masteries.size >= 1

    add_fractions = masteries.find { |m| m["learningObjective"]["name"] == "Add fractions with different denominators" }
    assert add_fractions
    assert add_fractions["examMastered"]
    assert_not add_fractions["dailyMastered"]
    assert_not add_fractions["mastered"]
  end

  test "filters masteries by subject" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: MASTERIES_QUERY,
      variables: { studentId: students(:student_emma).id.to_s, subjectId: subjects(:math).id.to_s },
      user: teacher
    )
    masteries = result["data"]["studentMasteries"]
    # All returned masteries should be for math objectives
    assert masteries.all? { |m|
      obj = LearningObjective.find_by(name: m["learningObjective"]["name"])
      obj&.topic&.subject == subjects(:math)
    }
  end

  test "unauthenticated user cannot view masteries" do
    result = execute_query(
      query: MASTERIES_QUERY,
      variables: { studentId: students(:student_emma).id.to_s }
    )
    assert result["errors"].present?
  end
end
