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

export type User = Teacher | Parent;

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
export interface FeedPost {
  id: string;
  body: string;
  teacher: { name: string };
  classroom: { id: string; name: string };
  mediaUrls: string[];
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

// === Session user (decoded from JWT, stored in locals) ===
export interface SessionUser {
  id: string;
  type: 'Teacher' | 'Parent';
  email: string;
}
