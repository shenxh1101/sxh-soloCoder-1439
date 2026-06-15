import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { ClassType, CLASS_TYPE_MAP } from '@/types';
import StudentCard from '@/components/StudentCard';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import styles from './index.module.scss';

const StudentsPage: React.FC = () => {
  const students = useAppStore((s) => s.students);
  const [searchText, setSearchText] = useState('');
  const [filterClass, setFilterClass] = useState<ClassType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'warning' | 'exhausted'>('all');

  const classOptions: { key: ClassType | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'piano', label: CLASS_TYPE_MAP.piano },
    { key: 'art', label: CLASS_TYPE_MAP.art },
    { key: 'dance', label: CLASS_TYPE_MAP.dance },
    { key: 'calligraphy', label: CLASS_TYPE_MAP.calligraphy }
  ];

  const statusOptions = [
    { key: 'all', label: '全部状态' },
    { key: 'warning', label: '待续费(≤2节)' },
    { key: 'exhausted', label: '已用完' }
  ];

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (searchText && !s.name.includes(searchText) && !s.parentPhone.includes(searchText)) {
        return false;
      }
      if (filterClass !== 'all' && s.classType !== filterClass) {
        return false;
      }
      if (filterStatus === 'warning' && (s.remainingLessons <= 0 || s.remainingLessons > 2)) {
        return false;
      }
      if (filterStatus === 'exhausted' && s.remainingLessons > 0) {
        return false;
      }
      return true;
    });
  }, [students, searchText, filterClass, filterStatus]);

  const stats = useMemo(() => {
    const normal = students.filter((s) => s.remainingLessons > 2).length;
    const warning = students.filter((s) => s.remainingLessons > 0 && s.remainingLessons <= 2).length;
    const exhausted = students.filter((s) => s.remainingLessons <= 0).length;
    return { normal, warning, exhausted };
  }, [students]);

  return (
    <View className={styles.page}>
      <View className={styles.searchBox}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索学生姓名或家长电话"
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <View className={styles.summaryRow}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryNum}>{stats.normal}</Text>
          <Text className={styles.summaryLabel}>课时充足</Text>
        </View>
        <View className={classnames(styles.summaryCard, styles.summaryWarn)}>
          <Text className={styles.summaryNum}>{stats.warning}</Text>
          <Text className={styles.summaryLabel}>待续费</Text>
        </View>
        <View className={classnames(styles.summaryCard, styles.summaryDanger)}>
          <Text className={styles.summaryNum}>{stats.exhausted}</Text>
          <Text className={styles.summaryLabel}>已用完</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.filterBar}>
        {classOptions.map((opt) => (
          <Text
            key={opt.key}
            className={classnames(styles.filterItem, filterClass === opt.key && styles.active)}
            onClick={() => setFilterClass(opt.key)}
          >
            {opt.label}
          </Text>
        ))}
      </ScrollView>

      <View className={styles.subFilterRow}>
        {statusOptions.map((opt) => (
          <Text
            key={opt.key}
            className={classnames(styles.subFilterItem, filterStatus === opt.key && styles.active)}
            onClick={() => setFilterStatus(opt.key as any)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY style={{ maxHeight: 'calc(100vh - 560rpx)' }}>
        {filtered.length > 0 ? (
          filtered.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              onClick={() => Taro.navigateTo({ url: `/pages/studentDetail/index?id=${s.id}` })}
            />
          ))
        ) : (
          <EmptyState icon="👤" title="暂无学生数据" description="点击右下角按钮添加第一个学生" />
        )}
      </ScrollView>

      <View
        className={styles.fab}
        onClick={() => Taro.navigateTo({ url: '/pages/addStudent/index' })}
      >
        <Text className={styles.fabText}>+</Text>
      </View>
    </View>
  );
};

export default StudentsPage;
