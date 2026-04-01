# Phase 3: COPPA Compliance & Consent Engine

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement invitation-only access, parental consent (Email-Plus), PII encryption, audit trail, data export/deletion, and privacy policy — making GrewMe legally compliant for children's data before launch.

**Architecture:** Replace open registration with invitation chain (School Manager → Teacher → Parent via consent). Add Consent model for COPPA Email-Plus flow. Encrypt PII with Active Record Encryption. Add AuditLog for FERPA compliance. Add data export/deletion GraphQL mutations. Host privacy policy as a static page.

**Tech Stack:** Rails 8.1.2, Active Record Encryption, ActionMailer, Solid Queue, GraphQL, SvelteKit

**COPPA Deadline:** April 22, 2026

---

## Task 1: Invitation Model & Migration

**Files:**
- Create: `backend/app/models/invitation.rb`
- Create: `backend/db/migrate/YYYYMMDDHHMMSS_create_invitations.rb`
- Create: `backend/test/models/invitation_test.rb`

**Step 1: Write the migration**

```ruby
class CreateInvitations < ActiveRecord::Migration[8.1]
  def change
    create_table :invitations do |t|
      t.references :inviter, null: false, polymorphic: true
      t.references :school, null: false, foreign_key: true
      t.string :email, null: false
      t.string :role, null: false  # teacher
      t.string :token, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :expires_at, null: false
      t.datetime :accepted_at
      t.timestamps
    end

    add_index :invitations, :token, unique: true
    add_index :invitations, [:email, :school_id], unique: true, where: "status = 'pending'"
  end
end
```

**Step 2: Create the model**

```ruby
class Invitation < ApplicationRecord
  belongs_to :inviter, polymorphic: true
  belongs_to :school

  enum :status, { pending: "pending", accepted: "accepted", expired: "expired", revoked: "revoked" }

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: %w[teacher] }
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  before_validation :generate_token, on: :create
  before_validation :set_expiry, on: :create

  scope :active, -> { pending.where("expires_at > ?", Time.current) }

  def expired?
    expires_at < Time.current
  end

  def accept!(user)
    update!(status: :accepted, accepted_at: Time.current)
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiry
    self.expires_at ||= 7.days.from_now
  end
end
```

**Step 3: Write model tests**

Test: valid invitation, email format, token uniqueness, expiry, status transitions, scopes.

**Step 4: Run migration and tests**

```bash
bin/rails db:migrate
bin/rails test test/models/invitation_test.rb
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(coppa): add Invitation model for teacher invitation chain"
```

---

## Task 2: Consent Model & Migration

**Files:**
- Create: `backend/app/models/consent.rb`
- Create: `backend/db/migrate/YYYYMMDDHHMMSS_create_consents.rb`
- Create: `backend/test/models/consent_test.rb`

**Step 1: Write the migration**

```ruby
class CreateConsents < ActiveRecord::Migration[8.1]
  def change
    create_table :consents do |t|
      t.references :student, null: false, foreign_key: true
      t.references :parent, null: true, foreign_key: { to_table: :parents }
      t.string :parent_email, null: false
      t.string :status, null: false, default: "pending"
      t.string :consent_method, null: false, default: "email_plus"
      t.string :token, null: false
      t.inet :ip_address
      t.datetime :granted_at
      t.datetime :revoked_at
      t.datetime :expires_at
      t.string :notice_content_hash  # SHA-256 of notice shown
      t.timestamps
    end

    add_index :consents, :token, unique: true
    add_index :consents, [:student_id, :parent_email], unique: true
    add_index :consents, :status
  end
end
```

**Step 2: Create the model**

```ruby
class Consent < ApplicationRecord
  belongs_to :student
  belongs_to :parent, optional: true

  enum :status, {
    pending: "pending",
    granted: "granted",
    declined: "declined",
    revoked: "revoked",
    expired: "expired"
  }

  validates :parent_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token, presence: true, uniqueness: true
  validates :consent_method, presence: true, inclusion: { in: %w[email_plus school_official] }

  before_validation :generate_token, on: :create
  before_validation :set_expiry, on: :create

  scope :active, -> { granted.where(revoked_at: nil) }

  def grant!(parent:, ip_address: nil)
    update!(
      status: :granted,
      parent: parent,
      granted_at: Time.current,
      ip_address: ip_address
    )
  end

  def revoke!
    update!(status: :revoked, revoked_at: Time.current)
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiry
    self.expires_at ||= 60.days.from_now
  end
end
```

