import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Student, CLASS_TYPE_MAP } from '@/types';
import styles from './index.module.scss';

interface WarningCardProps {
  student: Student;
  onViewDetail?: () => void;
}

const WarningCard: React.FC<WarningCardProps> = ({ student, onViewDetail }) => {
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.makePhoneCall({
      phoneNumber: student.parentPhone
    }).catch((err) => console.error('[Call] Failed:', err));
  };

  return (
    <View className={styles.card} onClick={onViewDetail}>
      <View className={styles.icon}>
        <Text className={styles.iconText}>⚠️</Text>
      </View>
      <View className={styles.info}>
        <View className={styles.topRow}>
          <Text className={styles.name}>{student.name}</Text>
          <Text className={styles.classTag}>{CLASS_TYPE_MAP[student.classType]}</Text>
        </View>
        <Text className={styles.warnText}>
          剩余 <Text className={styles.remainCount}>{student.remainingLessons}</Text> 节课，建议尽快续费
        </Text>
      </View>
      <View className={styles.callBtn} onClick={handleCall}>
        <Text className={styles.callText}>📞</Text>
      </View>
    </View>
  );
};

export default WarningCard;
