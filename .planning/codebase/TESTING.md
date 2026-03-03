# Testing Patterns

**Analysis Date:** 2026-03-04

## Test Framework

### Backend (Rails)

**Runner:**
- Minitest (Rails default) — built into Rails 8.1
- Config: `backend/test/test_helper.rb`

**Assertion Library:**
- Minitest assertions (built-in) — `assert`, `assert_equal`, `assert_not`, etc.

**Run Commands:**
```bash
bin/rails test                    # Run all tests
bin/rails test test/models/       # Run model tests only
bin/rails test test/models/user_test.rb  # Run single file
bin/rails test test/models/user_test.rb:5  # Run specific line
```

**Parallel execution:**
- Enabled via `parallelize(workers: :number_of_processors)` in `backend/test/test_helper.rb`

### Mobile Apps (Kotlin Multiplatform)

**Runner:**
- No test framework configured
- No `commonTest` source set created
- No test dependencies in `build.gradle.kts`
- **No tests exist for either mobile app**

## Test File Organization

### Backend

**Location:**
- Separate `test/` directory (Rails convention)
- Mirrors `app/` structure

**Naming:**
- `<model_name>_test.rb` — e.g., `user_test.rb`, `daily_score_test.rb`

**Structure:**
```
backend/test/
├── controllers/       # Controller tests (empty - .keep only)
├── fixtures/          # YAML fixture data
│   ├── files/         # File attachments for tests (empty)
│   ├── classrooms.yml
│   ├── daily_scores.yml
│   ├── parent_students.yml
│   ├── schools.yml
│   ├── students.yml
│   └── users.yml
├── integration/       # Integration tests (empty - .keep only)
├── mailers/           # Mailer tests (empty - .keep only)
├── models/            # Model unit tests
│   ├── classroom_test.rb
│   ├── daily_score_test.rb
│   ├── parent_student_test.rb
│   ├── school_test.rb
│   ├── student_test.rb
│   └── user_test.rb
└── test_helper.rb     # Test configuration & shared setup
```

## Test Structure

### Backend

**Suite Organization:**
```ruby
require "test_helper"

class UserTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
```

**CRITICAL: All model test files are empty stubs.** Every test file contains only the commented-out placeholder. No actual test assertions exist anywhere.

**Expected pattern when tests are written:**
```ruby
require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "should not save user without name" do
    user = User.new(email: "test@example.com", password: "password", role: :teacher)
    assert_not user.save, "Saved user without a name"
  end

  test "should not save user with invalid email" do
    user = User.new(name: "Test", email: "invalid", password: "password", role: :teacher)
    assert_not user.save
  end

  test "validates email uniqueness" do
    user = users(:one)
    duplicate = User.new(name: "Dup", email: user.email, password: "password", role: :teacher)
    assert_not duplicate.valid?
  end
end
```

**Patterns (from `test_helper.rb`):**
- All tests inherit from `ActiveSupport::TestCase`
- `fixtures :all` — all fixtures loaded for every test
- Parallel execution across CPU cores

## Mocking

### Backend

**Framework:** None explicitly configured

**Built-in options available:**
- Minitest stubs/mocks built-in
- No factory_bot or mocha gems in Gemfile

**Expected pattern:**
```ruby
# Minitest stub
JwtService.stub :decode, { user_id: 1, role: "teacher" } do
  # test code that calls JwtService.decode
end
```

**What to mock:**
- External service calls (JWT encoding/decoding for controller tests)
- Time-dependent logic (freeze time for date-based scores)

**What NOT to mock:**
- ActiveRecord validations and associations
- Database queries in model tests

## Fixtures and Factories

### Backend

**Test Data: YAML Fixtures**
- Located in `backend/test/fixtures/`
- All fixture files use Rails-generated placeholder data — not realistic values

**Current fixture quality — ALL use placeholder `MyString` values:**