**Step 3: Write model tests**

Test: valid consent, status transitions, grant/revoke, token generation, scopes.

**Step 4: Run and commit**

```bash
bin/rails db:migrate
bin/rails test test/models/consent_test.rb
git add -A && git commit -m "feat(coppa): add Consent model for parental consent tracking"
```

---

## Task 3: AuditLog Model & Service

**Files:**
- Create: `backend/app/models/audit_log.rb`
- Create: `backend/db/migrate/YYYYMMDDHHMMSS_create_audit_logs.rb`
- Create: `backend/app/services/audit_logger.rb`
- Create: `backend/test/models/audit_log_test.rb`
- Create: `backend/test/services/audit_logger_test.rb`

**Step 1: Write the migration**

```ruby
class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.string :event_type, null: false
      t.string :severity, null: false, default: "info"
      t.bigint :user_id
      t.string :user_type
      t.string :user_role
      t.string :resource_type
      t.bigint :resource_id
      t.string :action, null: false
      t.jsonb :metadata, default: {}
      t.inet :ip_address
      t.string :user_agent
      t.timestamps
    end

    add_index :audit_logs, :event_type
    add_index :audit_logs, [:user_type, :user_id]
    add_index :audit_logs, [:resource_type, :resource_id]
    add_index :audit_logs, :created_at
    add_index :audit_logs, :severity
  end
end
```

**Step 2: Create AuditLog model + AuditLogger service**

AuditLogger.log(event_type:, user:, resource:, action:, metadata:, severity:, request:)

**Step 3: Write tests, run, commit**

```bash
git add -A && git commit -m "feat(coppa): add AuditLog model and AuditLogger service for FERPA compliance"
```

---

## Task 4: Active Record Encryption for PII

**Files:**
- Modify: `backend/app/models/student.rb` — add `encrypts :name`
- Modify: `backend/app/models/teacher.rb` — add `encrypts :name, :email`
- Modify: `backend/app/models/parent.rb` — add `encrypts :name, :email`
- Modify: `backend/app/models/school_manager.rb` — add `encrypts :name, :email`
- Modify: `backend/app/models/consent.rb` — add `encrypts :parent_email, :ip_address`
- Create: `backend/db/migrate/YYYYMMDDHHMMSS_add_encryption_to_pii_fields.rb`
- Create: `backend/test/models/encryption_test.rb`

**Step 1: Generate encryption keys**

```bash
bin/rails db:encryption:init
# Add output to config/credentials.yml.enc
```

**Step 2: Add `encrypts` declarations to models**

- Student: `encrypts :name` (non-deterministic)
- Teacher/Parent/SchoolManager: `encrypts :name` (non-deterministic), `encrypts :email, deterministic: true` (needed for login lookup)
- Consent: `encrypts :parent_email, deterministic: true`, `encrypts :ip_address`

**Step 3: Migration to convert existing plaintext data**

Create a migration that re-saves existing records to encrypt them in place.

**Step 4: Test encryption works — write/read roundtrip, query by deterministic email**

**Step 5: Run full test suite to ensure nothing breaks**

```bash
bin/rails test
git add -A && git commit -m "feat(coppa): encrypt PII fields with Active Record Encryption"
```

---

## Task 5: Invitation GraphQL Mutations & Mailer

**Files:**
- Create: `backend/app/graphql/mutations/create_invitation.rb`
- Create: `backend/app/graphql/mutations/accept_invitation.rb`
- Create: `backend/app/graphql/mutations/revoke_invitation.rb`
- Create: `backend/app/graphql/types/invitation_type.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`
- Modify: `backend/app/graphql/types/query_type.rb` — add `school_invitations` query
- Create: `backend/app/mailers/invitation_mailer.rb`
- Create: `backend/app/views/invitation_mailer/teacher_invitation.html.erb`
- Create: `backend/test/graphql/mutations/invitation_mutations_test.rb`

