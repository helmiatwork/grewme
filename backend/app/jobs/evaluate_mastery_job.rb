class EvaluateMasteryJob < ApplicationJob
  queue_as :default

  def perform(student_id, topic_id)
    student = Student.find(student_id)
    topic = Topic.find(topic_id)

    topic.learning_objectives.each do |objective|
      MasteryEvaluationService.evaluate(student, objective)
    end
  end
end
