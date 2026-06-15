import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { ClassType, CLASS_TYPE_MAP } from '@/types';
import { exportRemainingLessonsList, exportAttendanceSheet } from '@/utils/export';
import classnames from 'classnames';
import styles from './index.module.scss';

const ExportPage: React.FC = () => {
  const students = useAppStore((s) => s.students);
  const courses = useAppStore((s) => s.courses);
  const attendanceRecords = useAppStore((s) => s.attendanceRecords);
  const getCoursesByDate = useAppStore((s) => s.getCoursesByDate);
  const getAttendanceByCourse = useAppStore((s) => s.getAttendanceByCourse);

  const [filterClass, setFilterClass] = useState<ClassType | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>('today');

  const classOptions: { key: ClassType | 'all'; label: string }[] = [
    { key: 'all', label: '全部班级' },
    { key: 'piano', label: CLASS_TYPE_MAP.piano },
    { key: 'art', label: CLASS_TYPE_MAP.art },
    { key: 'dance', label: CLASS_TYPE_MAP.dance },
    { key: 'calligraphy', label: CLASS_TYPE_MAP.calligraphy }
  ];

  const filteredStudents = useMemo(() => {
    if (filterClass === 'all') return students;
    return students.filter((s) => s.classType === filterClass);
  }, [students, filterClass]);

  const exportLessons = () => {
    exportRemainingLessonsList(filteredStudents);
  };

  const dateCourses = useMemo(() => {
    let date = '';
    switch (filterDate) {
      case 'today':
        date = new Date().toISOString().split('T')[0];
        break;
      case 'yesterday':
        date = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        break;
      case 'tomorrow':
        date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        break;
      default:
        date = filterDate;
    }
    return getCoursesByDate(date);
  }, [courses, filterDate]);

  const exportAllAttendance = () => {
    if (dateCourses.length === 0) {
      Taro.showToast({ title: '当日无课程', icon: 'none' });
      return;
    }
    dateCourses.forEach((c) => {
      const records = getAttendanceByCourse(c.id);
      exportAttendanceSheet(c, students, records);
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>📊 数据导出中心</Text>
        <Text className={styles.headerDesc}>
          支持导出剩余课时清单和每日点名表。{'\n'}
          数据将以CSV格式复制到剪贴板，可直接粘贴到Excel、WPS或其他表格软件中使用。
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>导出剩余课时清单</Text>
        <View className={styles.classPicker}>
          {classOptions.map((opt) => (
            <Text
              key={opt.key}
              className={classnames(styles.classChip, filterClass === opt.key && styles.active)}
              onClick={() => setFilterClass(opt.key)}
            >
              {opt.label}
            </Text>
          ))}
        </View>
        <View className={styles.exportCard}>
          <View className={styles.exportIcon} style={{ background: '#EEF2FF' }}>📋</View>
          <View className={styles.exportInfo}>
            <Text className={styles.exportName}>剩余课时清单</Text>
            <Text className={styles.exportDesc}>
              包含 {filteredStudents.length} 名学生的姓名、班级、课时信息、续费状态等
            </Text>
          </View>
          <Button className={styles.exportBtn} onClick={exportLessons}>
            <Text className={styles.exportBtnText}>导出</Text>
          </Button>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>导出点名表</Text>
        <View className={styles.classPicker}>
          {[
            { key: 'yesterday', label: '昨天' },
            { key: 'today', label: '今天' },
            { key: 'tomorrow', label: '明天' }
          ].map((opt) => (
            <Text
              key={opt.key}
              className={classnames(styles.classChip, filterDate === opt.key && styles.active)}
              onClick={() => setFilterDate(opt.key)}
            >
              {opt.label}
            </Text>
          ))}
        </View>
        <View className={styles.exportCard}>
          <View className={styles.exportIcon} style={{ background: '#FEF3C7' }}>✅</View>
          <View className={styles.exportInfo}>
            <Text className={styles.exportName}>当日全部点名表</Text>
            <Text className={styles.exportDesc}>
              共 {dateCourses.length} 节课，包含学生考勤状态和剩余课时
            </Text>
          </View>
          <Button className={styles.exportBtn} onClick={exportAllAttendance}>
            <Text className={styles.exportBtnText}>导出</Text>
          </Button>
        </View>
        {dateCourses.map((course) => {
          const records = getAttendanceByCourse(course.id);
          return (
            <View
              key={course.id}
              className={styles.exportCard}
              onClick={() => exportAttendanceSheet(course, students, records)}
            >
              <View className={styles.exportIcon} style={{ background: '#D1FAE5' }}>📝</View>
              <View className={styles.exportInfo}>
                <Text className={styles.exportName}>
                  {CLASS_TYPE_MAP[course.classType]} {course.startTime}-{course.endTime}
                </Text>
                <Text className={styles.exportDesc}>
                  教室{course.classroom} · {course.teacher} · {course.studentIds.length}名学生
                </Text>
              </View>
              <Button className={styles.exportBtn}>
                <Text className={styles.exportBtnText}>导出</Text>
              </Button>
            </View>
          );
        })}
      </View>

      <View className={styles.tipBox}>
        <Text className={styles.tipTitle}>💡 使用说明</Text>
        <View className={styles.tipList}>
          <Text className={styles.tipItem}>• 点击导出按钮后，数据会自动复制到系统剪贴板</Text>
          <Text className={styles.tipItem}>• 打开Excel/WPS，粘贴(Ctrl+V)即可生成表格</Text>
          <Text className={styles.tipItem}>• 数据使用UTF-8 BOM编码，中文不会乱码</Text>
          <Text className={styles.tipItem}>• 如需分享给老师，可粘贴后发送文件或截图</Text>
        </View>
      </View>
    </View>
  );
};

export default ExportPage;