`backend/test/fixtures/users.yml`:
```yaml
one:
  name: MyString
  email: MyString
  password_digest: MyString
  role: 1

two:
  name: MyString
  email: MyString
  password_digest: MyString
  role: 1
```

`backend/test/fixtures/schools.yml`:
```yaml
one:
  name: MyString

two:
  name: MyString
```

`backend/test/fixtures/classrooms.yml`:
```yaml
one:
  name: MyString
  school: one
  teacher: one

two:
  name: MyString
  school: two
  teacher: two
```

`backend/test/fixtures/students.yml`:
```yaml
one:
  name: MyString
  classroom: one
  avatar: MyString

two:
  name: MyString
  classroom: two
  avatar: MyString
```

`backend/test/fixtures/daily_scores.yml`:
```yaml
one:
  student: one
  teacher: one
  date: 2026-03-03
  skill_category: 1
  score: 1
  notes: MyText
```

`backend/test/fixtures/parent_students.yml`:
```yaml
one:
  parent: one
  student: one
```

**CRITICAL ISSUES with fixtures:**
1. `users.yml` uses `MyString` for email — violates email format validation
2. `users.yml` uses `MyString` for `password_digest` — not a valid bcrypt hash
3. Both users have `role: 1` (parent) — no teacher fixture for testing teacher-specific features
4. Duplicate `MyString` values for emails — violates uniqueness validation
5. No meaningful test data — all fields are placeholder strings
6. **Fixtures will fail if tests actually run model validations**

**Factories:**
- No factory_bot gem — not in Gemfile
- Only YAML fixtures available

## Coverage

### Backend

**Requirements:** None enforced
- No simplecov or coverage gem in Gemfile
- No coverage configuration
- No coverage thresholds in CI

**Current actual coverage: 0%** — all test files are empty stubs

### Mobile Apps

**Requirements:** None
- No test infrastructure exists

## Test Types

### Backend

**Unit Tests (Model Tests):**
- Files exist in `backend/test/models/` for all 6 models
- **All are empty stubs** — no actual test logic
- Should test: validations, associations, enum definitions, custom methods like `Student#radar_data`

**Controller Tests:**
- Directory exists at `backend/test/controllers/` (empty, `.keep` only)
- **No controller tests exist**
- Should test: `Api::V1::AuthController` login/register actions, auth concern

**Integration Tests:**
- Directory exists at `backend/test/integration/` (empty, `.keep` only)
- **No integration tests exist**
- Should test: full auth flow (register → login → access protected endpoint)

**Mailer Tests:**
- Directory exists at `backend/test/mailers/` (empty, `.keep` only)
- **No mailers implemented, so none needed yet**

**E2E Tests:**
- Not applicable for API-only backend
- No mobile app testing framework configured

### Mobile Apps

**All test types: Not implemented**
- No test source sets (`commonTest/`, `androidTest/`)
- No test dependencies in `build.gradle.kts`
- No UI testing framework (no Compose testing library)

## CI/CD Testing

### Backend (`backend/.github/workflows/ci.yml`)

**Three CI jobs run on PR and push to main:**

1. **`scan_ruby`** — Security scanning
   - `bin/brakeman --no-pager` — Static analysis for Rails security vulnerabilities
   - `bin/bundler-audit` — Known gem vulnerabilities

2. **`lint`** — Code style
   - `bin/rubocop -f github` — RuboCop with GitHub annotation format
   - Uses cached RuboCop results between runs

3. **`test`** — Test execution
   - PostgreSQL service container
   - `bin/rails db:test:prepare test` — Prepares DB and runs all tests
   - No coverage reporting
   - No test result artifacts

**CI environment:**
- `RAILS_ENV=test`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432`
- Redis commented out (not needed yet)
- `RAILS_MASTER_KEY` commented out

**Dependency management:**
- Dependabot configured for Bundler gems (weekly, max 10 PRs)
- Dependabot configured for GitHub Actions (weekly, max 10 PRs)
- See `backend/.github/dependabot.yml`

### Mobile Apps
- **No CI/CD pipeline configured**

## Common Patterns

### Writing New Model Tests

Follow this pattern for new model tests in `backend/test/models/`:
```ruby
require "test_helper"

