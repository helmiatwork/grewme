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
class1a = Classroom.create!(name: "Class 1A", school: school, grade: 1)
class1b = Classroom.create!(name: "Class 1B", school: school, grade: 1)
class2a = Classroom.create!(name: "Class 2A", school: school, grade: 2)
class2b = Classroom.create!(name: "Class 2B", school: school, grade: 2)
class3a = Classroom.create!(name: "Class 3A", school: school, grade: 3)
class3b = Classroom.create!(name: "Class 3B", school: school, grade: 3)
class4a = Classroom.create!(name: "Class 4A", school: school, grade: 4)

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

# Invitations — school manager invites teachers
Invitation.create!(inviter: SchoolManager.first, school: school, email: "alice@greenwood.edu", role: "teacher", status: "accepted", accepted_at: 30.days.ago, expires_at: 30.days.from_now)
Invitation.create!(inviter: SchoolManager.first, school: school, email: "bob@greenwood.edu", role: "teacher", status: "accepted", accepted_at: 28.days.ago, expires_at: 30.days.from_now)

# Consents — parents grant consent for their children
[ carol, dan, eve, frank, grace_p, hana, ivan, julia, kevin, lisa, mike, nina ].each do |parent|
  parent.children.each do |child|
    Consent.create!(
      student: child,
      parent: parent,
      parent_email: parent.email,
      consent_method: "email_plus",
      status: :granted,
      granted_at: 20.days.ago
    )
  end
end

# Health checkups — 3 months of data for students in Alice's classes
[ class1a, class3a, class3b, class4a ].each do |classroom|
  classroom.students.each do |student|
    3.downto(1) do |months_ago|
      HealthCheckup.create!(
        student: student,
        teacher: alice,
        measured_at: months_ago.months.ago.to_date,
        weight_kg: (rand(18..26) + rand(0.0..0.9)).round(1),
        height_cm: (rand(105..125) + rand(0.0..0.9)).round(1),
        head_circumference_cm: (rand(49..53) + rand(0.0..0.9)).round(1)
      )
    end
  end
end

# ─── Academic Year ────────────────────────────────────────────────────────────
academic_year = AcademicYear.create!(
  school: school,
  label: "2025/2026",
  start_date: Date.new(2025, 7, 14),
  end_date: Date.new(2026, 6, 19),
  current: true
)

# ─── Subjects, Topics & Learning Objectives ──────────────────────────────────
subjects_data = {
  "Mathematics" => {
    topics: {
      "Numbers & Counting" => [ "Count to 100", "Recognize odd and even numbers", "Compare numbers using < > =" ],
      "Addition & Subtraction" => [ "Add single-digit numbers", "Subtract single-digit numbers", "Solve word problems" ],
      "Fractions" => [ "Identify simple fractions", "Compare fractions", "Add fractions with same denominator" ],
      "Multiplication" => [ "Understand multiplication concept", "Memorize times tables 1-5", "Solve multiplication word problems" ]
    }
  },
  "English" => {
    topics: {
      "Reading Comprehension" => [ "Identify main idea", "Make predictions", "Summarize a passage" ],
      "Writing" => [ "Write complete sentences", "Use correct punctuation", "Write a short paragraph" ],
      "Grammar" => [ "Identify nouns and verbs", "Use adjectives correctly", "Form plural nouns" ],
      "Vocabulary" => [ "Learn 10 new words weekly", "Use context clues", "Understand synonyms and antonyms" ]
    }
  },
  "Science" => {
    topics: {
      "Living Things" => [ "Classify plants and animals", "Understand life cycles", "Identify habitats" ],
      "Matter & Materials" => [ "Identify states of matter", "Describe material properties", "Understand changes in matter" ],
      "Earth & Space" => [ "Describe weather patterns", "Understand day and night cycle", "Identify planets in solar system" ]
    }
  },
  "Social Studies" => {
    topics: {
      "My Community" => [ "Identify community helpers", "Understand rules and laws", "Describe community places" ],
      "Geography" => [ "Read simple maps", "Identify continents and oceans", "Understand cardinal directions" ],
      "History" => [ "Understand timelines", "Learn about national holidays", "Identify historical figures" ]
    }
  },
  "Art" => {
    topics: {
      "Drawing & Painting" => [ "Use primary colors", "Draw from observation", "Create a self-portrait" ],
      "Crafts" => [ "Paper folding techniques", "Clay modeling basics", "Collage creation" ]
    }
  }
}

all_subjects = {}
all_topics = {}

subjects_data.each do |subject_name, data|
  subject = Subject.create!(school: school, name: subject_name)
  all_subjects[subject_name] = subject

  data[:topics].each_with_index do |(topic_name, objectives), t_idx|
    topic = Topic.create!(subject: subject, name: topic_name, position: t_idx + 1)
    all_topics[topic_name] = topic

    objectives.each do |obj_name|
      LearningObjective.create!(topic: topic, name: obj_name)
    end
  end
