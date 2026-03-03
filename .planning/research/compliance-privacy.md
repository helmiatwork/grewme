# Compliance & Privacy Research: GrewMe

**Domain:** Children's Education App — Teacher/Parent skill radar for ages 5-7
**Researched:** 2026-03-04
**Overall Confidence:** HIGH (sourced from FTC.gov, ICO.org.uk, Apple/Google developer docs, legal analyses)

---

## 1. COPPA Compliance

**Confidence: HIGH** — Sourced from FTC.gov final rule (April 2025), multiple legal analyses (Cooley, Mayer Brown, BBB National Programs)

### Does COPPA Apply to GrewMe?

**YES.** Even though children don't use the app directly, COPPA applies because:

- GrewMe is "directed to children" — it collects personal information *about* children under 13 (names, skill scores) through teachers and parents
- The FTC's 2025 amended COPPA Rule (effective June 23, 2025, compliance deadline **April 22, 2026**) expanded the definition of "personal information" and tightened requirements
- The "school official exception" (see FERPA section below) may allow schools to consent on behalf of parents for *educational purposes only*, but this has limits

### What Constitutes "Personal Information" Under COPPA (2025 Amended Rule)

For GrewMe, the following are "personal information" under COPPA:

| Data Point | COPPA Classification | Stored In GrewMe? |
|-----------|---------------------|-------------------|
| Student's first + last name | Yes — directly identifies child | `students.name` |
| Parent's email | Yes — online contact info | `users.email` (role: parent) |
| Teacher's email | Not child's data, but facilitates collection | `users.email` (role: teacher) |
| Skill scores (reading, math, etc.) | Yes — education record linked to identifiable child | `daily_scores` |
| Device identifiers/IP addresses | Yes — persistent identifiers (2025 expansion) | Logs, if any |

### Verifiable Parental Consent (VPC) — Required Methods

The 2025 COPPA Rule now approves these VPC methods. **GrewMe should implement at least one:**

| Method | How It Works | Recommended for GrewMe? |
|--------|-------------|------------------------|
| **Email-Plus** | Email parent, confirm via follow-up email or phone call | **YES — Primary method.** Lowest friction for a teacher-mediated flow |
| **Text-Plus** (NEW 2025) | Text parent, confirm via follow-up text or phone call | **YES — Secondary method.** FTC explicitly added this for mobile-first apps |
| **Knowledge-Based Authentication** (NEW 2025) | Dynamic multiple-choice questions too hard for a 12-year-old | No — overkill for this use case |
| **Government ID + facial match** (NEW 2025) | Photo ID verified against selfie | No — too invasive for an education app |
| **Signed consent form** | Physical form returned via fax/mail/scan | Maybe — school districts may prefer this for FERPA alignment |
| **Credit card verification** | Small charge verified | No — inappropriate for education context |

### GrewMe-Specific COPPA Implementation Requirements

```
REQUIRED FEATURES:
├── Direct Notice to Parent (before any data collection)
│   ├── What data is collected (name, scores)
│   ├── How data will be used (skill tracking, radar charts)
│   ├── Who has access (teacher, parent, admin)
│   ├── Third-party disclosures (none, or list them)
│   └── How to revoke consent and delete data
│
├── Privacy Notice on App/Website
│   ├── All of the above, plus
│   ├── Data retention policy with specific timeframes
│   ├── Contact info for privacy questions
│   └── Operator identity (company name + address)
│
├── Parental Consent Mechanism
│   ├── Teacher creates student → triggers consent request to parent
│   ├── No student data (scores, charts) shared with parent until consent given
│   ├── Parent must be able to review data, refuse further collection, request deletion
│   └── Consent record stored with timestamp
│
├── Ongoing Parental Rights
│   ├── GET /api/v1/parents/children/:id/data — export all data
│   ├── DELETE /api/v1/parents/children/:id/data — delete all data
│   ├── PUT /api/v1/parents/consent/:id/revoke — revoke consent
│   └── Parent can review what data is collected at any time
│
├── Data Minimization
│   ├── Collect ONLY what's needed (name, scores — no photos, no location)
│   ├── Don't collect device IDs beyond what's needed for auth
│   └── No analytics SDKs that track children
│
├── Data Retention & Deletion
│   ├── Written retention policy (public in privacy notice)
│   ├── Auto-delete scores after defined period (recommend: end of school year + 1 year)
│   ├── Delete parent contact info if consent not given within reasonable time
│   └── Secure deletion (not soft-delete — actual removal)
│
└── Security Program (NEW 2025 requirement)
    ├── Designated security personnel
    ├── Annual risk assessment
    ├── Safeguards proportional to data sensitivity
    ├── Regular testing of safeguards
    └── Third-party security compliance verification
```

### The "School Official Exception" — COPPA + FERPA Intersection

**Critical for GrewMe's consent flow:**

Under COPPA, schools can consent to collection of children's data *on behalf of parents* when:
1. The data is used **solely for educational purposes** (not commercial)
2. The school acts as the parent's agent
3. The operator (GrewMe) does NOT use data for commercial purposes beyond the educational service

**Practical implication:** If GrewMe contracts with a school district, the school can provide consent for the educational use of student data. Parents still have the right to review and delete data. This is the most common pattern for edtech apps.

**But:** Parents must still be notified. And if GrewMe ever adds features beyond education (e.g., gamification with third-party rewards, advertising), this exception collapses.

---

## 2. FERPA Compliance

**Confidence: HIGH** — Sourced from ED.gov/PTAC, UpGuard (2026), Island.io FERPA checklist, legal analyses

### Does FERPA Apply to GrewMe?

