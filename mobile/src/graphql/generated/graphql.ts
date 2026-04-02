import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  ISO8601Date: { input: any; output: any; }
  ISO8601DateTime: { input: any; output: any; }
};

export type AcademicYearType = {
  __typename?: 'AcademicYearType';
  createdAt: Scalars['ISO8601DateTime']['output'];
  current: Scalars['Boolean']['output'];
  endDate: Scalars['ISO8601Date']['output'];
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  startDate: Scalars['ISO8601Date']['output'];
};

export type AccountDeletionRequestType = {
  __typename?: 'AccountDeletionRequestType';
  completedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  createdAt: Scalars['ISO8601DateTime']['output'];
  gracePeriodEndsAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type AssignExamInput = {
  classroomId: Scalars['ID']['input'];
  dueAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  examId: Scalars['ID']['input'];
  scheduledAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  showResults?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AssignExamPayload = {
  __typename?: 'AssignExamPayload';
  classroomExam?: Maybe<ClassroomExamType>;
  errors: Array<UserErrorType>;
};

export type AttendanceRecordInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  status: AttendanceStatusEnum;
  studentId: Scalars['ID']['input'];
};

export enum AttendanceStatusEnum {
  Excused = 'EXCUSED',
  Present = 'PRESENT',
  Sick = 'SICK',
  Unexcused = 'UNEXCUSED'
}

export type AttendanceType = {
  __typename?: 'AttendanceType';
  classroom: ClassroomType;
  createdAt: Scalars['ISO8601DateTime']['output'];
  date: Scalars['ISO8601Date']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  status: AttendanceStatusEnum;
  student: StudentType;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type AwardBehaviorPointPayload = {
  __typename?: 'AwardBehaviorPointPayload';
  behaviorPoint?: Maybe<BehaviorPointType>;
  dailyTotal: Scalars['Int']['output'];
  errors: Array<UserErrorType>;
};

export type BehaviorCategoryType = {
  __typename?: 'BehaviorCategoryType';
  color: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  icon: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isPositive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  pointValue: Scalars['Int']['output'];
  position: Scalars['Int']['output'];
};

export type BehaviorPointType = {
  __typename?: 'BehaviorPointType';
  awardedAt: Scalars['ISO8601DateTime']['output'];
  behaviorCategory: BehaviorCategoryType;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  pointValue: Scalars['Int']['output'];
  revokable: Scalars['Boolean']['output'];
  revokedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  student: StudentType;
  teacher: TeacherType;
};

export type BulkRecordAttendancePayload = {
  __typename?: 'BulkRecordAttendancePayload';
  attendances: Array<AttendanceType>;
  errors: Array<UserErrorType>;
};

export type ClassroomBehaviorStudentType = {
  __typename?: 'ClassroomBehaviorStudentType';
  negativeCount: Scalars['Int']['output'];
  positiveCount: Scalars['Int']['output'];
  recentPoints: Array<BehaviorPointType>;
  student: StudentType;
  totalPoints: Scalars['Int']['output'];
};

export type ClassroomEventType = {
  __typename?: 'ClassroomEventType';
  classroom: ClassroomType;
  createdAt: Scalars['ISO8601DateTime']['output'];
  creatorName: Scalars['String']['output'];
  creatorType: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  eventDate: Scalars['ISO8601Date']['output'];
  id: Scalars['ID']['output'];
  isMine: Scalars['Boolean']['output'];
  startTime?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export enum ClassroomExamStatusEnum {
  Active = 'ACTIVE',
  Closed = 'CLOSED',
  Draft = 'DRAFT'
}

export type ClassroomExamType = {
  __typename?: 'ClassroomExamType';
  accessCode?: Maybe<Scalars['String']['output']>;
  classroom: ClassroomType;
  createdAt: Scalars['ISO8601DateTime']['output'];
  dueAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  exam: ExamObjectType;
  examSubmissions: Array<ExamSubmissionType>;
  id: Scalars['ID']['output'];
  scheduledAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  showResults: Scalars['Boolean']['output'];
  status: ClassroomExamStatusEnum;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type ClassroomOverviewType = {
  __typename?: 'ClassroomOverviewType';
  classroomId: Scalars['ID']['output'];
  classroomName: Scalars['String']['output'];
  students: Array<RadarDataType>;
};

export type ClassroomType = {
  __typename?: 'ClassroomType';
  grade?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  school: SchoolType;
};

export type ConversationType = {
  __typename?: 'ConversationType';
  createdAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
  lastMessage?: Maybe<MessageType>;
  messages: Array<MessageType>;
  parent: ParentType;
  student: StudentType;
  teacher: TeacherType;
  unreadCount: Scalars['Int']['output'];
};

export type CreateExamInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  examType: ExamTypeEnum;
  maxScore?: InputMaybe<Scalars['Int']['input']>;
  questions?: InputMaybe<Array<ExamQuestionInput>>;
  rubricCriteria?: InputMaybe<Array<RubricCriteriaInput>>;
  title: Scalars['String']['input'];
  topicId: Scalars['ID']['input'];
};

export type CreateExamPayload = {
  __typename?: 'CreateExamPayload';
  errors: Array<UserErrorType>;
  exam?: Maybe<ExamObjectType>;
};

export type CreateHealthCheckupPayload = {
  __typename?: 'CreateHealthCheckupPayload';
  errors: Array<UserErrorType>;
  healthCheckup?: Maybe<HealthCheckupType>;
};

export type CreateLeaveRequestPayload = {
  __typename?: 'CreateLeaveRequestPayload';
  errors: Array<UserErrorType>;
  leaveRequest?: Maybe<LeaveRequestType>;
};

export type CurriculumLearningObjectiveType = {
  __typename?: 'CurriculumLearningObjectiveType';
  createdAt: Scalars['ISO8601DateTime']['output'];
  dailyScoreThreshold: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  examPassThreshold: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type DailyScoreType = {
  __typename?: 'DailyScoreType';
  date: Scalars['ISO8601Date']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  score: Scalars['Int']['output'];
  skillCategory: SkillCategoryEnum;
  studentId: Scalars['ID']['output'];
};

export type DailyScoreTypeConnection = {
  __typename?: 'DailyScoreTypeConnection';
  edges: Array<DailyScoreTypeEdge>;
  pageInfo: PageInfo;
};

export type DailyScoreTypeEdge = {
  __typename?: 'DailyScoreTypeEdge';
  cursor: Scalars['String']['output'];
  node: DailyScoreType;
};

export type DeleteLeaveRequestPayload = {
  __typename?: 'DeleteLeaveRequestPayload';
  errors: Array<UserErrorType>;
  success: Scalars['Boolean']['output'];
};

export type ExamAnswerType = {
  __typename?: 'ExamAnswerType';
  correct?: Maybe<Scalars['Boolean']['output']>;
  examQuestion: ExamQuestionType;
  id: Scalars['ID']['output'];
  pointsAwarded: Scalars['Int']['output'];
  selectedAnswer?: Maybe<Scalars['String']['output']>;
};

export type ExamObjectType = {
  __typename?: 'ExamObjectType';
  classroomExams: Array<ClassroomExamType>;
  createdAt: Scalars['ISO8601DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  examQuestions: Array<ExamQuestionType>;
  examType: ExamTypeEnum;
  id: Scalars['ID']['output'];
  maxScore?: Maybe<Scalars['Int']['output']>;
  rubricCriteria: Array<RubricCriteriaType>;
  title: Scalars['String']['output'];
  topic: TopicCurriculumType;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type ExamQuestionInput = {
  correctAnswer?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Scalars['String']['input']>;
  points?: InputMaybe<Scalars['Int']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
  questionText?: InputMaybe<Scalars['String']['input']>;
};

export type ExamQuestionType = {
  __typename?: 'ExamQuestionType';
  correctAnswer?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  options?: Maybe<Scalars['String']['output']>;
  points: Scalars['Int']['output'];
  position: Scalars['Int']['output'];
  questionText?: Maybe<Scalars['String']['output']>;
};

export enum ExamSubmissionStatusEnum {
  Graded = 'GRADED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED',
  Submitted = 'SUBMITTED'
}

export type ExamSubmissionType = {
  __typename?: 'ExamSubmissionType';
  classroomExam: ClassroomExamType;
  createdAt: Scalars['ISO8601DateTime']['output'];
  examAnswers: Array<ExamAnswerType>;
  gradedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  id: Scalars['ID']['output'];
  passed?: Maybe<Scalars['Boolean']['output']>;
  rubricScores: Array<RubricScoreType>;
  score?: Maybe<Scalars['Float']['output']>;
  startedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  status: ExamSubmissionStatusEnum;
  student: StudentType;
  submittedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  teacherNotes?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export enum ExamTypeEnum {
  MultipleChoice = 'MULTIPLE_CHOICE',
  PassFail = 'PASS_FAIL',
  Rubric = 'RUBRIC',
  ScoreBased = 'SCORE_BASED'
}

export type ExportChildDataPayload = {
  __typename?: 'ExportChildDataPayload';
  data?: Maybe<Scalars['String']['output']>;
  errors: Array<UserErrorType>;
};

export type GradeCurriculumItemType = {
  __typename?: 'GradeCurriculumItemType';
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  position: Scalars['Int']['output'];
  subject?: Maybe<SubjectCurriculumType>;
  topic?: Maybe<TopicCurriculumType>;
};

export type GradeCurriculumType = {
  __typename?: 'GradeCurriculumType';
  academicYear: AcademicYearType;
  createdAt: Scalars['ISO8601DateTime']['output'];
  grade: Scalars['Int']['output'];
  gradeCurriculumItems: Array<GradeCurriculumItemType>;
  id: Scalars['ID']['output'];
};

export type GradeExamSubmissionPayload = {
  __typename?: 'GradeExamSubmissionPayload';
  errors: Array<UserErrorType>;
  examSubmission?: Maybe<ExamSubmissionType>;
};

export type GradeSubmissionInput = {
  examSubmissionId: Scalars['ID']['input'];
  passed?: InputMaybe<Scalars['Boolean']['input']>;
  rubricScores?: InputMaybe<Array<RubricScoreInput>>;
  score?: InputMaybe<Scalars['Float']['input']>;
  teacherNotes?: InputMaybe<Scalars['String']['input']>;
};

export type HealthCheckupType = {
  __typename?: 'HealthCheckupType';
  bmi?: Maybe<Scalars['Float']['output']>;
  bmiCategory?: Maybe<Scalars['String']['output']>;
  headCircumferenceCm?: Maybe<Scalars['Float']['output']>;
  heightCm?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  measuredAt: Scalars['ISO8601Date']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  weightKg?: Maybe<Scalars['Float']['output']>;
};

export type LearningObjectiveType = {
  __typename?: 'LearningObjectiveType';
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  topic: TopicMasteryType;
};

export enum LeaveRequestStatusEnum {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type LeaveRequestType = {
  __typename?: 'LeaveRequestType';
  createdAt: Scalars['ISO8601DateTime']['output'];
  daysCount: Scalars['Int']['output'];
  endDate: Scalars['ISO8601Date']['output'];
  id: Scalars['ID']['output'];
  parent: ParentType;
  reason: Scalars['String']['output'];
  rejectionReason?: Maybe<Scalars['String']['output']>;
  requestType: LeaveRequestTypeEnum;
  reviewedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  reviewedBy?: Maybe<TeacherType>;
  startDate: Scalars['ISO8601Date']['output'];
  status: LeaveRequestStatusEnum;
  student: StudentType;
};

export enum LeaveRequestTypeEnum {
  Excused = 'EXCUSED',
  Sick = 'SICK'
}

export type LoginPayload = {
  __typename?: 'LoginPayload';
  accessToken?: Maybe<Scalars['String']['output']>;
  errors: Array<UserErrorType>;
  expiresIn?: Maybe<Scalars['Int']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserUnion>;
};

export type MediaAttachmentType = {
  __typename?: 'MediaAttachmentType';
  contentType: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type MessageType = {
  __typename?: 'MessageType';
  attachments: Array<MediaAttachmentType>;
  body: Scalars['String']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  id: Scalars['ID']['output'];
  mine: Scalars['Boolean']['output'];
  senderId: Scalars['ID']['output'];
  senderName: Scalars['String']['output'];
  senderType: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  assignExamToClassroom: AssignExamPayload;
  awardBehaviorPoint: AwardBehaviorPointPayload;
  bulkRecordAttendance: BulkRecordAttendancePayload;
  createExam: CreateExamPayload;
  createHealthCheckup: CreateHealthCheckupPayload;
  createLeaveRequest: CreateLeaveRequestPayload;
  deleteLeaveRequest: DeleteLeaveRequestPayload;
  exportChildData: ExportChildDataPayload;
  gradeExamSubmission: GradeExamSubmissionPayload;
  login: LoginPayload;
  requestAccountDeletion: RequestAccountDeletionPayload;
  requestChildDataDeletion: RequestChildDataDeletionPayload;
  sendMessage: SendMessagePayload;
};


export type MutationAssignExamToClassroomArgs = {
  input: AssignExamInput;
};


export type MutationAwardBehaviorPointArgs = {
  behaviorCategoryId: Scalars['ID']['input'];
  classroomId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  studentId: Scalars['ID']['input'];
};


export type MutationBulkRecordAttendanceArgs = {
  classroomId: Scalars['ID']['input'];
  date: Scalars['ISO8601Date']['input'];
  records: Array<AttendanceRecordInput>;
};


export type MutationCreateExamArgs = {
  input: CreateExamInput;
};


export type MutationCreateHealthCheckupArgs = {
  headCircumferenceCm?: InputMaybe<Scalars['Float']['input']>;
  heightCm?: InputMaybe<Scalars['Float']['input']>;
  measuredAt: Scalars['ISO8601Date']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  studentId: Scalars['ID']['input'];
  weightKg?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationCreateLeaveRequestArgs = {
  endDate: Scalars['ISO8601Date']['input'];
  reason: Scalars['String']['input'];
  requestType: LeaveRequestTypeEnum;
  startDate: Scalars['ISO8601Date']['input'];
  studentId: Scalars['ID']['input'];
};


export type MutationDeleteLeaveRequestArgs = {
  leaveRequestId: Scalars['ID']['input'];
};


export type MutationExportChildDataArgs = {
  studentId: Scalars['ID']['input'];
};


export type MutationGradeExamSubmissionArgs = {
  input: GradeSubmissionInput;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: Scalars['String']['input'];
};


export type MutationRequestAccountDeletionArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRequestChildDataDeletionArgs = {
  studentId: Scalars['ID']['input'];
};


export type MutationSendMessageArgs = {
  body: Scalars['String']['input'];
  conversationId: Scalars['ID']['input'];
};

export type ObjectiveMasteryType = {
  __typename?: 'ObjectiveMasteryType';
  dailyMastered: Scalars['Boolean']['output'];
  examMastered: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  learningObjective: LearningObjectiveType;
  mastered: Scalars['Boolean']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type ParentType = {
  __typename?: 'ParentType';
  children: Array<StudentType>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role: Scalars['String']['output'];
};

export type ProgressDataType = {
  __typename?: 'ProgressDataType';
  weeks: Array<ProgressWeekType>;
};

export type ProgressWeekType = {
  __typename?: 'ProgressWeekType';
  period: Scalars['String']['output'];
  skills: RadarSkillType;
};

export type Query = {
  __typename?: 'Query';
  academicYears: Array<AcademicYearType>;
  behaviorCategories: Array<BehaviorCategoryType>;
  classroomAttendance: Array<AttendanceType>;
  classroomBehaviorToday: Array<ClassroomBehaviorStudentType>;
  classroomEvents: Array<ClassroomEventType>;
  classroomExams: Array<ClassroomExamType>;
  classroomOverview: ClassroomOverviewType;
  classrooms: Array<ClassroomType>;
  conversation: ConversationType;
  conversations: Array<ConversationType>;
  exam?: Maybe<ExamObjectType>;
  examSubmission?: Maybe<ExamSubmissionType>;
  gradeCurriculum?: Maybe<GradeCurriculumType>;
  myChildren: Array<StudentType>;
  parentLeaveRequests: Array<LeaveRequestType>;
  studentAttendance: Array<AttendanceType>;
  studentBehaviorHistory: Array<BehaviorPointType>;
  studentDailyScores: DailyScoreTypeConnection;
  studentHealthCheckups: Array<HealthCheckupType>;
  studentMasteries: Array<ObjectiveMasteryType>;
  studentProgress: ProgressDataType;
  studentRadar: RadarDataType;
  subject?: Maybe<SubjectCurriculumType>;
  subjects: Array<SubjectCurriculumType>;
  topic?: Maybe<TopicCurriculumType>;
};


export type QueryAcademicYearsArgs = {
  schoolId: Scalars['ID']['input'];
};


export type QueryBehaviorCategoriesArgs = {
  schoolId: Scalars['ID']['input'];
};


export type QueryClassroomAttendanceArgs = {
  classroomId: Scalars['ID']['input'];
  date: Scalars['ISO8601Date']['input'];
};


export type QueryClassroomBehaviorTodayArgs = {
  classroomId: Scalars['ID']['input'];
};


export type QueryClassroomEventsArgs = {
  classroomIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  month: Scalars['ISO8601Date']['input'];
};


export type QueryClassroomExamsArgs = {
  classroomId: Scalars['ID']['input'];
  status?: InputMaybe<ClassroomExamStatusEnum>;
};


export type QueryClassroomOverviewArgs = {
  classroomId: Scalars['ID']['input'];
};


export type QueryConversationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExamArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExamSubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGradeCurriculumArgs = {
  academicYearId: Scalars['ID']['input'];
  grade: Scalars['Int']['input'];
};


export type QueryParentLeaveRequestsArgs = {
  status?: InputMaybe<LeaveRequestStatusEnum>;
  studentId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryStudentAttendanceArgs = {
  endDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  startDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  studentId: Scalars['ID']['input'];
};


export type QueryStudentBehaviorHistoryArgs = {
  endDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  startDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  studentId: Scalars['ID']['input'];
};


export type QueryStudentDailyScoresArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  skillCategory?: InputMaybe<SkillCategoryEnum>;
  studentId: Scalars['ID']['input'];
};


export type QueryStudentHealthCheckupsArgs = {
  endDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  startDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  studentId: Scalars['ID']['input'];
};


export type QueryStudentMasteriesArgs = {
  studentId: Scalars['ID']['input'];
  subjectId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryStudentProgressArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryStudentRadarArgs = {
  studentId: Scalars['ID']['input'];
};


export type QuerySubjectArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySubjectsArgs = {
  schoolId: Scalars['ID']['input'];
};


export type QueryTopicArgs = {
  id: Scalars['ID']['input'];
};

export type RadarDataType = {
  __typename?: 'RadarDataType';
  skills: RadarSkillType;
  studentId: Scalars['ID']['output'];
  studentName: Scalars['String']['output'];
};

export type RadarSkillType = {
  __typename?: 'RadarSkillType';
  logic?: Maybe<Scalars['Float']['output']>;
  math?: Maybe<Scalars['Float']['output']>;
  reading?: Maybe<Scalars['Float']['output']>;
  social?: Maybe<Scalars['Float']['output']>;
  writing?: Maybe<Scalars['Float']['output']>;
};

export type RequestAccountDeletionPayload = {
  __typename?: 'RequestAccountDeletionPayload';
  deletionRequest?: Maybe<AccountDeletionRequestType>;
  errors: Array<UserErrorType>;
};

export type RequestChildDataDeletionPayload = {
  __typename?: 'RequestChildDataDeletionPayload';
  errors: Array<UserErrorType>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type RubricCriteriaInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  maxScore?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type RubricCriteriaType = {
  __typename?: 'RubricCriteriaType';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  maxScore: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  position: Scalars['Int']['output'];
};

export type RubricScoreInput = {
  feedback?: InputMaybe<Scalars['String']['input']>;
  rubricCriteriaId: Scalars['ID']['input'];
  score: Scalars['Int']['input'];
};

export type RubricScoreType = {
  __typename?: 'RubricScoreType';
  feedback?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  rubricCriteria: RubricCriteriaType;
  score: Scalars['Int']['output'];
};

export type SchoolType = {
  __typename?: 'SchoolType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type SendMessagePayload = {
  __typename?: 'SendMessagePayload';
  errors: Array<UserErrorType>;
  message?: Maybe<MessageType>;
};

export enum SkillCategoryEnum {
  Logic = 'LOGIC',
  Math = 'MATH',
  Reading = 'READING',
  Social = 'SOCIAL',
  Writing = 'WRITING'
}

export type StudentType = {
  __typename?: 'StudentType';
  avatar?: Maybe<Scalars['String']['output']>;
  classrooms: Array<ClassroomType>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type SubjectCurriculumType = {
  __typename?: 'SubjectCurriculumType';
  createdAt: Scalars['ISO8601DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  topics: Array<TopicCurriculumType>;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type SubjectMasteryType = {
  __typename?: 'SubjectMasteryType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type TeacherType = {
  __typename?: 'TeacherType';
  classrooms: Array<ClassroomType>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role: Scalars['String']['output'];
};

export type TopicCurriculumType = {
  __typename?: 'TopicCurriculumType';
  createdAt: Scalars['ISO8601DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  exams: Array<ExamObjectType>;
  id: Scalars['ID']['output'];
  learningObjectives: Array<CurriculumLearningObjectiveType>;
  name: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  subject: SubjectCurriculumType;
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

export type TopicMasteryType = {
  __typename?: 'TopicMasteryType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  subject: SubjectMasteryType;
};

export type UserErrorType = {
  __typename?: 'UserErrorType';
  message: Scalars['String']['output'];
  path?: Maybe<Array<Scalars['String']['output']>>;
};

export type UserUnion = ParentType | TeacherType;

export type BulkRecordAttendanceMutationVariables = Exact<{
  classroomId: Scalars['ID']['input'];
  date: Scalars['ISO8601Date']['input'];
  records: Array<AttendanceRecordInput> | AttendanceRecordInput;
}>;


export type BulkRecordAttendanceMutation = { __typename?: 'Mutation', bulkRecordAttendance: { __typename?: 'BulkRecordAttendancePayload', attendances: Array<{ __typename?: 'AttendanceType', id: string, date: any, status: AttendanceStatusEnum, notes?: string | null, student: { __typename?: 'StudentType', id: string, name: string } }>, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'LoginPayload', accessToken?: string | null, refreshToken?: string | null, expiresIn?: number | null, user?:
      | { __typename: 'ParentType', id: string, name: string, email: string, role: string }
      | { __typename: 'TeacherType', id: string, name: string, email: string, role: string }
     | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type AwardBehaviorPointMutationVariables = Exact<{
  studentId: Scalars['ID']['input'];
  classroomId: Scalars['ID']['input'];
  behaviorCategoryId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
}>;


export type AwardBehaviorPointMutation = { __typename?: 'Mutation', awardBehaviorPoint: { __typename?: 'AwardBehaviorPointPayload', dailyTotal: number, behaviorPoint?: { __typename?: 'BehaviorPointType', id: string, pointValue: number, awardedAt: any } | null, errors: Array<{ __typename?: 'UserErrorType', message: string }> } };

export type ExportChildDataMutationVariables = Exact<{
  studentId: Scalars['ID']['input'];
}>;


export type ExportChildDataMutation = { __typename?: 'Mutation', exportChildData: { __typename?: 'ExportChildDataPayload', data?: string | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type RequestChildDataDeletionMutationVariables = Exact<{
  studentId: Scalars['ID']['input'];
}>;


export type RequestChildDataDeletionMutation = { __typename?: 'Mutation', requestChildDataDeletion: { __typename?: 'RequestChildDataDeletionPayload', success?: boolean | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type RequestAccountDeletionMutationVariables = Exact<{
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type RequestAccountDeletionMutation = { __typename?: 'Mutation', requestAccountDeletion: { __typename?: 'RequestAccountDeletionPayload', deletionRequest?: { __typename?: 'AccountDeletionRequestType', id: string, status: string, gracePeriodEndsAt: any, reason?: string | null, createdAt: any } | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type CreateExamMutationVariables = Exact<{
  input: CreateExamInput;
}>;


export type CreateExamMutation = { __typename?: 'Mutation', createExam: { __typename?: 'CreateExamPayload', exam?: { __typename?: 'ExamObjectType', id: string, title: string, description?: string | null, examType: ExamTypeEnum, maxScore?: number | null, durationMinutes?: number | null, createdAt: any } | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type AssignExamToClassroomMutationVariables = Exact<{
  input: AssignExamInput;
}>;


export type AssignExamToClassroomMutation = { __typename?: 'Mutation', assignExamToClassroom: { __typename?: 'AssignExamPayload', classroomExam?: { __typename?: 'ClassroomExamType', id: string, status: ClassroomExamStatusEnum, scheduledAt?: any | null, dueAt?: any | null, accessCode?: string | null } | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type GradeExamSubmissionMutationVariables = Exact<{
  input: GradeSubmissionInput;
}>;


export type GradeExamSubmissionMutation = { __typename?: 'Mutation', gradeExamSubmission: { __typename?: 'GradeExamSubmissionPayload', examSubmission?: { __typename?: 'ExamSubmissionType', id: string, status: ExamSubmissionStatusEnum, score?: number | null, passed?: boolean | null, gradedAt?: any | null, teacherNotes?: string | null } | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type CreateHealthCheckupMutationVariables = Exact<{
  studentId: Scalars['ID']['input'];
  measuredAt: Scalars['ISO8601Date']['input'];
  weightKg?: InputMaybe<Scalars['Float']['input']>;
  heightCm?: InputMaybe<Scalars['Float']['input']>;
  headCircumferenceCm?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateHealthCheckupMutation = { __typename?: 'Mutation', createHealthCheckup: { __typename?: 'CreateHealthCheckupPayload', healthCheckup?: { __typename?: 'HealthCheckupType', id: string, measuredAt: any, weightKg?: number | null, heightCm?: number | null, headCircumferenceCm?: number | null, bmi?: number | null, bmiCategory?: string | null } | null, errors: Array<{ __typename?: 'UserErrorType', message: string }> } };

export type CreateLeaveRequestMutationVariables = Exact<{
  studentId: Scalars['ID']['input'];
  requestType: LeaveRequestTypeEnum;
  startDate: Scalars['ISO8601Date']['input'];
  endDate: Scalars['ISO8601Date']['input'];
  reason: Scalars['String']['input'];
}>;


export type CreateLeaveRequestMutation = { __typename?: 'Mutation', createLeaveRequest: { __typename?: 'CreateLeaveRequestPayload', leaveRequest?: { __typename?: 'LeaveRequestType', id: string, requestType: LeaveRequestTypeEnum, startDate: any, endDate: any, reason: string, status: LeaveRequestStatusEnum, daysCount: number, createdAt: any, student: { __typename?: 'StudentType', id: string, name: string } } | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type DeleteLeaveRequestMutationVariables = Exact<{
  leaveRequestId: Scalars['ID']['input'];
}>;


export type DeleteLeaveRequestMutation = { __typename?: 'Mutation', deleteLeaveRequest: { __typename?: 'DeleteLeaveRequestPayload', success: boolean, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type SendMessageMutationVariables = Exact<{
  conversationId: Scalars['ID']['input'];
  body: Scalars['String']['input'];
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage: { __typename?: 'SendMessagePayload', message?: { __typename?: 'MessageType', id: string, body: string, senderName: string, senderType: string, senderId: string, mine: boolean, createdAt: any, attachments: Array<{ __typename?: 'MediaAttachmentType', url: string, filename: string, contentType: string }> } | null, errors: Array<{ __typename?: 'UserErrorType', message: string, path?: Array<string> | null }> } };

export type StudentAttendanceQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
  startDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  endDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
}>;


export type StudentAttendanceQuery = { __typename?: 'Query', studentAttendance: Array<{ __typename?: 'AttendanceType', id: string, date: any, status: AttendanceStatusEnum, notes?: string | null, classroom: { __typename?: 'ClassroomType', id: string, name: string } }> };

export type ClassroomBehaviorTodayQueryVariables = Exact<{
  classroomId: Scalars['ID']['input'];
}>;


export type ClassroomBehaviorTodayQuery = { __typename?: 'Query', classroomBehaviorToday: Array<{ __typename?: 'ClassroomBehaviorStudentType', totalPoints: number, positiveCount: number, negativeCount: number, student: { __typename?: 'StudentType', id: string, name: string }, recentPoints: Array<{ __typename?: 'BehaviorPointType', id: string, pointValue: number, awardedAt: any, behaviorCategory: { __typename?: 'BehaviorCategoryType', name: string, isPositive: boolean } }> }> };

export type BehaviorCategoriesQueryVariables = Exact<{
  schoolId: Scalars['ID']['input'];
}>;


export type BehaviorCategoriesQuery = { __typename?: 'Query', behaviorCategories: Array<{ __typename?: 'BehaviorCategoryType', id: string, name: string, description?: string | null, pointValue: number, isPositive: boolean, icon: string, color: string, position: number }> };

export type StudentBehaviorHistoryQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
  startDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  endDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
}>;


export type StudentBehaviorHistoryQuery = { __typename?: 'Query', studentBehaviorHistory: Array<{ __typename?: 'BehaviorPointType', id: string, pointValue: number, note?: string | null, awardedAt: any, revokable: boolean, teacher: { __typename?: 'TeacherType', id: string, name: string }, behaviorCategory: { __typename?: 'BehaviorCategoryType', name: string, isPositive: boolean, icon: string, color: string } }> };

export type ClassroomEventsQueryVariables = Exact<{
  month: Scalars['ISO8601Date']['input'];
  classroomIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type ClassroomEventsQuery = { __typename?: 'Query', classroomEvents: Array<{ __typename?: 'ClassroomEventType', id: string, title: string, description?: string | null, eventDate: any, startTime?: string | null, endTime?: string | null, creatorName: string, creatorType: string, isMine: boolean, createdAt: any, classroom: { __typename?: 'ClassroomType', id: string, name: string } }> };

export type MyChildrenQueryVariables = Exact<{ [key: string]: never; }>;


export type MyChildrenQuery = { __typename?: 'Query', myChildren: Array<{ __typename?: 'StudentType', id: string, name: string, avatar?: string | null }> };

export type StudentRadarQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
}>;


export type StudentRadarQuery = { __typename?: 'Query', studentRadar: { __typename?: 'RadarDataType', studentId: string, studentName: string, skills: { __typename?: 'RadarSkillType', reading?: number | null, math?: number | null, writing?: number | null, logic?: number | null, social?: number | null } } };

export type StudentProgressQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
}>;


export type StudentProgressQuery = { __typename?: 'Query', studentProgress: { __typename?: 'ProgressDataType', weeks: Array<{ __typename?: 'ProgressWeekType', period: string, skills: { __typename?: 'RadarSkillType', reading?: number | null, math?: number | null, writing?: number | null, logic?: number | null, social?: number | null } }> } };

export type StudentDailyScoresQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
  skillCategory?: InputMaybe<SkillCategoryEnum>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type StudentDailyScoresQuery = { __typename?: 'Query', studentDailyScores: { __typename?: 'DailyScoreTypeConnection', edges: Array<{ __typename?: 'DailyScoreTypeEdge', cursor: string, node: { __typename?: 'DailyScoreType', id: string, date: any, skillCategory: SkillCategoryEnum, score: number, notes?: string | null } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean } } };

export type ClassroomsQueryVariables = Exact<{ [key: string]: never; }>;


export type ClassroomsQuery = { __typename?: 'Query', classrooms: Array<{ __typename?: 'ClassroomType', id: string, name: string, school: { __typename?: 'SchoolType', id: string } }> };

export type ClassroomOverviewQueryVariables = Exact<{
  classroomId: Scalars['ID']['input'];
}>;


export type ClassroomOverviewQuery = { __typename?: 'Query', classroomOverview: { __typename?: 'ClassroomOverviewType', classroomId: string, classroomName: string, students: Array<{ __typename?: 'RadarDataType', studentId: string, studentName: string, skills: { __typename?: 'RadarSkillType', reading?: number | null, math?: number | null, writing?: number | null, logic?: number | null, social?: number | null } }> } };

export type MyChildrenWithSchoolQueryVariables = Exact<{ [key: string]: never; }>;


export type MyChildrenWithSchoolQuery = { __typename?: 'Query', myChildren: Array<{ __typename?: 'StudentType', id: string, name: string, classrooms: Array<{ __typename?: 'ClassroomType', id: string, grade?: number | null, school: { __typename?: 'SchoolType', id: string, name: string } }> }> };

export type SubjectsQueryVariables = Exact<{
  schoolId: Scalars['ID']['input'];
}>;


export type SubjectsQuery = { __typename?: 'Query', subjects: Array<{ __typename?: 'SubjectCurriculumType', id: string, name: string, description?: string | null, topics: Array<{ __typename?: 'TopicCurriculumType', id: string, name: string }> }> };

export type SubjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SubjectQuery = { __typename?: 'Query', subject?: { __typename?: 'SubjectCurriculumType', id: string, name: string, description?: string | null, topics: Array<{ __typename?: 'TopicCurriculumType', id: string, name: string, description?: string | null, position: number, learningObjectives: Array<{ __typename?: 'CurriculumLearningObjectiveType', id: string }> }> } | null };

export type TopicQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TopicQuery = { __typename?: 'Query', topic?: { __typename?: 'TopicCurriculumType', id: string, name: string, description?: string | null, subject: { __typename?: 'SubjectCurriculumType', id: string, name: string }, learningObjectives: Array<{ __typename?: 'CurriculumLearningObjectiveType', id: string, name: string, description?: string | null, examPassThreshold: number, dailyScoreThreshold: number, position: number }>, exams: Array<{ __typename?: 'ExamObjectType', id: string, title: string, description?: string | null, examType: ExamTypeEnum, maxScore?: number | null }> } | null };

export type AcademicYearsQueryVariables = Exact<{
  schoolId: Scalars['ID']['input'];
}>;


export type AcademicYearsQuery = { __typename?: 'Query', academicYears: Array<{ __typename?: 'AcademicYearType', id: string, label: string, current: boolean }> };

export type GradeCurriculumQueryVariables = Exact<{
  academicYearId: Scalars['ID']['input'];
  grade: Scalars['Int']['input'];
}>;


export type GradeCurriculumQuery = { __typename?: 'Query', gradeCurriculum?: { __typename?: 'GradeCurriculumType', id: string, grade: number, gradeCurriculumItems: Array<{ __typename?: 'GradeCurriculumItemType', id: string, displayName: string, position: number, subject?: { __typename?: 'SubjectCurriculumType', id: string, name: string } | null, topic?: { __typename?: 'TopicCurriculumType', id: string, name: string, subject: { __typename?: 'SubjectCurriculumType', id: string, name: string } } | null }> } | null };

export type StudentMasteriesQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
  subjectId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type StudentMasteriesQuery = { __typename?: 'Query', studentMasteries: Array<{ __typename?: 'ObjectiveMasteryType', id: string, examMastered: boolean, dailyMastered: boolean, mastered: boolean, learningObjective: { __typename?: 'LearningObjectiveType', id: string, description: string, topic: { __typename?: 'TopicMasteryType', id: string, name: string, subject: { __typename?: 'SubjectMasteryType', id: string, name: string } } } }> };

export type StudentHealthCheckupsQueryVariables = Exact<{
  studentId: Scalars['ID']['input'];
  startDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  endDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
}>;


export type StudentHealthCheckupsQuery = { __typename?: 'Query', studentHealthCheckups: Array<{ __typename?: 'HealthCheckupType', id: string, measuredAt: any, weightKg?: number | null, heightCm?: number | null, headCircumferenceCm?: number | null, bmi?: number | null, bmiCategory?: string | null, notes?: string | null }> };

export type ParentLeaveRequestsQueryVariables = Exact<{
  studentId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<LeaveRequestStatusEnum>;
}>;


export type ParentLeaveRequestsQuery = { __typename?: 'Query', parentLeaveRequests: Array<{ __typename?: 'LeaveRequestType', id: string, requestType: LeaveRequestTypeEnum, startDate: any, endDate: any, reason: string, status: LeaveRequestStatusEnum, rejectionReason?: string | null, reviewedAt?: any | null, daysCount: number, createdAt: any, student: { __typename?: 'StudentType', id: string, name: string } }> };

export type ConversationsQueryVariables = Exact<{ [key: string]: never; }>;


export type ConversationsQuery = { __typename?: 'Query', conversations: Array<{ __typename?: 'ConversationType', id: string, unreadCount: number, createdAt: any, student: { __typename?: 'StudentType', id: string, name: string }, parent: { __typename?: 'ParentType', id: string, name: string }, teacher: { __typename?: 'TeacherType', id: string, name: string }, lastMessage?: { __typename?: 'MessageType', id: string, body: string, senderName: string, mine: boolean, createdAt: any } | null }> };

export type ConversationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ConversationQuery = { __typename?: 'Query', conversation: { __typename?: 'ConversationType', id: string, student: { __typename?: 'StudentType', id: string, name: string }, parent: { __typename?: 'ParentType', id: string, name: string }, teacher: { __typename?: 'TeacherType', id: string, name: string }, messages: Array<{ __typename?: 'MessageType', id: string, body: string, senderName: string, senderType: string, senderId: string, mine: boolean, createdAt: any, attachments: Array<{ __typename?: 'MediaAttachmentType', url: string, filename: string, contentType: string }> }> } };

export type ClassroomAttendanceQueryVariables = Exact<{
  classroomId: Scalars['ID']['input'];
  date: Scalars['ISO8601Date']['input'];
}>;


export type ClassroomAttendanceQuery = { __typename?: 'Query', classroomAttendance: Array<{ __typename?: 'AttendanceType', id: string, date: any, status: AttendanceStatusEnum, notes?: string | null, createdAt: any, updatedAt: any, student: { __typename?: 'StudentType', id: string, name: string } }> };

export type ClassroomExamsQueryVariables = Exact<{
  classroomId: Scalars['ID']['input'];
  status?: InputMaybe<ClassroomExamStatusEnum>;
}>;


export type ClassroomExamsQuery = { __typename?: 'Query', classroomExams: Array<{ __typename?: 'ClassroomExamType', id: string, status: ClassroomExamStatusEnum, scheduledAt?: any | null, dueAt?: any | null, accessCode?: string | null, durationMinutes?: number | null, showResults: boolean, createdAt: any, exam: { __typename?: 'ExamObjectType', id: string, title: string, description?: string | null, examType: ExamTypeEnum, maxScore?: number | null }, examSubmissions: Array<{ __typename?: 'ExamSubmissionType', id: string, status: ExamSubmissionStatusEnum }> }> };

export type ExamDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ExamDetailQuery = { __typename?: 'Query', exam?: { __typename?: 'ExamObjectType', id: string, title: string, description?: string | null, examType: ExamTypeEnum, maxScore?: number | null, durationMinutes?: number | null, createdAt: any, topic: { __typename?: 'TopicCurriculumType', id: string, name: string, subject: { __typename?: 'SubjectCurriculumType', id: string, name: string } }, examQuestions: Array<{ __typename?: 'ExamQuestionType', id: string, questionText?: string | null, points: number, position: number }>, rubricCriteria: Array<{ __typename?: 'RubricCriteriaType', id: string, name: string, description?: string | null, maxScore: number, position: number }>, classroomExams: Array<{ __typename?: 'ClassroomExamType', id: string, status: ClassroomExamStatusEnum, scheduledAt?: any | null, dueAt?: any | null, accessCode?: string | null, classroom: { __typename?: 'ClassroomType', id: string, name: string }, examSubmissions: Array<{ __typename?: 'ExamSubmissionType', id: string, status: ExamSubmissionStatusEnum, score?: number | null, passed?: boolean | null, submittedAt?: any | null, gradedAt?: any | null, student: { __typename?: 'StudentType', id: string, name: string } }> }> } | null };

export type ExamSubmissionDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ExamSubmissionDetailQuery = { __typename?: 'Query', examSubmission?: { __typename?: 'ExamSubmissionType', id: string, status: ExamSubmissionStatusEnum, score?: number | null, passed?: boolean | null, startedAt?: any | null, submittedAt?: any | null, gradedAt?: any | null, teacherNotes?: string | null, student: { __typename?: 'StudentType', id: string, name: string }, classroomExam: { __typename?: 'ClassroomExamType', id: string, exam: { __typename?: 'ExamObjectType', id: string, title: string, examType: ExamTypeEnum, maxScore?: number | null, examQuestions: Array<{ __typename?: 'ExamQuestionType', id: string, questionText?: string | null, points: number, position: number, correctAnswer?: string | null }>, rubricCriteria: Array<{ __typename?: 'RubricCriteriaType', id: string, name: string, description?: string | null, maxScore: number, position: number }> } }, examAnswers: Array<{ __typename?: 'ExamAnswerType', id: string, selectedAnswer?: string | null, correct?: boolean | null, pointsAwarded: number, examQuestion: { __typename?: 'ExamQuestionType', id: string, questionText?: string | null, points: number, correctAnswer?: string | null } }>, rubricScores: Array<{ __typename?: 'RubricScoreType', id: string, score: number, feedback?: string | null, rubricCriteria: { __typename?: 'RubricCriteriaType', id: string, name: string, maxScore: number } }> } | null };


export const BulkRecordAttendanceDocument = gql`
    mutation BulkRecordAttendance($classroomId: ID!, $date: ISO8601Date!, $records: [AttendanceRecordInput!]!) {
  bulkRecordAttendance(classroomId: $classroomId, date: $date, records: $records) {
    attendances {
      id
      date
      status
      notes
      student {
        id
        name
      }
    }
    errors {
      message
      path
    }
  }
}
    `;
export type BulkRecordAttendanceMutationFn = Apollo.MutationFunction<BulkRecordAttendanceMutation, BulkRecordAttendanceMutationVariables>;

/**
 * __useBulkRecordAttendanceMutation__
 *
 * To run a mutation, you first call `useBulkRecordAttendanceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBulkRecordAttendanceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bulkRecordAttendanceMutation, { data, loading, error }] = useBulkRecordAttendanceMutation({
 *   variables: {
 *      classroomId: // value for 'classroomId'
 *      date: // value for 'date'
 *      records: // value for 'records'
 *   },
 * });
 */
export function useBulkRecordAttendanceMutation(baseOptions?: Apollo.MutationHookOptions<BulkRecordAttendanceMutation, BulkRecordAttendanceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BulkRecordAttendanceMutation, BulkRecordAttendanceMutationVariables>(BulkRecordAttendanceDocument, options);
      }
export type BulkRecordAttendanceMutationHookResult = ReturnType<typeof useBulkRecordAttendanceMutation>;
export type BulkRecordAttendanceMutationResult = Apollo.MutationResult<BulkRecordAttendanceMutation>;
export type BulkRecordAttendanceMutationOptions = Apollo.BaseMutationOptions<BulkRecordAttendanceMutation, BulkRecordAttendanceMutationVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!, $role: String!) {
  login(email: $email, password: $password, role: $role) {
    accessToken
    refreshToken
    expiresIn
    user {
      __typename
      ... on TeacherType {
        id
        name
        email
        role
      }
      ... on ParentType {
        id
        name
        email
        role
      }
    }
    errors {
      message
      path
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const AwardBehaviorPointDocument = gql`
    mutation AwardBehaviorPoint($studentId: ID!, $classroomId: ID!, $behaviorCategoryId: ID!, $note: String) {
  awardBehaviorPoint(
    studentId: $studentId
    classroomId: $classroomId
    behaviorCategoryId: $behaviorCategoryId
    note: $note
  ) {
    behaviorPoint {
      id
      pointValue
      awardedAt
    }
    dailyTotal
    errors {
      message
    }
  }
}
    `;
export type AwardBehaviorPointMutationFn = Apollo.MutationFunction<AwardBehaviorPointMutation, AwardBehaviorPointMutationVariables>;

/**
 * __useAwardBehaviorPointMutation__
 *
 * To run a mutation, you first call `useAwardBehaviorPointMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAwardBehaviorPointMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [awardBehaviorPointMutation, { data, loading, error }] = useAwardBehaviorPointMutation({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      classroomId: // value for 'classroomId'
 *      behaviorCategoryId: // value for 'behaviorCategoryId'
 *      note: // value for 'note'
 *   },
 * });
 */
export function useAwardBehaviorPointMutation(baseOptions?: Apollo.MutationHookOptions<AwardBehaviorPointMutation, AwardBehaviorPointMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AwardBehaviorPointMutation, AwardBehaviorPointMutationVariables>(AwardBehaviorPointDocument, options);
      }
export type AwardBehaviorPointMutationHookResult = ReturnType<typeof useAwardBehaviorPointMutation>;
export type AwardBehaviorPointMutationResult = Apollo.MutationResult<AwardBehaviorPointMutation>;
export type AwardBehaviorPointMutationOptions = Apollo.BaseMutationOptions<AwardBehaviorPointMutation, AwardBehaviorPointMutationVariables>;
export const ExportChildDataDocument = gql`
    mutation ExportChildData($studentId: ID!) {
  exportChildData(studentId: $studentId) {
    data
    errors {
      message
      path
    }
  }
}
    `;
export type ExportChildDataMutationFn = Apollo.MutationFunction<ExportChildDataMutation, ExportChildDataMutationVariables>;

/**
 * __useExportChildDataMutation__
 *
 * To run a mutation, you first call `useExportChildDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useExportChildDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [exportChildDataMutation, { data, loading, error }] = useExportChildDataMutation({
 *   variables: {
 *      studentId: // value for 'studentId'
 *   },
 * });
 */
export function useExportChildDataMutation(baseOptions?: Apollo.MutationHookOptions<ExportChildDataMutation, ExportChildDataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ExportChildDataMutation, ExportChildDataMutationVariables>(ExportChildDataDocument, options);
      }
export type ExportChildDataMutationHookResult = ReturnType<typeof useExportChildDataMutation>;
export type ExportChildDataMutationResult = Apollo.MutationResult<ExportChildDataMutation>;
export type ExportChildDataMutationOptions = Apollo.BaseMutationOptions<ExportChildDataMutation, ExportChildDataMutationVariables>;
export const RequestChildDataDeletionDocument = gql`
    mutation RequestChildDataDeletion($studentId: ID!) {
  requestChildDataDeletion(studentId: $studentId) {
    success
    errors {
      message
      path
    }
  }
}
    `;
export type RequestChildDataDeletionMutationFn = Apollo.MutationFunction<RequestChildDataDeletionMutation, RequestChildDataDeletionMutationVariables>;

/**
 * __useRequestChildDataDeletionMutation__
 *
 * To run a mutation, you first call `useRequestChildDataDeletionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestChildDataDeletionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestChildDataDeletionMutation, { data, loading, error }] = useRequestChildDataDeletionMutation({
 *   variables: {
 *      studentId: // value for 'studentId'
 *   },
 * });
 */
export function useRequestChildDataDeletionMutation(baseOptions?: Apollo.MutationHookOptions<RequestChildDataDeletionMutation, RequestChildDataDeletionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestChildDataDeletionMutation, RequestChildDataDeletionMutationVariables>(RequestChildDataDeletionDocument, options);
      }
export type RequestChildDataDeletionMutationHookResult = ReturnType<typeof useRequestChildDataDeletionMutation>;
export type RequestChildDataDeletionMutationResult = Apollo.MutationResult<RequestChildDataDeletionMutation>;
export type RequestChildDataDeletionMutationOptions = Apollo.BaseMutationOptions<RequestChildDataDeletionMutation, RequestChildDataDeletionMutationVariables>;
export const RequestAccountDeletionDocument = gql`
    mutation RequestAccountDeletion($reason: String) {
  requestAccountDeletion(reason: $reason) {
    deletionRequest {
      id
      status
      gracePeriodEndsAt
      reason
      createdAt
    }
    errors {
      message
      path
    }
  }
}
    `;
export type RequestAccountDeletionMutationFn = Apollo.MutationFunction<RequestAccountDeletionMutation, RequestAccountDeletionMutationVariables>;

/**
 * __useRequestAccountDeletionMutation__
 *
 * To run a mutation, you first call `useRequestAccountDeletionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestAccountDeletionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestAccountDeletionMutation, { data, loading, error }] = useRequestAccountDeletionMutation({
 *   variables: {
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useRequestAccountDeletionMutation(baseOptions?: Apollo.MutationHookOptions<RequestAccountDeletionMutation, RequestAccountDeletionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestAccountDeletionMutation, RequestAccountDeletionMutationVariables>(RequestAccountDeletionDocument, options);
      }
export type RequestAccountDeletionMutationHookResult = ReturnType<typeof useRequestAccountDeletionMutation>;
export type RequestAccountDeletionMutationResult = Apollo.MutationResult<RequestAccountDeletionMutation>;
export type RequestAccountDeletionMutationOptions = Apollo.BaseMutationOptions<RequestAccountDeletionMutation, RequestAccountDeletionMutationVariables>;
export const CreateExamDocument = gql`
    mutation CreateExam($input: CreateExamInput!) {
  createExam(input: $input) {
    exam {
      id
      title
      description
      examType
      maxScore
      durationMinutes
      createdAt
    }
    errors {
      message
      path
    }
  }
}
    `;
export type CreateExamMutationFn = Apollo.MutationFunction<CreateExamMutation, CreateExamMutationVariables>;

/**
 * __useCreateExamMutation__
 *
 * To run a mutation, you first call `useCreateExamMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateExamMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createExamMutation, { data, loading, error }] = useCreateExamMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateExamMutation(baseOptions?: Apollo.MutationHookOptions<CreateExamMutation, CreateExamMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateExamMutation, CreateExamMutationVariables>(CreateExamDocument, options);
      }
export type CreateExamMutationHookResult = ReturnType<typeof useCreateExamMutation>;
export type CreateExamMutationResult = Apollo.MutationResult<CreateExamMutation>;
export type CreateExamMutationOptions = Apollo.BaseMutationOptions<CreateExamMutation, CreateExamMutationVariables>;
export const AssignExamToClassroomDocument = gql`
    mutation AssignExamToClassroom($input: AssignExamInput!) {
  assignExamToClassroom(input: $input) {
    classroomExam {
      id
      status
      scheduledAt
      dueAt
      accessCode
    }
    errors {
      message
      path
    }
  }
}
    `;
export type AssignExamToClassroomMutationFn = Apollo.MutationFunction<AssignExamToClassroomMutation, AssignExamToClassroomMutationVariables>;

/**
 * __useAssignExamToClassroomMutation__
 *
 * To run a mutation, you first call `useAssignExamToClassroomMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignExamToClassroomMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignExamToClassroomMutation, { data, loading, error }] = useAssignExamToClassroomMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAssignExamToClassroomMutation(baseOptions?: Apollo.MutationHookOptions<AssignExamToClassroomMutation, AssignExamToClassroomMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AssignExamToClassroomMutation, AssignExamToClassroomMutationVariables>(AssignExamToClassroomDocument, options);
      }
export type AssignExamToClassroomMutationHookResult = ReturnType<typeof useAssignExamToClassroomMutation>;
export type AssignExamToClassroomMutationResult = Apollo.MutationResult<AssignExamToClassroomMutation>;
export type AssignExamToClassroomMutationOptions = Apollo.BaseMutationOptions<AssignExamToClassroomMutation, AssignExamToClassroomMutationVariables>;
export const GradeExamSubmissionDocument = gql`
    mutation GradeExamSubmission($input: GradeSubmissionInput!) {
  gradeExamSubmission(input: $input) {
    examSubmission {
      id
      status
      score
      passed
      gradedAt
      teacherNotes
    }
    errors {
      message
      path
    }
  }
}
    `;
export type GradeExamSubmissionMutationFn = Apollo.MutationFunction<GradeExamSubmissionMutation, GradeExamSubmissionMutationVariables>;

/**
 * __useGradeExamSubmissionMutation__
 *
 * To run a mutation, you first call `useGradeExamSubmissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGradeExamSubmissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [gradeExamSubmissionMutation, { data, loading, error }] = useGradeExamSubmissionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGradeExamSubmissionMutation(baseOptions?: Apollo.MutationHookOptions<GradeExamSubmissionMutation, GradeExamSubmissionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GradeExamSubmissionMutation, GradeExamSubmissionMutationVariables>(GradeExamSubmissionDocument, options);
      }
export type GradeExamSubmissionMutationHookResult = ReturnType<typeof useGradeExamSubmissionMutation>;
export type GradeExamSubmissionMutationResult = Apollo.MutationResult<GradeExamSubmissionMutation>;
export type GradeExamSubmissionMutationOptions = Apollo.BaseMutationOptions<GradeExamSubmissionMutation, GradeExamSubmissionMutationVariables>;
export const CreateHealthCheckupDocument = gql`
    mutation CreateHealthCheckup($studentId: ID!, $measuredAt: ISO8601Date!, $weightKg: Float, $heightCm: Float, $headCircumferenceCm: Float, $notes: String) {
  createHealthCheckup(
    studentId: $studentId
    measuredAt: $measuredAt
    weightKg: $weightKg
    heightCm: $heightCm
    headCircumferenceCm: $headCircumferenceCm
    notes: $notes
  ) {
    healthCheckup {
      id
      measuredAt
      weightKg
      heightCm
      headCircumferenceCm
      bmi
      bmiCategory
    }
    errors {
      message
    }
  }
}
    `;
export type CreateHealthCheckupMutationFn = Apollo.MutationFunction<CreateHealthCheckupMutation, CreateHealthCheckupMutationVariables>;

/**
 * __useCreateHealthCheckupMutation__
 *
 * To run a mutation, you first call `useCreateHealthCheckupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHealthCheckupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHealthCheckupMutation, { data, loading, error }] = useCreateHealthCheckupMutation({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      measuredAt: // value for 'measuredAt'
 *      weightKg: // value for 'weightKg'
 *      heightCm: // value for 'heightCm'
 *      headCircumferenceCm: // value for 'headCircumferenceCm'
 *      notes: // value for 'notes'
 *   },
 * });
 */
export function useCreateHealthCheckupMutation(baseOptions?: Apollo.MutationHookOptions<CreateHealthCheckupMutation, CreateHealthCheckupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateHealthCheckupMutation, CreateHealthCheckupMutationVariables>(CreateHealthCheckupDocument, options);
      }
export type CreateHealthCheckupMutationHookResult = ReturnType<typeof useCreateHealthCheckupMutation>;
export type CreateHealthCheckupMutationResult = Apollo.MutationResult<CreateHealthCheckupMutation>;
export type CreateHealthCheckupMutationOptions = Apollo.BaseMutationOptions<CreateHealthCheckupMutation, CreateHealthCheckupMutationVariables>;
export const CreateLeaveRequestDocument = gql`
    mutation CreateLeaveRequest($studentId: ID!, $requestType: LeaveRequestTypeEnum!, $startDate: ISO8601Date!, $endDate: ISO8601Date!, $reason: String!) {
  createLeaveRequest(
    studentId: $studentId
    requestType: $requestType
    startDate: $startDate
    endDate: $endDate
    reason: $reason
  ) {
    leaveRequest {
      id
      requestType
      startDate
      endDate
      reason
      status
      student {
        id
        name
      }
      daysCount
      createdAt
    }
    errors {
      message
      path
    }
  }
}
    `;
export type CreateLeaveRequestMutationFn = Apollo.MutationFunction<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>;

/**
 * __useCreateLeaveRequestMutation__
 *
 * To run a mutation, you first call `useCreateLeaveRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateLeaveRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createLeaveRequestMutation, { data, loading, error }] = useCreateLeaveRequestMutation({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      requestType: // value for 'requestType'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useCreateLeaveRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>(CreateLeaveRequestDocument, options);
      }
export type CreateLeaveRequestMutationHookResult = ReturnType<typeof useCreateLeaveRequestMutation>;
export type CreateLeaveRequestMutationResult = Apollo.MutationResult<CreateLeaveRequestMutation>;
export type CreateLeaveRequestMutationOptions = Apollo.BaseMutationOptions<CreateLeaveRequestMutation, CreateLeaveRequestMutationVariables>;
export const DeleteLeaveRequestDocument = gql`
    mutation DeleteLeaveRequest($leaveRequestId: ID!) {
  deleteLeaveRequest(leaveRequestId: $leaveRequestId) {
    success
    errors {
      message
      path
    }
  }
}
    `;
export type DeleteLeaveRequestMutationFn = Apollo.MutationFunction<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>;

/**
 * __useDeleteLeaveRequestMutation__
 *
 * To run a mutation, you first call `useDeleteLeaveRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteLeaveRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteLeaveRequestMutation, { data, loading, error }] = useDeleteLeaveRequestMutation({
 *   variables: {
 *      leaveRequestId: // value for 'leaveRequestId'
 *   },
 * });
 */
export function useDeleteLeaveRequestMutation(baseOptions?: Apollo.MutationHookOptions<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>(DeleteLeaveRequestDocument, options);
      }
export type DeleteLeaveRequestMutationHookResult = ReturnType<typeof useDeleteLeaveRequestMutation>;
export type DeleteLeaveRequestMutationResult = Apollo.MutationResult<DeleteLeaveRequestMutation>;
export type DeleteLeaveRequestMutationOptions = Apollo.BaseMutationOptions<DeleteLeaveRequestMutation, DeleteLeaveRequestMutationVariables>;
export const SendMessageDocument = gql`
    mutation SendMessage($conversationId: ID!, $body: String!) {
  sendMessage(conversationId: $conversationId, body: $body) {
    message {
      id
      body
      senderName
      senderType
      senderId
      mine
      createdAt
      attachments {
        url
        filename
        contentType
      }
    }
    errors {
      message
      path
    }
  }
}
    `;
export type SendMessageMutationFn = Apollo.MutationFunction<SendMessageMutation, SendMessageMutationVariables>;

/**
 * __useSendMessageMutation__
 *
 * To run a mutation, you first call `useSendMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendMessageMutation, { data, loading, error }] = useSendMessageMutation({
 *   variables: {
 *      conversationId: // value for 'conversationId'
 *      body: // value for 'body'
 *   },
 * });
 */
export function useSendMessageMutation(baseOptions?: Apollo.MutationHookOptions<SendMessageMutation, SendMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendMessageMutation, SendMessageMutationVariables>(SendMessageDocument, options);
      }
export type SendMessageMutationHookResult = ReturnType<typeof useSendMessageMutation>;
export type SendMessageMutationResult = Apollo.MutationResult<SendMessageMutation>;
export type SendMessageMutationOptions = Apollo.BaseMutationOptions<SendMessageMutation, SendMessageMutationVariables>;
export const StudentAttendanceDocument = gql`
    query StudentAttendance($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
  studentAttendance(
    studentId: $studentId
    startDate: $startDate
    endDate: $endDate
  ) {
    id
    date
    status
    notes
    classroom {
      id
      name
    }
  }
}
    `;

/**
 * __useStudentAttendanceQuery__
 *
 * To run a query within a React component, call `useStudentAttendanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudentAttendanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudentAttendanceQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useStudentAttendanceQuery(baseOptions: Apollo.QueryHookOptions<StudentAttendanceQuery, StudentAttendanceQueryVariables> & ({ variables: StudentAttendanceQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StudentAttendanceQuery, StudentAttendanceQueryVariables>(StudentAttendanceDocument, options);
      }
export function useStudentAttendanceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StudentAttendanceQuery, StudentAttendanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StudentAttendanceQuery, StudentAttendanceQueryVariables>(StudentAttendanceDocument, options);
        }
// @ts-ignore
export function useStudentAttendanceSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<StudentAttendanceQuery, StudentAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<StudentAttendanceQuery, StudentAttendanceQueryVariables>;
export function useStudentAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentAttendanceQuery, StudentAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<StudentAttendanceQuery | undefined, StudentAttendanceQueryVariables>;
export function useStudentAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentAttendanceQuery, StudentAttendanceQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StudentAttendanceQuery, StudentAttendanceQueryVariables>(StudentAttendanceDocument, options);
        }
export type StudentAttendanceQueryHookResult = ReturnType<typeof useStudentAttendanceQuery>;
export type StudentAttendanceLazyQueryHookResult = ReturnType<typeof useStudentAttendanceLazyQuery>;
export type StudentAttendanceSuspenseQueryHookResult = ReturnType<typeof useStudentAttendanceSuspenseQuery>;
export type StudentAttendanceQueryResult = Apollo.QueryResult<StudentAttendanceQuery, StudentAttendanceQueryVariables>;
export const ClassroomBehaviorTodayDocument = gql`
    query ClassroomBehaviorToday($classroomId: ID!) {
  classroomBehaviorToday(classroomId: $classroomId) {
    student {
      id
      name
    }
    totalPoints
    positiveCount
    negativeCount
    recentPoints {
      id
      pointValue
      awardedAt
      behaviorCategory {
        name
        isPositive
      }
    }
  }
}
    `;

/**
 * __useClassroomBehaviorTodayQuery__
 *
 * To run a query within a React component, call `useClassroomBehaviorTodayQuery` and pass it any options that fit your needs.
 * When your component renders, `useClassroomBehaviorTodayQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClassroomBehaviorTodayQuery({
 *   variables: {
 *      classroomId: // value for 'classroomId'
 *   },
 * });
 */
export function useClassroomBehaviorTodayQuery(baseOptions: Apollo.QueryHookOptions<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables> & ({ variables: ClassroomBehaviorTodayQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>(ClassroomBehaviorTodayDocument, options);
      }
export function useClassroomBehaviorTodayLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>(ClassroomBehaviorTodayDocument, options);
        }
// @ts-ignore
export function useClassroomBehaviorTodaySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>;
export function useClassroomBehaviorTodaySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomBehaviorTodayQuery | undefined, ClassroomBehaviorTodayQueryVariables>;
export function useClassroomBehaviorTodaySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>(ClassroomBehaviorTodayDocument, options);
        }
export type ClassroomBehaviorTodayQueryHookResult = ReturnType<typeof useClassroomBehaviorTodayQuery>;
export type ClassroomBehaviorTodayLazyQueryHookResult = ReturnType<typeof useClassroomBehaviorTodayLazyQuery>;
export type ClassroomBehaviorTodaySuspenseQueryHookResult = ReturnType<typeof useClassroomBehaviorTodaySuspenseQuery>;
export type ClassroomBehaviorTodayQueryResult = Apollo.QueryResult<ClassroomBehaviorTodayQuery, ClassroomBehaviorTodayQueryVariables>;
export const BehaviorCategoriesDocument = gql`
    query BehaviorCategories($schoolId: ID!) {
  behaviorCategories(schoolId: $schoolId) {
    id
    name
    description
    pointValue
    isPositive
    icon
    color
    position
  }
}
    `;

/**
 * __useBehaviorCategoriesQuery__
 *
 * To run a query within a React component, call `useBehaviorCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useBehaviorCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBehaviorCategoriesQuery({
 *   variables: {
 *      schoolId: // value for 'schoolId'
 *   },
 * });
 */
export function useBehaviorCategoriesQuery(baseOptions: Apollo.QueryHookOptions<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables> & ({ variables: BehaviorCategoriesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>(BehaviorCategoriesDocument, options);
      }
export function useBehaviorCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>(BehaviorCategoriesDocument, options);
        }
// @ts-ignore
export function useBehaviorCategoriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>;
export function useBehaviorCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<BehaviorCategoriesQuery | undefined, BehaviorCategoriesQueryVariables>;
export function useBehaviorCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>(BehaviorCategoriesDocument, options);
        }
export type BehaviorCategoriesQueryHookResult = ReturnType<typeof useBehaviorCategoriesQuery>;
export type BehaviorCategoriesLazyQueryHookResult = ReturnType<typeof useBehaviorCategoriesLazyQuery>;
export type BehaviorCategoriesSuspenseQueryHookResult = ReturnType<typeof useBehaviorCategoriesSuspenseQuery>;
export type BehaviorCategoriesQueryResult = Apollo.QueryResult<BehaviorCategoriesQuery, BehaviorCategoriesQueryVariables>;
export const StudentBehaviorHistoryDocument = gql`
    query StudentBehaviorHistory($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
  studentBehaviorHistory(
    studentId: $studentId
    startDate: $startDate
    endDate: $endDate
  ) {
    id
    pointValue
    note
    awardedAt
    revokable
    teacher {
      id
      name
    }
    behaviorCategory {
      name
      isPositive
      icon
      color
    }
  }
}
    `;

/**
 * __useStudentBehaviorHistoryQuery__
 *
 * To run a query within a React component, call `useStudentBehaviorHistoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudentBehaviorHistoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudentBehaviorHistoryQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useStudentBehaviorHistoryQuery(baseOptions: Apollo.QueryHookOptions<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables> & ({ variables: StudentBehaviorHistoryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>(StudentBehaviorHistoryDocument, options);
      }
export function useStudentBehaviorHistoryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>(StudentBehaviorHistoryDocument, options);
        }
// @ts-ignore
export function useStudentBehaviorHistorySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>): Apollo.UseSuspenseQueryResult<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>;
export function useStudentBehaviorHistorySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>): Apollo.UseSuspenseQueryResult<StudentBehaviorHistoryQuery | undefined, StudentBehaviorHistoryQueryVariables>;
export function useStudentBehaviorHistorySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>(StudentBehaviorHistoryDocument, options);
        }
export type StudentBehaviorHistoryQueryHookResult = ReturnType<typeof useStudentBehaviorHistoryQuery>;
export type StudentBehaviorHistoryLazyQueryHookResult = ReturnType<typeof useStudentBehaviorHistoryLazyQuery>;
export type StudentBehaviorHistorySuspenseQueryHookResult = ReturnType<typeof useStudentBehaviorHistorySuspenseQuery>;
export type StudentBehaviorHistoryQueryResult = Apollo.QueryResult<StudentBehaviorHistoryQuery, StudentBehaviorHistoryQueryVariables>;
export const ClassroomEventsDocument = gql`
    query ClassroomEvents($month: ISO8601Date!, $classroomIds: [ID!]) {
  classroomEvents(month: $month, classroomIds: $classroomIds) {
    id
    title
    description
    eventDate
    startTime
    endTime
    classroom {
      id
      name
    }
    creatorName
    creatorType
    isMine
    createdAt
  }
}
    `;

/**
 * __useClassroomEventsQuery__
 *
 * To run a query within a React component, call `useClassroomEventsQuery` and pass it any options that fit your needs.
 * When your component renders, `useClassroomEventsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClassroomEventsQuery({
 *   variables: {
 *      month: // value for 'month'
 *      classroomIds: // value for 'classroomIds'
 *   },
 * });
 */
export function useClassroomEventsQuery(baseOptions: Apollo.QueryHookOptions<ClassroomEventsQuery, ClassroomEventsQueryVariables> & ({ variables: ClassroomEventsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClassroomEventsQuery, ClassroomEventsQueryVariables>(ClassroomEventsDocument, options);
      }
export function useClassroomEventsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClassroomEventsQuery, ClassroomEventsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClassroomEventsQuery, ClassroomEventsQueryVariables>(ClassroomEventsDocument, options);
        }
// @ts-ignore
export function useClassroomEventsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClassroomEventsQuery, ClassroomEventsQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomEventsQuery, ClassroomEventsQueryVariables>;
export function useClassroomEventsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomEventsQuery, ClassroomEventsQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomEventsQuery | undefined, ClassroomEventsQueryVariables>;
export function useClassroomEventsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomEventsQuery, ClassroomEventsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClassroomEventsQuery, ClassroomEventsQueryVariables>(ClassroomEventsDocument, options);
        }
export type ClassroomEventsQueryHookResult = ReturnType<typeof useClassroomEventsQuery>;
export type ClassroomEventsLazyQueryHookResult = ReturnType<typeof useClassroomEventsLazyQuery>;
export type ClassroomEventsSuspenseQueryHookResult = ReturnType<typeof useClassroomEventsSuspenseQuery>;
export type ClassroomEventsQueryResult = Apollo.QueryResult<ClassroomEventsQuery, ClassroomEventsQueryVariables>;
export const MyChildrenDocument = gql`
    query MyChildren {
  myChildren {
    id
    name
    avatar
  }
}
    `;

/**
 * __useMyChildrenQuery__
 *
 * To run a query within a React component, call `useMyChildrenQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyChildrenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyChildrenQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyChildrenQuery(baseOptions?: Apollo.QueryHookOptions<MyChildrenQuery, MyChildrenQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyChildrenQuery, MyChildrenQueryVariables>(MyChildrenDocument, options);
      }
export function useMyChildrenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyChildrenQuery, MyChildrenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyChildrenQuery, MyChildrenQueryVariables>(MyChildrenDocument, options);
        }
// @ts-ignore
export function useMyChildrenSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyChildrenQuery, MyChildrenQueryVariables>): Apollo.UseSuspenseQueryResult<MyChildrenQuery, MyChildrenQueryVariables>;
export function useMyChildrenSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyChildrenQuery, MyChildrenQueryVariables>): Apollo.UseSuspenseQueryResult<MyChildrenQuery | undefined, MyChildrenQueryVariables>;
export function useMyChildrenSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyChildrenQuery, MyChildrenQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyChildrenQuery, MyChildrenQueryVariables>(MyChildrenDocument, options);
        }
export type MyChildrenQueryHookResult = ReturnType<typeof useMyChildrenQuery>;
export type MyChildrenLazyQueryHookResult = ReturnType<typeof useMyChildrenLazyQuery>;
export type MyChildrenSuspenseQueryHookResult = ReturnType<typeof useMyChildrenSuspenseQuery>;
export type MyChildrenQueryResult = Apollo.QueryResult<MyChildrenQuery, MyChildrenQueryVariables>;
export const StudentRadarDocument = gql`
    query StudentRadar($studentId: ID!) {
  studentRadar(studentId: $studentId) {
    studentId
    studentName
    skills {
      reading
      math
      writing
      logic
      social
    }
  }
}
    `;

/**
 * __useStudentRadarQuery__
 *
 * To run a query within a React component, call `useStudentRadarQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudentRadarQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudentRadarQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *   },
 * });
 */
export function useStudentRadarQuery(baseOptions: Apollo.QueryHookOptions<StudentRadarQuery, StudentRadarQueryVariables> & ({ variables: StudentRadarQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StudentRadarQuery, StudentRadarQueryVariables>(StudentRadarDocument, options);
      }
export function useStudentRadarLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StudentRadarQuery, StudentRadarQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StudentRadarQuery, StudentRadarQueryVariables>(StudentRadarDocument, options);
        }
// @ts-ignore
export function useStudentRadarSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<StudentRadarQuery, StudentRadarQueryVariables>): Apollo.UseSuspenseQueryResult<StudentRadarQuery, StudentRadarQueryVariables>;
export function useStudentRadarSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentRadarQuery, StudentRadarQueryVariables>): Apollo.UseSuspenseQueryResult<StudentRadarQuery | undefined, StudentRadarQueryVariables>;
export function useStudentRadarSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentRadarQuery, StudentRadarQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StudentRadarQuery, StudentRadarQueryVariables>(StudentRadarDocument, options);
        }
export type StudentRadarQueryHookResult = ReturnType<typeof useStudentRadarQuery>;
export type StudentRadarLazyQueryHookResult = ReturnType<typeof useStudentRadarLazyQuery>;
export type StudentRadarSuspenseQueryHookResult = ReturnType<typeof useStudentRadarSuspenseQuery>;
export type StudentRadarQueryResult = Apollo.QueryResult<StudentRadarQuery, StudentRadarQueryVariables>;
export const StudentProgressDocument = gql`
    query StudentProgress($studentId: ID!) {
  studentProgress(studentId: $studentId) {
    weeks {
      period
      skills {
        reading
        math
        writing
        logic
        social
      }
    }
  }
}
    `;

/**
 * __useStudentProgressQuery__
 *
 * To run a query within a React component, call `useStudentProgressQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudentProgressQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudentProgressQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *   },
 * });
 */
export function useStudentProgressQuery(baseOptions: Apollo.QueryHookOptions<StudentProgressQuery, StudentProgressQueryVariables> & ({ variables: StudentProgressQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StudentProgressQuery, StudentProgressQueryVariables>(StudentProgressDocument, options);
      }
export function useStudentProgressLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StudentProgressQuery, StudentProgressQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StudentProgressQuery, StudentProgressQueryVariables>(StudentProgressDocument, options);
        }
// @ts-ignore
export function useStudentProgressSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<StudentProgressQuery, StudentProgressQueryVariables>): Apollo.UseSuspenseQueryResult<StudentProgressQuery, StudentProgressQueryVariables>;
export function useStudentProgressSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentProgressQuery, StudentProgressQueryVariables>): Apollo.UseSuspenseQueryResult<StudentProgressQuery | undefined, StudentProgressQueryVariables>;
export function useStudentProgressSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentProgressQuery, StudentProgressQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StudentProgressQuery, StudentProgressQueryVariables>(StudentProgressDocument, options);
        }
export type StudentProgressQueryHookResult = ReturnType<typeof useStudentProgressQuery>;
export type StudentProgressLazyQueryHookResult = ReturnType<typeof useStudentProgressLazyQuery>;
export type StudentProgressSuspenseQueryHookResult = ReturnType<typeof useStudentProgressSuspenseQuery>;
export type StudentProgressQueryResult = Apollo.QueryResult<StudentProgressQuery, StudentProgressQueryVariables>;
export const StudentDailyScoresDocument = gql`
    query StudentDailyScores($studentId: ID!, $skillCategory: SkillCategoryEnum, $first: Int, $after: String) {
  studentDailyScores(
    studentId: $studentId
    skillCategory: $skillCategory
    first: $first
    after: $after
  ) {
    edges {
      node {
        id
        date
        skillCategory
        score
        notes
      }
      cursor
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
    `;

/**
 * __useStudentDailyScoresQuery__
 *
 * To run a query within a React component, call `useStudentDailyScoresQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudentDailyScoresQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudentDailyScoresQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      skillCategory: // value for 'skillCategory'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useStudentDailyScoresQuery(baseOptions: Apollo.QueryHookOptions<StudentDailyScoresQuery, StudentDailyScoresQueryVariables> & ({ variables: StudentDailyScoresQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>(StudentDailyScoresDocument, options);
      }
export function useStudentDailyScoresLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>(StudentDailyScoresDocument, options);
        }
// @ts-ignore
export function useStudentDailyScoresSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>): Apollo.UseSuspenseQueryResult<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>;
export function useStudentDailyScoresSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>): Apollo.UseSuspenseQueryResult<StudentDailyScoresQuery | undefined, StudentDailyScoresQueryVariables>;
export function useStudentDailyScoresSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>(StudentDailyScoresDocument, options);
        }
export type StudentDailyScoresQueryHookResult = ReturnType<typeof useStudentDailyScoresQuery>;
export type StudentDailyScoresLazyQueryHookResult = ReturnType<typeof useStudentDailyScoresLazyQuery>;
export type StudentDailyScoresSuspenseQueryHookResult = ReturnType<typeof useStudentDailyScoresSuspenseQuery>;
export type StudentDailyScoresQueryResult = Apollo.QueryResult<StudentDailyScoresQuery, StudentDailyScoresQueryVariables>;
export const ClassroomsDocument = gql`
    query Classrooms {
  classrooms {
    id
    name
    school {
      id
    }
  }
}
    `;

/**
 * __useClassroomsQuery__
 *
 * To run a query within a React component, call `useClassroomsQuery` and pass it any options that fit your needs.
 * When your component renders, `useClassroomsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClassroomsQuery({
 *   variables: {
 *   },
 * });
 */
export function useClassroomsQuery(baseOptions?: Apollo.QueryHookOptions<ClassroomsQuery, ClassroomsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClassroomsQuery, ClassroomsQueryVariables>(ClassroomsDocument, options);
      }
export function useClassroomsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClassroomsQuery, ClassroomsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClassroomsQuery, ClassroomsQueryVariables>(ClassroomsDocument, options);
        }
// @ts-ignore
export function useClassroomsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClassroomsQuery, ClassroomsQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomsQuery, ClassroomsQueryVariables>;
export function useClassroomsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomsQuery, ClassroomsQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomsQuery | undefined, ClassroomsQueryVariables>;
export function useClassroomsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomsQuery, ClassroomsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClassroomsQuery, ClassroomsQueryVariables>(ClassroomsDocument, options);
        }
export type ClassroomsQueryHookResult = ReturnType<typeof useClassroomsQuery>;
export type ClassroomsLazyQueryHookResult = ReturnType<typeof useClassroomsLazyQuery>;
export type ClassroomsSuspenseQueryHookResult = ReturnType<typeof useClassroomsSuspenseQuery>;
export type ClassroomsQueryResult = Apollo.QueryResult<ClassroomsQuery, ClassroomsQueryVariables>;
export const ClassroomOverviewDocument = gql`
    query ClassroomOverview($classroomId: ID!) {
  classroomOverview(classroomId: $classroomId) {
    classroomId
    classroomName
    students {
      studentId
      studentName
      skills {
        reading
        math
        writing
        logic
        social
      }
    }
  }
}
    `;

/**
 * __useClassroomOverviewQuery__
 *
 * To run a query within a React component, call `useClassroomOverviewQuery` and pass it any options that fit your needs.
 * When your component renders, `useClassroomOverviewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClassroomOverviewQuery({
 *   variables: {
 *      classroomId: // value for 'classroomId'
 *   },
 * });
 */
export function useClassroomOverviewQuery(baseOptions: Apollo.QueryHookOptions<ClassroomOverviewQuery, ClassroomOverviewQueryVariables> & ({ variables: ClassroomOverviewQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>(ClassroomOverviewDocument, options);
      }
export function useClassroomOverviewLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>(ClassroomOverviewDocument, options);
        }
// @ts-ignore
export function useClassroomOverviewSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>;
export function useClassroomOverviewSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomOverviewQuery | undefined, ClassroomOverviewQueryVariables>;
export function useClassroomOverviewSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>(ClassroomOverviewDocument, options);
        }
export type ClassroomOverviewQueryHookResult = ReturnType<typeof useClassroomOverviewQuery>;
export type ClassroomOverviewLazyQueryHookResult = ReturnType<typeof useClassroomOverviewLazyQuery>;
export type ClassroomOverviewSuspenseQueryHookResult = ReturnType<typeof useClassroomOverviewSuspenseQuery>;
export type ClassroomOverviewQueryResult = Apollo.QueryResult<ClassroomOverviewQuery, ClassroomOverviewQueryVariables>;
export const MyChildrenWithSchoolDocument = gql`
    query MyChildrenWithSchool {
  myChildren {
    id
    name
    classrooms {
      id
      grade
      school {
        id
        name
      }
    }
  }
}
    `;

/**
 * __useMyChildrenWithSchoolQuery__
 *
 * To run a query within a React component, call `useMyChildrenWithSchoolQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyChildrenWithSchoolQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyChildrenWithSchoolQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyChildrenWithSchoolQuery(baseOptions?: Apollo.QueryHookOptions<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>(MyChildrenWithSchoolDocument, options);
      }
export function useMyChildrenWithSchoolLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>(MyChildrenWithSchoolDocument, options);
        }
// @ts-ignore
export function useMyChildrenWithSchoolSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>): Apollo.UseSuspenseQueryResult<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>;
export function useMyChildrenWithSchoolSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>): Apollo.UseSuspenseQueryResult<MyChildrenWithSchoolQuery | undefined, MyChildrenWithSchoolQueryVariables>;
export function useMyChildrenWithSchoolSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>(MyChildrenWithSchoolDocument, options);
        }
export type MyChildrenWithSchoolQueryHookResult = ReturnType<typeof useMyChildrenWithSchoolQuery>;
export type MyChildrenWithSchoolLazyQueryHookResult = ReturnType<typeof useMyChildrenWithSchoolLazyQuery>;
export type MyChildrenWithSchoolSuspenseQueryHookResult = ReturnType<typeof useMyChildrenWithSchoolSuspenseQuery>;
export type MyChildrenWithSchoolQueryResult = Apollo.QueryResult<MyChildrenWithSchoolQuery, MyChildrenWithSchoolQueryVariables>;
export const SubjectsDocument = gql`
    query Subjects($schoolId: ID!) {
  subjects(schoolId: $schoolId) {
    id
    name
    description
    topics {
      id
      name
    }
  }
}
    `;

/**
 * __useSubjectsQuery__
 *
 * To run a query within a React component, call `useSubjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSubjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSubjectsQuery({
 *   variables: {
 *      schoolId: // value for 'schoolId'
 *   },
 * });
 */
export function useSubjectsQuery(baseOptions: Apollo.QueryHookOptions<SubjectsQuery, SubjectsQueryVariables> & ({ variables: SubjectsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SubjectsQuery, SubjectsQueryVariables>(SubjectsDocument, options);
      }
export function useSubjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SubjectsQuery, SubjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SubjectsQuery, SubjectsQueryVariables>(SubjectsDocument, options);
        }
// @ts-ignore
export function useSubjectsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SubjectsQuery, SubjectsQueryVariables>): Apollo.UseSuspenseQueryResult<SubjectsQuery, SubjectsQueryVariables>;
export function useSubjectsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SubjectsQuery, SubjectsQueryVariables>): Apollo.UseSuspenseQueryResult<SubjectsQuery | undefined, SubjectsQueryVariables>;
export function useSubjectsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SubjectsQuery, SubjectsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SubjectsQuery, SubjectsQueryVariables>(SubjectsDocument, options);
        }
export type SubjectsQueryHookResult = ReturnType<typeof useSubjectsQuery>;
export type SubjectsLazyQueryHookResult = ReturnType<typeof useSubjectsLazyQuery>;
export type SubjectsSuspenseQueryHookResult = ReturnType<typeof useSubjectsSuspenseQuery>;
export type SubjectsQueryResult = Apollo.QueryResult<SubjectsQuery, SubjectsQueryVariables>;
export const SubjectDocument = gql`
    query Subject($id: ID!) {
  subject(id: $id) {
    id
    name
    description
    topics {
      id
      name
      description
      position
      learningObjectives {
        id
      }
    }
  }
}
    `;

/**
 * __useSubjectQuery__
 *
 * To run a query within a React component, call `useSubjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useSubjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSubjectQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSubjectQuery(baseOptions: Apollo.QueryHookOptions<SubjectQuery, SubjectQueryVariables> & ({ variables: SubjectQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SubjectQuery, SubjectQueryVariables>(SubjectDocument, options);
      }
export function useSubjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SubjectQuery, SubjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SubjectQuery, SubjectQueryVariables>(SubjectDocument, options);
        }
// @ts-ignore
export function useSubjectSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SubjectQuery, SubjectQueryVariables>): Apollo.UseSuspenseQueryResult<SubjectQuery, SubjectQueryVariables>;
export function useSubjectSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SubjectQuery, SubjectQueryVariables>): Apollo.UseSuspenseQueryResult<SubjectQuery | undefined, SubjectQueryVariables>;
export function useSubjectSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SubjectQuery, SubjectQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SubjectQuery, SubjectQueryVariables>(SubjectDocument, options);
        }
export type SubjectQueryHookResult = ReturnType<typeof useSubjectQuery>;
export type SubjectLazyQueryHookResult = ReturnType<typeof useSubjectLazyQuery>;
export type SubjectSuspenseQueryHookResult = ReturnType<typeof useSubjectSuspenseQuery>;
export type SubjectQueryResult = Apollo.QueryResult<SubjectQuery, SubjectQueryVariables>;
export const TopicDocument = gql`
    query Topic($id: ID!) {
  topic(id: $id) {
    id
    name
    description
    subject {
      id
      name
    }
    learningObjectives {
      id
      name
      description
      examPassThreshold
      dailyScoreThreshold
      position
    }
    exams {
      id
      title
      description
      examType
      maxScore
    }
  }
}
    `;

/**
 * __useTopicQuery__
 *
 * To run a query within a React component, call `useTopicQuery` and pass it any options that fit your needs.
 * When your component renders, `useTopicQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTopicQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useTopicQuery(baseOptions: Apollo.QueryHookOptions<TopicQuery, TopicQueryVariables> & ({ variables: TopicQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TopicQuery, TopicQueryVariables>(TopicDocument, options);
      }
export function useTopicLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TopicQuery, TopicQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TopicQuery, TopicQueryVariables>(TopicDocument, options);
        }
// @ts-ignore
export function useTopicSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TopicQuery, TopicQueryVariables>): Apollo.UseSuspenseQueryResult<TopicQuery, TopicQueryVariables>;
export function useTopicSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TopicQuery, TopicQueryVariables>): Apollo.UseSuspenseQueryResult<TopicQuery | undefined, TopicQueryVariables>;
export function useTopicSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TopicQuery, TopicQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TopicQuery, TopicQueryVariables>(TopicDocument, options);
        }
export type TopicQueryHookResult = ReturnType<typeof useTopicQuery>;
export type TopicLazyQueryHookResult = ReturnType<typeof useTopicLazyQuery>;
export type TopicSuspenseQueryHookResult = ReturnType<typeof useTopicSuspenseQuery>;
export type TopicQueryResult = Apollo.QueryResult<TopicQuery, TopicQueryVariables>;
export const AcademicYearsDocument = gql`
    query AcademicYears($schoolId: ID!) {
  academicYears(schoolId: $schoolId) {
    id
    label
    current
  }
}
    `;

/**
 * __useAcademicYearsQuery__
 *
 * To run a query within a React component, call `useAcademicYearsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAcademicYearsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAcademicYearsQuery({
 *   variables: {
 *      schoolId: // value for 'schoolId'
 *   },
 * });
 */
export function useAcademicYearsQuery(baseOptions: Apollo.QueryHookOptions<AcademicYearsQuery, AcademicYearsQueryVariables> & ({ variables: AcademicYearsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AcademicYearsQuery, AcademicYearsQueryVariables>(AcademicYearsDocument, options);
      }
export function useAcademicYearsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AcademicYearsQuery, AcademicYearsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AcademicYearsQuery, AcademicYearsQueryVariables>(AcademicYearsDocument, options);
        }
// @ts-ignore
export function useAcademicYearsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AcademicYearsQuery, AcademicYearsQueryVariables>): Apollo.UseSuspenseQueryResult<AcademicYearsQuery, AcademicYearsQueryVariables>;
export function useAcademicYearsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AcademicYearsQuery, AcademicYearsQueryVariables>): Apollo.UseSuspenseQueryResult<AcademicYearsQuery | undefined, AcademicYearsQueryVariables>;
export function useAcademicYearsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AcademicYearsQuery, AcademicYearsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AcademicYearsQuery, AcademicYearsQueryVariables>(AcademicYearsDocument, options);
        }
export type AcademicYearsQueryHookResult = ReturnType<typeof useAcademicYearsQuery>;
export type AcademicYearsLazyQueryHookResult = ReturnType<typeof useAcademicYearsLazyQuery>;
export type AcademicYearsSuspenseQueryHookResult = ReturnType<typeof useAcademicYearsSuspenseQuery>;
export type AcademicYearsQueryResult = Apollo.QueryResult<AcademicYearsQuery, AcademicYearsQueryVariables>;
export const GradeCurriculumDocument = gql`
    query GradeCurriculum($academicYearId: ID!, $grade: Int!) {
  gradeCurriculum(academicYearId: $academicYearId, grade: $grade) {
    id
    grade
    gradeCurriculumItems {
      id
      displayName
      position
      subject {
        id
        name
      }
      topic {
        id
        name
        subject {
          id
          name
        }
      }
    }
  }
}
    `;

/**
 * __useGradeCurriculumQuery__
 *
 * To run a query within a React component, call `useGradeCurriculumQuery` and pass it any options that fit your needs.
 * When your component renders, `useGradeCurriculumQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGradeCurriculumQuery({
 *   variables: {
 *      academicYearId: // value for 'academicYearId'
 *      grade: // value for 'grade'
 *   },
 * });
 */
export function useGradeCurriculumQuery(baseOptions: Apollo.QueryHookOptions<GradeCurriculumQuery, GradeCurriculumQueryVariables> & ({ variables: GradeCurriculumQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GradeCurriculumQuery, GradeCurriculumQueryVariables>(GradeCurriculumDocument, options);
      }
export function useGradeCurriculumLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GradeCurriculumQuery, GradeCurriculumQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GradeCurriculumQuery, GradeCurriculumQueryVariables>(GradeCurriculumDocument, options);
        }
// @ts-ignore
export function useGradeCurriculumSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GradeCurriculumQuery, GradeCurriculumQueryVariables>): Apollo.UseSuspenseQueryResult<GradeCurriculumQuery, GradeCurriculumQueryVariables>;
export function useGradeCurriculumSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GradeCurriculumQuery, GradeCurriculumQueryVariables>): Apollo.UseSuspenseQueryResult<GradeCurriculumQuery | undefined, GradeCurriculumQueryVariables>;
export function useGradeCurriculumSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GradeCurriculumQuery, GradeCurriculumQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GradeCurriculumQuery, GradeCurriculumQueryVariables>(GradeCurriculumDocument, options);
        }
export type GradeCurriculumQueryHookResult = ReturnType<typeof useGradeCurriculumQuery>;
export type GradeCurriculumLazyQueryHookResult = ReturnType<typeof useGradeCurriculumLazyQuery>;
export type GradeCurriculumSuspenseQueryHookResult = ReturnType<typeof useGradeCurriculumSuspenseQuery>;
export type GradeCurriculumQueryResult = Apollo.QueryResult<GradeCurriculumQuery, GradeCurriculumQueryVariables>;
export const StudentMasteriesDocument = gql`
    query StudentMasteries($studentId: ID!, $subjectId: ID) {
  studentMasteries(studentId: $studentId, subjectId: $subjectId) {
    id
    examMastered
    dailyMastered
    mastered
    learningObjective {
      id
      description
      topic {
        id
        name
        subject {
          id
          name
        }
      }
    }
  }
}
    `;

/**
 * __useStudentMasteriesQuery__
 *
 * To run a query within a React component, call `useStudentMasteriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudentMasteriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudentMasteriesQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      subjectId: // value for 'subjectId'
 *   },
 * });
 */
export function useStudentMasteriesQuery(baseOptions: Apollo.QueryHookOptions<StudentMasteriesQuery, StudentMasteriesQueryVariables> & ({ variables: StudentMasteriesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StudentMasteriesQuery, StudentMasteriesQueryVariables>(StudentMasteriesDocument, options);
      }
export function useStudentMasteriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StudentMasteriesQuery, StudentMasteriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StudentMasteriesQuery, StudentMasteriesQueryVariables>(StudentMasteriesDocument, options);
        }
// @ts-ignore
export function useStudentMasteriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<StudentMasteriesQuery, StudentMasteriesQueryVariables>): Apollo.UseSuspenseQueryResult<StudentMasteriesQuery, StudentMasteriesQueryVariables>;
export function useStudentMasteriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentMasteriesQuery, StudentMasteriesQueryVariables>): Apollo.UseSuspenseQueryResult<StudentMasteriesQuery | undefined, StudentMasteriesQueryVariables>;
export function useStudentMasteriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentMasteriesQuery, StudentMasteriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StudentMasteriesQuery, StudentMasteriesQueryVariables>(StudentMasteriesDocument, options);
        }
export type StudentMasteriesQueryHookResult = ReturnType<typeof useStudentMasteriesQuery>;
export type StudentMasteriesLazyQueryHookResult = ReturnType<typeof useStudentMasteriesLazyQuery>;
export type StudentMasteriesSuspenseQueryHookResult = ReturnType<typeof useStudentMasteriesSuspenseQuery>;
export type StudentMasteriesQueryResult = Apollo.QueryResult<StudentMasteriesQuery, StudentMasteriesQueryVariables>;
export const StudentHealthCheckupsDocument = gql`
    query StudentHealthCheckups($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
  studentHealthCheckups(
    studentId: $studentId
    startDate: $startDate
    endDate: $endDate
  ) {
    id
    measuredAt
    weightKg
    heightCm
    headCircumferenceCm
    bmi
    bmiCategory
    notes
  }
}
    `;

/**
 * __useStudentHealthCheckupsQuery__
 *
 * To run a query within a React component, call `useStudentHealthCheckupsQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudentHealthCheckupsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudentHealthCheckupsQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useStudentHealthCheckupsQuery(baseOptions: Apollo.QueryHookOptions<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables> & ({ variables: StudentHealthCheckupsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>(StudentHealthCheckupsDocument, options);
      }
export function useStudentHealthCheckupsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>(StudentHealthCheckupsDocument, options);
        }
// @ts-ignore
export function useStudentHealthCheckupsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>): Apollo.UseSuspenseQueryResult<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>;
export function useStudentHealthCheckupsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>): Apollo.UseSuspenseQueryResult<StudentHealthCheckupsQuery | undefined, StudentHealthCheckupsQueryVariables>;
export function useStudentHealthCheckupsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>(StudentHealthCheckupsDocument, options);
        }
export type StudentHealthCheckupsQueryHookResult = ReturnType<typeof useStudentHealthCheckupsQuery>;
export type StudentHealthCheckupsLazyQueryHookResult = ReturnType<typeof useStudentHealthCheckupsLazyQuery>;
export type StudentHealthCheckupsSuspenseQueryHookResult = ReturnType<typeof useStudentHealthCheckupsSuspenseQuery>;
export type StudentHealthCheckupsQueryResult = Apollo.QueryResult<StudentHealthCheckupsQuery, StudentHealthCheckupsQueryVariables>;
export const ParentLeaveRequestsDocument = gql`
    query ParentLeaveRequests($studentId: ID, $status: LeaveRequestStatusEnum) {
  parentLeaveRequests(studentId: $studentId, status: $status) {
    id
    requestType
    startDate
    endDate
    reason
    status
    rejectionReason
    reviewedAt
    student {
      id
      name
    }
    daysCount
    createdAt
  }
}
    `;

/**
 * __useParentLeaveRequestsQuery__
 *
 * To run a query within a React component, call `useParentLeaveRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useParentLeaveRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useParentLeaveRequestsQuery({
 *   variables: {
 *      studentId: // value for 'studentId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useParentLeaveRequestsQuery(baseOptions?: Apollo.QueryHookOptions<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>(ParentLeaveRequestsDocument, options);
      }
export function useParentLeaveRequestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>(ParentLeaveRequestsDocument, options);
        }
// @ts-ignore
export function useParentLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>;
export function useParentLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>): Apollo.UseSuspenseQueryResult<ParentLeaveRequestsQuery | undefined, ParentLeaveRequestsQueryVariables>;
export function useParentLeaveRequestsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>(ParentLeaveRequestsDocument, options);
        }
export type ParentLeaveRequestsQueryHookResult = ReturnType<typeof useParentLeaveRequestsQuery>;
export type ParentLeaveRequestsLazyQueryHookResult = ReturnType<typeof useParentLeaveRequestsLazyQuery>;
export type ParentLeaveRequestsSuspenseQueryHookResult = ReturnType<typeof useParentLeaveRequestsSuspenseQuery>;
export type ParentLeaveRequestsQueryResult = Apollo.QueryResult<ParentLeaveRequestsQuery, ParentLeaveRequestsQueryVariables>;
export const ConversationsDocument = gql`
    query Conversations {
  conversations {
    id
    student {
      id
      name
    }
    parent {
      id
      name
    }
    teacher {
      id
      name
    }
    lastMessage {
      id
      body
      senderName
      mine
      createdAt
    }
    unreadCount
    createdAt
  }
}
    `;

/**
 * __useConversationsQuery__
 *
 * To run a query within a React component, call `useConversationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useConversationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConversationsQuery({
 *   variables: {
 *   },
 * });
 */
export function useConversationsQuery(baseOptions?: Apollo.QueryHookOptions<ConversationsQuery, ConversationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ConversationsQuery, ConversationsQueryVariables>(ConversationsDocument, options);
      }
export function useConversationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConversationsQuery, ConversationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ConversationsQuery, ConversationsQueryVariables>(ConversationsDocument, options);
        }
// @ts-ignore
export function useConversationsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ConversationsQuery, ConversationsQueryVariables>): Apollo.UseSuspenseQueryResult<ConversationsQuery, ConversationsQueryVariables>;
export function useConversationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ConversationsQuery, ConversationsQueryVariables>): Apollo.UseSuspenseQueryResult<ConversationsQuery | undefined, ConversationsQueryVariables>;
export function useConversationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ConversationsQuery, ConversationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ConversationsQuery, ConversationsQueryVariables>(ConversationsDocument, options);
        }
export type ConversationsQueryHookResult = ReturnType<typeof useConversationsQuery>;
export type ConversationsLazyQueryHookResult = ReturnType<typeof useConversationsLazyQuery>;
export type ConversationsSuspenseQueryHookResult = ReturnType<typeof useConversationsSuspenseQuery>;
export type ConversationsQueryResult = Apollo.QueryResult<ConversationsQuery, ConversationsQueryVariables>;
export const ConversationDocument = gql`
    query Conversation($id: ID!) {
  conversation(id: $id) {
    id
    student {
      id
      name
    }
    parent {
      id
      name
    }
    teacher {
      id
      name
    }
    messages {
      id
      body
      senderName
      senderType
      senderId
      mine
      createdAt
      attachments {
        url
        filename
        contentType
      }
    }
  }
}
    `;

/**
 * __useConversationQuery__
 *
 * To run a query within a React component, call `useConversationQuery` and pass it any options that fit your needs.
 * When your component renders, `useConversationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConversationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useConversationQuery(baseOptions: Apollo.QueryHookOptions<ConversationQuery, ConversationQueryVariables> & ({ variables: ConversationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ConversationQuery, ConversationQueryVariables>(ConversationDocument, options);
      }
export function useConversationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConversationQuery, ConversationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ConversationQuery, ConversationQueryVariables>(ConversationDocument, options);
        }
// @ts-ignore
export function useConversationSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ConversationQuery, ConversationQueryVariables>): Apollo.UseSuspenseQueryResult<ConversationQuery, ConversationQueryVariables>;
export function useConversationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ConversationQuery, ConversationQueryVariables>): Apollo.UseSuspenseQueryResult<ConversationQuery | undefined, ConversationQueryVariables>;
export function useConversationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ConversationQuery, ConversationQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ConversationQuery, ConversationQueryVariables>(ConversationDocument, options);
        }
export type ConversationQueryHookResult = ReturnType<typeof useConversationQuery>;
export type ConversationLazyQueryHookResult = ReturnType<typeof useConversationLazyQuery>;
export type ConversationSuspenseQueryHookResult = ReturnType<typeof useConversationSuspenseQuery>;
export type ConversationQueryResult = Apollo.QueryResult<ConversationQuery, ConversationQueryVariables>;
export const ClassroomAttendanceDocument = gql`
    query ClassroomAttendance($classroomId: ID!, $date: ISO8601Date!) {
  classroomAttendance(classroomId: $classroomId, date: $date) {
    id
    date
    status
    notes
    student {
      id
      name
    }
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useClassroomAttendanceQuery__
 *
 * To run a query within a React component, call `useClassroomAttendanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useClassroomAttendanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClassroomAttendanceQuery({
 *   variables: {
 *      classroomId: // value for 'classroomId'
 *      date: // value for 'date'
 *   },
 * });
 */
export function useClassroomAttendanceQuery(baseOptions: Apollo.QueryHookOptions<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables> & ({ variables: ClassroomAttendanceQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>(ClassroomAttendanceDocument, options);
      }
export function useClassroomAttendanceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>(ClassroomAttendanceDocument, options);
        }
// @ts-ignore
export function useClassroomAttendanceSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>;
export function useClassroomAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomAttendanceQuery | undefined, ClassroomAttendanceQueryVariables>;
export function useClassroomAttendanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>(ClassroomAttendanceDocument, options);
        }
export type ClassroomAttendanceQueryHookResult = ReturnType<typeof useClassroomAttendanceQuery>;
export type ClassroomAttendanceLazyQueryHookResult = ReturnType<typeof useClassroomAttendanceLazyQuery>;
export type ClassroomAttendanceSuspenseQueryHookResult = ReturnType<typeof useClassroomAttendanceSuspenseQuery>;
export type ClassroomAttendanceQueryResult = Apollo.QueryResult<ClassroomAttendanceQuery, ClassroomAttendanceQueryVariables>;
export const ClassroomExamsDocument = gql`
    query ClassroomExams($classroomId: ID!, $status: ClassroomExamStatusEnum) {
  classroomExams(classroomId: $classroomId, status: $status) {
    id
    status
    scheduledAt
    dueAt
    accessCode
    durationMinutes
    showResults
    createdAt
    exam {
      id
      title
      description
      examType
      maxScore
    }
    examSubmissions {
      id
      status
    }
  }
}
    `;

/**
 * __useClassroomExamsQuery__
 *
 * To run a query within a React component, call `useClassroomExamsQuery` and pass it any options that fit your needs.
 * When your component renders, `useClassroomExamsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClassroomExamsQuery({
 *   variables: {
 *      classroomId: // value for 'classroomId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useClassroomExamsQuery(baseOptions: Apollo.QueryHookOptions<ClassroomExamsQuery, ClassroomExamsQueryVariables> & ({ variables: ClassroomExamsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClassroomExamsQuery, ClassroomExamsQueryVariables>(ClassroomExamsDocument, options);
      }
export function useClassroomExamsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClassroomExamsQuery, ClassroomExamsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClassroomExamsQuery, ClassroomExamsQueryVariables>(ClassroomExamsDocument, options);
        }
// @ts-ignore
export function useClassroomExamsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClassroomExamsQuery, ClassroomExamsQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomExamsQuery, ClassroomExamsQueryVariables>;
export function useClassroomExamsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomExamsQuery, ClassroomExamsQueryVariables>): Apollo.UseSuspenseQueryResult<ClassroomExamsQuery | undefined, ClassroomExamsQueryVariables>;
export function useClassroomExamsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClassroomExamsQuery, ClassroomExamsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClassroomExamsQuery, ClassroomExamsQueryVariables>(ClassroomExamsDocument, options);
        }
export type ClassroomExamsQueryHookResult = ReturnType<typeof useClassroomExamsQuery>;
export type ClassroomExamsLazyQueryHookResult = ReturnType<typeof useClassroomExamsLazyQuery>;
export type ClassroomExamsSuspenseQueryHookResult = ReturnType<typeof useClassroomExamsSuspenseQuery>;
export type ClassroomExamsQueryResult = Apollo.QueryResult<ClassroomExamsQuery, ClassroomExamsQueryVariables>;
export const ExamDetailDocument = gql`
    query ExamDetail($id: ID!) {
  exam(id: $id) {
    id
    title
    description
    examType
    maxScore
    durationMinutes
    createdAt
    topic {
      id
      name
      subject {
        id
        name
      }
    }
    examQuestions {
      id
      questionText
      points
      position
    }
    rubricCriteria {
      id
      name
      description
      maxScore
      position
    }
    classroomExams {
      id
      status
      scheduledAt
      dueAt
      accessCode
      classroom {
        id
        name
      }
      examSubmissions {
        id
        status
        score
        passed
        submittedAt
        gradedAt
        student {
          id
          name
        }
      }
    }
  }
}
    `;

/**
 * __useExamDetailQuery__
 *
 * To run a query within a React component, call `useExamDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useExamDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExamDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useExamDetailQuery(baseOptions: Apollo.QueryHookOptions<ExamDetailQuery, ExamDetailQueryVariables> & ({ variables: ExamDetailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExamDetailQuery, ExamDetailQueryVariables>(ExamDetailDocument, options);
      }
export function useExamDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExamDetailQuery, ExamDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExamDetailQuery, ExamDetailQueryVariables>(ExamDetailDocument, options);
        }
// @ts-ignore
export function useExamDetailSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ExamDetailQuery, ExamDetailQueryVariables>): Apollo.UseSuspenseQueryResult<ExamDetailQuery, ExamDetailQueryVariables>;
export function useExamDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ExamDetailQuery, ExamDetailQueryVariables>): Apollo.UseSuspenseQueryResult<ExamDetailQuery | undefined, ExamDetailQueryVariables>;
export function useExamDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ExamDetailQuery, ExamDetailQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ExamDetailQuery, ExamDetailQueryVariables>(ExamDetailDocument, options);
        }
export type ExamDetailQueryHookResult = ReturnType<typeof useExamDetailQuery>;
export type ExamDetailLazyQueryHookResult = ReturnType<typeof useExamDetailLazyQuery>;
export type ExamDetailSuspenseQueryHookResult = ReturnType<typeof useExamDetailSuspenseQuery>;
export type ExamDetailQueryResult = Apollo.QueryResult<ExamDetailQuery, ExamDetailQueryVariables>;
export const ExamSubmissionDetailDocument = gql`
    query ExamSubmissionDetail($id: ID!) {
  examSubmission(id: $id) {
    id
    status
    score
    passed
    startedAt
    submittedAt
    gradedAt
    teacherNotes
    student {
      id
      name
    }
    classroomExam {
      id
      exam {
        id
        title
        examType
        maxScore
        examQuestions {
          id
          questionText
          points
          position
          correctAnswer
        }
        rubricCriteria {
          id
          name
          description
          maxScore
          position
        }
      }
    }
    examAnswers {
      id
      examQuestion {
        id
        questionText
        points
        correctAnswer
      }
      selectedAnswer
      correct
      pointsAwarded
    }
    rubricScores {
      id
      rubricCriteria {
        id
        name
        maxScore
      }
      score
      feedback
    }
  }
}
    `;

/**
 * __useExamSubmissionDetailQuery__
 *
 * To run a query within a React component, call `useExamSubmissionDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useExamSubmissionDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExamSubmissionDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useExamSubmissionDetailQuery(baseOptions: Apollo.QueryHookOptions<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables> & ({ variables: ExamSubmissionDetailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>(ExamSubmissionDetailDocument, options);
      }
export function useExamSubmissionDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>(ExamSubmissionDetailDocument, options);
        }
// @ts-ignore
export function useExamSubmissionDetailSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>): Apollo.UseSuspenseQueryResult<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>;
export function useExamSubmissionDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>): Apollo.UseSuspenseQueryResult<ExamSubmissionDetailQuery | undefined, ExamSubmissionDetailQueryVariables>;
export function useExamSubmissionDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>(ExamSubmissionDetailDocument, options);
        }
export type ExamSubmissionDetailQueryHookResult = ReturnType<typeof useExamSubmissionDetailQuery>;
export type ExamSubmissionDetailLazyQueryHookResult = ReturnType<typeof useExamSubmissionDetailLazyQuery>;
export type ExamSubmissionDetailSuspenseQueryHookResult = ReturnType<typeof useExamSubmissionDetailSuspenseQuery>;
export type ExamSubmissionDetailQueryResult = Apollo.QueryResult<ExamSubmissionDetailQuery, ExamSubmissionDetailQueryVariables>;