end

# ─── Grade Curriculum (Kurikulum Tahunan) ────────────────────────────────────
# Each grade selects which subjects are taught that year

# Grade 1 (ELM 1): Core basics
gc1 = GradeCurriculum.create!(academic_year: academic_year, grade: 1)
[
  { subject: all_subjects["Mathematics"], position: 1 },
  { subject: all_subjects["English"], position: 2 },
  { subject: all_subjects["Art"], position: 3 }
].each do |item|
  GradeCurriculumItem.create!(grade_curriculum: gc1, **item)
end

# Grade 2 (ELM 2): Adds Science
gc2 = GradeCurriculum.create!(academic_year: academic_year, grade: 2)
[
  { subject: all_subjects["Mathematics"], position: 1 },
  { subject: all_subjects["English"], position: 2 },
  { subject: all_subjects["Science"], position: 3 },
  { subject: all_subjects["Art"], position: 4 }
].each do |item|
  GradeCurriculumItem.create!(grade_curriculum: gc2, **item)
end

# Grade 3 (ELM 3): Adds Social Studies
gc3 = GradeCurriculum.create!(academic_year: academic_year, grade: 3)
[
  { subject: all_subjects["Mathematics"], position: 1 },
  { subject: all_subjects["English"], position: 2 },
  { subject: all_subjects["Science"], position: 3 },
  { subject: all_subjects["Social Studies"], position: 4 },
  { subject: all_subjects["Art"], position: 5 }
].each do |item|
  GradeCurriculumItem.create!(grade_curriculum: gc3, **item)
end

# Grade 4 (ELM 4): All subjects
gc4 = GradeCurriculum.create!(academic_year: academic_year, grade: 4)
[
  { subject: all_subjects["Mathematics"], position: 1 },
  { subject: all_subjects["English"], position: 2 },
  { subject: all_subjects["Science"], position: 3 },
  { subject: all_subjects["Social Studies"], position: 4 },
  { subject: all_subjects["Art"], position: 5 }
].each do |item|
  GradeCurriculumItem.create!(grade_curriculum: gc4, **item)
end

puts "Seeded: #{Subject.count} subjects, #{Topic.count} topics, #{LearningObjective.count} objectives, #{GradeCurriculum.count} grade curriculums"

# ─── Conversations & Messages ────────────────────────────────────────────────
# Alice chats with parents of her students
conversations_data = [
  {
    teacher: alice, parent: carol, student: all_students["Emma"],
    messages: [
      { sender: :parent, body: "Hi Ms. Alice, how is Emma doing in class?", ago: 5.days },
      { sender: :teacher, body: "Hi Carol! Emma is doing great. She's been very active in reading time and her comprehension skills are improving.", ago: 5.days + 2.hours },
      { sender: :parent, body: "That's wonderful to hear! She loves reading at home too.", ago: 4.days },
      { sender: :teacher, body: "Keep encouraging that! I'll send home some recommended book lists next week.", ago: 4.days + 1.hour },
      { sender: :parent, body: "Thank you so much! Looking forward to it.", ago: 4.days + 2.hours }
    ]
  },
  {
    teacher: alice, parent: dan, student: all_students["Liam"],
    messages: [
      { sender: :teacher, body: "Hi Dan, I wanted to let you know that Liam has been having some difficulty with math lately.", ago: 3.days },
      { sender: :parent, body: "Oh no, what's happening?", ago: 3.days + 1.hour },
      { sender: :teacher, body: "He's struggling with subtraction. I think some extra practice at home would help. I can send worksheets.", ago: 3.days + 2.hours },
      { sender: :parent, body: "Yes please, we'll work on it together at home. Thank you for letting me know.", ago: 2.days }
    ]
  },
  {
    teacher: alice, parent: julia, student: all_students["Mason"],
    messages: [
      { sender: :parent, body: "Ms. Alice, Mason mentioned a science project. Can you share the details?", ago: 7.days },
      { sender: :teacher, body: "Yes! The class is building simple circuits. Mason is in a team of 3. They need to present next Friday.", ago: 7.days + 3.hours },
      { sender: :parent, body: "Do they need any materials from home?", ago: 6.days },
      { sender: :teacher, body: "A small flashlight bulb and some aluminum foil would be great if you have them!", ago: 6.days + 1.hour },
      { sender: :parent, body: "Got it! We'll prepare those. Mason is very excited.", ago: 6.days + 2.hours },
      { sender: :teacher, body: "He's been such a great team leader in this project. 😊", ago: 5.days }
    ]
  },
  {
    teacher: alice, parent: kevin, student: all_students["Wyatt"],
    messages: [
      { sender: :teacher, body: "Hi Kevin, just a heads up that Wyatt forgot his homework again today.", ago: 2.days },
      { sender: :parent, body: "I'm sorry about that. We'll make sure he packs it tonight.", ago: 2.days + 30.minutes },
      { sender: :teacher, body: "No worries! He can turn it in tomorrow. He's a bright kid, just needs to remember his bag! 😄", ago: 2.days + 1.hour }
    ]
  },
  {
    teacher: alice, parent: mike, student: all_students["Felix"],
    messages: [
      { sender: :parent, body: "Good morning Ms. Alice! Felix won't be in class today, he has a dentist appointment.", ago: 1.day },
      { sender: :teacher, body: "Thank you for letting me know, Mike. I'll save today's handouts for him.", ago: 1.day + 30.minutes },
      { sender: :parent, body: "Thank you! He should be back tomorrow.", ago: 1.day + 1.hour }
    ]
  },
  {
    teacher: alice, parent: nina, student: all_students["Oscar"],
    messages: [
      { sender: :parent, body: "Hi, I wanted to ask about Oscar's progress in math. He says long division is hard.", ago: 10.days },
      { sender: :teacher, body: "It is a tough topic! Oscar is actually making good progress. He gets the concept, just needs more practice with larger numbers.", ago: 10.days + 4.hours },
      { sender: :parent, body: "Should we get a tutor?", ago: 9.days },
      { sender: :teacher, body: "I don't think that's necessary yet. Let's try extra practice sheets first. If he still struggles after 2 weeks, we can discuss other options.", ago: 9.days + 2.hours },
      { sender: :parent, body: "OK sounds good. Please send the practice sheets.", ago: 9.days + 3.hours },
      { sender: :teacher, body: "Will do! I'll put them in his folder tomorrow.", ago: 8.days },
      { sender: :parent, body: "He did much better on the practice sheets! Thank you for the help.", ago: 3.days },
      { sender: :teacher, body: "That's great to hear! He's been doing better in class too. Keep it up Oscar! 🌟", ago: 3.days + 1.hour }
    ]
  }
]

