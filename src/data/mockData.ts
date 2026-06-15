import { Student, Course, AttendanceRecord, RechargeRecord } from '@/types';
import dayjs from 'dayjs';

const now = dayjs();

export const mockStudents: Student[] = [
  {
    id: 's1',
    name: '张子涵',
    parentPhone: '13800138001',
    classType: 'piano',
    ageGroup: '6-8',
    totalLessons: 40,
    usedLessons: 38,
    remainingLessons: 2,
    createdAt: now.subtract(3, 'month').toISOString()
  },
  {
    id: 's2',
    name: '李思琪',
    parentPhone: '13800138002',
    classType: 'piano',
    ageGroup: '9-12',
    totalLessons: 30,
    usedLessons: 15,
    remainingLessons: 15,
    createdAt: now.subtract(2, 'month').toISOString()
  },
  {
    id: 's3',
    name: '王小明',
    parentPhone: '13800138003',
    classType: 'art',
    ageGroup: '3-5',
    totalLessons: 24,
    usedLessons: 23,
    remainingLessons: 1,
    createdAt: now.subtract(4, 'month').toISOString()
  },
  {
    id: 's4',
    name: '赵敏萱',
    parentPhone: '13800138004',
    classType: 'art',
    ageGroup: '6-8',
    totalLessons: 36,
    usedLessons: 12,
    remainingLessons: 24,
    createdAt: now.subtract(1, 'month').toISOString()
  },
  {
    id: 's5',
    name: '陈雨欣',
    parentPhone: '13800138005',
    classType: 'dance',
    ageGroup: '3-5',
    totalLessons: 48,
    usedLessons: 10,
    remainingLessons: 38,
    createdAt: now.subtract(2, 'month').toISOString()
  },
  {
    id: 's6',
    name: '刘佳怡',
    parentPhone: '13800138006',
    classType: 'dance',
    ageGroup: '6-8',
    totalLessons: 32,
    usedLessons: 31,
    remainingLessons: 1,
    createdAt: now.subtract(5, 'month').toISOString()
  },
  {
    id: 's7',
    name: '孙浩然',
    parentPhone: '13800138007',
    classType: 'calligraphy',
    ageGroup: '9-12',
    totalLessons: 20,
    usedLessons: 18,
    remainingLessons: 2,
    createdAt: now.subtract(3, 'month').toISOString()
  },
  {
    id: 's8',
    name: '周雅婷',
    parentPhone: '13800138008',
    classType: 'calligraphy',
    ageGroup: '13+',
    totalLessons: 40,
    usedLessons: 8,
    remainingLessons: 32,
    createdAt: now.subtract(1, 'month').toISOString()
  },
  {
    id: 's9',
    name: '吴俊熙',
    parentPhone: '13800138009',
    classType: 'piano',
    ageGroup: '6-8',
    totalLessons: 30,
    usedLessons: 5,
    remainingLessons: 25,
    createdAt: now.subtract(20, 'day').toISOString()
  },
  {
    id: 's10',
    name: '郑梦琪',
    parentPhone: '13800138010',
    classType: 'art',
    ageGroup: '9-12',
    totalLessons: 36,
    usedLessons: 34,
    remainingLessons: 2,
    createdAt: now.subtract(4, 'month').toISOString()
  },
  {
    id: 's11',
    name: '杨雨泽',
    parentPhone: '13800138011',
    classType: 'dance',
    ageGroup: '9-12',
    totalLessons: 24,
    usedLessons: 6,
    remainingLessons: 18,
    createdAt: now.subtract(1, 'month').toISOString()
  },
  {
    id: 's12',
    name: '黄诗涵',
    parentPhone: '13800138012',
    classType: 'calligraphy',
    ageGroup: '6-8',
    totalLessons: 30,
    usedLessons: 2,
    remainingLessons: 28,
    createdAt: now.subtract(15, 'day').toISOString()
  }
];

const today = dayjs().format('YYYY-MM-DD');
const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