class DailyScoreTest < ActiveSupport::TestCase
  # Test validations
  test "requires date" do
    score = DailyScore.new(student: students(:one), teacher: users(:one), skill_category: :reading, score: 50)
    assert_not score.valid?
    assert_includes score.errors[:date], "can't be blank"
  end

  # Test numericality
  test "score must be between 0 and 100" do
    score = daily_scores(:one)
    score.score = 101
    assert_not score.valid?
  end

  # Test uniqueness constraints
  test "enforces one score per student per skill per day" do
    existing = daily_scores(:one)
    duplicate = DailyScore.new(
      student: existing.student,
      teacher: existing.teacher,
      date: existing.date,
      skill_category: existing.skill_category,
      score: 75
    )
    assert_not duplicate.valid?
  end

  # Test associations
  test "belongs to student" do
    assert_respond_to daily_scores(:one), :student
  end

  # Test enums
  test "has skill categories" do
    assert DailyScore.skill_categories.key?("reading")
    assert DailyScore.skill_categories.key?("math")
  end

  # Test custom methods
  test "Student#radar_data returns averages by category" do
    student = students(:one)
    result = student.radar_data
    assert_kind_of Hash, result
  end
end
```

### Writing New Controller Tests

Follow this pattern for controllers in `backend/test/controllers/`:
```ruby
require "test_helper"

class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  test "login with valid credentials returns token" do
    post api_v1_login_url, params: { email: "teacher@example.com", password: "password" }
    assert_response :success
    json = JSON.parse(response.body)
    assert json["token"].present?
    assert_equal "teacher@example.com", json["user"]["email"]
  end

  test "login with invalid credentials returns unauthorized" do
    post api_v1_login_url, params: { email: "wrong@example.com", password: "wrong" }
    assert_response :unauthorized
  end

  test "register creates new user" do
    assert_difference "User.count", 1 do
      post api_v1_register_url, params: {
        name: "New User",
        email: "new@example.com",
        password: "password",
        password_confirmation: "password",
        role: "teacher"
      }
    end
    assert_response :created
  end
end
```

### Async Testing (for future Solid Queue jobs)
```ruby
require "test_helper"

class SomeJobTest < ActiveJob::TestCase
  test "enqueues job" do
    assert_enqueued_with(job: SomeJob) do
      SomeJob.perform_later(arg)
    end
  end
end
```

## Priority Test Gaps

Ranked by risk and impact:

| Priority | Area | What's Missing | Files Affected |
|----------|------|----------------|----------------|
| **P0** | Auth Controller | No tests for login/register — core security flow | `backend/app/controllers/api/v1/auth_controller.rb` |
| **P0** | Authenticatable Concern | No tests for JWT auth middleware | `backend/app/controllers/concerns/authenticatable.rb` |
| **P0** | JwtService | No tests for token encode/decode | `backend/app/services/jwt_service.rb` |
| **P1** | User Model | No validation/association tests | `backend/app/models/user.rb` |
| **P1** | DailyScore Model | No validation/uniqueness/enum tests | `backend/app/models/daily_score.rb` |
| **P1** | Student Model | No `radar_data` method test | `backend/app/models/student.rb` |
| **P2** | Fixtures | All use placeholder data — will break when tests run | `backend/test/fixtures/*.yml` |
| **P2** | Classroom/School/ParentStudent | No validation tests | `backend/app/models/classroom.rb`, `school.rb`, `parent_student.rb` |
| **P3** | Mobile Apps | No test infrastructure at all | `mobile-app-teacher/`, `mobile-app-parent/` |

---

*Testing analysis: 2026-03-04*
