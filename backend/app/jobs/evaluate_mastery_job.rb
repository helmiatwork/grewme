class EvaluateMasteryJob < ApplicationJob
  queue_as :default

  limits_concurrency to: 1, key: ->(student_id, topic_id) { "mastery-#{student_id}-#{topic_id}" }

  retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3

  def perform(student_id, topic_id)
    student = Student.find(student_id)
    topic = Topic.find(topic_id)

    topic.learning_objectives.each do |objective|
      MasteryEvaluationService.evaluate(student, objective)
    end
  end
end