conversations_data.each do |conv_data|
  convo = Conversation.create!(
    teacher: conv_data[:teacher],
    parent: conv_data[:parent],
    student: conv_data[:student]
  )
  conv_data[:messages].each do |msg|
    sender = (msg[:sender] == :teacher) ? conv_data[:teacher] : conv_data[:parent]
    Message.create!(
      conversation: convo,
      sender: sender,
      body: msg[:body],
      created_at: Time.current - msg[:ago],
      read_at: (msg[:ago] > 1.day) ? Time.current - msg[:ago] + 2.hours : nil
    )
  end
end

puts "Seeded: #{Conversation.count} conversations, #{Message.count} messages"

# ─── Exams ───────────────────────────────────────────────────────────────────
pat = SchoolManager.find_by!(email: "pat@greenwood.edu")

# 1) Multiple Choice exam — Math: Addition & Subtraction (for Class 1A)
mc_exam = Exam.create!(
  title: "Addition & Subtraction Quiz",
  exam_type: :multiple_choice,
  topic: all_topics["Addition & Subtraction"],
  created_by: alice,
  max_score: 5,
  duration_minutes: 30
)
mc_questions = [
  { question_text: "What is 3 + 4?", correct_answer: "7", options: [ "5", "6", "7", "8" ], points: 1 },
  { question_text: "What is 9 - 5?", correct_answer: "4", options: [ "3", "4", "5", "6" ], points: 1 },
  { question_text: "What is 6 + 7?", correct_answer: "13", options: [ "11", "12", "13", "14" ], points: 1 },
  { question_text: "What is 15 - 8?", correct_answer: "7", options: [ "6", "7", "8", "9" ], points: 1 },
  { question_text: "What is 8 + 5?", correct_answer: "13", options: [ "12", "13", "14", "15" ], points: 1 }
].each_with_index.map do |q, idx|
  ExamQuestion.create!(exam: mc_exam, position: idx + 1, **q)
end

# Assign to Class 1A — active, due in 3 days
mc_classroom_exam = ClassroomExam.create!(
  exam: mc_exam,
  classroom: class1a,
  assigned_by: alice,
  status: :active,
  scheduled_at: 2.days.ago,
  due_at: 3.days.from_now
)

# Submissions for 1A students (8 students, 6 graded, 1 submitted, 1 not started)
class1a_students = class1a.students.order(:name).to_a
class1a_students.each_with_index do |student, idx|
  if idx < 6
    submission = ExamSubmission.create!(
      student: student, classroom_exam: mc_classroom_exam,
      status: :graded, score: rand(3..5), graded_at: 1.day.ago
    )
    mc_questions.each do |q|
      correct = [ true, true, true, false, true ].sample
      ExamAnswer.create!(
        exam_submission: submission, exam_question: q,
        selected_answer: correct ? q.correct_answer : q.options.reject { |o| o == q.correct_answer }.sample,
        correct: correct,
        points_awarded: correct ? q.points : 0
      )
    end
  elsif idx == 6
    ExamSubmission.create!(student: student, classroom_exam: mc_classroom_exam, status: :submitted)
  else
    ExamSubmission.create!(student: student, classroom_exam: mc_classroom_exam, status: :not_started)
  end
