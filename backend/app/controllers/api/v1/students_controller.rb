module Api
  module V1
    class StudentsController < BaseController
      def show
        @student = Student.find(params[:id])
        authorize @student
        render json: StudentResource.new(@student).serialize
      end

      def radar
        @student = Student.find(params[:id])
        authorize @student

        averages = @student.radar_data
        radar = OpenStruct.new(
          student_id: @student.id,
          student_name: @student.name,
          avg_reading: averages["reading"],
          avg_math: averages["math"],
          avg_writing: averages["writing"],
          avg_logic: averages["logic"],
          avg_social: averages["social"]
        )
        render json: RadarDataResource.new(radar).serialize
      end

      def progress
        @student = Student.find(params[:id])
        authorize @student

        weeks = 4.downto(0).map do |i|
          week_start = i.weeks.ago.beginning_of_week.to_date
          week_end = i.weeks.ago.end_of_week.to_date
          averages = @student.radar_data(start_date: week_start, end_date: week_end)
          {
            period: "Week of #{week_start.strftime("%b %d")}",
            reading: averages["reading"],
            math: averages["math"],
            writing: averages["writing"],
            logic: averages["logic"],
            social: averages["social"]
          }
        end

        render json: ProgressDataResource.new(weeks).serialize
      end
    end
  end
end
