import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Course, AttendanceRecord, ClassType, AgeGroup, WARNING_LESSON_THRESHOLD } from '@/types';
import { mockStudents, mockCourses, mockAttendanceRecords } from '@/data/mockData';
import dayjs from 'dayjs';

interface AppState {
  students: Student[];
  courses: Course[];
  attendanceRecords: AttendanceRecord[];

  addStudent: (data: Omit<Student, 'id' | 'createdAt' | 'usedLessons'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
  getWarningStudents: () => Student[];
  getStudentsByClass: (classType?: ClassType) => Student[];

  addCourse: (data: Omit<Course, 'id' | 'attendance' | 'createdAt'>) => { success: boolean; message?: string };
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourseById: (id: string) => Course | undefined;
  getCoursesByDate: (date: string) => Course[];
  getCoursesByWeek: (weekStart: string) => Course[];
  checkTimeConflict: (classroom: 'A' | 'B' | 'C', date: string, startTime: string, endTime: string, excludeId?: string) => boolean;

  takeAttendance: (courseId: string, studentId: string, status: 'present' | 'absent' | 'leave') => void;
  getAttendanceByCourse: (courseId: string) => AttendanceRecord[];
  isStudentAttended: (courseId: string, studentId: string) => boolean;

  resetToMock: () => void;
}

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      students: mockStudents,
      courses: mockCourses,
      attendanceRecords: mockAttendanceRecords,

      addStudent: (data) => {
        const newStudent: Student = {
          ...data,
          id: generateId('s'),
          usedLessons: 0,
          remainingLessons: data.totalLessons,
          createdAt: dayjs().toISOString()
        };
        set((state) => ({ students: [...state.students, newStudent] }));
        console.log('[Student] Add student:', newStudent.name);
      },

      updateStudent: (id, data) => {
        set((state) => ({
          students: state.students.map((s) => {
            if (s.id === id) {
              const updated = { ...s, ...data };
              if (data.totalLessons !== undefined || data.usedLessons !== undefined) {
                updated.remainingLessons = updated.totalLessons - updated.usedLessons;
              }
              return updated;
            }
            return s;
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
          }))
        }));
        console.log('[Student] Delete student:', id);
      },

      getStudentById: (id) => get().students.find((s) => s.id === id),

      getWarningStudents: () =>
        get().students.filter((s) => s.remainingLessons <= WARNING_LESSON_THRESHOLD && s.remainingLessons > 0),

      getStudentsByClass: (classType) => {
        const list = get().students;
        if (!classType) return list;
        return list.filter((s) => s.classType === classType);
      },

      addCourse: (data) => {
        const { classroom, date, startTime, endTime } = data;
        if (get().checkTimeConflict(classroom, date, startTime, endTime)) {
          return { success: false, message: '该教室此时段已被占用，请调整时间或教室' };
        }
        const newCourse: Course = {
          ...data,
          id: generateId('c'),
          attendance: [],
          createdAt: dayjs().toISOString()
        };
        set((state) => ({ courses: [...state.courses, newCourse] }));
        console.log('[Course] Add course:', newCourse.id, date, startTime);
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

      checkTimeConflict: (classroom, date, startTime, endTime, excludeId) => {
        const sameRoom = get().courses.filter(
          (c) => c.classroom === classroom && c.date === date && c.id !== excludeId
        );
        return sameRoom.some((c) => isTimeOverlap(startTime, endTime, c.startTime, c.endTime));
      },

      takeAttendance: (courseId, studentId, status) => {
        const state = get();
        const existing = state.attendanceRecords.find(
          (a) => a.courseId === courseId && a.studentId === studentId
        );

        if (existing) {
          if (existing.status === 'present' && status !== 'present') {
            set((s) => ({
              students: s.students.map((st) =>
                st.id === studentId
                  ? {
                      ...st,
                      usedLessons: Math.max(0, st.usedLessons - 1),
                      remainingLessons: Math.min(st.totalLessons, st.remainingLessons + 1)
                    }
                  : st
              ),
              attendanceRecords: s.attendanceRecords.map((a) =>
                a.id === existing.id ? { ...a, status, checkedAt: dayjs().toISOString() } : a
              )
            }));
          } else if (existing.status !== 'present' && status === 'present') {
            set((s) => ({
              students: s.students.map((st) =>
                st.id === studentId
                  ? {
                      ...st,
                      usedLessons: Math.min(st.totalLessons, st.usedLessons + 1),
                      remainingLessons: Math.max(0, st.remainingLessons - 1)
                    }
                  : st
              ),
              attendanceRecords: s.attendanceRecords.map((a) =>
                a.id === existing.id ? { ...a, status, checkedAt: dayjs().toISOString() } : a
              )
            }));
          } else {
            set((s) => ({
              attendanceRecords: s.attendanceRecords.map((a) =>
                a.id === existing.id ? { ...a, status, checkedAt: dayjs().toISOString() } : a
              )
            }));
          }
        } else {
          const newRecord: AttendanceRecord = {
            id: generateId('a'),
            studentId,
            courseId,
            status,
            checkedAt: dayjs().toISOString()
          };
          if (status === 'present') {
            set((s) => ({
              students: s.students.map((st) =>
                st.id === studentId
                  ? {
                      ...st,
                      usedLessons: Math.min(st.totalLessons, st.usedLessons + 1),
                      remainingLessons: Math.max(0, st.remainingLessons - 1)
                    }
                  : st
              ),
              attendanceRecords: [...s.attendanceRecords, newRecord]
            }));
          } else {
            set((s) => ({
              attendanceRecords: [...s.attendanceRecords, newRecord]
            }));
          }
        }
        console.log('[Attendance] Check:', courseId, studentId, status);
      },

      getAttendanceByCourse: (courseId) =>
        get().attendanceRecords.filter((a) => a.courseId === courseId),

      isStudentAttended: (courseId, studentId) => {
        const record = get().attendanceRecords.find(
          (a) => a.courseId === courseId && a.studentId === studentId
        );
        return record?.status === 'present';
      },

      resetToMock: () => {
        set({
          students: mockStudents,
          courses: mockCourses,
          attendanceRecords: mockAttendanceRecords
        });
        console.log('[Store] Reset to mock data');
      }
    }),
    {
      name: 'training-class-store'
    }
  )
);
