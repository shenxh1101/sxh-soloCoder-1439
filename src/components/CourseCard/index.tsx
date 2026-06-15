import React from 'react';
import { View, Text } from '@tarojs/components';
import { Course, CLASSROOM_MAP, AGE_GROUP_MAP } from '@/types';
import ClassBadge from '@/components/ClassBadge';
import styles from './index.module.scss';
import classnames from 'classnames';
import dayjs from 'dayjs';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
  showDate?: boolean;
  compact?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, showDate = false, compact = false }) => {
  const isToday = course.date === dayjs().format('YYYY-MM-DD');
  const isPast = dayjs(course.date).isBefore(dayjs(), 'day');

  return (
    <View
      className={classnames(
        styles.card,
        course.classType,
        compact && styles.compact,
        isPast && styles.past
      )}
      onClick={onClick}
    >
      <View className={styles.leftBar} />
      <View className={styles.content}>
        <View className={styles.header}>
          <ClassBadge classType={course.classType} size={compact ? 'sm' : 'md'} />
          <View className={styles.classroomTag}>
            <Text className={styles.classroomText}>{CLASSROOM_MAP[course.classroom]}</Text>
          </View>
        </View>

        <View className={styles.timeRow}>
          <Text className={styles.time}>{course.startTime} - {course.endTime}</Text>
          {showDate && (
            <Text className={classnames(styles.date, isToday && styles.todayDate)}>
              {isToday ? '今天' : course.date}
            </Text>
          )}
        </View>

        {!compact && (
          <>
            <View className={styles.infoRow}>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>老师</Text>
                <Text className={styles.infoValue}>{course.teacher}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>年龄段</Text>
                <Text className={styles.infoValue}>{AGE_GROUP_MAP[course.ageGroup]}</Text>
              </View>
            </View>
            <View className={styles.studentRow}>
              <Text className={styles.studentCount}>👥 {course.studentIds.length}名学生</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default CourseCard;
