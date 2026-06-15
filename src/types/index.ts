export type ClassType = 'piano' | 'art' | 'dance' | 'calligraphy';

export type AgeGroup = '3-5' | '6-8' | '9-12' | '13+';

export interface Student {
  id: string;
  name: string;
  parentPhone: string;
  classType: ClassType;
  ageGroup: AgeGroup;
  totalLessons: number;
  usedLessons: number;
  remainingLessons: number;
  createdAt: string;
}

export interface Course {
  id: string;
  classType: ClassType;
  ageGroup: AgeGroup;
  classroom: 'A' | 'B' | 'C';
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  studentIds: string[];
  attendance: AttendanceRecord[];
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  status: 'present' | 'absent' | 'leave';
  checkedAt: string;
}

export const CLASS_TYPE_MAP: Record<ClassType, string> = {
  piano: '钢琴班',
  art: '美术班',
  dance: '舞蹈班',
  calligraphy: '书法班'
};

export const AGE_GROUP_MAP: Record<AgeGroup, string> = {
  '3-5': '3-5岁',
  '6-8': '6-8岁',
  '9-12': '9-12岁',
  '13+': '13岁以上'
};

export const CLASSROOM_MAP: Record<'A' | 'B' | 'C', string> = {
  A: '1号教室',
  B: '2号教室',
  C: '3号教室'
};

export const WARNING_LESSON_THRESHOLD = 2;
