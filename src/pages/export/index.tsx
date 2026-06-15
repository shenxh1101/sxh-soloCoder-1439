import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import { useAppStore } from '@/store/appStore';
import {
  ClassType,
  CLASS_TYPE_MAP,
  WARNING_LESSON_THRESHOLD,
  RechargeRecord
} from '@/types';
import {
  ExportItem,
  buildRemainingLessonsExport,
  buildBatchRemainingLessons,
  buildBatchAttendanceByDate,
  buildAttendanceExport,
  buildRechargeExport,
  copyMultipleToClipboard,
  exportSingle
} from '@/utils/export';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

type TabKey = 'lessons' | 'attendance' | 'recharge';

const ExportPage: React.FC = () => {
  const students = useAppStore((s) => s.students);
  const courses = useAppStore((s) => s.courses);
  const rechargeRecords = useAppStore((s) => s.rechargeRecords);
  const attendanceRecords = useAppStore((s) => s.attendanceRecords);
  const getLastRechargeByStudent = useAppStore((s) => s.getLastRechargeByStudent);

  const [activeTab, setActiveTab] = useState<TabKey>('lessons');
  const [classFilter, setClassFilter] = useState<ClassType | 'all'>('all');
  const [attendanceDate, setAttendanceDate] = useState(dayjs().format('YYYY-MM-DD'));

  const lastRecharges = useMemo(() => {
    const map: Record<string, RechargeRecord | undefined> = {};
    students.forEach((s) => {
      map[s.id] = getLastRechargeByStudent(s.id);
    });
    return map;
  }, [students, rechargeRecords]);

  const lessonsResults = useMemo<ExportItem[]>(() => {
    if (classFilter === 'all') {
      return buildBatchRemainingLessons(students, lastRecharges);
    }
    return [buildRemainingLessonsExport(students, lastRecharges, classFilter)];
  }, [students, lastRecharges, classFilter]);

  const attendanceResults = useMemo<ExportItem[]>(() => {
    return buildBatchAttendanceByDate(attendanceDate, courses, students, attendanceRecords);
  }, [attendanceDate, courses, students, attendanceRecords]);

  const rechargeResults = useMemo<ExportItem[]>(() => {
    if (classFilter === 'all') {
      const all = buildRechargeExport(students, rechargeRecords);
      const result: ExportItem[] = [all];
      (['piano', 'art', 'dance', 'calligraphy'] as ClassType[]).forEach((ct) => {
        const count = students.filter((s) => s.classType === ct).length;
        if (count > 0) {
          result.push(buildRechargeExport(students, rechargeRecords, ct));
        }
      });
      return result;
    }
    return [buildRechargeExport(students, rechargeRecords, classFilter)];
  }, [students, rechargeRecords, classFilter]);

  const currentResults = useMemo(() => {
    switch (activeTab) {
      case 'lessons':
        return lessonsResults;
      case 'attendance':
        return attendanceResults;
      case 'recharge':
        return rechargeResults;
      default:
        return [];
    }
  }, [activeTab, lessonsResults, attendanceResults, rechargeResults]);

  const totalCount = useMemo(() => {
    return currentResults.reduce((s, r) => s + r.count, 0);
  }, [currentResults]);

  const handleCopyAll = async () => {
    await copyMultipleToClipboard(currentResults);
  };

  const handleCopyOne = async (item: ExportItem) => {
    await exportSingle(item);
  };

  const prevDay = () => {
    setAttendanceDate(dayjs(attendanceDate).subtract(1, 'day').format('YYYY-MM-DD'));
  };

  const nextDay = () => {
    setAttendanceDate(dayjs(attendanceDate).add(1, 'day').format('YYYY-MM-DD'));
  };

  const classOptions: (ClassType | 'all')[] = ['all', 'piano', 'art', 'dance', 'calligraphy'];

  const warnStudents = students.filter(
    (s) => s.remainingLessons > 0 && s.remainingLessons <= WARNING_LESSON_THRESHOLD
  ).length;
  const usedUpStudents = students.filter((s) => s.remainingLessons <= 0).length;

  const todayCourses = courses.filter((c) => c.date === dayjs().format('YYYY-MM-DD')).length;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>📊 数据导出中心</Text>
        <Text className={styles.headerDesc}>
          一键导出学生课时、点名表和续费记录，支持按班级/日期筛选，
          复制到 Excel 即可查看和打印。
        </Text>
      </View>

      <View className={styles.tabs}>
        {[
          { key: 'lessons' as TabKey, label: '📚 剩余课时' },
          { key: 'attendance' as TabKey, label: '✅ 点名表' },
          { key: 'recharge' as TabKey, label: '💳 续费记录' }
        ].map((tab) => (
          <Text
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </View>

      {activeTab === 'lessons' && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>剩余课时清单</Text>
          <Text className={styles.sectionSubtitle}>
            按剩余课时从少到多排序，导出后可直接发给前台做续费提醒
          </Text>

          <View className={styles.statBadges}>
            <View className={styles.statBadge}>
              总学生
              <Text className={styles.statBadgeNum}>{students.length}</Text>
            </View>
            <View className={styles.statBadge}>
              待续费
              <Text className={styles.statBadgeNum}>{warnStudents}</Text>
            </View>
            <View className={styles.statBadge}>
              已用完
              <Text className={styles.statBadgeNum}>{usedUpStudents}</Text>
            </View>
          </View>

          <Text className={styles.label}>按班级筛选：</Text>
          <View className={styles.classPicker}>
            {classOptions.map((opt) => (
              <Text
                key={opt}
                className={classnames(
                  styles.classChip,
                  classFilter === opt && styles.active
                )}
                onClick={() => setClassFilter(opt)}
              >
                {opt === 'all' ? '全部班级' : CLASS_TYPE_MAP[opt]}
              </Text>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'attendance' && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>课程点名表</Text>
          <Text className={styles.sectionSubtitle}>
            选择日期导出当天所有课程的点名表，含课前/课后剩余课时
          </Text>

          <View className={styles.statBadges}>
            <View className={styles.statBadge}>
              当日课程
              <Text className={styles.statBadgeNum}>{attendanceResults.length - 1}</Text>
            </View>
            <View className={styles.statBadge}>
              覆盖学生
              <Text className={styles.statBadgeNum}>{totalCount}</Text>
            </View>
          </View>

          <Text className={styles.label}>选择日期：</Text>
          <View className={styles.toolBar}>
            <View className={styles.dateNavBtn} onClick={prevDay}>
              ‹
            </View>
            <View className={styles.datePicker}>
              📅 {dayjs(attendanceDate).format('YYYY年M月D日')}
              {attendanceDate === dayjs().format('YYYY-MM-DD') && ' (今天)'}
            </View>
            <View className={styles.dateNavBtn} onClick={nextDay}>
              ›
            </View>
          </View>

          <View className={styles.classPicker}>
            {[
              { v: dayjs().format('YYYY-MM-DD'), l: '今天' },
              { v: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), l: '昨天' },
              { v: dayjs().add(1, 'day').format('YYYY-MM-DD'), l: '明天' },
              { v: dayjs().add(7, 'day').format('YYYY-MM-DD'), l: '一周后' }
            ].map((d) => (
              <Text
                key={d.v}
                className={classnames(
                  styles.classChip,
                  attendanceDate === d.v && styles.active
                )}
                onClick={() => setAttendanceDate(d.v)}
              >
                {d.l}
              </Text>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'recharge' && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>续费记录</Text>
          <Text className={styles.sectionSubtitle}>
            查看所有学生的续费历史，方便对账和统计续费金额
          </Text>

          <View className={styles.statBadges}>
            <View className={styles.statBadge}>
              续费记录
              <Text className={styles.statBadgeNum}>{rechargeRecords.length}</Text>
            </View>
            <View className={styles.statBadge}>
              总节数
              <Text className={styles.statBadgeNum}>
                {rechargeRecords.reduce((s, r) => s + r.amount, 0)}
              </Text>
            </View>
          </View>

          <Text className={styles.label}>按班级筛选：</Text>
          <View className={styles.classPicker}>
            {classOptions.map((opt) => (
              <Text
                key={opt}
                className={classnames(
                  styles.classChip,
                  classFilter === opt && styles.active
                )}
                onClick={() => setClassFilter(opt)}
              >
                {opt === 'all' ? '全部班级' : CLASS_TYPE_MAP[opt]}
              </Text>
            ))}
          </View>
        </View>
      )}

      {currentResults.length > 0 && (
        <View className={styles.batchBar}>
          <View>
            <Text className={styles.batchInfo}>共 {currentResults.length} 份文件</Text>
            <Text className={styles.batchCount}> {totalCount} 条记录</Text>
          </View>
          <Button className={styles.batchBtn} onClick={handleCopyAll}>
            📋 一键全部复制
          </Button>
        </View>
      )}

      <View className={styles.resultList}>
        {currentResults.length > 0 ? (
          currentResults.map((item, idx) => (
            <View
              key={idx}
              className={classnames(styles.resultItem, item.type)}
            >
              <Text className={styles.resultIcon}>
                {item.type === 'lessons'
                  ? '📚'
                  : item.type === 'attendance'
                  ? '✅'
                  : '💳'}
              </Text>
              <View className={styles.resultMeta}>
                <Text className={styles.resultName}>{item.name}</Text>
                <Text className={styles.resultDesc}>{item.description}</Text>
              </View>
              <Text className={styles.resultCount}>{item.count}</Text>
              <Button
                className={styles.copyBtn}
                onClick={() => handleCopyOne(item)}
              >
                复制
              </Button>
            </View>
          ))
        ) : (
          <View className={styles.emptyResults}>
            <Text className={styles.emptyText}>
              📭 当前筛选条件下暂无数据
              {'\n'}
              试试切换班级或日期看看
            </Text>
          </View>
        )}
      </View>

      <View className={styles.tipBox}>
        <Text className={styles.tipTitle}>💡 使用说明</Text>
        <View className={styles.tipList}>
          <Text className={styles.tipItem}>
            1. 点击「复制」按钮可单独复制一份文件内容
          </Text>
          <Text className={styles.tipItem}>
            2. 点击「一键全部复制」可复制所有文件内容（带分隔线）
          </Text>
          <Text className={styles.tipItem}>
            3. 复制后打开 Excel / WPS，粘贴后使用「数据 → 分列 → 分隔符号 → 逗号」即可
          </Text>
          <Text className={styles.tipItem}>
            4. 建议每一份导出单独保存为一个 .csv 文件，方便管理
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ExportPage;
