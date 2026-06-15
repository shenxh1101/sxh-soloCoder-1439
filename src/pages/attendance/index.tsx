import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { CLASS_TYPE_MAP, CLASSROOM_MAP } from '@/types';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const avatarColors = ['#6366F1', '#EC4899', '#F97316', '#78350F', '#10B981', '#06B6D4', '#8B5CF6'];

const AttendancePage: React.FC = () => {
  const courses = useAppStore((s) => s.courses);
  const students = useAppStore((s) => s.students);
  const attendanceRecords = useAppStore((s) => s.attendanceRecords);
  const getCoursesByDate = useAppStore((s) => s.getCoursesByDate);
  const takeAttendance = useAppStore((s) => s.takeAttendance);
  const getAttendanceByCourse = useAppStore((s) => s.getAttendanceByCourse);
  const resetAttendanceStore = useAppStore((s) => s.resetAttendance);

  const [activeDateIdx, setActiveDateIdx] = useState(1);

  const dateTabs = useMemo(() => {
    return [-1, 0, 1, 2].map((offset) => {
      const d = dayjs().add(offset, 'day');
      return {
        date: d.format('YYYY-MM-DD'),
        day: offset === 0 ? '今天' : offset === -1 ? '昨天' : offset === 1 ? '明天' : `周${['日','一','二','三','四','五','六'][d.day()]}`,
        dateStr: d.format('M/D')
      };
    });
  }, []);

  const selectedDate = dateTabs[activeDateIdx].date;
  const todayCourses = useMemo(() => getCoursesByDate(selectedDate), [courses, selectedDate]);

  const getStudentStatus = (courseId: string, studentId: string) => {
    const r = attendanceRecords.find((a) => a.courseId === courseId && a.studentId === studentId);
    return r?.status || null;
  };

  const getProgress = (courseId: string) => {
    const records = getAttendanceByCourse(courseId);
    const total = courses.find((c) => c.id === courseId)?.studentIds.length || 0;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    return { total, present, absent, leave };
  };

  const markAllPresent = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    course.studentIds.forEach((sid) => {
      if (!getStudentStatus(courseId, sid)) {
        takeAttendance(courseId, sid, 'present');
      }
    });
    Taro.showToast({ title: '已全部标记出勤', icon: 'success' });
  };

  const resetAttendance = (courseId: string) => {
    Taro.showModal({
      title: '确认重置',
      content: '确定要重置本节课所有点名状态吗？所有已扣课时会加回来。',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          resetAttendanceStore(courseId);
          Taro.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <ScrollView scrollX className={styles.dateTabs}>
        {dateTabs.map((tab, idx) => (
          <View
            key={tab.date}
            className={classnames(styles.dateTab, activeDateIdx === idx && styles.active)}
            onClick={() => setActiveDateIdx(idx)}
          >
            <Text className={styles.dateTabDay}>{tab.day}</Text>
            <Text className={styles.dateTabDate}>{tab.dateStr}</Text>
          </View>
        ))}
      </ScrollView>

      {todayCourses.length > 0 ? (
        todayCourses.map((course) => {
          const { total, present, absent, leave } = getProgress(course.id);
          const done = present + absent + leave;

          return (
            <View key={course.id} className={styles.courseSection}>
              <View
                onClick={() => Taro.navigateTo({ url: `/pages/courseDetail/index?id=${course.id}` })}
              >
                <CourseCard course={course} showDate compact />
              </View>

              <View className={styles.progressCard}>
                <View className={styles.progressRow}>
                  <Text className={styles.progressTitle}>
                    点名进度 {done}/{total}
                  </Text>
                  <View className={styles.progressStats}>
                    <View className={styles.progressStat}>
                      <View className={styles.progressDot} style={{ background: '#10B981' }} />
                      <Text className={styles.progressLabel}>出勤</Text>
                      <Text className={styles.progressNum}>{present}</Text>
                    </View>
                    <View className={styles.progressStat}>
                      <View className={styles.progressDot} style={{ background: '#EF4444' }} />
                      <Text className={styles.progressLabel}>缺勤</Text>
                      <Text className={styles.progressNum}>{absent}</Text>
                    </View>
                    <View className={styles.progressStat}>
                      <View className={styles.progressDot} style={{ background: '#F59E0B' }} />
                      <Text className={styles.progressLabel}>请假</Text>
                      <Text className={styles.progressNum}>{leave}</Text>
                    </View>
                  </View>
                </View>
                <View className={styles.progressBar}>
                  <View
                    className={styles.progressSegment}
                    style={{
                      width: total ? `${(present / total) * 100}%` : '0%',
                      background: '#10B981'
                    }}
                  />
                  <View
                    className={styles.progressSegment}
                    style={{
                      width: total ? `${(absent / total) * 100}%` : '0%',
                      background: '#EF4444'
                    }}
                  />
                  <View
                    className={styles.progressSegment}
                    style={{
                      width: total ? `${(leave / total) * 100}%` : '0%',
                      background: '#F59E0B'
                    }}
                  />
                </View>
              </View>

              <View className={styles.quickActionBar}>
                <View className={styles.quickBtn} onClick={() => markAllPresent(course.id)}>
                  <Text className={styles.quickBtnIcon}>✅</Text>
                  <Text className={styles.quickBtnText}>一键全勤</Text>
                </View>
                <View className={styles.quickBtn} onClick={() => resetAttendance(course.id)}>
                  <Text className={styles.quickBtnIcon}>🔄</Text>
                  <Text className={styles.quickBtnText}>重置</Text>
                </View>
              </View>

              <View className={styles.studentList}>
                {course.studentIds.map((sid, idx) => {
                  const student = students.find((s) => s.id === sid);
                  if (!student) return null;
                  const status = getStudentStatus(course.id, sid);
                  const isWarn = student.remainingLessons > 0 && student.remainingLessons <= 2;
                  const isDanger = student.remainingLessons <= 0;
                  const color = avatarColors[idx % avatarColors.length];

                  return (
                    <View key={sid} className={styles.studentItem}>
                      <View className={styles.studentAvatar} style={{ background: color }}>
                        {student.name.charAt(0)}
                      </View>
                      <View className={styles.studentInfo}>
                        <View className={styles.studentNameRow}>
                          <Text className={styles.studentName}>{student.name}</Text>
                          <Text
                            className={classnames(
                              styles.remainBadge,
                              !isWarn && !isDanger && 'normal',
                              isWarn && 'warning',
                              isDanger && 'danger'
                            )}
                          >
                            剩{student.remainingLessons}节
                          </Text>
                        </View>
                        <Text className={styles.studentPhone}>
                          {CLASS_TYPE_MAP[student.classType]} · {student.parentPhone}
                        </Text>
                      </View>
                      <View className={styles.statusBtns}>
                        {(['present', 'absent', 'leave'] as const).map((s) => (
                          <Text
                            key={s}
                            className={classnames(
                              styles.statusBtn,
                              styles[s],
                              status === s && 'active'
                            )}
                            onClick={() => takeAttendance(course.id, sid, s)}
                          >
                            {s === 'present' ? '出' : s === 'absent' ? '缺' : '假'}
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })
      ) : (
        <EmptyState
          icon="📝"
          title={`${dateTabs[activeDateIdx].day}暂无课程`}
          description="切换日期或去「排课」页面添加新课程"
        />
      )}
    </ScrollView>
  );
};

export default AttendancePage;
