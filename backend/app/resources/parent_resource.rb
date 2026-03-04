class ParentResource
  include Alba::Resource

  root_key :user
  attributes :id, :name, :email

  attribute :role do |_parent|
    "parent"
  end
end
