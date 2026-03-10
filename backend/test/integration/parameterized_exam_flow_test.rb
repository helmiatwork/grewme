require "test_helper"

class ParameterizedExamFlowTest < ActiveSupport::TestCase
  test "full flow: create parameterized exam → assign → generate → verify unique per student" do
    # 1. Create exam with parameterized MC question
    exam = Exam.create!(
      title: "Parameterized Math Test",
      exam_type: :multiple_choice,
      topic: topics(:fractions),
      created_by: teachers(:teacher_alice)
    )

    question = exam.exam_questions.create!(
      question_text: "Placeholder",
      parameterized: true,
      template_text: "What is {a} + {b}?",
      variables: [ { "name" => "a", "min" => 1, "max" => 50 }, { "name" => "b", "min" => 1, "max" => 50 } ],
      formula: "a + b",
      value_mode: :shuffled,
      options: [ "{a + b}", "{a * b}", "{a - b}", "0" ],
      correct_answer: "{a + b}",
      points: 10
    )

    # 2. Assign to classroom
    classroom_exam = ClassroomExam.create!(
      exam: exam,
      classroom: classrooms(:alice_class),
      assigned_by: teachers(:teacher_alice),
      status: :active
    )

    # 3. Generate student questions
    QuestionGenerator.generate_for_classroom_exam!(classroom_exam)

    # 4. Verify each student got a StudentQuestion
    students = classrooms(:alice_class).students
    assert students.count > 0, "Classroom should have students"

    students.each do |student|
      sq = StudentQuestion.find_by(student: student, exam_question: question, classroom_exam: classroom_exam)
      assert_not_nil sq, "StudentQuestion should exist for #{student.name}"
      assert_not_nil sq.generated_text
      assert_not_nil sq.correct_answer
      assert_not_equal "Placeholder", sq.generated_text

      # Verify correct answer matches formula evaluation
      expected = FormulaEvaluator.evaluate_to_s("a + b", sq.values)
      assert_equal expected, sq.correct_answer, "Correct answer should match formula evaluation for #{student.name}"
    end

    # 5. Verify students got different values (with high probability for shuffled mode)
    all_values = StudentQuestion.where(exam_question: question, classroom_exam: classroom_exam).pluck(:values)
    if students.count > 1
      # At least some should differ (probabilistically near certain with range 1-50)
      assert all_values.uniq.size > 1, "Shuffled mode should produce different values for different students"
    end
  end

  test "fixed mode gives same values to all students" do
    exam = Exam.create!(
      title: "Fixed Values Test",
      exam_type: :multiple_choice,
      topic: topics(:fractions),
      created_by: teachers(:teacher_alice)
    )

    question = exam.exam_questions.create!(
      question_text: "Placeholder",
      parameterized: true,
      template_text: "What is {x} * {y}?",
      variables: [ { "name" => "x", "min" => 1, "max" => 100 }, { "name" => "y", "min" => 1, "max" => 100 } ],
      formula: "x * y",
      value_mode: :fixed,
      fixed_values: { "x" => 5, "y" => 3 },
      options: [ "15", "8", "2", "53" ],
      correct_answer: "15",
      points: 5
    )

    classroom_exam = ClassroomExam.create!(
      exam: exam,
      classroom: classrooms(:alice_class),
      assigned_by: teachers(:teacher_alice),
      status: :active
    )

    QuestionGenerator.generate_for_classroom_exam!(classroom_exam)

    all_values = StudentQuestion.where(exam_question: question, classroom_exam: classroom_exam).pluck(:values)
    # All should have same fixed values
    all_values.each do |v|
      assert_equal 5, v["x"]
      assert_equal 3, v["y"]
    end
  end
end
