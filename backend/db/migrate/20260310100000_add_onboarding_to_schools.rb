class AddOnboardingToSchools < ActiveRecord::Migration[8.1]
  def change
    add_column :schools, :onboarding_completed_at, :datetime
    add_column :schools, :onboarding_step, :integer, default: 0, null: false
  end
end
