class GenerateBehaviorSummariesJob < ApplicationJob
  queue_as :default

  limits_concurrency to: 1, key: -> { "behavior-summaries" }

  def perform
    week_start = Date.current.beginning_of_week

    Classroom.find_each do |classroom|
      classroom.students.find_each do |student|
        points = BehaviorPoint.active
          .where(student_id: student.id, classroom_id: classroom.id)
          .for_week(week_start)

        next if points.empty?

        positive = points.select { |p| p.point_value > 0 }
        negative = points.select { |p| p.point_value < 0 }

        top_category_id = positive
          .group_by(&:behavior_category_id)
          .max_by { |_, pts| pts.size }
          &.first

        BehaviorSummary.upsert(
          {
            student_id: student.id,
            classroom_id: classroom.id,
            week_start: week_start,
            total_points: points.sum(&:point_value),
            positive_count: positive.size,
            negative_count: negative.size,
            top_behavior_category_id: top_category_id,
            created_at: Time.current,
            updated_at: Time.current
          },
          unique_by: [ :student_id, :classroom_id, :week_start ]
        )

        student.parents.find_each do |parent|
          Notification.create!(
            recipient: parent,
            notifiable: student,
            title: "Weekly Behavior Report",
            body: "#{student.name}'s behavior report for this week is ready.",
            kind: "behavior_report"
          )
        end
      end
    end
  end
end