**Step 1: Create InvitationType**

**Step 2: Create mutations**

- `CreateInvitation` — school_manager only, sends email via InvitationMailer
- `AcceptInvitation` — public (token-based), creates teacher account, links to school
- `RevokeInvitation` — school_manager only

**Step 3: Create InvitationMailer**

Email contains: school name, inviter name, signup link with token, expiry notice.

**Step 4: Add query for listing school invitations**

**Step 5: Write tests, run, commit**

```bash
git add -A && git commit -m "feat(coppa): add invitation mutations and teacher invitation email"
```

---

## Task 6: Consent GraphQL Mutations & Mailer

**Files:**
- Create: `backend/app/graphql/mutations/request_consent.rb`
- Create: `backend/app/graphql/mutations/grant_consent.rb`
- Create: `backend/app/graphql/mutations/decline_consent.rb`
- Create: `backend/app/graphql/mutations/revoke_consent.rb`
- Create: `backend/app/graphql/types/consent_type.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`
- Modify: `backend/app/graphql/types/query_type.rb` — add `consent_status` query
- Create: `backend/app/mailers/consent_mailer.rb`
- Create: `backend/app/views/consent_mailer/consent_request.html.erb`
- Create: `backend/app/views/consent_mailer/consent_confirmation.html.erb`
- Create: `backend/test/graphql/mutations/consent_mutations_test.rb`

**Step 1: Create ConsentType**

**Step 2: Create mutations**

- `RequestConsent` — teacher adds student with parent email, triggers consent email
- `GrantConsent` — public (token-based), parent accepts, creates parent account if needed, links to child
- `DeclineConsent` — public (token-based), parent declines
- `RevokeConsent` — authenticated parent, revokes existing consent

**Step 3: Create ConsentMailer**

- `consent_request` — COPPA direct notice: what data, how used, who accesses, privacy policy link, accept/decline links
- `consent_confirmation` — Email-Plus confirmation after consent granted

**Step 4: Add consent_status query for parents**

**Step 5: Write tests, run, commit**

```bash
git add -A && git commit -m "feat(coppa): add consent mutations and Email-Plus consent flow"
```

---

## Task 7: Lock Down Registration (Invitation-Only)

**Files:**
- Modify: `backend/app/graphql/mutations/register.rb` — require invitation or consent token
- Modify: `backend/test/graphql/mutations/auth_mutations_test.rb`

**Step 1: Modify Register mutation**

- Require `invitation_token` OR `consent_token` parameter
- If invitation_token: validate token, set role from invitation, link to school
- If consent_token: validate token, set role to parent, link to child
- Remove ability to self-select role
- Reject registration without valid token

**Step 2: Update existing tests**

**Step 3: Write new tests for token-based registration**

**Step 4: Run full test suite**

```bash
bin/rails test
git add -A && git commit -m "feat(coppa): lock registration to invitation/consent tokens only"
```

---

## Task 8: Data Export & Deletion Mutations

**Files:**
- Create: `backend/app/graphql/mutations/export_child_data.rb`
- Create: `backend/app/graphql/mutations/request_account_deletion.rb`
- Create: `backend/app/graphql/mutations/request_child_data_deletion.rb`
- Create: `backend/app/models/account_deletion_request.rb`
- Create: `backend/db/migrate/YYYYMMDDHHMMSS_create_account_deletion_requests.rb`
- Create: `backend/app/jobs/data_export_job.rb`
- Create: `backend/app/jobs/account_deletion_job.rb`
- Create: `backend/app/jobs/data_retention_cleanup_job.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`
- Create: `backend/test/graphql/mutations/data_rights_mutations_test.rb`

**Step 1: Create AccountDeletionRequest model**

Fields: user_type, user_id, status (pending/completed/cancelled), grace_period_ends_at (30 days), completed_at

**Step 2: Create mutations**

- `ExportChildData` — parent only, queues DataExportJob, returns download URL when ready
- `RequestAccountDeletion` — any user, 30-day grace period, queues AccountDeletionJob
- `RequestChildDataDeletion` — parent only, COPPA right to delete child's data

