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

# Teachers (4 total)
alice = Teacher.create!(name: "Alice Teacher", email: "alice@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
bob = Teacher.create!(name: "Bob Teacher", email: "bob@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
charlie = Teacher.create!(name: "Charlie Teacher", email: "charlie@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)
diana = Teacher.create!(name: "Diana Teacher", email: "diana@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)

# Parents (12 total)
carol = Parent.create!(name: "Carol Parent", email: "carol@parent.com", password: "password123", password_confirmation: "password123")
dan = Parent.create!(name: "Dan Parent", email: "dan@parent.com", password: "password123", password_confirmation: "password123")
eve = Parent.create!(name: "Eve Parent", email: "eve@parent.com", password: "password123", password_confirmation: "password123")
frank = Parent.create!(name: "Frank Parent", email: "frank@parent.com", password: "password123", password_confirmation: "password123")
grace_p = Parent.create!(name: "Grace Parent", email: "grace@parent.com", password: "password123", password_confirmation: "password123")
hana = Parent.create!(name: "Hana Parent", email: "hana@parent.com", password: "password123", password_confirmation: "password123")
ivan = Parent.create!(name: "Ivan Parent", email: "ivan@parent.com", password: "password123", password_confirmation: "password123")
julia = Parent.create!(name: "Julia Parent", email: "julia@parent.com", password: "password123", password_confirmation: "password123")
kevin = Parent.create!(name: "Kevin Parent", email: "kevin@parent.com", password: "password123", password_confirmation: "password123")
lisa = Parent.create!(name: "Lisa Parent", email: "lisa@parent.com", password: "password123", password_confirmation: "password123")
mike = Parent.create!(name: "Mike Parent", email: "mike@parent.com", password: "password123", password_confirmation: "password123")
nina = Parent.create!(name: "Nina Parent", email: "nina@parent.com", password: "password123", password_confirmation: "password123")

# Admin user for Avo
AdminUser.create!(email: "admin@grewme.app", password: "password123", password_confirmation: "password123")

# School Manager
SchoolManager.create!(name: "Pat Principal", email: "pat@greenwood.edu", password: "password123", password_confirmation: "password123", school: school)

# 7 Classrooms — Alice gets 4, others get 1 each
class1a = Classroom.create!(name: "Class 1A", school: school)
class1b = Classroom.create!(name: "Class 1B", school: school)
class2a = Classroom.create!(name: "Class 2A", school: school)
class2b = Classroom.create!(name: "Class 2B", school: school)
class3a = Classroom.create!(name: "Class 3A", school: school)
class3b = Classroom.create!(name: "Class 3B", school: school)
class4a = Classroom.create!(name: "Class 4A", school: school)

# Assign teachers to classrooms
# Alice: primary in 1A, 3A, 3B, 4A (4 classes)
ClassroomTeacher.create!(classroom: class1a, teacher: alice, role: "primary")
ClassroomTeacher.create!(classroom: class3a, teacher: alice, role: "primary")
ClassroomTeacher.create!(classroom: class3b, teacher: alice, role: "primary")
ClassroomTeacher.create!(classroom: class4a, teacher: alice, role: "primary")
# Bob: primary in 1B, assistant in 1A
ClassroomTeacher.create!(classroom: class1b, teacher: bob, role: "primary")
ClassroomTeacher.create!(classroom: class1a, teacher: bob, role: "assistant")
# Charlie: primary in 2A
ClassroomTeacher.create!(classroom: class2a, teacher: charlie, role: "primary")
# Diana: primary in 2B, assistant in 2A
ClassroomTeacher.create!(classroom: class2b, teacher: diana, role: "primary")
ClassroomTeacher.create!(classroom: class2a, teacher: diana, role: "assistant")

# Students — 8 per Alice's classes, 5 per others = 47 total
student_names = {
  class1a => %w[Emma Finn Liam Noah Olivia Zara Ryan Sophie],
  class1b => %w[Ava Henry Isla Jack Mia],
  class2a => %w[Ethan Sophia Lucas Amelia James],
  class2b => %w[Charlotte Benjamin Harper Elijah Aria],
  class3a => %w[Mason Luna Aiden Chloe Leo Nora Owen Lily],
  class3b => %w[Wyatt Hazel Caleb Violet Theo Ruby Jasper Ivy],
  class4a => %w[Felix Stella Oscar Penelope Hugo Willow Atlas Daisy]
}

all_students = {}
student_names.each do |classroom, names|
  names.each do |name|
    student = Student.create!(name: name)
    student.enroll!(classroom, academic_year: "2025/2026")
    all_students[name] = student
  end
end

# Parent-student links
# Carol has kids in 1A (Alice's class)
ParentStudent.create!(parent: carol, student: all_students["Emma"])
ParentStudent.create!(parent: carol, student: all_students["Finn"])
# Dan has kid in 1A
ParentStudent.create!(parent: dan, student: all_students["Liam"])
# Eve has kids in 1B
ParentStudent.create!(parent: eve, student: all_students["Ava"])
ParentStudent.create!(parent: eve, student: all_students["Henry"])
# Frank has kid in 2A
ParentStudent.create!(parent: frank, student: all_students["Ethan"])
# Grace has kids in 2A
ParentStudent.create!(parent: grace_p, student: all_students["Sophia"])
ParentStudent.create!(parent: grace_p, student: all_students["Lucas"])
# Hana has kid in 2B
ParentStudent.create!(parent: hana, student: all_students["Charlotte"])
# Ivan has kids in 2B
ParentStudent.create!(parent: ivan, student: all_students["Benjamin"])
ParentStudent.create!(parent: ivan, student: all_students["Harper"])
# Julia has kids in 3A (Alice's class)
ParentStudent.create!(parent: julia, student: all_students["Mason"])
ParentStudent.create!(parent: julia, student: all_students["Luna"])
# Kevin has kids in 3B (Alice's class)
ParentStudent.create!(parent: kevin, student: all_students["Wyatt"])
ParentStudent.create!(parent: kevin, student: all_students["Hazel"])
# Lisa has kid in 3B (Alice's class)
ParentStudent.create!(parent: lisa, student: all_students["Caleb"])
# Mike has kids in 4A (Alice's class)
ParentStudent.create!(parent: mike, student: all_students["Felix"])
ParentStudent.create!(parent: mike, student: all_students["Stella"])
# Nina has kid in 4A (Alice's class)
ParentStudent.create!(parent: nina, student: all_students["Oscar"])

# Daily scores — 30 days of data for all students
skill_categories = %i[reading math writing logic social]
30.downto(1) do |days_ago|
  date = days_ago.days.ago.to_date
  all_students.each_value do |student|
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

# Feed posts — varied content across all classrooms
posts = []

# Class 1A posts (Alice — 8 students)
posts << FeedPost.create!(teacher: alice, classroom: class1a, body: "Today we practiced reading comprehension with a fun story about space explorers! The kids were so engaged. 🚀📚")
posts << FeedPost.create!(teacher: alice, classroom: class1a, body: "Math quiz results are in! Everyone improved from last week. Keep up the great work! 🎉")
posts << FeedPost.create!(teacher: alice, classroom: class1a, body: "Reminder: Parent-teacher conference next Friday. Looking forward to meeting everyone!")
posts << FeedPost.create!(teacher: alice, classroom: class1a, body: "We started our creative writing unit today. Ask your kids about their story ideas! ✍️")

# Class 1B posts (Bob)
posts << FeedPost.create!(teacher: bob, classroom: class1b, body: "Class 1B had an amazing art session today. We painted autumn leaves! 🍂🎨")
posts << FeedPost.create!(teacher: bob, classroom: class1b, body: "Great progress in phonics this week. The kids are reading short sentences now!")
posts << FeedPost.create!(teacher: bob, classroom: class1b, body: "Field trip to the science museum next Wednesday. Permission slips due Monday! 🏛️")

# Class 2A posts (Charlie)
posts << FeedPost.create!(teacher: charlie, classroom: class2a, body: "We started multiplication tables today. Practice at home makes a big difference! ✖️")
posts << FeedPost.create!(teacher: charlie, classroom: class2a, body: "Book report presentations were fantastic! Every student did a wonderful job. 📖")
posts << FeedPost.create!(teacher: charlie, classroom: class2a, body: "Science experiment day! We made baking soda volcanoes and learned about chemical reactions. 🌋")

# Class 2B posts (Diana)
posts << FeedPost.create!(teacher: diana, classroom: class2b, body: "We started our new science project today. The students are building model solar systems! 🪐")
posts << FeedPost.create!(teacher: diana, classroom: class2b, body: "Spelling bee practice is going well. Our class champion will be announced Friday! 🐝")

# Class 3A posts (Alice — 8 students)
posts << FeedPost.create!(teacher: alice, classroom: class3a, body: "Class 3A is diving into fractions this week. We used pizza slices to make it fun! 🍕")
posts << FeedPost.create!(teacher: alice, classroom: class3a, body: "History project presentations next week. Students are researching famous inventors! 💡")
posts << FeedPost.create!(teacher: alice, classroom: class3a, body: "Amazing teamwork in today's group science experiment. Every team built a working circuit! ⚡")

# Class 3B posts (Alice — 8 students)
posts << FeedPost.create!(teacher: alice, classroom: class3b, body: "Class 3B started their poetry unit today. We read Shel Silverstein and the kids loved it! 📝")
posts << FeedPost.create!(teacher: alice, classroom: class3b, body: "Geography quiz went really well. Most students scored above 80%! 🌍")
posts << FeedPost.create!(teacher: alice, classroom: class3b, body: "Art day! We made clay models of landforms — mountains, valleys, and plateaus. 🏔️")

# Class 4A posts (Alice — 8 students)
posts << FeedPost.create!(teacher: alice, classroom: class4a, body: "Class 4A is working on long division this week. It's challenging but they're getting it! ➗")
posts << FeedPost.create!(teacher: alice, classroom: class4a, body: "We started reading Charlotte's Web today. The students are already hooked! 🕷️📖")
posts << FeedPost.create!(teacher: alice, classroom: class4a, body: "Science fair projects are due next month. Please help your kids pick a topic this weekend! 🔬")

# Tagged posts
FeedPostStudent.create!(feed_post: posts[1], student: all_students["Emma"])     # Math quiz → Emma
FeedPostStudent.create!(feed_post: posts[1], student: all_students["Finn"])     # Math quiz → Finn
FeedPostStudent.create!(feed_post: posts[1], student: all_students["Zara"])     # Math quiz → Zara
FeedPostStudent.create!(feed_post: posts[3], student: all_students["Olivia"])   # Creative writing → Olivia
FeedPostStudent.create!(feed_post: posts[3], student: all_students["Sophie"])   # Creative writing → Sophie
FeedPostStudent.create!(feed_post: posts[8], student: all_students["Ethan"])    # Book report → Ethan
FeedPostStudent.create!(feed_post: posts[8], student: all_students["Sophia"])   # Book report → Sophia
FeedPostStudent.create!(feed_post: posts[12], student: all_students["Mason"])    # Fractions → Mason
FeedPostStudent.create!(feed_post: posts[14], student: all_students["Aiden"])    # Science circuit → Aiden
FeedPostStudent.create!(feed_post: posts[14], student: all_students["Leo"])      # Science circuit → Leo
FeedPostStudent.create!(feed_post: posts[15], student: all_students["Wyatt"])    # Poetry → Wyatt
FeedPostStudent.create!(feed_post: posts[15], student: all_students["Ivy"])      # Poetry → Ivy
FeedPostStudent.create!(feed_post: posts[18], student: all_students["Felix"])    # Long division → Felix
FeedPostStudent.create!(feed_post: posts[19], student: all_students["Penelope"]) # Charlotte's Web → Penelope

# Feed post likes
FeedPostLike.create!(feed_post: posts[0], liker: carol)
FeedPostLike.create!(feed_post: posts[0], liker: dan)
FeedPostLike.create!(feed_post: posts[1], liker: carol)
FeedPostLike.create!(feed_post: posts[4], liker: eve)
FeedPostLike.create!(feed_post: posts[7], liker: frank)
FeedPostLike.create!(feed_post: posts[7], liker: grace_p)
FeedPostLike.create!(feed_post: posts[10], liker: hana)
FeedPostLike.create!(feed_post: posts[10], liker: ivan)
FeedPostLike.create!(feed_post: posts[12], liker: julia)
FeedPostLike.create!(feed_post: posts[15], liker: kevin)
FeedPostLike.create!(feed_post: posts[16], liker: kevin)
FeedPostLike.create!(feed_post: posts[16], liker: lisa)
FeedPostLike.create!(feed_post: posts[18], liker: mike)
FeedPostLike.create!(feed_post: posts[19], liker: mike)
FeedPostLike.create!(feed_post: posts[19], liker: nina)

# Feed post comments
FeedPostComment.create!(feed_post: posts[0], commenter: carol, body: "Emma loved the space story! She kept talking about it at dinner 😊")
FeedPostComment.create!(feed_post: posts[0], commenter: dan, body: "Liam too! Can we get the book title?")
FeedPostComment.create!(feed_post: posts[0], commenter: alice, body: "The book is 'Mousetronaut' by Mark Kelly! Great for bedtime reading.")
FeedPostComment.create!(feed_post: posts[1], commenter: carol, body: "So proud of the kids!")
FeedPostComment.create!(feed_post: posts[4], commenter: eve, body: "Ava brought her painting home — it's beautiful! 🎨")
FeedPostComment.create!(feed_post: posts[7], commenter: frank, body: "Ethan has been practicing at home. He loves math now!")
FeedPostComment.create!(feed_post: posts[7], commenter: charlie, body: "That's great to hear! He's doing really well in class too.")
FeedPostComment.create!(feed_post: posts[10], commenter: hana, body: "Charlotte is so excited about the solar system project!")
FeedPostComment.create!(feed_post: posts[12], commenter: julia, body: "Mason said fractions are actually fun now 😄")
FeedPostComment.create!(feed_post: posts[15], commenter: kevin, body: "Wyatt came home reciting poems! Love it 📖")
FeedPostComment.create!(feed_post: posts[16], commenter: lisa, body: "Caleb was so proud of his geography score!")
FeedPostComment.create!(feed_post: posts[18], commenter: mike, body: "Felix is struggling a bit with long division. Any tips for practice at home?")
FeedPostComment.create!(feed_post: posts[18], commenter: alice, body: "Try Khan Academy's division games — they make it fun! I'll also give Felix extra practice sheets.")
FeedPostComment.create!(feed_post: posts[19], commenter: nina, body: "Oscar already wants to read ahead! 😄")

# Calendar events — spread across this month and next
today = Date.today
this_month_start = today.beginning_of_month
next_month_start = (today + 1.month).beginning_of_month

# Teacher-created events
ClassroomEvent.create!(classroom: class1a, creator: alice, title: "Parent-Teacher Conference", description: "Individual meetings to discuss student progress", event_date: this_month_start + 14, start_time: Time.zone.parse("14:00"), end_time: Time.zone.parse("17:00"))
ClassroomEvent.create!(classroom: class1a, creator: alice, title: "Reading Day", description: "Students bring their favorite book to share", event_date: this_month_start + 20, start_time: Time.zone.parse("09:00"), end_time: Time.zone.parse("11:00"))
ClassroomEvent.create!(classroom: class1a, creator: alice, title: "Math Quiz", event_date: this_month_start + 22, start_time: Time.zone.parse("10:00"), end_time: Time.zone.parse("10:45"))
ClassroomEvent.create!(classroom: class3a, creator: alice, title: "Science Fair", description: "Students present their science projects to parents and judges", event_date: next_month_start + 5, start_time: Time.zone.parse("09:00"), end_time: Time.zone.parse("14:00"))
ClassroomEvent.create!(classroom: class3a, creator: alice, title: "History Presentations", event_date: this_month_start + 18, start_time: Time.zone.parse("13:00"), end_time: Time.zone.parse("15:00"))
ClassroomEvent.create!(classroom: class3b, creator: alice, title: "Poetry Recital", description: "Students perform their original poems", event_date: this_month_start + 25, start_time: Time.zone.parse("10:00"), end_time: Time.zone.parse("11:30"))
ClassroomEvent.create!(classroom: class3b, creator: alice, title: "Art Exhibition", event_date: next_month_start + 10, start_time: Time.zone.parse("14:00"), end_time: Time.zone.parse("16:00"))
ClassroomEvent.create!(classroom: class4a, creator: alice, title: "Long Division Workshop", description: "Extra practice session for students who need help", event_date: this_month_start + 16, start_time: Time.zone.parse("14:00"), end_time: Time.zone.parse("15:30"))
ClassroomEvent.create!(classroom: class4a, creator: alice, title: "Charlotte's Web Book Club", event_date: this_month_start + 28, start_time: Time.zone.parse("13:00"), end_time: Time.zone.parse("14:00"))
ClassroomEvent.create!(classroom: class1b, creator: bob, title: "Field Trip to Science Museum", description: "Permission slips required. Bring packed lunch.", event_date: next_month_start + 8, start_time: Time.zone.parse("08:30"), end_time: Time.zone.parse("15:00"))
ClassroomEvent.create!(classroom: class1b, creator: bob, title: "Phonics Assessment", event_date: this_month_start + 19, start_time: Time.zone.parse("09:00"), end_time: Time.zone.parse("10:00"))
ClassroomEvent.create!(classroom: class2a, creator: charlie, title: "Multiplication Bee", description: "Classroom competition for multiplication tables", event_date: this_month_start + 21, start_time: Time.zone.parse("10:00"), end_time: Time.zone.parse("11:00"))
ClassroomEvent.create!(classroom: class2b, creator: diana, title: "Solar System Project Due", event_date: this_month_start + 24)
ClassroomEvent.create!(classroom: class2b, creator: diana, title: "Spelling Bee Finals", description: "Class champion will be announced!", event_date: this_month_start + 26, start_time: Time.zone.parse("13:00"), end_time: Time.zone.parse("14:00"))

# Parent-created events
ClassroomEvent.create!(classroom: class1a, creator: carol, title: "Bake Sale Fundraiser", description: "Parents organizing a bake sale to fund class supplies", event_date: next_month_start + 12, start_time: Time.zone.parse("11:00"), end_time: Time.zone.parse("14:00"))
ClassroomEvent.create!(classroom: class3a, creator: julia, title: "Class Picnic", description: "End-of-month family picnic at the park", event_date: next_month_start + 20, start_time: Time.zone.parse("10:00"), end_time: Time.zone.parse("14:00"))
ClassroomEvent.create!(classroom: class4a, creator: mike, title: "Study Group", description: "Parents organizing a weekend study group for math", event_date: this_month_start + 23, start_time: Time.zone.parse("10:00"), end_time: Time.zone.parse("12:00"))

puts "Seeded: #{School.count} school, #{Teacher.count} teachers, #{Parent.count} parents, #{Classroom.count} classrooms, #{Student.count} students, #{DailyScore.count} scores"
puts "Seeded: #{FeedPost.count} feed posts, #{FeedPostLike.count} likes, #{FeedPostComment.count} comments"
puts "Seeded: #{ClassroomEvent.count} calendar events"
puts "Admin user: admin@grewme.app / password123"
puts "School Manager: pat@greenwood.edu / password123 (Greenwood Elementary — full school access)"
puts ""
puts "Teacher logins:"
puts "  alice@greenwood.edu / password123 (Class 1A, 3A, 3B, 4A — 4 classes, 32 students)"
puts "  bob@greenwood.edu / password123 (Class 1B primary, 1A assistant)"
puts "  charlie@greenwood.edu / password123 (Class 2A primary)"
puts "  diana@greenwood.edu / password123 (Class 2B primary, 2A assistant)"
puts ""
puts "Parent logins:"
puts "  carol@parent.com / password123 (Emma + Finn in 1A)"
puts "  dan@parent.com / password123 (Liam in 1A)"
puts "  eve@parent.com / password123 (Ava + Henry in 1B)"
puts "  frank@parent.com / password123 (Ethan in 2A)"
puts "  grace@parent.com / password123 (Sophia + Lucas in 2A)"
puts "  hana@parent.com / password123 (Charlotte in 2B)"
puts "  ivan@parent.com / password123 (Benjamin + Harper in 2B)"
puts "  julia@parent.com / password123 (Mason + Luna in 3A)"
puts "  kevin@parent.com / password123 (Wyatt + Hazel in 3B)"
puts "  lisa@parent.com / password123 (Caleb in 3B)"
puts "  mike@parent.com / password123 (Felix + Stella in 4A)"
puts "  nina@parent.com / password123 (Oscar in 4A)"

# Refresh materialized view
if ActiveRecord::Base.connection.view_exists?(:student_radar_summaries)
  StudentRadarSummary.refresh
  puts "Refreshed radar summaries"
end
