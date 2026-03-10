require "test_helper"

class QuestionGeneratorTest < ActiveSupport::TestCase
  test "renders template text with values" do
    text = QuestionGenerator.render_text("What is {a} + {b}?", { "a" => 10, "b" => 7 })
    assert_equal "What is 10 + 7?", text
  end

  test "generates random values within ranges" do
    variables = [
      { "name" => "a", "min" => 1, "max" => 10 },
      { "name" => "b", "min" => 1, "max" => 10 }
    ]
    values = QuestionGenerator.random_values(variables)
    assert values["a"].between?(1, 10)
    assert values["b"].between?(1, 10)
  end

  test "generates unique value sets" do
    variables = [
      { "name" => "a", "min" => 1, "max" => 100 },
      { "name" => "b", "min" => 1, "max" => 100 }
    ]
    sets = QuestionGenerator.unique_value_sets(variables, 5)
    assert_equal 5, sets.length
    assert_equal 5, sets.uniq.length
  end

  test "generates student questions for classroom exam (shuffled)" do
    exam_question = exam_questions(:mc_q1)
    exam_question.update_columns(
      parameterized: true,
      template_text: "What is {a} + {b}?",
      variables: [ { "name" => "a", "min" => 1, "max" => 50 }, { "name" => "b", "min" => 1, "max" => 50 } ],
      formula: "a + b",
      value_mode: 1 # shuffled
    )

    classroom_exam = classroom_exams(:alice_mc_exam)
    students = classroom_exam.classroom.students

    # Clear any existing student questions
    StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam).delete_all

    QuestionGenerator.generate_for_classroom_exam!(classroom_exam)

    student_questions = StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam)
    assert_equal students.count, student_questions.count

    # Verify correct answers are computed
    student_questions.each do |sq|
      expected = FormulaEvaluator.evaluate_to_s("a + b", sq.values)
      assert_equal expected, sq.correct_answer
    end
  end

  test "generates fixed student questions for all students" do
    exam_question = exam_questions(:mc_q1)
    exam_question.update_columns(
      parameterized: true,
      template_text: "What is {a} + {b}?",
      variables: [ { "name" => "a", "min" => 1, "max" => 50 }, { "name" => "b", "min" => 1, "max" => 50 } ],
      formula: "a + b",
      value_mode: 0, # fixed
      fixed_values: { "a" => 10, "b" => 7 }
    )

    classroom_exam = classroom_exams(:alice_mc_exam)
    classroom_exam.classroom.students

    StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam).delete_all

    QuestionGenerator.generate_for_classroom_exam!(classroom_exam)

    student_questions = StudentQuestion.where(exam_question: exam_question, classroom_exam: classroom_exam)

    # All students get same values
    student_questions.each do |sq|
      assert_equal({ "a" => 10, "b" => 7 }, sq.values)
      assert_equal "What is 10 + 7?", sq.generated_text
      assert_equal "17", sq.correct_answer
    end
  end

  test "calculates total possible combinations" do
    variables = [
      { "name" => "a", "min" => 1, "max" => 10 },
      { "name" => "b", "min" => 1, "max" => 5 }
    ]
    combos = QuestionGenerator.total_combinations(variables)
    assert_equal 50, combos # 10 * 5
  end
end
