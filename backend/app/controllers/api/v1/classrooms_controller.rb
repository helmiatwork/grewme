require "ostruct"

module Api
  module V1
    class ClassroomsController < BaseController
      def index
        @classrooms = policy_scope(Classroom).includes(:classroom_teachers, :classroom_students)
        render json: ClassroomResource.new(@classrooms).serialize
      end

      def show
        @classroom = Classroom.find(params[:id])
        authorize @classroom
        render json: ClassroomResource.new(@classroom).serialize
      end

      def overview
        @classroom = Classroom.find(params[:id])
        authorize @classroom

        students = @classroom.students.includes(:daily_scores)
        radar_data = students.map do |student|
          averages = student.radar_data
          OpenStruct.new(
            student_id: student.id,
            student_name: student.name,
            avg_reading: averages["reading"],
            avg_math: averages["math"],
            avg_writing: averages["writing"],
            avg_logic: averages["logic"],
            avg_social: averages["social"]
          )
        end
        render json: RadarDataResource.new(radar_data).serialize
      end
    end
  end
end