end

# 2) Rubric exam — English: Writing (for Class 3A)
rubric_exam = Exam.create!(
  title: "Paragraph Writing Assessment",
  exam_type: :rubric,
  topic: all_topics["Writing"],
  created_by: alice,
  duration_minutes: 45
)
rubric_criteria_list = [
  { name: "Content & Ideas", description: "Quality and relevance of ideas", max_score: 5 },
  { name: "Organization", description: "Logical structure and flow", max_score: 5 },
  { name: "Grammar & Spelling", description: "Correct use of grammar and spelling", max_score: 5 },
  { name: "Creativity", description: "Original thinking and expression", max_score: 5 }
].each_with_index.map do |c, idx|
  RubricCriteria.create!(exam: rubric_exam, position: idx + 1, **c)
end

rubric_classroom_exam = ClassroomExam.create!(
  exam: rubric_exam, classroom: class3a, assigned_by: alice,
  status: :closed, scheduled_at: 1.week.ago, due_at: 5.days.ago
)

class3a.students.each do |student|
  submission = ExamSubmission.create!(
    student: student, classroom_exam: rubric_classroom_exam,
    status: :graded, score: rand(12..20), graded_at: 3.days.ago,
    teacher_notes: [ "Good effort!", "Well done!", "Needs improvement in grammar.", "Creative story!", "Keep practicing." ].sample
  )
  rubric_criteria_list.each do |criteria|
    RubricScore.create!(
      exam_submission: submission, rubric_criteria: criteria,
      score: rand(2..5),
      feedback: [ "Excellent", "Good", "Needs work", "Satisfactory", "Outstanding" ].sample
    )
  end
end

# 3) Score-based exam — Science: Living Things (for Class 3B)
score_exam = Exam.create!(
  title: "Living Things Test",
  exam_type: :score_based,
  topic: all_topics["Living Things"],
  created_by: alice,
  max_score: 100,
  duration_minutes: 40
)
[
  { question_text: "Name three characteristics of living things.", correct_answer: "Growth, reproduction, response to stimuli", points: 10 },
  { question_text: "Describe the life cycle of a butterfly.", correct_answer: "Egg → larva → pupa → adult", points: 15 },
  { question_text: "What is a habitat? Give two examples.", correct_answer: "A habitat is where an organism lives. Examples: forest, ocean", points: 10 },
  { question_text: "How do plants make their food?", correct_answer: "Through photosynthesis using sunlight, water, and carbon dioxide", points: 15 },
  { question_text: "Classify these as plants or animals: rose, cat, oak tree, fish, mushroom.", correct_answer: "Plants: rose, oak tree. Animals: cat, fish. Fungi: mushroom", points: 10 }
].each_with_index do |q, idx|
  ExamQuestion.create!(exam: score_exam, position: idx + 1, **q)
end

score_classroom_exam = ClassroomExam.create!(
  exam: score_exam, classroom: class3b, assigned_by: alice,
  status: :active, scheduled_at: 3.days.ago, due_at: 2.days.from_now
)

class3b.students.first(5).each do |student|
  ExamSubmission.create!(
    student: student, classroom_exam: score_classroom_exam,
    status: :graded, score: rand(55..95), graded_at: 1.day.ago,
    passed: true
  )
end
class3b.students.last(3).each do |student|
  ExamSubmission.create!(
    student: student, classroom_exam: score_classroom_exam,
    status: :submitted
  )
end

# 4) Pass/Fail exam — Art: Drawing & Painting (for Class 4A)
pf_exam = Exam.create!(
  title: "Self-Portrait Drawing",
  exam_type: :pass_fail,
  topic: all_topics["Drawing & Painting"],
  created_by: alice,
  duration_minutes: 60
)

pf_classroom_exam = ClassroomExam.create!(
  exam: pf_exam, classroom: class4a, assigned_by: alice,
  status: :closed, scheduled_at: 2.weeks.ago, due_at: 10.days.ago
)

class4a.students.each_with_index do |student, idx|
  ExamSubmission.create!(
    student: student, classroom_exam: pf_classroom_exam,
    status: :graded,
    passed: idx < 7, # 7 pass, 1 fail
    graded_at: 9.days.ago,
    teacher_notes: (idx < 7) ? "Good work on proportions and detail!" : "Needs to focus more on facial proportions. Let's practice together."
  )
end

