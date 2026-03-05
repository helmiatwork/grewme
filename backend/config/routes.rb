Rails.application.routes.draw do
  # Avo admin panel
  mount_avo

  # Avo admin authentication
  get "avo/sign_in", to: "avo/sessions#new"
  post "avo/sign_in", to: "avo/sessions#create"
  delete "avo/sign_out", to: "avo/sessions#destroy"

  # GraphQL API
  post "/graphql", to: "graphql#execute"

  get "up" => "rails/health#show", :as => :rails_health_check
end
