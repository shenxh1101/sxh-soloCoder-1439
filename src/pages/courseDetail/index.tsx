import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { CLASS_TYPE_MAP, CLASSROOM_MAP, AGE_GROUP_MAP, WARNING_LESSON_THRESHOLD } from '@/types';
import { exportAttendanceSheet } from '@/utils/export';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const avatarColors = ['#6366F1', '#EC4899', '#F97316', '#78350F', '#10B981', '#06B6D4', '#8B5CF6'];

const statusLabels: Record<string, string> = {
  present: '出勤',
  absent: '缺勤',
  leave: '请假',
  none: '未点名'
};

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id as string;
  const course = useAppStore((s) => s.getCourseById(id));
  const students = useAppStore((s) => s.students);
  const attendanceRecords = useAppStore((s) => s.attendanceRecords);
  const getAttendanceByCourse = useAppStore((s) => s.getAttendanceByCourse);
  const deleteCourse = useAppStore((s) => s.deleteCourse);

  const records = useMemo(() => course ? getAttendanceByCourse(course.id) : [], [course, attendanceRecords]);

  const stats = useMemo(() => {
    if (!course) return { total: 0, present: 0, absent: 0, leave: 0 };
    const total = course.studentIds.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    return { total, present, absent, leave };
  }, [course, records]);

  if (!course) {
    return (
      <View className={styles.page}>
        <EmptyState icon="❓" title="课程不存在" description="该课程可能已被删除" />
      </View>
    );
  }

  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs(course.date).day()];

  const handleExport = () => {
    exportAttendanceSheet(course, students, records);
  };

  const handleGoAttendance = () => {
    Taro.switchTab({ url: '/pages/attendance/index' });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除 ${course.date} ${course.startTime} 的 ${CLASS_TYPE_MAP[course.classType]} 课程吗？`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          deleteCourse(course.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 800);
        }
      }
    });
  };

  const getStudentStatus = (sid: string) => {
    const r = records.find((a) => a.studentId === sid);
    return r?.status || 'none';
  };

  return (
    <View className={styles.page}>
      <View className={classnames(styles.header, course.classType)}>
        <View className={styles.courseTitleRow}>
          <Text className={styles.courseTitle}>{CLASS_TYPE_MAP[course.classType]}</Text>
          <Text className={styles.classroomBadge}>{CLASSROOM_MAP[course.classroom]}</Text>
        </View>
        <View className={styles.courseTimeRow}>
          <View className={styles.timeBlock}>
            <Text>📅</Text>
            <Text>{course.date} {weekday}</Text>
          </View>
        </View>
        <View className={styles.courseTimeRow}>
          <View className={styles.timeBlock}>
            <Text>🕐</Text>
            <Text>{course.startTime} - {course.endTime}</Text>
          </View>
        </View>
        <View className={styles.courseMetaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.metaNum}>{stats.total}</Text>
            <Text className={styles.metaLabel}>总人数</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaNum}>{stats.present}</Text>
            <Text className={styles.metaLabel}>已出勤</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaNum}>{stats.absent + stats.leave}</Text>
            <Text className={styles.metaLabel}>未到</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            📋 课程信息
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>授课老师</Text>
            <Text className={styles.infoValue}>{course.teacher}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>年龄段</Text>
            <Text className={styles.infoValue}>{AGE_GROUP_MAP[course.ageGroup]}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>
              {new Date(course.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardTitle}>
            <Text>👥 学生名单</Text>
            <View className={styles.actionBtns}>
              <Text className={classnames(styles.smallBtn, 'export')} onClick={handleExport}>
                导出点名表
              </Text>
            </View>
          </View>
          {course.studentIds.map((sid, idx) => {
            const s = students.find((x) => x.id === sid);
            if (!s) return null;
            const status = getStudentStatus(sid);
            const isWarn = s.remainingLessons > 0 && s.remainingLessons <= WARNING_LESSON_THRESHOLD;
            const isDanger = s.remainingLessons <= 0;
            const color = avatarColors[idx % avatarColors.length];
            return (
              <View
                key={sid}
                className={styles.studentItem}
                onClick={() => Taro.navigateTo({ url: `/pages/studentDetail/index?id=${s.id}` })}
              >
                <View className={styles.avatar} style={{ background: color }}>
                  {s.name.charAt(0)}
                </View>
                <View className={styles.studentInfo}>
                  <View className={styles.nameRow}>
                    <Text className={styles.name}>{s.name}</Text>
                    <Text
                      className={classnames(
                        styles.remainBadge,
                        !isWarn && !isDanger && 'normal',
                        isWarn && 'warning',
                        isDanger && 'danger'
                      )}
                    >
                      剩{s.remainingLessons}节
                    </Text>
                  </View>
                  <Text className={styles.phone}>{s.parentPhone}</Text>
                </View>
                <Text className={classnames(styles.statusTag, status)}>
                  {statusLabels[status]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, 'secondary')} onClick={handleDelete}>
          删除课程
        </Button>
        <Button className={classnames(styles.btn, 'primary')} onClick={handleGoAttendance}>
          去点名
        </Button>
      </View>
    </View>
  );
};

export default CourseDetailPage;