# 5) Draft exam — Math: Fractions (for Class 3A, not yet assigned)
draft_exam = Exam.create!(
  title: "Fractions Mid-Term Test",
  exam_type: :multiple_choice,
  topic: all_topics["Fractions"],
  created_by: alice,
  max_score: 10,
  duration_minutes: 35
)
[
  { question_text: "What is 1/2 + 1/2?", correct_answer: "1", options: [ "1/2", "1", "2", "1/4" ], points: 2 },
  { question_text: "Which is bigger: 1/3 or 1/4?", correct_answer: "1/3", options: [ "1/3", "1/4", "Same", "Cannot tell" ], points: 2 },
  { question_text: "What is 3/4 of 8?", correct_answer: "6", options: [ "4", "5", "6", "7" ], points: 2 },
  { question_text: "Simplify 2/4.", correct_answer: "1/2", options: [ "1/4", "1/2", "2/3", "1/3" ], points: 2 },
  { question_text: "What is 1/3 + 1/3?", correct_answer: "2/3", options: [ "1/3", "2/3", "1", "2/6" ], points: 2 }
].each_with_index do |q, idx|
  ExamQuestion.create!(exam: draft_exam, position: idx + 1, **q)
end

ClassroomExam.create!(
  exam: draft_exam, classroom: class3a, assigned_by: alice,
  status: :draft, scheduled_at: 1.week.from_now, due_at: 1.week.from_now + 2.days
)

puts "Seeded: #{Exam.count} exams, #{ExamQuestion.count} questions, #{RubricCriteria.count} rubric criteria, #{ClassroomExam.count} classroom exams, #{ExamSubmission.count} submissions"

# ─── Attendance (30 days) ────────────────────────────────────────────────────
alice_classrooms = [ class1a, class3a, class3b, class4a ]

30.downto(1) do |days_ago|
  date = days_ago.days.ago.to_date
  next if date.saturday? || date.sunday?

  alice_classrooms.each do |classroom|
    classroom.students.each do |student|
      # 90% present, 4% sick, 3% excused, 3% unexcused
      roll = rand(100)
      status = if roll < 90 then :present
      elsif roll < 94 then :sick
      elsif roll < 97 then :excused
      else
        :unexcused
      end

      notes = case status
      when :sick then "Student reported feeling unwell"
      when :excused then "Family event"
      when :unexcused then "No notification received"
      end

      Attendance.create!(
        student: student,
        classroom: classroom,
        recorded_by: alice,
        date: date,
        status: status,
        notes: notes
      )
    end
  end
end

puts "Seeded: #{Attendance.count} attendance records"

# ─── Student Leave Requests (Permohonan Izin) ───────────────────────────────
leave_requests_data = [
  # Carol requests sick leave for Emma (1A) — approved
  { parent: carol, student: all_students["Emma"], request_type: :sick, status: :approved,
   start_date: 10.days.ago.to_date, end_date: 8.days.ago.to_date,
   reason: "Emma has a high fever and the doctor advised rest for 3 days.",
   reviewed_by: alice, reviewed_at: 10.days.ago + 2.hours },
  # Dan requests excused leave for Liam (1A) — approved
  { parent: dan, student: all_students["Liam"], request_type: :excused, status: :approved,
   start_date: 15.days.ago.to_date, end_date: 15.days.ago.to_date,
   reason: "Family wedding ceremony out of town.",
   reviewed_by: alice, reviewed_at: 15.days.ago + 3.hours },
  # Julia requests sick leave for Mason (3A) — approved
  { parent: julia, student: all_students["Mason"], request_type: :sick, status: :approved,
   start_date: 20.days.ago.to_date, end_date: 18.days.ago.to_date,
   reason: "Mason has chickenpox. Doctor's note attached.",
   reviewed_by: alice, reviewed_at: 20.days.ago + 1.hour },
  # Julia requests excused leave for Luna (3A) — rejected
  { parent: julia, student: all_students["Luna"], request_type: :excused, status: :rejected,
   start_date: 5.days.ago.to_date, end_date: 3.days.ago.to_date,
   reason: "Family vacation trip.",
   reviewed_by: alice, reviewed_at: 5.days.ago + 4.hours, rejection_reason: "The dates conflict with mid-term assessments. Please reschedule if possible." },
  # Kevin requests sick leave for Wyatt (3B) — pending
  { parent: kevin, student: all_students["Wyatt"], request_type: :sick, status: :pending,
   start_date: 1.day.ago.to_date, end_date: 1.day.from_now.to_date,
   reason: "Wyatt has a stomach flu and needs to rest." },
  # Mike requests excused leave for Felix (4A) — pending
  { parent: mike, student: all_students["Felix"], request_type: :excused, status: :pending,
   start_date: 3.days.from_now.to_date, end_date: 4.days.from_now.to_date,
   reason: "Family religious ceremony that requires Felix's attendance." },
  # Nina requests sick leave for Oscar (4A) — approved
  { parent: nina, student: all_students["Oscar"], request_type: :sick, status: :approved,
   start_date: 12.days.ago.to_date, end_date: 11.days.ago.to_date,
   reason: "Oscar has a bad cold and cough.",
   reviewed_by: alice },
  # Lisa requests excused leave for Caleb (3B) — approved
  { parent: lisa, student: all_students["Caleb"], request_type: :excused, status: :approved,
   start_date: 25.days.ago.to_date, end_date: 25.days.ago.to_date,
   reason: "Caleb has a dental surgery appointment.",
   reviewed_by: alice }
]

