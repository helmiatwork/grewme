Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Auth
      post "auth/login", to: "auth#login"
      post "auth/register", to: "auth#register"
      post "auth/refresh", to: "auth#refresh"

      # Classrooms (teacher)
      resources :classrooms, only: [ :index, :show ] do
        get :overview, on: :member
        resources :students, only: [ :index ], controller: "classrooms/students"
      end

      # Scores
      resources :daily_scores, only: [ :create, :update ]

      # Students (shared by teacher + parent)
      resources :students, only: [ :show ] do
        get :radar, on: :member
        get :progress, on: :member
        resources :daily_scores, only: [ :index ], controller: "students/daily_scores"
      end

      # Parent endpoints
      namespace :parents do
        resources :children, only: [ :index ]
      end
    end
  end

  get "up" => "rails/health#show", :as => :rails_health_check
end
