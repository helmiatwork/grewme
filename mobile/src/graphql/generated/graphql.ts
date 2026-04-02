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

export type ClassroomBehaviorStudentType = {
  __typename?: 'ClassroomBehaviorStudentType';
  negativeCount: Scalars['Int']['output'];
  positiveCount: Scalars['Int']['output'];
  recentPoints: Array<BehaviorPointType>;
  student: StudentType;
  totalPoints: Scalars['Int']['output'];
};

export type ClassroomOverviewType = {
  __typename?: 'ClassroomOverviewType';
  classroomId: Scalars['ID']['output'];
  classroomName: Scalars['String']['output'];
  students: Array<RadarDataType>;
};

export type ClassroomType = {
  __typename?: 'ClassroomType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  school: SchoolType;
};

export type CreateHealthCheckupPayload = {
  __typename?: 'CreateHealthCheckupPayload';
  errors: Array<UserErrorType>;
  healthCheckup?: Maybe<HealthCheckupType>;
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

export type LoginPayload = {
  __typename?: 'LoginPayload';
  accessToken?: Maybe<Scalars['String']['output']>;
  errors: Array<UserErrorType>;
  expiresIn?: Maybe<Scalars['Int']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserUnion>;
};

export type Mutation = {
  __typename?: 'Mutation';
  awardBehaviorPoint: AwardBehaviorPointPayload;
  createHealthCheckup: CreateHealthCheckupPayload;
  login: LoginPayload;
};


export type MutationAwardBehaviorPointArgs = {
  behaviorCategoryId: Scalars['ID']['input'];
  classroomId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  studentId: Scalars['ID']['input'];
};


export type MutationCreateHealthCheckupArgs = {
  headCircumferenceCm?: InputMaybe<Scalars['Float']['input']>;
  heightCm?: InputMaybe<Scalars['Float']['input']>;
  measuredAt: Scalars['ISO8601Date']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  studentId: Scalars['ID']['input'];
  weightKg?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: Scalars['String']['input'];
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
  behaviorCategories: Array<BehaviorCategoryType>;
  classroomBehaviorToday: Array<ClassroomBehaviorStudentType>;
  classroomOverview: ClassroomOverviewType;
  classrooms: Array<ClassroomType>;
  myChildren: Array<StudentType>;
  studentBehaviorHistory: Array<BehaviorPointType>;
  studentDailyScores: DailyScoreTypeConnection;
  studentProgress: ProgressDataType;
  studentRadar: RadarDataType;
};


export type QueryBehaviorCategoriesArgs = {
  schoolId: Scalars['ID']['input'];
};


export type QueryClassroomBehaviorTodayArgs = {
  classroomId: Scalars['ID']['input'];
};


export type QueryClassroomOverviewArgs = {
  classroomId: Scalars['ID']['input'];
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


export type QueryStudentProgressArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryStudentRadarArgs = {
  studentId: Scalars['ID']['input'];
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

export type SchoolType = {
  __typename?: 'SchoolType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
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

export type UserErrorType = {
  __typename?: 'UserErrorType';
  message: Scalars['String']['output'];
  path?: Maybe<Array<Scalars['String']['output']>>;
};

export type UserUnion = ParentType | TeacherType;

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

export type CreateHealthCheckupMutationVariables = Exact<{
  studentId: Scalars['ID']['input'];
  measuredAt: Scalars['ISO8601Date']['input'];
  weightKg?: InputMaybe<Scalars['Float']['input']>;
  heightCm?: InputMaybe<Scalars['Float']['input']>;
  headCircumferenceCm?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateHealthCheckupMutation = { __typename?: 'Mutation', createHealthCheckup: { __typename?: 'CreateHealthCheckupPayload', healthCheckup?: { __typename?: 'HealthCheckupType', id: string, measuredAt: any, weightKg?: number | null, heightCm?: number | null, headCircumferenceCm?: number | null, bmi?: number | null, bmiCategory?: string | null } | null, errors: Array<{ __typename?: 'UserErrorType', message: string }> } };

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