leave_requests_data.each do |lr_data|
  LeaveRequest.create!(**lr_data)
end

puts "Seeded: #{LeaveRequest.count} student leave requests"

# ─── Teacher Leave Requests (Cuti Saya) + Balance ───────────────────────────
# Create leave balance for Alice first
leave_balance = TeacherLeaveBalance.find_or_create_for(alice, academic_year)
# Pre-set used leave to reflect approved requests
leave_balance.update!(used_annual: 2, used_sick: 2, used_personal: 0.5)

# Approved annual leave (2 days) — already taken
TeacherLeaveRequest.new(
  teacher: alice, school: school,
  request_type: :annual, status: :approved,
  start_date: 2.months.ago.to_date, end_date: (2.months.ago + 1.day).to_date,
  reason: "Personal family event — wedding anniversary trip.",
  reviewed_by: pat, reviewed_at: (2.months.ago - 3.days), substitute: bob
).save!(validate: false) # Skip balance check since we pre-set usage

# Approved sick leave (2 days) — already taken
TeacherLeaveRequest.new(
  teacher: alice, school: school,
  request_type: :sick, status: :approved,
  start_date: 3.weeks.ago.to_date, end_date: (3.weeks.ago + 1.day).to_date,
  reason: "Flu symptoms, doctor advised rest for 2 days.",
  reviewed_by: pat, reviewed_at: (3.weeks.ago - 1.day), substitute: charlie
).save!(validate: false)

# Pending personal leave (1 day) — future
TeacherLeaveRequest.create!(
  teacher: alice, school: school,
  request_type: :personal, status: :pending,
  start_date: 2.weeks.from_now.to_date, end_date: 2.weeks.from_now.to_date,
  reason: "Need to attend a parent-teacher conference at my child's school.",
  substitute: diana
)

# Approved half-day leave (morning) — already taken
TeacherLeaveRequest.new(
  teacher: alice, school: school,
  request_type: :personal, status: :approved,
  start_date: 1.week.ago.to_date, end_date: 1.week.ago.to_date,
  reason: "Dentist appointment in the morning.",
  reviewed_by: pat, reviewed_at: (1.week.ago - 2.days), half_day_session: :morning
).save!(validate: false)

# Pending half-day leave (afternoon) — future
TeacherLeaveRequest.create!(
  teacher: alice, school: school,
  request_type: :annual, status: :pending,
  start_date: 3.weeks.from_now.to_date, end_date: 3.weeks.from_now.to_date,
  reason: "Need to pick up relatives from the airport.",
  half_day_session: :afternoon
)

puts "Seeded: #{TeacherLeaveRequest.count} teacher leave requests, #{TeacherLeaveBalance.count} leave balances"

# ─── Group Conversations ─────────────────────────────────────────────────────
[ class1a, class3a, class3b, class4a ].each do |classroom|
  gc = GroupConversation.create!(classroom: classroom)
  GroupMessage.create!(group_conversation: gc, sender: alice, body: "Welcome to our class group! Feel free to ask questions here. 😊", created_at: 2.weeks.ago)
  classroom.students.first(3).each_with_index do |student, idx|
    parent_link = student.parent_students.first
    next unless parent_link
    GroupMessage.create!(
      group_conversation: gc,
      sender: parent_link.parent,
      body: [ "Thank you Ms. Alice!", "Looking forward to a great semester!", "Hello everyone! 👋" ][idx],
      created_at: 2.weeks.ago + (idx + 1).hours
    )
  end
  GroupMessage.create!(group_conversation: gc, sender: alice, body: "Reminder: Parent-teacher meetings are next week. Please sign up for a slot.", created_at: 1.week.ago)
end

puts "Seeded: #{GroupConversation.count} group conversations, #{GroupMessage.count} group messages"

# ─── Objective Masteries ─────────────────────────────────────────────────────
# Track student mastery of learning objectives for Alice's classrooms
all_objectives = LearningObjective.includes(:topic).all.to_a

