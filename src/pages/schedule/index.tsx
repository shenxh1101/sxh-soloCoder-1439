import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { CLASSROOM_MAP } from '@/types';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const SchedulePage: React.FC = () => {
  const courses = useAppStore((s) => s.courses);
  const getCoursesByWeek = useAppStore((s) => s.getCoursesByWeek);

  const [weekStart, setWeekStart] = useState(() =>
    dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
  );
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [classroomFilter, setClassroomFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');

  const weekDays = useMemo(() => {
    const start = dayjs(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = start.add(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const hasCourse = courses.some((c) => c.date === dateStr);
      return {
        date: dateStr,
        dayName: ['一', '二', '三', '四', '五', '六', '日'][d.day() === 0 ? 6 : d.day() - 1],
        dayNum: d.format('D'),
        isToday: dateStr === dayjs().format('YYYY-MM-DD'),
        hasCourse
      };
    });
  }, [weekStart, courses]);

  const weekCourses = useMemo(() => {
    const list = getCoursesByWeek(weekStart);
    let result = list;
    if (classroomFilter !== 'all') {
      result = result.filter((c) => c.classroom === classroomFilter);
    }
    if (selectedDate) {
      result = result.filter((c) => c.date === selectedDate);
    }
    return result;
  }, [courses, weekStart, classroomFilter, selectedDate]);

  const groupedCourses = useMemo(() => {
    const groups: Record<string, typeof weekCourses> = {};
    weekCourses.forEach((c) => {
      if (!groups[c.date]) groups[c.date] = [];
      groups[c.date].push(c);
    });
    return groups;
  }, [weekCourses]);

  const classroomStats = useMemo(() => {
    const week = getCoursesByWeek(weekStart);
    return {
      all: week.length,
      A: week.filter((c) => c.classroom === 'A').length,
      B: week.filter((c) => c.classroom === 'B').length,
      C: week.filter((c) => c.classroom === 'C').length
    };
  }, [courses, weekStart]);

  const prevWeek = () => {
    setWeekStart(dayjs(weekStart).subtract(7, 'day').format('YYYY-MM-DD'));
  };

  const nextWeek = () => {
    setWeekStart(dayjs(weekStart).add(7, 'day').format('YYYY-MM-DD'));
  };

  const weekTitle = `${dayjs(weekStart).format('M月D日')} - ${dayjs(weekStart).add(6, 'day').format('M月D日')}`;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.weekNav}>
        <View className={styles.weekHeader}>
          <Text className={styles.weekNavBtn} onClick={prevWeek}>‹</Text>
          <Text className={styles.weekTitle}>{weekTitle}</Text>
          <Text className={styles.weekNavBtn} onClick={nextWeek}>›</Text>
        </View>
        <View className={styles.weekDays}>
          {weekDays.map((d) => (
            <View
              key={d.date}
              className={classnames(
                styles.dayItem,
                selectedDate === d.date && styles.active,
                d.isToday && styles.today,
                d.hasCourse && styles.hasCourse
              )}
              onClick={() => setSelectedDate(d.date)}
            >
              <Text className={styles.dayName}>周{d.dayName}</Text>
              <Text className={styles.dayNum}>{d.dayNum}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.classroomTabs}>
        {(['all', 'A', 'B', 'C'] as const).map((key) => (
          <View
            key={key}
            className={classnames(styles.classroomTab, classroomFilter === key && styles.active)}
            onClick={() => setClassroomFilter(key)}
          >
            <Text className={styles.classroomName}>
              {key === 'all' ? '全部教室' : CLASSROOM_MAP[key]}
            </Text>
            <Text className={styles.classroomCount}>{classroomStats[key]}节课</Text>
          </View>
        ))}
      </View>

      <View className={styles.coursesList}>
        {Object.keys(groupedCourses).length > 0 ? (
          Object.entries(groupedCourses).map(([date, list]) => {
            const d = dayjs(date);
            const label = date === dayjs().format('YYYY-MM-DD')
              ? `今天 (${d.format('M月D日')} 周${['日','一','二','三','四','五','六'][d.day()]})`
              : `${d.format('M月D日')} 周${['日','一','二','三','四','五','六'][d.day()]}`;
            return (
              <View key={date} className={styles.dateGroup}>
                <Text className={styles.dateGroupTitle}>{label}</Text>
                {list.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    onClick={() => Taro.navigateTo({ url: `/pages/courseDetail/index?id=${c.id}` })}
                  />
                ))}
              </View>
            );
          })
        ) : (
          <EmptyState
            icon="📅"
            title="当前没有课程安排"
            description="点击右下角按钮添加新课程，系统会自动检查时间冲突"
          />
        )}
      </View>

      <View
        className={styles.fab}
        onClick={() => Taro.navigateTo({ url: '/pages/addCourse/index' })}
      >
        <Text className={styles.fabText}>+</Text>
      </View>
    </ScrollView>
  );
};

export default SchedulePage;
