Rails.application.routes.draw do
  # Avo admin panel
  mount_avo

  # Avo admin authentication
  get "avo/sign_in", to: "avo/sessions#new"
  post "avo/sign_in", to: "avo/sessions#create"
  delete "avo/sign_out", to: "avo/sessions#destroy"

  namespace :api do
    namespace :v1 do
      # Teacher auth
      namespace :teachers do
        post "auth/login", to: "auth#login"
        post "auth/register", to: "auth#register"
        post "auth/refresh", to: "auth#refresh"
        delete "auth/logout", to: "auth#logout"
      end

      # Parent auth
      namespace :parents do
        post "auth/login", to: "auth#login"
        post "auth/register", to: "auth#register"
        post "auth/refresh", to: "auth#refresh"
        delete "auth/logout", to: "auth#logout"
        resources :children, only: [ :index ]
      end

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

      # Admin endpoints
      namespace :admin do
        resources :teachers, only: [] do
          resources :permissions, only: [ :index, :create, :update, :destroy ]
        end
        resources :parents, only: [] do
          resources :permissions, only: [ :index, :create, :update, :destroy ]
        end
      end
    end
  end

  get "up" => "rails/health#show", :as => :rails_health_check
end
