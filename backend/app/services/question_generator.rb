class QuestionGenerator
  MAX_UNIQUENESS_ATTEMPTS = 1000

  # Render template text by substituting {variable} placeholders with values
  def self.render_text(template_text, values)
    text = template_text.dup
    values.each do |key, val|
      formatted = (val.is_a?(Float) && val == val.to_i) ? val.to_i.to_s : val.to_s
      text.gsub!("{#{key}}", formatted)
    end
    text
  end

  # Generate random integer values within variable ranges
  def self.random_values(variables)
    variables.each_with_object({}) do |var, hash|
      hash[var["name"]] = rand(var["min"]..var["max"])
    end
  end

  # Generate N unique value sets
  def self.unique_value_sets(variables, count)
    sets = Set.new
    attempts = 0

    while sets.size < count && attempts < MAX_UNIQUENESS_ATTEMPTS
      vals = random_values(variables)
      sets.add(vals)
      attempts += 1
    end

    # If we can't get enough unique sets, fill with random (may overlap)
    while sets.size < count
      sets.add(random_values(variables))
    end

    sets.to_a
  end

  # Calculate total possible combinations for uniqueness check
  def self.total_combinations(variables)
    variables.reduce(1) { |prod, var| prod * (var["max"] - var["min"] + 1) }
  end

  # Generate StudentQuestion records for all parameterized questions in a classroom exam
  def self.generate_for_classroom_exam!(classroom_exam)
    exam = classroom_exam.exam
    students = classroom_exam.classroom.students.to_a
    return if students.empty?

    parameterized_questions = exam.exam_questions.where(parameterized: true)
    return if parameterized_questions.empty?

    ActiveRecord::Base.transaction do
      parameterized_questions.each do |eq|
        generate_for_question!(eq, students, classroom_exam)
      end
    end
  end

  private

  def self.generate_for_question!(exam_question, students, classroom_exam)
    if exam_question.shuffled?
      value_sets = unique_value_sets(exam_question.variables, students.size)
      students.each_with_index do |student, i|
        create_student_question!(exam_question, student, classroom_exam, value_sets[i])
      end
    else
      # Fixed mode: all students get the same values
      values = exam_question.fixed_values
      students.each do |student|
        create_student_question!(exam_question, student, classroom_exam, values)
      end
    end
  end

  def self.create_student_question!(exam_question, student, classroom_exam, values)
    generated_text = render_text(exam_question.template_text, values)
    correct_answer = FormulaEvaluator.evaluate_to_s(exam_question.formula, values)

    StudentQuestion.create!(
      exam_question: exam_question,
      student: student,
      classroom_exam: classroom_exam,
      values: values,
      generated_text: generated_text,
      correct_answer: correct_answer
    )
  end
end
