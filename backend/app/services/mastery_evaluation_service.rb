class MasteryEvaluationService
  def self.evaluate(student, learning_objective)
    new(student, learning_objective).evaluate
  end

  def initialize(student, learning_objective)
    @student = student
    @objective = learning_objective
  end

  def evaluate
    mastery = ObjectiveMastery.find_or_create_by!(
      student: @student,
      learning_objective: @objective
    )

    mastery.exam_mastered = exam_mastered?
    mastery.daily_mastered = daily_mastered?

    if mastery.mastered? && mastery.mastered_at.nil?
      mastery.mastered_at = Time.current
    elsif !mastery.mastered?
      mastery.mastered_at = nil
    end

    mastery.save!
    mastery
  end

  private

  def exam_mastered?
    topic = @objective.topic
    classroom_exam_ids = ClassroomExam.joins(:exam).where(exams: { topic_id: topic.id }).pluck(:id)

    return false if classroom_exam_ids.empty?

    best_score = ExamSubmission
      .where(student: @student, classroom_exam_id: classroom_exam_ids, status: :graded)
      .maximum(:score)

    return false if best_score.nil?

    best_score >= @objective.exam_pass_threshold
  end

  def daily_mastered?
    avg = @student.daily_scores.average(:score)
    return false if avg.nil?

    avg >= @objective.daily_score_threshold
  end
end
