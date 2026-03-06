class Avo::Resources::FeedPostComment < Avo::BaseResource
  self.title = :id
  self.includes = [ :feed_post ]

  def fields
    field :id, as: :id
    field :body, as: :textarea
    field :commenter_type, as: :text
    field :commenter_id, as: :number
    field :feed_post, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
