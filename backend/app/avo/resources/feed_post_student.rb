class Avo::Resources::FeedPostStudent < Avo::BaseResource
  self.title = :id
  self.includes = [ :feed_post, :student ]

  def fields
    field :id, as: :id
    field :feed_post, as: :belongs_to
    field :student, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
