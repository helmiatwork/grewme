module Api
  module V1
    class DailyScoresController < BaseController
      def create
        @daily_score = DailyScore.new(daily_score_params)
        @daily_score.teacher = current_user

        student = Student.find(@daily_score.student_id)
        authorize student, :show?
        authorize @daily_score

        if @daily_score.save
          render json: DailyScoreResource.new(@daily_score).serialize, status: :created
        else
          render json: { error: { code: "validation_failed", message: "Validation failed", details: @daily_score.errors } }, status: :unprocessable_entity
        end
      end

      def update
        @daily_score = DailyScore.find(params[:id])
        authorize @daily_score

        if @daily_score.update(daily_score_update_params)
          render json: DailyScoreResource.new(@daily_score).serialize
        else
          render json: { error: { code: "validation_failed", message: "Validation failed", details: @daily_score.errors } }, status: :unprocessable_entity
        end
      end

      private

      def daily_score_params
        params.require(:daily_score).permit(:student_id, :date, :skill_category, :score, :notes)
      end

      def daily_score_update_params
        params.require(:daily_score).permit(:score, :notes)
      end
    end
  end
end