**Step 3: Create background jobs**

- `DataExportJob` — generates JSON export of all child data (scores, radar, progress)
- `AccountDeletionJob` — after grace period, anonymizes/deletes user data
- `DataRetentionCleanupJob` — nightly job: expire old consents, complete past-grace deletions, purge old audit logs

**Step 4: Configure recurring jobs in Solid Queue**

```ruby
# config/recurring.yml
data_retention_cleanup:
  class: DataRetentionCleanupJob
  schedule: every day at 4am
```

**Step 5: Write tests, run, commit**

```bash
git add -A && git commit -m "feat(coppa): add data export, account deletion, and retention cleanup"
```

---

## Task 9: Audit Logging Integration

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb` — add AuditLogger.log calls to student data queries
- Modify: `backend/app/graphql/mutations/create_daily_score.rb` — audit score creation
- Modify: `backend/app/graphql/mutations/update_daily_score.rb` — audit score updates
- Create: `backend/app/graphql/queries/audit_logs_query.rb` — school_manager can view audit trail
- Create: `backend/test/services/audit_integration_test.rb`

**Step 1: Add AuditLogger.log calls to sensitive queries**

- `student_radar`, `student_progress`, `student_daily_scores` — log STUDENT_DATA_VIEW
- `classroom_overview` — log CLASSROOM_OVERVIEW_VIEW
- `create_daily_score`, `update_daily_score` — log SCORE_CREATE/SCORE_UPDATE
- Consent mutations — log CONSENT_* events
- Auth mutations — log LOGIN_SUCCESS/LOGIN_FAILURE

**Step 2: Add audit_logs query for school managers**

**Step 3: Write integration tests verifying audit logs are created**

**Step 4: Run, commit**

```bash
git add -A && git commit -m "feat(coppa): integrate audit logging across GraphQL queries and mutations"
```

---

## Task 10: Privacy Policy Page

**Files:**
- Create: `front-end/src/routes/privacy/+page.svelte`
- Create: `front-end/src/routes/terms/+page.svelte`

**Step 1: Create privacy policy page**

Content based on research (Section 8 of compliance-privacy.md):
- Operator identity
- Data collected (student names, skill scores, parent/teacher emails)
- How data is used (educational skill tracking only)
- Data sharing (none — no third parties)
- Data retention periods
- Parental rights (access, delete, revoke)
- Security measures
- COPPA-specific disclosures
- Contact information
- Last updated date

**Step 2: Create terms of service page (basic)**

**Step 3: Add links to login/register pages and app layout**

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(coppa): add privacy policy and terms of service pages"
```

---

## Task 11: Frontend — Invitation & Consent Pages

**Files:**
- Create: `front-end/src/routes/invite/[token]/+page.svelte` — teacher invitation acceptance
- Create: `front-end/src/routes/consent/[token]/+page.svelte` — parent consent page
- Create: `front-end/src/lib/api/queries/invitations.ts`
- Create: `front-end/src/lib/api/queries/consent.ts`
- Modify: `front-end/src/routes/school/teachers/+page.svelte` — add "Invite Teacher" button
- Modify: `front-end/src/routes/register/+page.svelte` — require token, remove role selection

**Step 1: Create invitation acceptance page**

- Validate token via GraphQL query
- Show school name, inviter, role
- Registration form (name, email, password)
- On submit: call AcceptInvitation mutation

**Step 2: Create consent page**

- Validate token via GraphQL query
- Show COPPA direct notice (child name, school, teacher, data collected, how used, rights)
- Accept / Decline buttons
- If accept: registration form for parent account
- On submit: call GrantConsent mutation

**Step 3: Update school manager teachers page — add invite button**

