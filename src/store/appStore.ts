import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Student,
  Course,
  AttendanceRecord,
  RechargeRecord,
  ClassType,
  AgeGroup,
  WARNING_LESSON_THRESHOLD
} from '@/types';
import {
  mockStudents,
  mockCourses,
  mockAttendanceRecords,
  mockRechargeRecords
} from '@/data/mockData';
import dayjs from 'dayjs';

interface AppState {
  students: Student[];
  courses: Course[];
  attendanceRecords: AttendanceRecord[];
  rechargeRecords: RechargeRecord[];

  addStudent: (data: Omit<Student, 'id' | 'createdAt' | 'usedLessons' | 'remainingLessons'> & { totalLessons: number }) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
  getWarningStudents: () => Student[];
  getStudentsByClass: (classType?: ClassType) => Student[];

  renewLessons: (studentId: string, amount: number, operator?: string, remark?: string) => { success: boolean; message?: string };
  adjustUsedLessons: (studentId: string, delta: number, remark?: string) => { success: boolean; message?: string };
  updateTotalLessons: (studentId: string, newTotal: number) => { success: boolean; message?: string };

  addCourse: (data: Omit<Course, 'id' | 'attendance' | 'createdAt'>) => { success: boolean; message?: string };
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourseById: (id: string) => Course | undefined;
  getCoursesByDate: (date: string) => Course[];
  getCoursesByWeek: (weekStart: string) => Course[];
  getCoursesByDateRange: (startDate: string, endDate: string) => Course[];
  checkTimeConflict: (classroom: 'A' | 'B' | 'C', date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  getConflictCourses: (classroom: 'A' | 'B' | 'C', date: string, startTime: string, endTime: string, excludeId?: string) => Course[];

  takeAttendance: (courseId: string, studentId: string, status: 'present' | 'absent' | 'leave') => void;
  getAttendanceByCourse: (courseId: string) => AttendanceRecord[];
  isStudentAttended: (courseId: string, studentId: string) => boolean;

  getRechargeRecordsByStudent: (studentId: string) => RechargeRecord[];
  getLastRechargeByStudent: (studentId: string) => RechargeRecord | undefined;
  addRechargeRecord: (record: Omit<RechargeRecord, 'id' | 'createdAt'>) => void;

  resetToMock: () => void;
}

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return !(e1 <= s2 || e2 <= s1);
};

const clampLessons = (student: Student): Student => {
  const used = Math.max(0, Math.min(student.totalLessons, student.usedLessons));
  const total = Math.max(0, student.totalLessons);
  return {
    ...student,
    totalLessons: total,
    usedLessons: used,
    remainingLessons: Math.max(0, total - used)
  };
};

