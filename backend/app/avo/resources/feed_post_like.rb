class Avo::Resources::FeedPostLike < Avo::BaseResource
  self.title = :id
  self.includes = [ :feed_post ]

  def fields
    field :id, as: :id
    field :liker_type, as: :text
    field :liker_id, as: :number
    field :feed_post, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
