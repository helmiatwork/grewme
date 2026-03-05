# frozen_string_literal: true

class GrewmeSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)

  use GraphQL::Dataloader

  # Union and interface resolution
  def self.resolve_type(abstract_type, obj, ctx)
    case obj
    when Teacher then Types::TeacherType
    when Parent then Types::ParentType
    else
      raise GraphQL::ExecutionError, "Unexpected object: #{obj}"
    end
  end

  def self.id_from_object(object, type_definition, query_ctx)
    object.to_gid_param
  end

  def self.object_from_id(global_id, query_ctx)
    GlobalID.find(global_id)
  end

  # Error handling
  rescue_from(ActiveRecord::RecordNotFound) do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, "#{err.model || "Record"} not found"
  end

  rescue_from(Pundit::NotAuthorizedError) do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, "Not authorized"
  end

  # Limits
  max_query_string_tokens(5000)
  validate_max_errors(100)
  default_max_page_size 100
  default_page_size 30
end
