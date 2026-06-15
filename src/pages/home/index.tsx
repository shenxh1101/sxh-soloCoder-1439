import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import CourseCard from '@/components/CourseCard';
import WarningCard from '@/components/WarningCard';
import EmptyState from '@/components/EmptyState';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const students = useAppStore((s) => s.students);
  const courses = useAppStore((s) => s.courses);
  const warningStudents = useAppStore((s) => s.getWarningStudents());
  const getCoursesByDate = useAppStore((s) => s.getCoursesByDate);

  const today = dayjs().format('YYYY-MM-DD');
  const todayCourses = useMemo(() => getCoursesByDate(today), [courses, today]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const warningCount = warningStudents.length;
    const todayCourseCount = todayCourses.length;
    const exhausted = students.filter((s) => s.remainingLessons <= 0).length;
    return { totalStudents, warningCount, todayCourseCount, exhausted };
  }, [students, warningStudents, todayCourses]);

  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs().day()];
  const dateStr = `${dayjs().format('M月D日')} ${weekday}`;

  const quickActions = [
    { icon: '👤', label: '添加学生', bg: '#EEF2FF', action: () => Taro.navigateTo({ url: '/pages/addStudent/index' }) },
    { icon: '📅', label: '新增排课', bg: '#F0FDF4', action: () => Taro.navigateTo({ url: '/pages/addCourse/index' }) },
    { icon: '✅', label: '快速点名', bg: '#FEF3C7', action: () => Taro.switchTab({ url: '/pages/attendance/index' }) },
    { icon: '📊', label: '数据导出', bg: '#FCE7F3', action: () => Taro.navigateTo({ url: '/pages/export/index' }) }
  ];

  useDidShow(() => {});

  return (
    <ScrollView
      className={styles.page}
      scrollY
      onScrollToUpper={() => {}}
      refresherEnabled
      onRefresherrefresh={() => {
        setTimeout(() => Taro.stopPullDownRefresh(), 500);
      }}
    >
      <View className={styles.hero}>
        <Text className={styles.greeting}>👋 欢迎回来，今天也要加油哦~</Text>
        <Text className={styles.dateText}>{dateStr}</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.totalStudents}</Text>
            <Text className={styles.statLabel}>总学生</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.todayCourseCount}</Text>
            <Text className={styles.statLabel}>今日课</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.warningCount}</Text>
            <Text className={styles.statLabel}>待续费</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.exhausted}</Text>
            <Text className={styles.statLabel}>已用完</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>快捷操作</Text>
          </View>
          <View className={styles.quickGrid}>
            {quickActions.map((item, idx) => (
              <View key={idx} className={styles.quickItem} onClick={item.action}>
                <View className={styles.quickIcon} style={{ background: item.bg }}>
                  <Text>{item.icon}</Text>
                </View>
                <Text className={styles.quickText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {warningStudents.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                🔔 续费提醒
                {warningStudents.length > 0 && (
                  <View className={styles.sectionBadge}>{warningStudents.length}</View>
                )}
              </Text>
              <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/students/index' })}>
                查看全部 →
              </Text>
            </View>
            {warningStudents.slice(0, 3).map((s) => (
              <WarningCard
                key={s.id}
                student={s}
                onViewDetail={() => Taro.navigateTo({ url: `/pages/studentDetail/index?id=${s.id}` })}
              />
            ))}
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📚 今日课程</Text>
            <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/schedule/index' })}>
              查看全部 →
            </Text>
          </View>
          {todayCourses.length > 0 ? (
            <View className={styles.courseList}>
              {todayCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onClick={() => Taro.navigateTo({ url: `/pages/courseDetail/index?id=${c.id}` })}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="📅"
              title="今日暂无课程"
              description="点击上方「新增排课」开始添加今天的课程吧"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
