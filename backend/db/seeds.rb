puts "Seeding database..."

# School
school = School.create!(name: "Greenwood Elementary")

# Teachers
teacher1 = User.create!(name: "Alice Teacher", email: "alice@greenwood.edu", password: "password123", password_confirmation: "password123", role: :teacher)
teacher2 = User.create!(name: "Bob Teacher", email: "bob@greenwood.edu", password: "password123", password_confirmation: "password123", role: :teacher)

# Parents
parent1 = User.create!(name: "Carol Parent", email: "carol@parent.com", password: "password123", password_confirmation: "password123", role: :parent)
parent2 = User.create!(name: "Dan Parent", email: "dan@parent.com", password: "password123", password_confirmation: "password123", role: :parent)
parent3 = User.create!(name: "Eve Parent", email: "eve@parent.com", password: "password123", password_confirmation: "password123", role: :parent)

# Admin
User.create!(name: "Admin User", email: "admin@greenwood.edu", password: "password123", password_confirmation: "password123", role: :admin)

# Classrooms
class1a = Classroom.create!(name: "Class 1A", school: school, teacher: teacher1)
class2b = Classroom.create!(name: "Class 2B", school: school, teacher: teacher2)

# Students (10 total)
students_1a = %w[Emma Finn Liam Noah Olivia].map do |name|
  Student.create!(name: name, classroom: class1a)
end
students_2b = %w[Ava Grace Henry Isla Jack].map do |name|
  Student.create!(name: name, classroom: class2b)
end

# Parent-student links
ParentStudent.create!(parent: parent1, student: students_1a[0])
ParentStudent.create!(parent: parent1, student: students_1a[1])
ParentStudent.create!(parent: parent2, student: students_1a[2])
ParentStudent.create!(parent: parent3, student: students_2b[0])

# Daily scores — 30 days of data for all students
skill_categories = %i[reading math writing logic social]
30.downto(1) do |days_ago|
  date = days_ago.days.ago.to_date
  (students_1a + students_2b).each do |student|
    teacher = student.classroom.teacher
    skill_categories.each do |skill|
      DailyScore.create!(
        student: student,
        teacher: teacher,
        date: date,
        skill_category: skill,
        score: rand(40..95),
        notes: (days_ago <= 3) ? "Recent observation" : ""
      )
    end
  end
end

puts "Seeded: #{School.count} school, #{User.count} users, #{Classroom.count} classrooms, #{Student.count} students, #{DailyScore.count} scores"

# Refresh materialized view
if ActiveRecord::Base.connection.view_exists?(:student_radar_summaries)
  StudentRadarSummary.refresh
  puts "Refreshed radar summaries"
end
