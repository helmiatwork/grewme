puts "Seeding database..."

# School
school = School.create!(
  name: "Greenwood Elementary",
  address_line1: "123 Oak Street",
  city: "Portland",
  state_province: "Oregon",
  postal_code: "97201",
  country_code: "US"
)

# Teachers
teacher1 = Teacher.create!(name: "Alice Teacher", email: "alice@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
teacher2 = Teacher.create!(name: "Bob Teacher", email: "bob@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)

# Parents
parent1 = Parent.create!(name: "Carol Parent", email: "carol@parent.com", password: "password123", password_confirmation: "password123")
parent2 = Parent.create!(name: "Dan Parent", email: "dan@parent.com", password: "password123", password_confirmation: "password123")
parent3 = Parent.create!(name: "Eve Parent", email: "eve@parent.com", password: "password123", password_confirmation: "password123")

# Admin user for Avo
AdminUser.create!(email: "admin@grewme.app", password: "password123", password_confirmation: "password123")

# Classrooms
class1a = Classroom.create!(name: "Class 1A", school: school)
class2b = Classroom.create!(name: "Class 2B", school: school)

# Assign teachers to classrooms (many-to-many)
ClassroomTeacher.create!(classroom: class1a, teacher: teacher1, role: "primary")
ClassroomTeacher.create!(classroom: class2b, teacher: teacher2, role: "primary")
ClassroomTeacher.create!(classroom: class1a, teacher: teacher2, role: "assistant")

# Students (10 total)
students_1a = %w[Emma Finn Liam Noah Olivia].map do |name|
  student = Student.create!(name: name)
  student.enroll!(class1a, academic_year: "2025/2026")
  student
end
students_2b = %w[Ava Grace Henry Isla Jack].map do |name|
  student = Student.create!(name: name)
  student.enroll!(class2b, academic_year: "2025/2026")
  student
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
    teacher = student.current_classroom.primary_teacher
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

# Feed posts
post1 = FeedPost.create!(teacher: teacher1, classroom: class1a, body: "Today we practiced reading comprehension with a fun story about space explorers! The kids were so engaged. 🚀📚")
post2 = FeedPost.create!(teacher: teacher1, classroom: class1a, body: "Math quiz results are in! Everyone improved from last week. Keep up the great work! 🎉")
FeedPost.create!(teacher: teacher2, classroom: class2b, body: "We started our new science project today. The students are building model volcanoes! 🌋")
FeedPost.create!(teacher: teacher1, classroom: class1a, body: "Reminder: Parent-teacher conference next Friday. Looking forward to meeting everyone!")

# Feed post likes
FeedPostLike.create!(feed_post: post1, liker: parent1)
FeedPostLike.create!(feed_post: post1, liker: parent2)
FeedPostLike.create!(feed_post: post2, liker: parent1)

# Feed post comments
FeedPostComment.create!(feed_post: post1, commenter: parent1, body: "Emma loved the space story! She kept talking about it at dinner 😊")
FeedPostComment.create!(feed_post: post1, commenter: parent2, body: "Liam too! Can we get the book title?")
FeedPostComment.create!(feed_post: post1, commenter: teacher1, body: "The book is 'Mousetronaut' by Mark Kelly! Great for bedtime reading.")
FeedPostComment.create!(feed_post: post2, commenter: parent1, body: "So proud of the kids!")

puts "Seeded: #{School.count} school, #{Teacher.count} teachers, #{Parent.count} parents, #{Classroom.count} classrooms, #{Student.count} students, #{DailyScore.count} scores"
puts "Seeded: #{FeedPost.count} feed posts, #{FeedPostLike.count} likes, #{FeedPostComment.count} comments"
puts "Admin user: admin@grewme.app / password123"

# Refresh materialized view
if ActiveRecord::Base.connection.view_exists?(:student_radar_summaries)
  StudentRadarSummary.refresh
  puts "Refreshed radar summaries"
end