alice_classrooms.each do |classroom|
  classroom.students.each do |student|
    all_objectives.each do |obj|
      # ~40% fully mastered, ~30% daily only, ~15% exam only, ~15% not mastered
      roll = rand(100)
      if roll < 40
        ObjectiveMastery.create!(
          student: student,
          learning_objective: obj,
          daily_mastered: true,
          exam_mastered: true,
          mastered_at: rand(1..20).days.ago
        )
      elsif roll < 70
        ObjectiveMastery.create!(
          student: student,
          learning_objective: obj,
          daily_mastered: true,
          exam_mastered: false
        )
      elsif roll < 85
        ObjectiveMastery.create!(
          student: student,
          learning_objective: obj,
          daily_mastered: false,
          exam_mastered: true
        )
      end
      # else: no mastery record (not started)
    end
  end
end

puts "Seeded: #{ObjectiveMastery.count} objective masteries"

# ─── Notifications for Alice ─────────────────────────────────────────────────
notifications_data = [
  # Leave request notifications (unread)
  { title: "New Leave Request", body: "Kevin Parent submitted a sick leave request for Wyatt (Class 3B) from #{1.day.ago.to_date} to #{1.day.from_now.to_date}.",
   notifiable: LeaveRequest.find_by(student: all_students["Wyatt"]), created_at: 1.day.ago, read_at: nil,
   kind: "leave_request_created", params: { parent_name: "Kevin Parent", request_type: "sick", student_name: "Wyatt", start_date: 1.day.ago.to_date.to_s, end_date: 1.day.from_now.to_date.to_s } },
  { title: "New Leave Request", body: "Mike Parent submitted an excused leave request for Felix (Class 4A) from #{3.days.from_now.to_date} to #{4.days.from_now.to_date}.",
   notifiable: LeaveRequest.find_by(student: all_students["Felix"]), created_at: 6.hours.ago, read_at: nil,
   kind: "leave_request_created", params: { parent_name: "Mike Parent", request_type: "excused", student_name: "Felix", start_date: 3.days.from_now.to_date.to_s, end_date: 4.days.from_now.to_date.to_s } },

  # Exam submission notifications (unread)
  { title: "Exam Submitted", body: "A student in Class 3B submitted the Living Things Test. #{ExamSubmission.where(classroom_exam: score_classroom_exam, status: :submitted).count} submissions awaiting grading.",
   notifiable: score_classroom_exam, created_at: 3.hours.ago, read_at: nil,
   kind: "exam_submitted", params: { classroom_name: "Class 3B", exam_title: "Living Things Test", pending_count: ExamSubmission.where(classroom_exam: score_classroom_exam, status: :submitted).count } },

  # Message notifications (unread)
  { title: "New Message", body: "Mike Parent: Felix won't be in class today, he has a dentist appointment.",
   notifiable: Conversation.find_by(teacher: alice, parent: mike), created_at: 1.day.ago, read_at: nil,
   kind: "new_message", params: { sender_name: "Mike Parent", message_preview: "Felix won't be in class today, he has a dentist appointment." } },

  # Teacher leave request notification (unread)
  { title: "Leave Request Update", body: "Your personal leave request for #{2.weeks.from_now.to_date} is still pending review.",
   notifiable: TeacherLeaveRequest.find_by(teacher: alice, status: :pending), created_at: 2.days.ago, read_at: nil,
   kind: "teacher_leave_request_reviewed", params: { request_type: "personal", start_date: 2.weeks.from_now.to_date.to_s, end_date: 2.weeks.from_now.to_date.to_s, decision: "pending" } },

  # Read notifications (older)
  { title: "Leave Request Approved", body: "Your sick leave request (#{3.weeks.ago.to_date} – #{(3.weeks.ago + 1.day).to_date}) was approved by Pat Principal.",
   notifiable: TeacherLeaveRequest.find_by(teacher: alice, request_type: :sick, status: :approved), created_at: 3.weeks.ago + 4.hours, read_at: 3.weeks.ago + 5.hours,
   kind: "teacher_leave_request_reviewed", params: { request_type: "sick", start_date: 3.weeks.ago.to_date.to_s, end_date: (3.weeks.ago + 1.day).to_date.to_s, decision: "approved" } },
  { title: "Leave Request Approved", body: "Your annual leave request (#{2.months.ago.to_date} – #{(2.months.ago + 1.day).to_date}) was approved by Pat Principal.",
   notifiable: TeacherLeaveRequest.find_by(teacher: alice, request_type: :annual, status: :approved), created_at: 2.months.ago + 4.hours, read_at: 2.months.ago + 5.hours,
   kind: "teacher_leave_request_reviewed", params: { request_type: "annual", start_date: 2.months.ago.to_date.to_s, end_date: (2.months.ago + 1.day).to_date.to_s, decision: "approved" } },
  { title: "Exam Grading Complete", body: "All submissions for 'Paragraph Writing Assessment' in Class 3A have been graded.",
   notifiable: rubric_classroom_exam, created_at: 3.days.ago, read_at: 3.days.ago + 1.hour,
   kind: "exam_grading_complete", params: { exam_title: "Paragraph Writing Assessment", classroom_name: "Class 3A" } },
  { title: "Exam Grading Complete", body: "All submissions for 'Self-Portrait Drawing' in Class 4A have been graded.",
   notifiable: pf_classroom_exam, created_at: 9.days.ago, read_at: 9.days.ago + 2.hours,
   kind: "exam_grading_complete", params: { exam_title: "Self-Portrait Drawing", classroom_name: "Class 4A" } },
  { title: "New Message", body: "Carol Parent: That's wonderful to hear! She loves reading at home too.",
   notifiable: Conversation.find_by(teacher: alice, parent: carol), created_at: 4.days.ago, read_at: 4.days.ago + 30.minutes,
   kind: "new_message", params: { sender_name: "Carol Parent", message_preview: "That's wonderful to hear! She loves reading at home too." } },
  { title: "New Message", body: "Dan Parent: Yes please, we'll work on it together at home. Thank you for letting me know.",
   notifiable: Conversation.find_by(teacher: alice, parent: dan), created_at: 2.days.ago, read_at: 2.days.ago + 1.hour,
   kind: "new_message", params: { sender_name: "Dan Parent", message_preview: "Yes please, we'll work on it together at home. Thank you for letting me know." } },
  { title: "New Message", body: "Nina Parent: He did much better on the practice sheets! Thank you for the help.",
   notifiable: Conversation.find_by(teacher: alice, parent: nina), created_at: 3.days.ago, read_at: 3.days.ago + 2.hours,
   kind: "new_message", params: { sender_name: "Nina Parent", message_preview: "He did much better on the practice sheets! Thank you for the help." } },
  { title: "New Comment", body: "Carol Parent commented on your post: 'Emma loved the space story! She kept talking about it at dinner'",
   notifiable: posts[0], created_at: 5.days.ago, read_at: 5.days.ago + 1.hour,
   kind: "new_comment", params: { commenter_name: "Carol Parent", comment_preview: "Emma loved the space story! She kept talking about it at dinner" } },
  { title: "New Comment", body: "Mike Parent commented on your post: 'Felix is struggling a bit with long division. Any tips for practice at home?'",
   notifiable: posts[18], created_at: 4.days.ago, read_at: 4.days.ago + 30.minutes,
   kind: "new_comment", params: { commenter_name: "Mike Parent", comment_preview: "Felix is struggling a bit with long division. Any tips for practice at home?" } },
  { title: "Health Checkup Reminder", body: "Monthly health checkups are due for Class 1A, 3A, 3B, and 4A students.",
   notifiable: school, created_at: 1.week.ago, read_at: 1.week.ago + 3.hours,
   kind: "health_checkup_reminder", params: { classroom_names: "Class 1A, 3A, 3B, and 4A" } }
]