**Step 4: Update register page — require token parameter**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(coppa): add invitation acceptance and consent pages in frontend"
```

---

## Task 12: Frontend — Data Rights Pages

**Files:**
- Modify: `front-end/src/routes/parent/profile/+page.svelte` — add data export, account deletion
- Modify: `front-end/src/routes/teacher/profile/+page.svelte` — add account deletion
- Create: `front-end/src/routes/parent/children/[id]/data/+page.svelte` — child data management

**Step 1: Add to parent profile**

- "Export My Child's Data" button → calls ExportChildData mutation
- "Delete My Account" button → confirmation dialog → calls RequestAccountDeletion
- "Manage Consent" section → shows consent status per child, revoke button

**Step 2: Add to teacher profile**

- "Delete My Account" button → confirmation dialog → calls RequestAccountDeletion

**Step 3: Create child data management page**

- View all data collected about child
- Export as JSON
- Request deletion
- Revoke consent

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(coppa): add data rights UI for parents and teachers"
```

---

## Task 13: Consent Expiry & Reminder Jobs

**Files:**
- Create: `backend/app/jobs/consent_reminder_job.rb`
- Create: `backend/app/jobs/consent_expiry_job.rb`
- Create: `backend/app/mailers/consent_mailer.rb` — add reminder template
- Modify: `backend/config/recurring.yml`

**Step 1: Create ConsentReminderJob**

- Runs weekly
- Finds pending consents older than 30 days but not expired
- Sends reminder email to parent

**Step 2: Create ConsentExpiryJob**

- Runs daily
- Finds pending consents past expires_at
- Marks as expired
- Deletes parent_email (COPPA requirement: delete contact info if no consent)

**Step 3: Configure recurring schedule**

```yaml
consent_reminder:
  class: ConsentReminderJob
  schedule: every monday at 9am

consent_expiry:
  class: ConsentExpiryJob
  schedule: every day at 5am
```

**Step 4: Write tests, run, commit**

```bash
git add -A && git commit -m "feat(coppa): add consent reminder and expiry background jobs"
```

---

## Task 14: Integration Tests & Full Test Suite

**Files:**
- Create: `backend/test/integration/consent_flow_test.rb`
- Create: `backend/test/integration/invitation_flow_test.rb`
- Create: `backend/test/integration/data_rights_test.rb`

**Step 1: Write end-to-end consent flow test**

School manager invites teacher → teacher accepts → teacher adds student with parent email → consent email sent → parent accepts → parent can view child data → parent revokes → data access blocked.

**Step 2: Write invitation flow test**

School manager creates invitation → email sent → teacher accepts with token → teacher linked to school → invitation marked accepted.

**Step 3: Write data rights test**

Parent exports child data → receives JSON → parent requests deletion → grace period → data deleted.

**Step 4: Run full test suite**

```bash
bin/rails test
```

Expected: all tests pass, coverage ≥ 65%.

**Step 5: Commit**

```bash
git add -A && git commit -m "test(coppa): add integration tests for consent, invitation, and data rights flows"
```

---

## Execution Order (Dependencies)

```
Wave 1 (parallel): Task 1 + Task 2 + Task 3  (models, no dependencies)
Wave 2:            Task 4                       (encryption, needs models)
Wave 3 (parallel): Task 5 + Task 6             (mutations + mailers)
Wave 4:            Task 7                       (lock registration, needs Task 5+6)
Wave 5:            Task 8                       (data rights, needs models)
Wave 6:            Task 9                       (audit integration, needs Task 3)
Wave 7 (parallel): Task 10 + Task 11 + Task 12 (frontend pages)
Wave 8:            Task 13                      (background jobs)
Wave 9:            Task 14                      (integration tests)
```

## Requirements Coverage

| Requirement | Task |
|---|---|
| COPPA-01 (Invitation chain) | Task 1, 5, 7, 11 |
| COPPA-02 (Email-Plus consent) | Task 2, 6, 11 |
| COPPA-03 (Consent record) | Task 2, 6 |
| COPPA-04 (Data gated on consent) | Task 6, 7 |
| COPPA-05 (Invitation-only) | Task 7 |
| COPPA-06 (PII encryption) | Task 4 |
| COPPA-07 (PaperTrail audit) | Task 3, 9 |
| COPPA-08 (AuditLogger) | Task 3, 9 |
| COPPA-09 (Data export) | Task 8, 12 |
| COPPA-10 (Account deletion) | Task 8, 12 |
| COPPA-11 (Retention cleanup) | Task 8, 13 |
| COPPA-12 (Privacy policy) | Task 10 |
