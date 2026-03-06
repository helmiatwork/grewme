class Avo::Resources::FeedPost < Avo::BaseResource
  self.title = :id
  self.includes = [ :teacher, :classroom ]

  def fields
    field :id, as: :id
    field :body, as: :textarea
    field :likes_count, as: :number, readonly: true
    field :comments_count, as: :number, readonly: true
    field :teacher, as: :belongs_to
    field :classroom, as: :belongs_to
    field :feed_post_students, as: :has_many
    field :likes, as: :has_many
    field :comments, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
