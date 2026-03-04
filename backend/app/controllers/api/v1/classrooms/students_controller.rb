module Api
  module V1
    module Classrooms
      class StudentsController < BaseController
        def index
          @classroom = Classroom.find(params[:classroom_id])
          authorize @classroom, :show?

          @students = @classroom.students
          render json: StudentResource.new(@students).serialize
        end
      end
    end
  end
end
