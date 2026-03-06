// === User types ===
export interface Teacher {
  id: string;
  name: string;
  email: string;
  role: 'teacher';
  phone?: string | null;
  bio?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  religion?: string | null;
  qualification?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  role: 'parent';
  phone?: string | null;
  bio?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  qualification?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
}

export interface SchoolManager {
  id: string;
  name: string;
  email: string;
  role: 'school_manager';
  phone?: string | null;
  bio?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  qualification?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
  school?: { id: string; name: string };
}

export type User = Teacher | Parent | SchoolManager;

export interface UserError {
  message: string;
  path: string[];
}

// === Auth ===
export interface AuthPayload {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  user: User | null;
  errors: UserError[];
}

export interface LogoutPayload {
  success: boolean;
  errors: UserError[];
}

// === Classroom ===
export interface Classroom {
  id: string;
  name: string;
  school: { id: string; name: string } | null;
  students: Student[];
  studentCount?: number;
}

// === Student ===
export interface Student {
  id: string;
  name: string;
  classrooms?: Classroom[];
}

// === Daily Score ===
export type SkillCategory = 'READING' | 'MATH' | 'WRITING' | 'LOGIC' | 'SOCIAL';

export interface DailyScore {
  id: string;
  date: string;
  skillCategory: SkillCategory;
  score: number;
  student: { id: string; name: string };
  teacher: { id: string; name: string };
}

// === Radar ===
export interface RadarSkills {
  reading: number | null;
  math: number | null;
  writing: number | null;
  logic: number | null;
  social: number | null;
}

export interface RadarData {
  studentId: string;
  studentName: string;
  skills: RadarSkills;
}

// === Progress ===
export interface ProgressWeek {
  period: string;
  skills: RadarSkills;
}

export interface ProgressData {
  weeks: ProgressWeek[];
}

// === Classroom Overview ===
export interface ClassroomOverviewStudent {
  studentId: string;
  studentName: string;
  skills: RadarSkills;
}

export interface ClassroomOverview {
  classroomId: string;
  classroomName: string;
  students: ClassroomOverviewStudent[];
}

// === Permissions ===
export interface Permission {
  id: string;
  resource: string;
  action: string;
  granted: boolean;
}

export interface EffectivePermission {
  resource: string;
  action: string;
  granted: boolean;
  source: string;
}

export interface UserPermissions {
  userId: string;
  role: string;
  overrides: Permission[];
  effective: EffectivePermission[];
}

// === Pagination (Relay-style) ===
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  nodes: T[];
  pageInfo: PageInfo;
  totalCount?: number;
}

// === Feed ===
export interface MediaAttachment {
  url: string;
  filename: string;
  contentType: string;
}

export interface FeedPost {
  id: string;
  body: string;
  teacher: { name: string };
  classroom: { id: string; name: string };
  mediaUrls: string[];
  mediaAttachments: MediaAttachment[];
  taggedStudents: { id: string; name: string }[];
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  comments: FeedPostComment[];
  createdAt: string;
}

export interface FeedPostComment {
  id: string;
  body: string;
  commenterName: string;
  commenterType: string;
  commenterId: string;
  isMine: boolean;
  createdAt: string;
}

// === Profile ===
export interface UpdateProfilePayload {
  user: User | null;
  errors: UserError[];
}

export interface ChangePasswordPayload {
  success: boolean;
  errors: UserError[];
}

// === Calendar ===
export interface ClassroomEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  classroom: { id: string; name: string };
  creatorName: string;
  creatorType: string;
  isMine: boolean;
  createdAt: string;
}

// === Curriculum ===
export interface Subject {
  id: string;
  name: string;
  description: string | null;
  topics: Topic[];
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string | null;
  position: number;
  subject: { id: string; name: string };
  learningObjectives: LearningObjective[];
  exams: Exam[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningObjective {
  id: string;
  description: string;
  position: number;
  masteryThreshold: number;
  topic: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// === Exams ===
export type ExamType = 'score_based' | 'multiple_choice' | 'rubric_based' | 'pass_fail';
export type ClassroomExamStatus = 'draft' | 'scheduled' | 'active' | 'closed' | 'archived';
export type ExamSubmissionStatus = 'in_progress' | 'submitted' | 'graded';

export interface ExamQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  position: number;
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
  position: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  examType: ExamType;
  maxScore: number | null;
  durationMinutes: number | null;
  topic: { id: string; name: string; subject: { id: string; name: string } };
  examQuestions: ExamQuestion[];
  rubricCriteria: RubricCriteria[];
  classroomExams: ClassroomExam[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomExam {
  id: string;
  exam: Exam;
  classroom: { id: string; name: string };
  status: ClassroomExamStatus;
  scheduledAt: string | null;
  dueAt: string | null;
  examSubmissions: ExamSubmission[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamAnswer {
  id: string;
  examQuestion: ExamQuestion;
  answerText: string | null;
  selectedOption: string | null;
  score: number | null;
  correct: boolean | null;
}

export interface RubricScore {
  id: string;
  rubricCriteria: RubricCriteria;
  score: number;
  comment: string | null;
}

export interface ExamSubmission {
  id: string;
  student: { id: string; name: string };
  classroomExam: ClassroomExam;
  status: ExamSubmissionStatus;
  score: number | null;
  passed: boolean | null;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  teacherNotes: string | null;
  examAnswers: ExamAnswer[];
  rubricScores: RubricScore[];
  createdAt: string;
  updatedAt: string;
}

export interface ObjectiveMastery {
  id: string;
  student: { id: string; name: string };
  learningObjective: LearningObjective;
  examMastered: boolean;
  dailyMastered: boolean;
  mastered: boolean;
  masteredAt: string | null;
}

// === Session user (decoded from JWT, stored in locals) ===
export interface SessionUser {
  id: string;
  type: 'Teacher' | 'Parent' | 'SchoolManager';
  email: string;
}