notifications_data.each do |n_data|
  next unless n_data[:notifiable] # skip if notifiable not found
  Notification.create!(
    recipient: alice,
    **n_data
  )
end

puts "Seeded: #{Notification.count} notifications (#{Notification.unread.where(recipient: alice).count} unread for Alice)"

# ─── Permissions for Alice ───────────────────────────────────────────────────
# Alice gets full teacher permissions
%w[classrooms students daily_scores feed_posts calendar_events].each do |resource|
  %w[index show create update destroy].each do |action|
    Permission.create!(permissionable: alice, resource: resource, action: action, granted: true)
  end
end

# Additional teacher-specific permissions
Permission.create!(permissionable: alice, resource: "students", action: "radar", granted: true)
Permission.create!(permissionable: alice, resource: "students", action: "progress", granted: true)
Permission.create!(permissionable: alice, resource: "classrooms", action: "overview", granted: true)

puts "Seeded: #{Permission.count} permissions for Alice"

# ─── Refresh materialized view ───────────────────────────────────────────────
if ActiveRecord::Base.connection.view_exists?(:student_radar_summaries)
  StudentRadarSummary.refresh
  puts "Refreshed radar summaries"
end

puts "\n✅ Seeding complete!"
puts "   #{School.count} schools, #{Teacher.count} teachers, #{Parent.count} parents, #{Student.count} students"
puts "   #{Classroom.count} classrooms, #{Invitation.count} invitations, #{Consent.count} consents"
puts "   #{AcademicYear.count} academic years, #{Subject.count} subjects, #{Topic.count} topics"
puts "   #{Exam.count} exams, #{ExamSubmission.count} submissions, #{Attendance.count} attendance records"
puts "   #{Conversation.count} conversations, #{Message.count} messages"
puts "   #{LeaveRequest.count} student leave requests, #{TeacherLeaveRequest.count} teacher leave requests"
puts "   #{HealthCheckup.count} health checkups, #{FeedPost.count} feed posts"