**CONDITIONALLY.** FERPA applies to educational institutions that receive federal funding. GrewMe itself is not directly covered by FERPA, BUT:

- When a school uses GrewMe, the data GrewMe stores becomes an "education record" under FERPA
- GrewMe becomes a "school official" with a "legitimate educational interest" — but ONLY if there's a proper agreement (see below)
- The school is responsible for FERPA compliance, but GrewMe must contractually support it

### What Is an "Education Record" Under FERPA?

**Anything that is:**
1. Directly related to a student, AND
2. Maintained by an educational agency/institution or a party acting for the agency

**GrewMe's data that qualifies:**
- Student names → directly related to student
- Daily skill scores → directly related to student academic performance
- Radar chart data → derived from education records
- Teacher assessments → education records

**What does NOT qualify:**
- Teacher's personal login credentials
- Aggregated, de-identified statistics

### GrewMe's FERPA Obligations (as a "School Official")

```
REQUIRED CONTRACTUAL + TECHNICAL FEATURES:
│
├── Data Processing Agreement (DPA) with School Districts
│   ├── GrewMe acts under "direct control" of the school
│   ├── Data used ONLY for authorized educational purpose
│   ├── GrewMe cannot re-disclose data without school authorization
│   ├── Data returned/deleted upon contract termination
│   └── Standard: Student Data Privacy Consortium (SDPC) National DPA template
│
├── Access Controls (Technical)
│   ├── Teachers see ONLY their classroom's students
│   ├── Parents see ONLY their linked children
│   ├── Admins scoped to their school
│   ├── No cross-school data leakage
│   └── Role-based authorization enforced at API level
│
├── Parent Rights (within 45 days of request)
│   ├── Right to inspect education records → data export endpoint
│   ├── Right to request amendment → dispute mechanism
│   ├── Right to consent to disclosure → consent management
│   └── Right to file complaint with Department of Education
│
├── Directory Information (optional, but relevant)
│   ├── Student name COULD be "directory information" if school designates it
│   ├── Schools must notify parents annually of what's directory info
│   └── Parents can opt out of directory info disclosure
│
├── Breach Notification
│   ├── FERPA requires notification to affected schools
│   ├── State laws add additional requirements (e.g., 72 hours in Illinois/SOPPA)
│   └── GrewMe must have incident response plan
│
└── Audit Trail
    ├── Log all access to education records
    ├── Include: who accessed, what record, when, from where
    ├── FERPA requires schools to maintain record of disclosures
    └── GrewMe must support this via audit log API/export
```

### FERPA-Specific Endpoints/Features Needed

| Feature | Purpose | FERPA Requirement |
|---------|---------|-------------------|
| `GET /api/v1/students/:id/records/export` | Parent data export | 45-day access right |
| `POST /api/v1/students/:id/records/amendment-request` | Parent disputes a record | Amendment right |
| `GET /api/v1/audit-log?student_id=:id` | School reviews access history | Disclosure accounting |
| Data Processing Agreement template | School signs before deployment | School official exception |
| De-identification capability | Aggregate stats without PII | Directory info / research |

---

## 3. GDPR Article 8 (Children's Data — EU/UK)

**Confidence: MEDIUM** — Sourced from ICO.org.uk, Kennedys Law, Handley Gill analysis

### Applicability

If GrewMe is used by schools in the EU/UK, GDPR applies. Article 8 sets specific rules for children:

- **EU:** Parental consent required for children under 16 (member states can lower to 13)
- **UK:** Age of digital consent is 13 under the UK Data Protection Act 2018
- GrewMe's target age (5-7) falls well below ALL thresholds — **parental consent is always required**

### UK Age Appropriate Design Code (Children's Code) — 15 Standards

The ICO's Children's Code applies to any "information society service" likely to be accessed by children. Key standards relevant to GrewMe:

| Standard | Requirement | GrewMe Implementation |
|----------|-------------|----------------------|
| **Best interests of the child** | Data processing must prioritize child welfare | Score data used only for educational insight, never commercial profiling |
| **Data protection impact assessment (DPIA)** | Mandatory before processing children's data | Must complete DPIA before launch |
| **Age appropriate application** | Apply protections based on child's age | All students treated as under-13; maximum protections by default |
| **Transparency** | Privacy info must be understandable to children/parents | Age-appropriate privacy notice for parents |
| **Data minimization** | Collect minimum necessary data | Only name + scores; no device tracking |
| **Data sharing** | Limit sharing of children's data | No third-party data sharing |
| **Geolocation** | Don't track children's location | No location data collected |
| **Parental controls** | Provide appropriate parental oversight | Parent app provides visibility and control |
| **Profiling** | Don't profile children by default | No ML/AI profiling on scores |
| **Default settings** | Privacy-protective by default | Highest privacy settings as default |

### GDPR-Specific Requirements

```
REQUIRED FOR EU/UK DEPLOYMENT:
│
├── Lawful Basis for Processing
│   ├── Consent (parental) — primary basis for child data
│   ├── OR Legitimate interest — but DPIA required and harder to justify for children
│   └── Contract with school — possible but consent still needed for under-16s
│
├── Data Protection Impact Assessment (DPIA)
│   ├── Systematic description of processing
│   ├── Assessment of necessity and proportionality
│   ├── Risk assessment to rights/freedoms of children
│   ├── Measures to address risks
│   └── Must be completed BEFORE processing begins
│
├── Data Subject Rights (parents exercising on behalf of child)
│   ├── Right of access (Art. 15)
│   ├── Right to rectification (Art. 16)
│   ├── Right to erasure / "right to be forgotten" (Art. 17)
│   ├── Right to data portability (Art. 20) — machine-readable export
│   ├── Right to object (Art. 21)
│   └── Right to withdraw consent at any time
│
├── International Data Transfers
│   ├── If GrewMe servers are outside EU → need legal mechanism
│   ├── Standard Contractual Clauses (SCCs) or adequacy decision
│   └── Consider EU-based hosting for EU schools
│
├── Data Protection Officer (DPO)
│   ├── Required if processing children's data on a large scale
│   └── Must be contactable by data subjects
│
└── Records of Processing Activities (Art. 30)
    ├── Document all processing of children's data
    ├── Purpose, categories, recipients, retention periods
    └── Must be available to supervisory authority on request
```

