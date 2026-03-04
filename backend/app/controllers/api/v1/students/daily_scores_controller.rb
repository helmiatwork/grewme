module Api
  module V1
    module Students
      class DailyScoresController < BaseController
        def index
          @student = Student.find(params[:student_id])
          authorize @student, :show?

          page = (params[:page] || 1).to_i
          per_page = (params[:per_page] || 30).to_i.clamp(1, 100)

          @scores = @student.daily_scores
            .order(date: :desc, skill_category: :asc)
            .offset((page - 1) * per_page)
            .limit(per_page)

          render json: DailyScoreResource.new(@scores).serialize
        end
      end
    end
  end
end
