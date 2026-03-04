module Api
  module V1
    module Parents
      class ChildrenController < BaseController
        def index
          unless current_user.parent?
            raise ApiError::Forbidden, "Only parents can access this endpoint"
          end
          @children = current_user.children
          render json: StudentResource.new(@children).serialize
        end
      end
    end
  end
end