export const mockCourses: Course[] = [
  {
    id: 'c1',
    classType: 'piano',
    ageGroup: '6-8',
    classroom: 'A',
    teacher: '李老师',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    studentIds: ['s1', 's9'],
    attendance: [],
    createdAt: now.subtract(7, 'day').toISOString()
  },
  {
    id: 'c2',
    classType: 'art',
    ageGroup: '3-5',
    classroom: 'B',
    teacher: '王老师',
    date: today,
    startTime: '09:00',
    endTime: '10:30',
    studentIds: ['s3'],
    attendance: [],
    createdAt: now.subtract(7, 'day').toISOString()
  },
  {
    id: 'c3',
    classType: 'dance',
    ageGroup: '6-8',
    classroom: 'C',
    teacher: '陈老师',
    date: today,
    startTime: '10:00',
    endTime: '11:30',
    studentIds: ['s6'],
    attendance: [],
    createdAt: now.subtract(5, 'day').toISOString()
  },
  {
    id: 'c4',
    classType: 'piano',
    ageGroup: '6-8',
    classroom: 'A',
    teacher: '李老师',
    date: today,
    startTime: '14:00',
    endTime: '15:00',
    studentIds: ['s1', 's9'],
    attendance: [],
    createdAt: now.subtract(3, 'day').toISOString()
  },
  {
    id: 'c5',
    classType: 'calligraphy',
    ageGroup: '9-12',
    classroom: 'B',
    teacher: '赵老师',
    date: today,
    startTime: '14:30',
    endTime: '16:00',
    studentIds: ['s7'],
    attendance: [],
    createdAt: now.subtract(2, 'day').toISOString()
  },
  {
    id: 'c6',
    classType: 'art',
    ageGroup: '6-8',
    classroom: 'A',
    teacher: '王老师',
    date: tomorrow,
    startTime: '09:00',
    endTime: '10:30',
    studentIds: ['s4'],
    attendance: [],
    createdAt: now.subtract(1, 'day').toISOString()
  },
  {
    id: 'c7',
    classType: 'dance',
    ageGroup: '3-5',
    classroom: 'C',
    teacher: '陈老师',
    date: tomorrow,
    startTime: '10:00',
    endTime: '11:00',
    studentIds: ['s5'],
    attendance: [],
    createdAt: now.subtract(1, 'day').toISOString()
  },
  {
    id: 'c8',
    classType: 'piano',
    ageGroup: '9-12',
    classroom: 'A',
    teacher: '李老师',
    date: yesterday,
    startTime: '15:00',
    endTime: '16:00',
    studentIds: ['s2'],
    attendance: [
      {
        id: 'a1',
        studentId: 's2',
        courseId: 'c8',
        status: 'present',
        checkedAt: now.subtract(1, 'day').hour(15).toISOString()
      }
    ],
    createdAt: now.subtract(8, 'day').toISOString()
  },
  {
    id: 'c9',
    classType: 'calligraphy',
    ageGroup: '13+',
    classroom: 'B',
    teacher: '赵老师',
    date: yesterday,
    startTime: '16:00',
    endTime: '17:30',
    studentIds: ['s8'],
    attendance: [
      {
        id: 'a2',
        studentId: 's8',
        courseId: 'c9',
        status: 'present',
        checkedAt: now.subtract(1, 'day').hour(16).toISOString()
      }
    ],
    createdAt: now.subtract(10, 'day').toISOString()
  },
  {
    id: 'c10',
    classType: 'art',
    ageGroup: '9-12',
    classroom: 'C',
    teacher: '王老师',
    date: yesterday,
    startTime: '14:00',
    endTime: '15:30',
    studentIds: ['s10'],
    attendance: [
      {
        id: 'a3',
        studentId: 's10',
        courseId: 'c10',
        status: 'present',
        checkedAt: now.subtract(1, 'day').hour(14).toISOString()
      }
    ],
    createdAt: now.subtract(12, 'day').toISOString()
  }
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'a1',
    studentId: 's2',
    courseId: 'c8',
    status: 'present',
    checkedAt: now.subtract(1, 'day').hour(15).toISOString()
  },
  {
    id: 'a2',
    studentId: 's8',
    courseId: 'c9',
    status: 'present',
    checkedAt: now.subtract(1, 'day').hour(16).toISOString()
  },
  {
    id: 'a3',
    studentId: 's10',
    courseId: 'c10',
    status: 'present',
    checkedAt: now.subtract(1, 'day').hour(14).toISOString()
  }
];

export const mockRechargeRecords: RechargeRecord[] = [
  {
    id: 'r1',
    studentId: 's1',
    amount: 20,
    beforeTotal: 20,
    afterTotal: 40,
    beforeRemaining: 18,
    afterRemaining: 38,
    operator: '前台小李',
    remark: '续费半年卡',
    createdAt: now.subtract(2, 'month').toISOString()
  },
  {
    id: 'r2',
    studentId: 's3',
    amount: 12,
    beforeTotal: 12,
    afterTotal: 24,
    beforeRemaining: 5,
    afterRemaining: 17,
    operator: '前台小李',
    remark: '季度续费',
    createdAt: now.subtract(1, 'month').toISOString()
  },
  {
    id: 'r3',
    studentId: 's6',
    amount: 32,
    beforeTotal: 0,
    afterTotal: 32,
    beforeRemaining: 0,
    afterRemaining: 32,
    operator: '王老师',
    remark: '新生报名',
    createdAt: now.subtract(5, 'month').toISOString()
  },
  {
    id: 'r4',
    studentId: 's7',
    amount: 20,
    beforeTotal: 0,
    afterTotal: 20,
    beforeRemaining: 0,
    afterRemaining: 20,
    operator: '前台小李',
    remark: '首次报名',
    createdAt: now.subtract(3, 'month').toISOString()
  },
  {
    id: 'r5',
    studentId: 's10',
    amount: 36,
    beforeTotal: 0,
    afterTotal: 36,
    beforeRemaining: 0,
    afterRemaining: 36,
    operator: '王老师',
    remark: '年卡报名',
    createdAt: now.subtract(4, 'month').toISOString()
  }
];