const updateStudentInList = (
  students: Student[],
  id: string,
  updater: (s: Student) => Student
): Student[] =>
  students.map((s) => (s.id === id ? clampLessons(updater(s)) : s));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      students: mockStudents,
      courses: mockCourses,
      attendanceRecords: mockAttendanceRecords,
      rechargeRecords: mockRechargeRecords,

      addStudent: (data) => {
        const total = Math.max(0, data.totalLessons);
        const newStudent: Student = {
          ...data,
          id: generateId('s'),
          totalLessons: total,
          usedLessons: 0,
          remainingLessons: total,
          createdAt: dayjs().toISOString()
        };
        set((state) => ({ students: [...state.students, newStudent] }));
        console.log('[Student] Add student:', newStudent.name, total, '节课');
      },

      updateStudent: (id, data) => {
        set((state) => ({
          students: updateStudentInList(state.students, id, (s) => {
            const updated = { ...s, ...data };
            if (data.totalLessons !== undefined || data.usedLessons !== undefined) {
              return clampLessons(updated);
            }
            return updated;
          })
        }));
        console.log('[Student] Update student:', id);
      },

      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          courses: state.courses.map((c) => ({
            ...c,
            studentIds: c.studentIds.filter((sid) => sid !== id)
          })),
          rechargeRecords: state.rechargeRecords.filter((r) => r.studentId !== id),
          attendanceRecords: state.attendanceRecords.filter((a) => a.studentId !== id)
        }));
        console.log('[Student] Delete student:', id);
      },

      getStudentById: (id) => get().students.find((s) => s.id === id),

      getWarningStudents: () =>
        get().students.filter(
          (s) => s.remainingLessons <= WARNING_LESSON_THRESHOLD && s.remainingLessons > 0
        ),

      getStudentsByClass: (classType) => {
        const list = get().students;
        if (!classType) return list;
        return list.filter((s) => s.classType === classType);
      },

      renewLessons: (studentId, amount, operator, remark) => {
        if (amount <= 0) {
          return { success: false, message: '续费课时必须大于0' };
        }
        const student = get().getStudentById(studentId);
        if (!student) {
          return { success: false, message: '学生不存在' };
        }

        const beforeTotal = student.totalLessons;
        const beforeRemaining = student.remainingLessons;
        const afterTotal = beforeTotal + amount;
        const afterRemaining = beforeRemaining + amount;

        const record: RechargeRecord = {
          id: generateId('r'),
          studentId,
          amount,
          beforeTotal,
          afterTotal,
          beforeRemaining,
          afterRemaining,
          operator,
          remark,
          createdAt: dayjs().toISOString()
        };

        set((state) => ({
          students: state.students.map((s) =>
            s.id === studentId
              ? clampLessons({
                  ...s,
                  totalLessons: afterTotal,
                  remainingLessons: afterRemaining
                })
              : s
          ),
          rechargeRecords: [...state.rechargeRecords, record]
        }));

        console.log(
          '[Recharge]',
          student.name,
          '续费',
          amount,
          '节，剩余',
          afterRemaining,
          '节'
        );
        return { success: true };
      },

      adjustUsedLessons: (studentId, delta, remark) => {
        const student = get().getStudentById(studentId);
        if (!student) {
          return { success: false, message: '学生不存在' };
        }

        const newUsed = student.usedLessons + delta;
        if (newUsed < 0) {
          return { success: false, message: '已上课时不能为负数' };
        }
        if (newUsed > student.totalLessons) {
          return { success: false, message: '已上课时不能超过总课时' };
        }

        set((state) => ({
          students: state.students.map((s) =>
            s.id === studentId
              ? clampLessons({
                  ...s,
                  usedLessons: newUsed,
                  remainingLessons: s.totalLessons - newUsed
                })
              : s
          )
        }));

        console.log(
          '[Lessons]',
          student.name,
          delta > 0 ? '增加' : '减少',
          Math.abs(delta),
          '节已用课时，当前剩余',
          student.totalLessons - newUsed,
          '节',
          remark ? `(${remark})` : ''
        );
        return { success: true };
      },

      updateTotalLessons: (studentId, newTotal) => {
        if (newTotal < 0) {
          return { success: false, message: '总课时不能为负数' };
        }
        const student = get().getStudentById(studentId);
        if (!student) {
          return { success: false, message: '学生不存在' };
        }

        const clampedUsed = Math.min(student.usedLessons, newTotal);
        set((state) => ({
          students: state.students.map((s) =>
            s.id === studentId
              ? clampLessons({
                  ...s,
                  totalLessons: newTotal,
                  usedLessons: clampedUsed,
                  remainingLessons: newTotal - clampedUsed
                })
              : s
          )
        }));

        console.log(
          '[Lessons]',
          student.name,
          '总课时从',
          student.totalLessons,
          '改为',
          newTotal,
          '，已用',
          clampedUsed,
          '，剩余',
          newTotal - clampedUsed
        );
        return { success: true };
      },

      addCourse: (data) => {
        const { classroom, date, startTime, endTime } = data;
        const conflicts = get().getConflictCourses(classroom, date, startTime, endTime);
        if (conflicts.length > 0) {
          const first = conflicts[0];
          return {
            success: false,
            message: `该教室此时段已被占用：${first.startTime}-${first.endTime} ${first.teacher}老师`
          };
        }
        const newCourse: Course = {
          ...data,
          id: generateId('c'),
          attendance: [],
          createdAt: dayjs().toISOString()
        };
        set((state) => ({ courses: [...state.courses, newCourse] }));
        console.log('[Course] Add course:', newCourse.id, date, startTime, classroom);
        return { success: true };
      },

      updateCourse: (id, data) => {
        set((state) => ({
          courses: state.courses.map((c) => (c.id === id ? { ...c, ...data } : c))
        }));
        console.log('[Course] Update course:', id);
      },

      deleteCourse: (id) => {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
          attendanceRecords: state.attendanceRecords.filter((a) => a.courseId !== id)
        }));
        console.log('[Course] Delete course:', id);
      },

      getCourseById: (id) => get().courses.find((c) => c.id === id),

      getCoursesByDate: (date) =>
        get()
          .courses.filter((c) => c.date === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),

      getCoursesByWeek: (weekStart) => {
        const start = dayjs(weekStart);
        const end = start.add(6, 'day');
        return get()
          .courses.filter((c) => {
            const d = dayjs(c.date);
            return d.isAfter(start.subtract(1, 'day')) && d.isBefore(end.add(1, 'day'));
          })
          .sort((a, b) => {
            const da = dayjs(a.date + ' ' + a.startTime);
            const db = dayjs(b.date + ' ' + b.startTime);
            return da.valueOf() - db.valueOf();
          });
      },

      getCoursesByDateRange: (startDate, endDate) => {
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        return get()
          .courses.filter((c) => {
            const d = dayjs(c.date);
            return d.isAfter(start.subtract(1, 'day')) && d.isBefore(end.add(1, 'day'));
          })
          .sort((a, b) => {
            const da = dayjs(a.date + ' ' + a.startTime);
            const db = dayjs(b.date + ' ' + b.startTime);
            return da.valueOf() - db.valueOf();
          });
      },

      checkTimeConflict: (classroom, date, startTime, endTime, excludeId) => {
        const sameRoom = get().courses.filter(
          (c) => c.classroom === classroom && c.date === date && c.id !== excludeId
        );
        return sameRoom.some((c) => isTimeOverlap(startTime, endTime, c.startTime, c.endTime));
      },

      getConflictCourses: (classroom, date, startTime, endTime, excludeId) => {
        const sameRoom = get().courses.filter(
          (c) => c.classroom === classroom && c.date === date && c.id !== excludeId
        );
        return sameRoom.filter((c) =>
          isTimeOverlap(startTime, endTime, c.startTime, c.endTime)
        );
      },

      takeAttendance: (courseId, studentId, status) => {
        const state = get();
        const existing = state.attendanceRecords.find(
          (a) => a.courseId === courseId && a.studentId === studentId
        );
        const student = state.getStudentById(studentId);
        if (!student) return;

        const wasPresent = existing?.status === 'present';
        const willBePresent = status === 'present';

        if (existing) {
          if (wasPresent === willBePresent) {
            set((s) => ({
              attendanceRecords: s.attendanceRecords.map((a) =>
                a.id === existing.id ? { ...a, status, checkedAt: dayjs().toISOString() } : a
              )
            }));
          } else if (willBePresent) {
            const result = state.adjustUsedLessons(studentId, 1, '点名出勤');
            if (result.success) {
              set((s) => ({
                attendanceRecords: s.attendanceRecords.map((a) =>
                  a.id === existing.id
                    ? { ...a, status, checkedAt: dayjs().toISOString() }
                    : a
                )
              }));
            }
          } else {
            const result = state.adjustUsedLessons(studentId, -1, '取消出勤');
            if (result.success) {
              set((s) => ({
                attendanceRecords: s.attendanceRecords.map((a) =>
                  a.id === existing.id
                    ? { ...a, status, checkedAt: dayjs().toISOString() }
                    : a
                )
              }));
            }
          }
        } else {
          const newRecord: AttendanceRecord = {
            id: generateId('a'),
            studentId,
            courseId,
            status,
            checkedAt: dayjs().toISOString()
          };
          if (willBePresent) {
            const result = state.adjustUsedLessons(studentId, 1, '点名出勤');
            if (result.success) {
              set((s) => ({
                attendanceRecords: [...s.attendanceRecords, newRecord]
              }));
            }
          } else {
            set((s) => ({
              attendanceRecords: [...s.attendanceRecords, newRecord]
            }));
          }
        }
        console.log('[Attendance]', courseId, studentId, status);
      },

      getAttendanceByCourse: (courseId) =>
        get().attendanceRecords.filter((a) => a.courseId === courseId),

      isStudentAttended: (courseId, studentId) => {
        const record = get().attendanceRecords.find(
          (a) => a.courseId === courseId && a.studentId === studentId
        );
        return record?.status === 'present';
      },

      getRechargeRecordsByStudent: (studentId) =>
        get()
          .rechargeRecords.filter((r) => r.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getLastRechargeByStudent: (studentId) => {
        const records = get().getRechargeRecordsByStudent(studentId);
        return records.length > 0 ? records[0] : undefined;
      },

      addRechargeRecord: (record) => {
        const newRecord: RechargeRecord = {
          ...record,
          id: generateId('r'),
          createdAt: dayjs().toISOString()
        };
        set((state) => ({
          rechargeRecords: [...state.rechargeRecords, newRecord]
        }));
      },

      resetToMock: () => {
        set({
          students: mockStudents,
          courses: mockCourses,
          attendanceRecords: mockAttendanceRecords,
          rechargeRecords: mockRechargeRecords
        });
        console.log('[Store] Reset to mock data');
      }
    }),
    {
      name: 'training-class-store'
    }
  )
);