---

## 4. App Store Requirements

**Confidence: HIGH** — Sourced from Apple Developer docs (Feb 2025, Jan 2026), Google Play Console Help, Mondaq/BakerHostetler legal analysis

### Apple App Store

**Key requirements for apps involving children's data (even if not a "Kids" category app):**

| Requirement | Details | GrewMe Impact |
|-------------|---------|---------------|
| **Privacy Nutrition Labels** | Must declare all data types collected, linked to identity, used for tracking | Declare: student names, education records, user accounts |
| **App Tracking Transparency** | Cannot track users across apps/websites | Ensure no third-party tracking SDKs |
| **Account Deletion** | MUST provide ability to delete account and all associated data (required since June 2023) | `DELETE /api/v1/account` endpoint required |
| **Privacy Policy URL** | Required in App Store Connect, linked from within app | Host at `https://grewme.app/privacy` (or similar) |
| **Age Rating** | Updated age rating system (Jan 2026) — must answer age rating questionnaire | Rate appropriately; no mature content |
| **Declared Age Range API** (NEW 2026) | Apple's new age verification system — apps can determine user's age category | Integrate Apple's API for age verification |
| **Kids Category** | If listed in Kids: no third-party ads, analytics, or SDKs not approved by Apple | GrewMe should NOT list in Kids category (it's a teacher/parent app, not child-facing) |
| **Data Collection from Children** | If app collects data from/about children: enhanced review, must comply with COPPA | Will trigger enhanced Apple review |

**Critical:** Apple's App Store Accountability Act compliance (California, Texas, Louisiana, Utah) requires age verification starting 2026. Apple provides the Declared Age Range API — GrewMe should integrate this.

### Google Play

**Key requirements:**

| Requirement | Details | GrewMe Impact |
|-------------|---------|---------------|
| **Families Policy** | Apps targeting children must comply with Families Policy | If targeting children → additional restrictions |
| **Target Audience Declaration** | Must declare target age groups in Play Console | Declare: adults (teachers/parents), but app involves children's data |
| **Teacher Approved Program** | Optional — apps rated by education experts for quality | Consider applying once app is mature |
| **Child Safety Standards** (2025) | All apps must comply with child safety standards | No inappropriate content, protect children's data |
| **Data Safety Section** | Must declare all data types collected/shared | Declare: personal info (names), education data |
| **Account Deletion** | Must provide account and data deletion (required since Dec 2023) | Same as Apple — `DELETE /api/v1/account` |
| **Families Self-Certified Ads SDK** | Only approved ad SDKs in children's apps | No ads in GrewMe — N/A |
| **Privacy Policy** | Required for all apps collecting personal data | Same as Apple |

**Key distinction:** GrewMe's teacher and parent apps are NOT child-facing. Children never interact with the app. This means:
- **Don't** enroll in Google Play's Designed for Families program
- **Do** declare that the app handles children's data in the Data Safety Section
- **Do** comply with all privacy requirements since the data is ABOUT children

### Both Platforms — Account Deletion Requirements

```
MANDATORY ACCOUNT DELETION FLOW:
│
├── In-App Trigger
│   ├── Settings → Account → Delete Account
│   └── Must be findable without external resources
│
├── What Must Be Deleted
│   ├── User account (teacher/parent)
│   ├── All associated student data (for parents: their children's data)
│   ├── All scores, assessments, charts
│   └── Audit logs may be retained for compliance (anonymized)
│
├── Confirmation Flow
│   ├── Explain what will be deleted
│   ├── Require explicit confirmation (not single tap)
│   ├── Provide grace period option (e.g., 30 days to change mind)
│   └── Send confirmation email after deletion
│
├── API Endpoint
│   ├── DELETE /api/v1/account — initiates deletion
│   ├── POST /api/v1/account/deletion-request — with grace period
│   └── Must complete within 90 days (Apple requirement)
│
└── Edge Cases
    ├── Teacher deletes account → what happens to student scores they submitted?
    │   └── Scores remain (they're the student's record) but teacher attribution anonymized
    ├── Parent deletes account → children's data?
    │   └── Children's data retained for educational purpose (teacher/school still needs it)
    │   └── BUT parent can separately request child data deletion via COPPA/GDPR rights
    └── School contract ends → all school data must be deletable in bulk
```

---

## 5. Data Retention & Deletion

**Confidence: HIGH** — COPPA 2025 rule explicitly requires written retention policy; FERPA/GDPR alignment

### Recommended Retention Policy

| Data Type | Retention Period | Rationale | Deletion Method |
|-----------|-----------------|-----------|-----------------|
| **Daily skill scores** | Current school year + 1 year | Allows year-over-year comparison, then no longer needed | Hard delete from `daily_scores` table |
| **Student records** (names, classroom) | Duration of school relationship + 1 year after student leaves | School may need historical access | Hard delete from `students` table |
| **Parent/teacher accounts** | Until account deletion requested or school contract ends | Active use | Hard delete or anonymize |
| **Consent records** | 3 years after consent given or revoked | Compliance audit trail | Archive, then delete |
| **Audit logs** | 3 years | Compliance investigations; FERPA disclosure records | Archive to cold storage, then purge |
| **Radar chart aggregates** | 2 years | Trend analysis for educational purposes | Automatic purge via background job |
| **Deleted account data** | 30-day grace period, then permanent deletion | Account recovery window | Hard delete after grace period |

### Implementation Requirements

```ruby
# Background job: app/jobs/data_retention_cleanup_job.rb
# Run nightly via SolidQueue

class DataRetentionCleanupJob < ApplicationJob
  queue_as :maintenance

  def perform
    # 1. Delete scores older than retention period
    cutoff = RetentionPolicy.score_retention_period.ago
    DailyScore.where("created_at < ?", cutoff).delete_all

    # 2. Delete students not in active school relationships
    # (school year ended > 1 year ago, no active classroom)

    # 3. Purge expired consent records
    Consent.expired.where("updated_at < ?", 3.years.ago).delete_all

    # 4. Purge old audit logs
    AuditLog.where("created_at < ?", 3.years.ago).delete_all

    # 5. Complete account deletions past grace period
    AccountDeletionRequest.past_grace_period.each(&:execute!)
  end
end
```

### COPPA 2025-Specific Retention Rules

- **Written data retention policy**: MUST be publicly posted in privacy notice
- **No indefinite storage**: Every data type must have a defined lifecycle
- **Secure deletion**: Must prevent unauthorized access to deleted data
- **Delete parent contact info**: If consent not given within "reasonable time" (recommend: 30 days)

---

## 6. Audit Logging

**Confidence: MEDIUM** — Based on FERPA disclosure requirements, COPPA security program requirements, industry best practices

### What Events to Log

```
AUDIT LOG EVENTS:
│
├── Authentication Events
│   ├── LOGIN_SUCCESS — user_id, role, IP, timestamp, device_info
│   ├── LOGIN_FAILURE — email_attempted, IP, timestamp, reason
│   ├── LOGOUT — user_id, timestamp
│   ├── TOKEN_REFRESH — user_id, timestamp
│   └── PASSWORD_CHANGE — user_id, timestamp
│
├── Student Data Access (FERPA-critical)
│   ├── STUDENT_VIEW — user_id, student_id, data_fields_accessed, timestamp
│   ├── STUDENT_SCORES_VIEW — user_id, student_id, date_range, timestamp
│   ├── RADAR_CHART_VIEW — user_id, student_id, timestamp
│   ├── STUDENT_EXPORT — user_id, student_id, format, timestamp
│   └── CLASSROOM_OVERVIEW_VIEW — user_id, classroom_id, timestamp
│
├── Data Modification Events
│   ├── SCORE_CREATE — teacher_id, student_id, scores, date, timestamp
│   ├── SCORE_UPDATE — teacher_id, student_id, old_scores, new_scores, timestamp
│   ├── SCORE_DELETE — user_id, student_id, reason, timestamp
│   ├── STUDENT_CREATE — user_id, student_name, classroom_id, timestamp
│   ├── STUDENT_UPDATE — user_id, student_id, changed_fields, timestamp
│   └── STUDENT_DELETE — user_id, student_id, reason, timestamp
│
├── Consent Events
│   ├── CONSENT_REQUESTED — student_id, parent_email, method, timestamp
│   ├── CONSENT_GRANTED — student_id, parent_id, method, timestamp
│   ├── CONSENT_DENIED — student_id, parent_id, timestamp
│   ├── CONSENT_REVOKED — student_id, parent_id, timestamp
│   └── CONSENT_EXPIRED — student_id, timestamp
│
├── Account Management Events
│   ├── ACCOUNT_CREATED — user_id, role, created_by, timestamp
│   ├── ACCOUNT_UPDATED — user_id, changed_fields, timestamp
│   ├── ACCOUNT_DELETION_REQUESTED — user_id, timestamp
│   ├── ACCOUNT_DELETED — user_id, timestamp
│   └── INVITATION_SENT — inviter_id, invitee_email, role, timestamp
│
└── Authorization Events
    ├── ACCESS_DENIED — user_id, resource, action, reason, timestamp
    ├── ROLE_CHANGED — user_id, old_role, new_role, changed_by, timestamp
    └── UNAUTHORIZED_DATA_ACCESS_ATTEMPT — user_id, resource, timestamp
```

### Audit Log Schema

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_audit_logs.rb
class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.string :event_type, null: false      # e.g., "STUDENT_VIEW", "SCORE_CREATE"
      t.string :severity, null: false         # info, warning, critical
      t.references :user, null: true          # who performed the action (null for system events)
      t.string :user_role                     # teacher, parent, admin (denormalized for audit)
      t.string :resource_type                 # Student, DailyScore, Consent, etc.
      t.bigint :resource_id                   # ID of affected resource
      t.string :action                        # view, create, update, delete, export
      t.jsonb :metadata, default: {}          # additional context (IP, device, changed fields)
      t.inet :ip_address                      # request IP
      t.string :user_agent                    # browser/device info
      t.timestamps
    end

    add_index :audit_logs, :event_type
    add_index :audit_logs, :user_id
    add_index :audit_logs, [:resource_type, :resource_id]
    add_index :audit_logs, :created_at
    add_index :audit_logs, :severity
  end
end
```

### Audit Log Retention

- **Active logs**: Kept in primary database for 90 days (fast query access)
- **Archive**: Moved to cold storage (S3/compressed backup) for 3 years total
- **Export format**: JSON Lines (`.jsonl`) — one JSON object per line for easy processing
- **Immutability**: Audit logs MUST be append-only. Never update or delete active logs. Use a separate archival process.

### Implementation Pattern

```ruby
# app/services/audit_logger.rb
class AuditLogger
  def self.log(event_type:, user:, resource: nil, action:, metadata: {}, severity: :info, request: nil)
    AuditLog.create!(
      event_type: event_type,
      severity: severity.to_s,
      user: user,
      user_role: user&.role,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      action: action,
      metadata: metadata,
      ip_address: request&.remote_ip,
      user_agent: request&.user_agent
    )
  end
end

# Usage in controller:
# AuditLogger.log(
#   event_type: "STUDENT_SCORES_VIEW",
#   user: current_user,
#   resource: @student,
#   action: "view",
#   metadata: { date_range: "2026-01-01..2026-03-01" },
#   request: request
# )
```

---

## 7. Consent Workflows

**Confidence: HIGH** — Based on COPPA VPC requirements, k-ID developer docs, Ziplet consent patterns, Glance app consent guide

### GrewMe Consent Flow (Teacher-Mediated)

This is the most critical workflow in the entire app. Here's the recommended flow:

```
INVITATION & CONSENT FLOW:
│
│ STEP 1: School Admin creates school account
│ ├── School admin registers → verified via school email domain
│ └── Admin invites teachers via email
│
│ STEP 2: Teacher joins school
│ ├── Teacher receives invitation email with signup link
│ ├── Teacher creates account (role: teacher, school_id: set automatically)
│ └── Teacher creates classroom(s)
│
│ STEP 3: Teacher adds students
│ ├── Teacher enters student first name + parent email
│ ├── System creates student record (MINIMAL data — first name only)
│ ├── System sends COPPA direct notice to parent email
│ │   ├── Email includes: what data is collected, how it's used, who accesses it
│ │   ├── Email includes: link to full privacy policy
│ │   └── Email includes: link to consent/decline
│ └── Student status = "pending_consent"
│
│ STEP 4: Parent receives notice & consents
│ ├── Parent clicks link in email → lands on consent page
│ ├── Consent page shows:
│ │   ├── Child's name (to verify correct child)
│ │   ├── Teacher's name and school
│ │   ├── What data will be collected (skill scores in 5 categories)
│ │   ├── How data will be used (radar chart, progress tracking)
│ │   ├── Retention period
│ │   ├── Parent's rights (access, delete, revoke)
│ │   └── Full privacy policy link
│ ├── Parent can:
│ │   ├── ACCEPT → creates parent account, links to child, consent recorded
│ │   ├── DECLINE → student remains, but no data shared with parent
│ │   └── IGNORE → after 30 days, system sends reminder; after 60 days, parent email deleted
│ └── Confirmation:
│     ├── Email-Plus: confirmation email sent (COPPA compliant)
│     └── Consent record stored: parent_id, student_id, method, timestamp, IP
│
│ STEP 5: Data access begins
│ ├── IF consent granted via parent:
│ │   ├── Parent can view radar charts
│ │   ├── Parent can export data
│ │   └── Parent can request deletion
│ ├── IF consent granted via school (COPPA school official exception):
│ │   ├── Teacher can enter scores immediately
│ │   ├── Parent is still notified but school has authorized collection
│ │   └── Parent retains rights to review and request deletion
│ └── IF no consent and no school exception:
│     └── Teacher CANNOT enter scores for this student
│
│ STEP 6: Ongoing consent management
│ ├── Parent can revoke consent at any time (Settings → Children → Revoke)
│ ├── Revocation triggers:
│ │   ├── Stop sharing data with parent
│ │   ├── If parent was sole consent mechanism → stop all data collection
│ │   └── Notification to teacher/school admin
│ └── Annual consent renewal reminder (best practice, not legally required)
```

### API Endpoints for Consent

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/v1/students` | POST | Teacher creates student (triggers consent request) |
| `GET /api/v1/consent/:token` | GET | Parent views consent request (public, token-based) |
| `POST /api/v1/consent/:token/accept` | POST | Parent grants consent |
| `POST /api/v1/consent/:token/decline` | POST | Parent declines consent |
| `PUT /api/v1/consent/:id/revoke` | PUT | Parent revokes consent |
| `GET /api/v1/consent/status` | GET | Parent views current consent status for all children |

### Consent Record Schema

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_consents.rb
class CreateConsents < ActiveRecord::Migration[8.1]
  def change
    create_table :consents do |t|
      t.references :student, null: false, foreign_key: true
      t.references :parent, null: true, foreign_key: { to_table: :users }
      t.string :parent_email, null: false
      t.string :status, null: false, default: "pending"
        # pending, granted, declined, revoked, expired
      t.string :method, null: false
        # email_plus, text_plus, school_official, signed_form
      t.string :token, null: false  # unique consent request token
      t.inet :ip_address            # IP when consent was given
      t.datetime :granted_at
      t.datetime :revoked_at
      t.datetime :expires_at        # for pending requests
      t.text :notice_content_hash   # SHA-256 of the notice shown (proves what parent saw)
      t.timestamps
    end

    add_index :consents, :token, unique: true
    add_index :consents, [:student_id, :parent_email], unique: true
    add_index :consents, :status
  end
end
```

---

## 8. Privacy Policy Requirements

**Confidence: HIGH** — Required by COPPA, GDPR, Apple App Store, Google Play

### What Must Be Disclosed

```
PRIVACY POLICY MUST INCLUDE:
│
├── Operator Identity
│   ├── Company name, physical address, email, phone
│   └── DPO contact (if GDPR applies)
│
├── Data Collection
│   ├── Types of data collected from/about children
│   │   ├── Student names
│   │   ├── Educational skill scores (reading, math, writing, logic, social)
│   │   ├── Teacher assessments
│   │   └── Parent contact information (email)
│   ├── How data is collected (via teacher input, not directly from children)
│   └── Persistent identifiers collected (list any — or state none)
│
├── Data Use
│   ├── Primary: educational skill tracking and visualization
│   ├── No advertising, no profiling, no commercial use
│   └── Internal operations (security, maintenance)
│
├── Data Sharing
│   ├── List ALL third parties (or "none")
│   ├── Infrastructure providers (hosting, database) — name them
│   ├── No sale of children's data (state explicitly)
│   └── Law enforcement exceptions
│
├── Data Retention
│   ├── Specific retention periods for each data type (from Section 5)
│   ├── When data is deleted
│   └── How data is deleted (securely)
│
├── Parental Rights
│   ├── Right to review child's data
│   ├── Right to request deletion
│   ├── Right to refuse further collection
│   ├── Right to revoke consent
│   ├── How to exercise these rights (in-app + email)
│   └── Response timeframe (FERPA: 45 days; GDPR: 30 days)
│
├── Security Measures
│   ├── Encryption at rest and in transit
│   ├── Access controls
│   ├── Regular security assessments
│   └── Breach notification procedures
│
├── COPPA-Specific (2025 Rule)
│   ├── Consent methods used
│   ├── Internal operations use of persistent identifiers
│   └── Audio file handling (N/A for GrewMe but state it)
│
├── GDPR-Specific (if EU/UK deployment)
│   ├── Lawful basis for processing
│   ├── International data transfers
│   ├── Data subject rights under GDPR
│   ├── Right to lodge complaint with supervisory authority
│   └── Automated decision-making disclosure (none)
│
└── Policy Updates
    ├── How users will be notified of changes
    ├── Last updated date
    └── Version history
```

### Where to Host

| Location | Requirement |
|----------|-------------|
| **Web URL** | `https://grewme.app/privacy` — linked from App Store listings |
| **In-App** (Teacher App) | Settings → Privacy Policy (WebView or deep link) |
| **In-App** (Parent App) | Settings → Privacy Policy (WebView or deep link) |
| **App Store Connect** | Privacy Policy URL field (required) |
| **Google Play Console** | Privacy Policy URL field (required) |
| **Consent emails** | Link to privacy policy in every consent notification |
| **Pre-registration** | Visible before account creation (link on login/signup screen) |

### Presentation Guidelines

- **Language**: Plain English. No legal jargon. COPPA requires the notice be "clearly and understandably written"
- **Format**: Layered approach — short summary at top, full details below
- **Accessibility**: Mobile-friendly, readable on small screens
- **Translation**: If deploying in non-English markets, provide translated versions

---

## 9. Encryption

**Confidence: HIGH** — Rails 8.1 Active Record Encryption docs (Context7), COPPA 2025 security requirements, FERPA best practices

### At-Rest Encryption

**Use Rails Active Record Encryption (built-in since Rails 7):**

```ruby
# app/models/student.rb
class Student < ApplicationRecord
  # Encrypt PII fields
  encrypts :name                      # Non-deterministic (can't query by name — good for privacy)

  # If you need to query by name (e.g., search):
  # encrypts :name, deterministic: true  # Same input → same ciphertext
  # But: deterministic encryption is less secure; prefer non-deterministic

  belongs_to :classroom
  has_many :daily_scores
  has_many :parent_students
end

# Note: DailyScore.score does NOT need encryption —
# it's a number (0-100) that's meaningless without the student context
# The student_id foreign key links to an encrypted name, providing sufficient protection
```

**Configuration:**

```ruby
# config/credentials.yml.enc (generated via rails credentials:edit)
active_record_encryption:
  primary_key: <32-byte hex key>
  deterministic_key: <32-byte hex key>
  key_derivation_salt: <32-byte hex key>
```

```ruby
# Generate keys:
# bin/rails db:encryption:init
# This outputs the three keys to add to credentials
```

**What to encrypt:**

| Field | Encrypt? | Type | Rationale |
|-------|----------|------|-----------|
| `students.name` | **YES** | Non-deterministic | PII — child's name |
| `users.email` | **YES** | Deterministic (needed for login lookup) | PII |
| `users.name` | **YES** | Non-deterministic | PII |
| `daily_scores.score` | No | N/A | Integer 0-100, meaningless without student context |
| `daily_scores.skill_category` | No | N/A | Enum integer, not PII |
| `consents.parent_email` | **YES** | Deterministic | PII — needed for lookup |
| `consents.ip_address` | **YES** | Non-deterministic | PII under GDPR |
| `audit_logs.ip_address` | **YES** | Non-deterministic | PII under GDPR |

### In-Transit Encryption

```
REQUIRED:
├── TLS 1.2+ for all API communications
│   ├── Rails: config.force_ssl = true (uncomment in production.rb)
│   ├── Rails: config.assume_ssl = true
│   └── Kamal/Thruster: configure SSL termination
│
├── Certificate Management
│   ├── Use Let's Encrypt (free, auto-renewal)
│   ├── Or managed certificates via cloud provider
│   └── HSTS header enabled (Strict-Transport-Security)
│
├── Mobile App Transport Security
│   ├── iOS: App Transport Security (ATS) enforces HTTPS by default
│   ├── Android: Network Security Config — restrict to HTTPS only
│   └── Both: certificate pinning recommended for extra security
│
└── Internal Communications
    ├── Database connections: SSL/TLS (PostgreSQL supports this)
    └── Background job queues: same database, already encrypted if disk encryption used
```

### Key Management

```
KEY MANAGEMENT STRATEGY:
│
├── Storage
│   ├── Rails encrypted credentials (config/credentials.yml.enc)
│   ├── master.key NEVER committed to git (already in .gitignore)
│   ├── Production: RAILS_MASTER_KEY environment variable
│   └── Consider: AWS KMS, GCP KMS, or HashiCorp Vault for production
│
├── Rotation
│   ├── Rails AR Encryption supports key rotation natively
│   ├── Add new key as primary, keep old key for decryption
│   ├── Schedule: rotate annually or upon suspected compromise
│   └── Migration: re-encrypt existing records with new key via background job
│
├── Database-Level Encryption
│   ├── PostgreSQL: enable pgcrypto extension (already available)
│   ├── Cloud: use encrypted volumes (AWS EBS encryption, etc.)
│   └── Backups: must also be encrypted
│
└── Mobile App
    ├── JWT tokens: store in Android Keystore / iOS Keychain
    ├── No PII cached on device
    └── android:allowBackup="false" (already flagged in CONCERNS.md)
```

---

## 10. Invitation-Based Access

**Confidence: HIGH** — Based on edtech app patterns, GrewMe architecture requirements

### Invitation Chain: School → Teacher → Parent

```
ACCESS HIERARCHY:
│
│ Level 1: SCHOOL ADMIN
│ ├── Created via: self-registration with school domain verification
│ │   ├── Option A: email domain whitelist (e.g., @springfield-school.edu)
│ │   ├── Option B: manual verification by GrewMe team
│ │   └── Option C: school code provided during sales/onboarding
│ ├── Powers: invite teachers, manage school settings, view aggregated data
│ └── Scope: own school only
│
│ Level 2: TEACHER
│ ├── Created via: invitation from school admin
│ │   ├── Admin sends invite → teacher receives email with signup link + invite code
│ │   ├── Invite link contains signed token (JWT or HMAC-signed)
│ │   ├── Token encodes: school_id, role=teacher, inviter_id, expiry
│ │   └── Token expires after 7 days
│ ├── Registration:
│ │   ├── Teacher clicks link → pre-filled school, role locked to "teacher"
│ │   ├── Teacher sets name, email, password
│ │   └── Account auto-linked to school
│ ├── Powers: create classrooms, add students, enter scores, view own students
│ └── Scope: own school, own classrooms, own students only
│
│ Level 3: PARENT
│ ├── Created via: consent flow (see Section 7)
│ │   ├── Teacher adds student with parent email → consent email sent
│ │   ├── Parent clicks consent link → consent page → if accepted, creates account
│ │   ├── Account auto-linked to child
│ │   └── No invite code needed (consent token IS the invitation)
│ ├── Powers: view own children's data, export, request deletion
│ └── Scope: own children only (via parent_students join table)
│
└── UNAUTHORIZED ACCESS PREVENTION
    ├── No self-registration for teachers (must be invited)
    ├── No self-registration for parents (must receive consent request)
    ├── Remove the current open registration endpoint (CRITICAL — role escalation bug exists)
    ├── All invitations expire (7 days for teacher invites, 60 days for parent consent)
    ├── All invitations are single-use (token invalidated after use)
    ├── Rate limit invitation sending (prevent spam/abuse)
    └── Email verification required for all accounts
```

### Invitation Schema

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_invitations.rb
class CreateInvitations < ActiveRecord::Migration[8.1]
  def change
    create_table :invitations do |t|
      t.references :inviter, null: false, foreign_key: { to_table: :users }
      t.references :school, null: false, foreign_key: true
      t.string :email, null: false
      t.string :role, null: false          # teacher
      t.string :token, null: false         # signed invitation token
      t.string :status, default: "pending" # pending, accepted, expired, revoked
      t.datetime :expires_at, null: false
      t.datetime :accepted_at
      t.timestamps
    end

    add_index :invitations, :token, unique: true
    add_index :invitations, [:email, :school_id]
  end
end
```

### API Endpoints for Invitations

| Endpoint | Method | Who | Purpose |
|----------|--------|-----|---------|
| `POST /api/v1/schools/:id/invitations` | POST | Admin | Invite a teacher |
| `GET /api/v1/invitations/:token` | GET | Public | Validate invitation (pre-registration) |
| `POST /api/v1/invitations/:token/accept` | POST | Public | Accept invitation + create account |
| `DELETE /api/v1/invitations/:id` | DELETE | Admin | Revoke pending invitation |
| `GET /api/v1/schools/:id/invitations` | GET | Admin | List all invitations for school |

### Critical Security Fix Required

**The current `POST /api/v1/auth/register` endpoint must be REMOVED or locked down.** Currently:
- Anyone can register with any role (including `admin`)
- This is a role escalation vulnerability (documented in CONCERNS.md)
- Replace with invitation-only registration

```ruby
# REMOVE this from register_params:
# params.permit(:name, :email, :password, :password_confirmation, :role)

# REPLACE with:
# Registration ONLY via invitation token or consent token
# Role determined by invitation/consent, NOT user input
```

---

## Summary: Compliance Feature Roadmap

### Priority 1 — Must Have Before Any School Deployment

| Feature | Blocks | Effort |
|---------|--------|--------|
| Remove open registration / add invitation flow | Security, FERPA | Medium |
| Parental consent workflow (Email-Plus) | COPPA | High |
| Privacy policy (web-hosted) | App Store, COPPA, GDPR | Low |
| Account deletion endpoint | App Store (Apple + Google) | Medium |
| Encrypt student names (AR Encryption) | COPPA security, FERPA | Low |
| Force SSL/TLS | COPPA security, basic security | Low |
| Basic audit logging (student data access) | FERPA | Medium |

### Priority 2 — Must Have Before App Store Submission

| Feature | Blocks | Effort |
|---------|--------|--------|
| Data Safety / Privacy Nutrition labels | App Store approval | Low |
| Age rating questionnaire answers | App Store approval | Low |
| In-app privacy policy link | App Store approval | Low |
| Data export endpoint (parent) | COPPA, GDPR | Medium |
| Data deletion endpoint (parent requesting for child) | COPPA, GDPR | Medium |
| Written data retention policy (in privacy notice) | COPPA 2025 Rule | Low |

### Priority 3 — Must Have Before EU/UK Deployment

| Feature | Blocks | Effort |
|---------|--------|--------|
| DPIA completed and documented | GDPR | Medium |
| GDPR-compliant privacy notice (layered) | GDPR | Low |
| Data portability endpoint (machine-readable export) | GDPR Art. 20 | Medium |
| EU-based hosting option | GDPR data transfers | High |
| DPO designation | GDPR | Low |
| Records of Processing Activities | GDPR Art. 30 | Medium |

### Priority 4 — Ongoing Compliance Operations

| Feature | Blocks | Effort |
|---------|--------|--------|
| Annual security risk assessment | COPPA 2025 | Medium |
| Data retention cleanup job | COPPA, data minimization | Medium |
| Consent renewal/re-notification workflow | Best practice | Low |
| Audit log archival + purge | Storage management | Medium |
| Key rotation process | Security best practice | Medium |
| Breach notification workflow | FERPA, GDPR, state laws | High |

---

## Sources

### COPPA
- FTC Children's Online Privacy Protection Rule — https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa (HIGH confidence)
- FTC 2025 COPPA Final Rule Amendments — Federal Register, April 22, 2025 (HIGH confidence)
- FTC COPPA Enforcement Policy on Age Verification — Feb 25, 2026 (HIGH confidence)
- Securiti.ai analysis of COPPA amendments — https://securiti.ai/ftc-coppa-final-rule-amendments/ (MEDIUM confidence)
- BBB National Programs COPPA amended rule summary — https://bbbprograms.org/media/insights/blog/coppa-amended (MEDIUM confidence)
- Promise Legal COPPA Practical Guide 2025 — https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/ (MEDIUM confidence)

### FERPA
- ED.gov Student Privacy — https://studentprivacy.ed.gov/training/data-retention-and-data-destruction (HIGH confidence)
- UpGuard FERPA Compliance Guide 2026 — https://www.upguard.com/blog/ferpa-compliance-guide (MEDIUM confidence)
- Hireplicity FERPA Compliance Checklist 2026 — https://www.hireplicity.com/blog/ferpa-compliance-checklist-2025 (MEDIUM confidence)
- Public Interest Privacy Center — FERPA EdTech Accountability — https://publicinterestprivacy.org/edtech-data-sharing/ (HIGH confidence)
- Island.io FERPA Compliance Checklist — https://www.island.io/content/compliance/ferpa (MEDIUM confidence)

### GDPR / UK Children's Code
- ICO Age Appropriate Design Code — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ (HIGH confidence)
- ICO Children and UK GDPR — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/children-and-the-uk-gdpr/ (HIGH confidence)
- Kennedys Law — UK DUA Act Children's Code — https://www.kennedyslaw.com/en/thought-leadership/article/2025/the-uk-dua-act-s-reform-pillars-divergence-from-the-eu-gdpr-age-appropriate-design-code-the-childrens-code/ (MEDIUM confidence)

### App Stores
- Apple Developer — Age Rating Updates (Jan 2026) — https://developer.apple.com/news/upcoming-requirements/?id=07242025a (HIGH confidence)
- Apple — Helping Protect Kids Online (Feb 2025) — https://developer.apple.com/support/downloads/Helping-Protect-Kids-Online-2025.pdf (HIGH confidence)
- Google Play Families Policy — https://support.google.com/googleplay/android-developer/topic/9877766 (HIGH confidence)
- Google Play Child Safety Standards — https://support.google.com/googleplay/android-developer/answer/14747720 (HIGH confidence)
- Google Play Data Practices in Families Apps — https://support.google.com/googleplay/android-developer/answer/11043825 (HIGH confidence)
- App Store Accountability Acts analysis — Mondaq, BakerHostetler, Taft (MEDIUM confidence)

### Encryption
- Rails 8.1.2 Active Record Encryption — Context7 (HIGH confidence)
- Thoughtbot — Querying Encrypted Data in Rails — https://thoughtbot.com/blog/querying-encrypted-data-in-rails-using-deterministic-encryption (HIGH confidence)

### State Laws (supplementary)
- Mayer Brown — Children's Privacy Legislation Tracker — https://www.mayerbrown.com/en/insights/publications/2026/01/little-users-big-rules-tracking-childrens-privacy-legislation (MEDIUM confidence)
- Keller & Heckman — State Kids Privacy Laws 2025/2026 — https://www.khlaw.com/insights/kids-and-teens-privacy-2025-look-back-and-2026-predictions-part-ii-state-privacy-patchwork (MEDIUM confidence)
- Respectlytics — EdTech Analytics FERPA & COPPA Guide — https://respectlytics.com/blog/edtech-analytics-ferpa-coppa/ (MEDIUM confidence)
