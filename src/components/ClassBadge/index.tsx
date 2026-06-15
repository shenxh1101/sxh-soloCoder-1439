import React from 'react';
import { View, Text } from '@tarojs/components';
import { ClassType, CLASS_TYPE_MAP } from '@/types';
import styles from './index.module.scss';
import classnames from 'classnames';

interface ClassBadgeProps {
  classType: ClassType;
  size?: 'sm' | 'md';
}

const ClassBadge: React.FC<ClassBadgeProps> = ({ classType, size = 'sm' }) => {
  return (
    <View className={classnames(styles.badge, styles[classType], styles[size])}>
      <Text className={styles.text}>{CLASS_TYPE_MAP[classType]}</Text>
    </View>
  );
};

export default ClassBadge;
