# app/graphql/types/

## Responsibility
120 GraphQL type definitions: entity types (TeacherType, StudentType, ClassroomType), enum types (SkillCategoryEnum, ExamTypeEnum), input types (CreateDailyScoreInputType), union types (UserUnion), connection/edge types for pagination, and the root QueryType and MutationType.

## Design
- **Entity types** inherit from `BaseObject`: define fields exposed to clients, field-level authorization, computed fields
- **Input types** inherit from `BaseInputObject`: validate and structure mutation arguments
- **Enum types** inherit from `BaseEnum`: constrain values (skill_category: reading|math|writing|logic|social)
- **Union types** inherit from `BaseUnion`: polymorphic results (UserUnion = Teacher | Parent)
- **Connection types** inherit from `BaseConnection`/`BaseEdge`: cursor-based pagination
- **QueryType**: Root query with 100+ fields (classrooms, students, exams, radar_data, etc.)
- **MutationType**: Root mutation mounting all 40+ mutations

### Key Entity Types:
- `TeacherType`, `ParentType`, `SchoolManagerType` — user types with role-specific fields
- `StudentType` — includes `radar_data` field (aggregated skill scores)
- `ClassroomType` — nested students, teachers, daily scores
- `ExamType` — includes questions, submissions, grading
- `DailyScoreType` — skill assessment data
- `NotificationType` — polymorphic notifiable reference

## Flow
1. QueryType field resolver receives `(obj, args, ctx)`
2. Pundit Scope filters records for current_user
3. Entity type serializes model → selects exposed fields
4. Nested types resolve associations (Dataloader batches queries)
5. Connection types handle pagination (cursor-based)

## Integration
- **Serializes**: All ActiveRecord models
- **Used by**: QueryType for reads, MutationType for write responses
- **Depends on**: Models for data, Pundit Scopes for filtering
- **Enums map to**: Model enum values (skill_category, exam_type, etc.)
