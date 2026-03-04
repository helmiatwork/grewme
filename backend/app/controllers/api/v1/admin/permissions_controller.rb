module Api
  module V1
    module Admin
      class PermissionsController < BaseController
        before_action :set_target_user
        before_action :set_permission, only: [ :update, :destroy ]

        def index
          authorize Permission
          permissions = @target_user.permissions
          effective = @target_user.effective_permissions

          render json: {
            user_id: @target_user.id,
            role: @target_user.role,
            overrides: PermissionResource.new(permissions).serialize,
            effective: effective
          }
        end

        def create
          permission = @target_user.permissions.build(permission_params)
          authorize permission

          if permission.save
            render json: PermissionResource.new(permission).serialize, status: :created
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: permission.errors } }, status: :unprocessable_entity
          end
        end

        def update
          authorize @permission

          if @permission.update(update_params)
            render json: PermissionResource.new(@permission).serialize
          else
            render json: { error: { code: "validation_failed", message: "Validation failed", details: @permission.errors } }, status: :unprocessable_entity
          end
        end

        def destroy
          authorize @permission
          @permission.destroy!
          head :no_content
        end

        private

        def set_target_user
          @target_user = if params[:teacher_id]
            Teacher.find(params[:teacher_id])
          elsif params[:parent_id]
            Parent.find(params[:parent_id])
          end
        end

        def set_permission
          @permission = @target_user.permissions.find(params[:id])
        end

        def permission_params
          params.require(:permission).permit(:resource, :action, :granted)
        end

        def update_params
          params.require(:permission).permit(:granted)
        end
      end
    end
  end
end
