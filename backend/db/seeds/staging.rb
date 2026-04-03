# frozen_string_literal: true

# Staging seed file — generates realistic demo data via Faker.
#
# NOTE: Faker gem is declared in the :test group in Gemfile. To run this seed
# in a staging environment you must either:
#   a) Move `gem "faker"` to group :development, :test or outside any group, OR
#   b) Run with: BUNDLE_WITH="test" bin/rails db:seed:staging
#
# Usage:
#   bin/rails db:seed:staging
#   # or from db/seeds.rb: load Rails.root.join("db/seeds/staging.rb")

require "faker"

puts "== Staging Seed =="
puts "Seeding staging data..."

ActiveRecord::Base.transaction do
  # =========================================================================
  # SCHOOLS
  # =========================================================================
  puts "\n-- Schools"

  school_data = [
    { name: "Greenwood International School", min_grade: 1, max_grade: 6, country_code: "US", city: "San Francisco", state_province: "CA" },
    { name: "Riverside Academy",              min_grade: 1, max_grade: 6, country_code: "US", city: "Austin",        state_province: "TX" }
  ]

  schools = school_data.map do |attrs|
    school = School.find_or_create_by!(name: attrs[:name]) do |s|
      s.min_grade     = attrs[:min_grade]
      s.max_grade     = attrs[:max_grade]
      s.country_code  = attrs[:country_code]
      s.city          = attrs[:city]
      s.state_province = attrs[:state_province]
      s.email         = Faker::Internet.email(name: attrs[:name])
      s.phone         = Faker::PhoneNumber.phone_number
    end
    puts "  School: #{school.name} (id=#{school.id})"
    school
  end

  # =========================================================================
  # ACADEMIC YEARS
  # =========================================================================
  puts "\n-- Academic Years"

  academic_years = schools.map do |school|
    year = AcademicYear.find_or_create_by!(school: school, label: "2025-2026") do |ay|
      ay.start_date = Date.new(2025, 9, 1)
      ay.end_date   = Date.new(2026, 6, 30)
      ay.current    = true
    end
    puts "  AcademicYear: #{year.label} for #{school.name}"
    year
  end

  # =========================================================================
  # SUBJECTS & TOPICS
  # =========================================================================
  puts "\n-- Subjects & Topics"

  subject_names = ["Mathematics", "Science", "English Language Arts"]

  topic_map = {
    "Mathematics"            => ["Number Operations", "Geometry"],
    "Science"                => ["Life Science", "Earth Science"],
    "English Language Arts"  => ["Reading Comprehension", "Writing Skills"]
  }

  schools.each_with_index do |school, si|
    subject_names.each do |subject_name|
      subject = Subject.find_or_create_by!(school: school, name: subject_name)
      puts "  Subject: #{subject.name} (school=#{school.name})"

      topic_map[subject_name].each_with_index do |topic_name, ti|
        Topic.find_or_create_by!(subject: subject, name: topic_name) do |t|
          t.position = ti + 1
        end
        puts "    Topic: #{topic_name}"
      end
    end
  end

  # =========================================================================
  # TEACHERS  (2 per school = 4 total)
  # =========================================================================
  puts "\n-- Teachers"

  teacher_seed_data = [
    # School 0
    { school_idx: 0, name: "Alice Morgan",  email: "alice.morgan@greenwood.staging.example.com" },
    { school_idx: 0, name: "Bob Chen",      email: "bob.chen@greenwood.staging.example.com" },
    # School 1
    { school_idx: 1, name: "Carol Davis",   email: "carol.davis@riverside.staging.example.com" },
    { school_idx: 1, name: "David Kim",     email: "david.kim@riverside.staging.example.com" }
  ]

  teachers = teacher_seed_data.map do |td|
    school = schools[td[:school_idx]]
    teacher = Teacher.find_or_initialize_by(email: td[:email])
    unless teacher.persisted?
      teacher.name                  = td[:name]
      teacher.school                = school
      teacher.password              = "Staging1!"
      teacher.password_confirmation = "Staging1!"
      teacher.save!
    end
    puts "  Teacher: #{td[:name]} (school=#{school.name})"
    teacher
  end

  # =========================================================================
  # CLASSROOMS  (2 per school = 4 total)
  # =========================================================================
  puts "\n-- Classrooms"

  classroom_seed_data = [
    # School 0
    { school_idx: 0, name: "Class 1A", grade: 1, teacher_idx: 0 },
    { school_idx: 0, name: "Class 2B", grade: 2, teacher_idx: 1 },
    # School 1
    { school_idx: 1, name: "Class 3A", grade: 3, teacher_idx: 2 },
    { school_idx: 1, name: "Class 4B", grade: 4, teacher_idx: 3 }
  ]

  classrooms = classroom_seed_data.map do |cd|
    school  = schools[cd[:school_idx]]
    teacher = teachers[cd[:teacher_idx]]

    classroom = Classroom.find_or_create_by!(school: school, name: cd[:name]) do |c|
      c.grade = cd[:grade]
    end

    # Assign primary teacher if not already assigned
    unless ClassroomTeacher.exists?(classroom: classroom, teacher: teacher)
      ClassroomTeacher.create!(classroom: classroom, teacher: teacher, role: "primary")
    end

    puts "  Classroom: #{classroom.name} (school=#{school.name}, teacher=#{teacher.name})"
    classroom
  end

  # =========================================================================
  # PARENTS  (4 per school = 8 total)
  # =========================================================================
  puts "\n-- Parents"

  parent_seed_data = [
    # School 0 parents
    { school_idx: 0, name: "Margaret Thompson", email: "margaret.thompson@staging.example.com" },
    { school_idx: 0, name: "James Patel",        email: "james.patel@staging.example.com" },
    { school_idx: 0, name: "Sophia Nguyen",      email: "sophia.nguyen@staging.example.com" },
    { school_idx: 0, name: "Richard Osei",       email: "richard.osei@staging.example.com" },
    # School 1 parents
    { school_idx: 1, name: "Laura Fernandez",    email: "laura.fernandez@staging.example.com" },
    { school_idx: 1, name: "Marcus Johnson",     email: "marcus.johnson@staging.example.com" },
    { school_idx: 1, name: "Aisha Rahman",       email: "aisha.rahman@staging.example.com" },
    { school_idx: 1, name: "Daniel Park",        email: "daniel.park@staging.example.com" }
  ]

  parents = parent_seed_data.map do |pd|
    parent = Parent.find_or_initialize_by(email: pd[:email])
    unless parent.persisted?
      parent.name                  = pd[:name]
      parent.password              = "Staging1!"
      parent.password_confirmation = "Staging1!"
      parent.save!
    end
    puts "  Parent: #{pd[:name]}"
    parent
  end

  # =========================================================================
  # STUDENTS  (10 per school = 20 total)
  # Spread across 2 classrooms per school (5 per classroom)
  # =========================================================================
  puts "\n-- Students"

  student_first_names = %w[
    Emma Liam Olivia Noah Ava William Isabella James Sophia Benjamin
    Mia Lucas Charlotte Alexander Amelia Elijah Harper Henry Evelyn
    Sebastian Abigail
  ]

  # Deterministic last names so re-runs produce same emails / names
  student_last_names = %w[
    Anderson Baker Clark Davis Evans Foster Green Harris Ingram Jackson
    King Lewis Miller Nelson Owen Price Quinn Roberts Stone Turner
    Underwood
  ]

  students = []

  schools.each_with_index do |school, si|
    school_classrooms = classrooms.select { |c| c.school_id == school.id }
    school_parents    = parents[(si * 4), 4]  # 4 parents per school, sliced by school index
    school_academic_year = academic_years[si]

    10.times do |i|
      global_idx = si * 10 + i
      first      = student_first_names[global_idx]
      last       = student_last_names[global_idx]
      full_name  = "#{first} #{last}"

      student = Student.find_or_create_by!(name: full_name)
      puts "  Student: #{full_name}"

      # Assign to classroom — 5 per classroom
      classroom = school_classrooms[i < 5 ? 0 : 1]

      unless ClassroomStudent.exists?(student: student, status: :active)
        ClassroomStudent.create!(
          student:       student,
          classroom:     classroom,
          academic_year: school_academic_year.label,
          enrolled_at:   school_academic_year.start_date,
          status:        :active
        )
      end

      # Link to a parent  (2 students per parent, cycling)
      parent = school_parents[i % 4]
      ParentStudent.find_or_create_by!(parent: parent, student: student)

      students << { student: student, school: school, classroom: classroom, teacher: classroom.primary_teacher || teachers[si * 2] }
    end
  end

  # =========================================================================
  # BEHAVIOR CATEGORIES  (5 per school: 3 positive, 2 negative)
  # =========================================================================
  puts "\n-- Behavior Categories"

  behavior_category_templates = [
    { name: "Excellent Participation", point_value: 3,  icon: "star",         color: "#4CAF50", position: 1 },
    { name: "Helped a Classmate",      point_value: 2,  icon: "heart",        color: "#2196F3", position: 2 },
    { name: "Creative Thinking",       point_value: 1,  icon: "lightbulb",    color: "#FF9800", position: 3 },
    { name: "Disruptive Behavior",     point_value: -2, icon: "warning",      color: "#F44336", position: 4 },
    { name: "Incomplete Homework",     point_value: -1, icon: "assignment_late", color: "#9C27B0", position: 5 }
  ]

  behavior_categories_by_school = {}

  schools.each do |school|
    behavior_categories_by_school[school.id] = behavior_category_templates.map do |tpl|
      cat = BehaviorCategory.find_or_create_by!(school: school, name: tpl[:name]) do |bc|
        bc.point_value = tpl[:point_value]
        bc.icon        = tpl[:icon]
        bc.color       = tpl[:color]
        bc.position    = tpl[:position]
        # is_positive is set automatically by before_validation callback
      end
      puts "  BehaviorCategory: #{cat.name} (school=#{school.name}, points=#{cat.point_value})"
      cat
    end
  end

  # =========================================================================
  # DAILY SCORES  (5 per student, last 30 days, unique date+skill combos)
  # =========================================================================
  puts "\n-- Daily Scores"

  skill_categories = DailyScore.skill_categories.keys  # ["reading", "math", "writing", "logic", "social"]

  students.each do |entry|
    student  = entry[:student]
    teacher  = entry[:teacher]
    # pluck(:skill_category) returns integers from the DB; normalise to strings for comparison
    existing = DailyScore.where(student: student).pluck(:date, :skill_category)
    skill_int_to_name = DailyScore.skill_categories.invert  # { 0 => "reading", ... }
    existing_set = existing.map { |d, sk_int| "#{d}|#{skill_int_to_name[sk_int]}" }.to_set

    # Pick 5 unique date+skill combinations from the last 30 days
    candidates = []
    30.downto(1).each do |days_ago|
      date = Date.current - days_ago
      skill_categories.each { |sk| candidates << [date, sk] }
    end
    candidates.shuffle!

    count = 0
    candidates.each do |date, skill|
      break if count >= 5
      key = "#{date}|#{skill}"
      next if existing_set.include?(key)

      DailyScore.create!(
        student:        student,
        teacher:        teacher,
        date:           date,
        skill_category: skill,
        score:          rand(55..100),
        notes:          Faker::Lorem.sentence(word_count: 6)
      )
      existing_set << key
      count += 1
    end
    puts "  DailyScores: #{count} created for #{student.name}"
  end

  # =========================================================================
  # HEALTH CHECKUPS  (1 per student)
  # =========================================================================
  puts "\n-- Health Checkups"

  students.each do |entry|
    student = entry[:student]
    teacher = entry[:teacher]
    measured_at = Date.current - rand(7..60)

    unless HealthCheckup.exists?(student: student, measured_at: measured_at)
      HealthCheckup.create!(
        student:    student,
        teacher:    teacher,
        measured_at: measured_at,
        weight_kg:  Faker::Number.decimal(l_digits: 2, r_digits: 1).to_f.clamp(15.0, 60.0),
        height_cm:  Faker::Number.decimal(l_digits: 3, r_digits: 1).to_f.clamp(90.0, 160.0),
        notes:      "Routine checkup. Student appears healthy."
      )
    end
    puts "  HealthCheckup for #{student.name} on #{measured_at}"
  end

  # =========================================================================
  # ATTENDANCE  (10 records per student, last 2 weeks)
  # =========================================================================
  puts "\n-- Attendance"

  # Status distribution: mostly present, occasional sick/excused/unexcused
  attendance_statuses = ([:present] * 7) + [:sick, :excused, :unexcused]

  students.each do |entry|
    student   = entry[:student]
    classroom = entry[:classroom]

    # Last 14 calendar days, pick 10 unique school days (skip weekends)
    school_days = (1..14).map { |d| Date.current - d }
                         .reject { |d| d.saturday? || d.sunday? }
                         .first(10)

    school_days.each do |date|
      next if Attendance.exists?(student: student, classroom: classroom, date: date)

      Attendance.create!(
        student:    student,
        classroom:  classroom,
        date:       date,
        status:     attendance_statuses.sample
      )
    end
    puts "  Attendance: #{school_days.size} records for #{student.name}"
  end

  # =========================================================================
  # BEHAVIOR POINTS  (3 per student)
  # =========================================================================
  puts "\n-- Behavior Points"

  students.each do |entry|
    student   = entry[:student]
    teacher   = entry[:teacher]
    classroom = entry[:classroom]
    cats      = behavior_categories_by_school[entry[:school].id]

    3.times do |i|
      category   = cats.sample
      awarded_at = Time.current - rand(1..20).days - rand(0..23).hours

      BehaviorPoint.create!(
        student:           student,
        teacher:           teacher,
        classroom:         classroom,
        behavior_category: category,
        point_value:       category.point_value,
        awarded_at:        awarded_at,
        note:              Faker::Lorem.sentence(word_count: 5)
      )
    end
    puts "  BehaviorPoints: 3 created for #{student.name}"
  end

  puts "\n== Staging Seed Complete =="
  puts "  Schools:             #{School.count}"
  puts "  Academic Years:      #{AcademicYear.count}"
  puts "  Teachers:            #{Teacher.count}"
  puts "  Parents:             #{Parent.count}"
  puts "  Students:            #{Student.count}"
  puts "  Classrooms:          #{Classroom.count}"
  puts "  Subjects:            #{Subject.count}"
  puts "  Topics:              #{Topic.count}"
  puts "  BehaviorCategories:  #{BehaviorCategory.count}"
  puts "  DailyScores:         #{DailyScore.count}"
  puts "  HealthCheckups:      #{HealthCheckup.count}"
  puts "  Attendances:         #{Attendance.count}"
  puts "  BehaviorPoints:      #{BehaviorPoint.count}"
end
