require "test_helper"

class KahootExamFlowTest < ActiveSupport::TestCase
  test "full flow: assign → code generated → student starts → saves → submits → auto-graded" do
    # Create a separate exam for this test
    exam = Exam.create!(
      title: "Full Flow Test Exam",
      exam_type: :multiple_choice,
      topic: topics(:fractions),
      created_by: teachers(:teacher_alice),
      max_score: 10
    )

    # Add a question to the exam
    ExamQuestion.create!(
      exam: exam,
      question_text: "What is 1/2 + 1/4?",
      options: [ "1/4", "3/4", "1", "1/2" ],
      correct_answer: "3/4",
      points: 10,
      position: 1
    )

    # 1. Teacher assigns exam (code auto-generated)
    ce = ClassroomExam.create!(
      exam: exam,
      classroom: classrooms(:alice_class),
      assigned_by: teachers(:teacher_alice),
      status: :active,
      duration_minutes: 30,
      show_results: true
    )
    assert_not_nil ce.access_code
    assert_equal 6, ce.access_code.length

    # 2. Look up exam by code
    result = GrewmeSchema.execute(<<~GQL, variables: { code: ce.access_code })
      query($code: String!) {
        examByAccessCode(code: $code) {
          id
          accessCode
          exam { title examType }
          classroom { id name students { id name } }
        }
      }
    GQL
    data = result.dig("data", "examByAccessCode")
    assert_not_nil data, "examByAccessCode returned nil. Errors: #{result.dig("errors")}"
    assert_not_empty data.dig("classroom", "students")

    # 3. Student starts exam
    student = students(:student_finn)
    assert_not_nil student, "Student fixture not loaded"
    result = GrewmeSchema.execute(<<~GQL, variables: { input: { accessCode: ce.access_code, studentId: student.id.to_s } })
      mutation($input: StartExamInput!) {
        startExam(input: $input) {
          examSubmission { id sessionToken status startedAt timeRemaining }
          errors { message }
        }
      }
    GQL
    sub_data = result.dig("data", "startExam", "examSubmission")
    assert_not_nil sub_data["sessionToken"]
    assert_equal "IN_PROGRESS", sub_data["status"]
    session_token = sub_data["sessionToken"]

    # 4. Student saves progress
    question = ce.exam.exam_questions.first
    result = GrewmeSchema.execute(<<~GQL, variables: { input: { sessionToken: session_token, answers: [ { examQuestionId: question.id.to_s, selectedAnswer: question.correct_answer } ] } })
      mutation($input: SaveExamProgressInput!) {
        saveExamProgress(input: $input) {
          success
          errors { message }
        }
      }
    GQL
    assert result.dig("data", "saveExamProgress", "success")

    # 5. Student submits
    result = GrewmeSchema.execute(<<~GQL, variables: { input: { sessionToken: session_token } })
      mutation($input: SubmitExamSessionInput!) {
        submitExamSession(input: $input) {
          examSubmission { id status score }
          errors { message }
        }
      }
    GQL
    sub = result.dig("data", "submitExamSession", "examSubmission")
    assert_equal "GRADED", sub["status"]
    assert sub["score"] > 0
  end

  test "auto-submit job works when timer expires" do
    # Create a separate exam for this test
    exam = Exam.create!(
      title: "Auto-Submit Test Exam",
      exam_type: :multiple_choice,
      topic: topics(:fractions),
      created_by: teachers(:teacher_alice),
      max_score: 10
    )

    ce = ClassroomExam.create!(
      exam: exam,
      classroom: classrooms(:alice_class),
      assigned_by: teachers(:teacher_alice),
      status: :active,
      duration_minutes: 1
    )

    submission = ExamSubmission.create!(
      student: students(:student_emma),
      classroom_exam: ce,
      status: :in_progress,
      started_at: 2.minutes.ago
    )

    ExamAutoSubmitJob.perform_now(submission.id)

    submission.reload
    assert_equal "submitted", submission.status
    assert submission.auto_submitted
  end

  test "rejoin returns existing session" do
    # Create a separate exam for this test
    exam = Exam.create!(
      title: "Rejoin Test Exam",
      exam_type: :multiple_choice,
      topic: topics(:fractions),
      created_by: teachers(:teacher_alice),
      max_score: 10
    )

    ce = ClassroomExam.create!(
      exam: exam,
      classroom: classrooms(:alice_class),
      assigned_by: teachers(:teacher_alice),
      status: :active,
      duration_minutes: 30
    )

    submission = ExamSubmission.create!(
      student: students(:student_grace),
      classroom_exam: ce,
      status: :in_progress,
      started_at: 5.minutes.ago
    )

    result = GrewmeSchema.execute(<<~GQL, variables: { sessionToken: submission.session_token })
      query($sessionToken: String!) {
        examSession(sessionToken: $sessionToken) {
          id
          status
          timeRemaining
        }
      }
    GQL
    data = result.dig("data", "examSession")
    assert_not_nil data
    assert_equal "IN_PROGRESS", data["status"]
    assert data["timeRemaining"] > 0
  end
end
