import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Student, AGE_GROUP_MAP, WARNING_LESSON_THRESHOLD } from '@/types';
import ClassBadge from '@/components/ClassBadge';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
  showWarning?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, showWarning = true }) => {
  const isWarning = showWarning && student.remainingLessons > 0 && student.remainingLessons <= WARNING_LESSON_THRESHOLD;
  const isExhausted = student.remainingLessons <= 0;

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.makePhoneCall({
      phoneNumber: student.parentPhone
    }).catch((err) => console.error('[Call] Failed:', err));
  };

  return (
    <View
      className={classnames(
        styles.card,
        isWarning && styles.warning,
        isExhausted && styles.exhausted
      )}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{student.name}</Text>
          <ClassBadge classType={student.classType} size="sm" />
        </View>
        <View className={styles.ageTag}>
          <Text className={styles.ageText}>{AGE_GROUP_MAP[student.ageGroup]}</Text>
        </View>
      </View>

      <View className={styles.phoneRow} onClick={handleCall}>
        <View className={styles.phoneIcon}>
          <Text className={styles.phoneIconText}>📞</Text>
        </View>
        <Text className={styles.phone}>{student.parentPhone}</Text>
      </View>

      <View className={styles.lessonRow}>
        <View className={styles.lessonInfo}>
          <Text className={styles.lessonLabel}>剩余课时</Text>
          <Text
            className={classnames(
              styles.lessonValue,
              isWarning && styles.warningValue,
              isExhausted && styles.exhaustedValue
            )}
          >
            {student.remainingLessons}节
          </Text>
        </View>
        <View className={styles.progressWrap}>
          <View className={styles.progressBar}>
            <View
              className={classnames(
                styles.progressFill,
                isWarning && styles.progressWarning,
                isExhausted && styles.progressExhausted
              )}
              style={{ width: `${Math.min(100, (student.usedLessons / student.totalLessons) * 100)}%` }}
            />
          </View>
          <Text className={styles.progressText}>
            {student.usedLessons}/{student.totalLessons}节
          </Text>
        </View>
      </View>

      {isWarning && (
        <View className={styles.warningBanner}>
          <Text className={styles.warningText}>⚠️ 课时不足，请提醒家长续费</Text>
        </View>
      )}
      {isExhausted && (
        <View className={styles.exhaustedBanner}>
          <Text className={styles.exhaustedText}>❌ 课时已用完，请尽快续费</Text>
        </View>
      )}
    </View>
  );
};

export default StudentCard;
