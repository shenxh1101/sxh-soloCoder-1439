import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { ClassType, AgeGroup, CLASS_TYPE_MAP, AGE_GROUP_MAP, CLASSROOM_MAP, WARNING_LESSON_THRESHOLD } from '@/types';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const timeSlots = [
  { start: '09:00', end: '10:00', label: '上午第一节' },
  { start: '10:00', end: '11:00', label: '上午第二节' },
  { start: '11:00', end: '12:00', label: '上午第三节' },
  { start: '14:00', end: '15:00', label: '下午第一节' },
  { start: '15:00', end: '16:00', label: '下午第二节' },
  { start: '16:00', end: '17:00', label: '下午第三节' },
  { start: '14:30', end: '16:00', label: '下午长课90分' },
  { start: '09:00', end: '10:30', label: '上午长课90分' },
];

const AddCoursePage: React.FC = () => {
  const students = useAppStore((s) => s.students);
  const courses = useAppStore((s) => s.courses);
  const addCourse = useAppStore((s) => s.addCourse);
  const checkTimeConflict = useAppStore((s) => s.checkTimeConflict);

  const [classType, setClassType] = useState<ClassType>('piano');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-8');
  const [classroom, setClassroom] = useState<'A' | 'B' | 'C'>('A');
  const [teacher, setTeacher] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const isConflict = useMemo(() => {
    return checkTimeConflict(classroom, date, startTime, endTime);
  }, [courses, classroom, date, startTime, endTime]);

  const conflictInfo = useMemo(() => {
    if (!isConflict) return null;
    return courses.find(
      (c) => c.classroom === classroom && c.date === date &&
      !(c.endTime <= startTime || c.startTime >= endTime)
    );
  }, [isConflict, courses, classroom, date, startTime, endTime]);

  const availableStudents = useMemo(() => {
    return students.filter(
      (s) => s.classType === classType && s.ageGroup === ageGroup
    );
  }, [students, classType, ageGroup]);

  const classOptions: ClassType[] = ['piano', 'art', 'dance', 'calligraphy'];
  const ageOptions: AgeGroup[] = ['3-5', '6-8', '9-12', '13+'];

  useEffect(() => {
    setSelectedStudents([]);
  }, [classType, ageGroup]);

  const toggleStudent = (sid: string) => {
    setSelectedStudents((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudents.map((s) => s.id));
    }
  };

  const quickDates = useMemo(() => {
    return [0, 1, 2, 6].map((offset) => {
      const d = dayjs().add(offset, 'day');
      return {
        value: d.format('YYYY-MM-DD'),
        label: offset === 0 ? '今天' : offset === 1 ? '明天' : offset === 2 ? '后天' : '下周日',
        date: d.format('M月D日'),
        week: ['日', '一', '二', '三', '四', '五', '六'][d.day()]
      };
    });
  }, []);

  const handleSlotSelect = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleSubmit = () => {
    if (!teacher.trim()) {
      Taro.showToast({ title: '请输入授课老师', icon: 'none' });
      return;
    }
    if (!date) {
      Taro.showToast({ title: '请选择上课日期', icon: 'none' });
      return;
    }
    if (!startTime || !endTime) {
      Taro.showToast({ title: '请选择上课时间', icon: 'none' });
      return;
    }
    if (isConflict) {
      Taro.showToast({ title: '该教室时间冲突，请调整', icon: 'none' });
      return;
    }
    if (selectedStudents.length === 0) {
      Taro.showModal({
        title: '未选择学生',
        content: '当前还没有添加任何学生到这节课，确定继续吗？',
        success: (res) => {
          if (res.confirm) doSubmit();
        }
      });
      return;
    }
    doSubmit();
  };

  const doSubmit = () => {
    const result = addCourse({
      classType,
      ageGroup,
      classroom,
      teacher: teacher.trim(),
      date,
      startTime,
      endTime,
      studentIds: selectedStudents
    });
    if (result.success) {
      Taro.showToast({ title: '排课成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } else {
      Taro.showToast({ title: result.message || '排课失败', icon: 'none' });
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.formCard}>
        <Text className={styles.cardTitle}>🎯 课程类型</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>课程班级
          </Text>
          <View className={styles.optionGrid}>
            {classOptions.map((opt) => (
              <View
                key={opt}
                className={classnames(styles.optionItem, classType === opt && styles.active)}
                onClick={() => setClassType(opt)}
              >
                <Text className={styles.optionLabel}>
                  {opt === 'piano' ? '🎹' : opt === 'art' ? '🎨' : opt === 'dance' ? '💃' : '✍️'}
                </Text>
                <Text className={styles.optionValue}>{CLASS_TYPE_MAP[opt]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>年龄段
          </Text>
          <View className={styles.optionGrid3}>
            {ageOptions.map((opt) => (
              <View
                key={opt}
                className={classnames(styles.optionItem, ageGroup === opt && styles.active)}
                onClick={() => setAgeGroup(opt)}
              >
                <Text className={classnames(styles.optionLabel, ageGroup === opt && styles.active)}>
                  {AGE_GROUP_MAP[opt]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.cardTitle}>📍 时间与教室</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>授课老师
          </Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              placeholder="请输入老师姓名，如：李老师"
              value={teacher}
              onInput={(e) => setTeacher(e.detail.value)}
              maxlength={10}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>上课日期
          </Text>
          <View className={styles.dateRow}>
            {quickDates.map((d) => (
              <View
                key={d.value}
                className={classnames(styles.dateCell, date === d.value && styles.active)}
                onClick={() => setDate(d.value)}
              >
                <Text className={classnames(styles.dateCellLabel, date === d.value && styles.active)}>
                  {d.label} · 周{d.week}
                </Text>
                <Text className={classnames(styles.dateCellValue, date === d.value && styles.active)}>
                  {d.date}
                </Text>
              </View>
            ))}
          </View>
          <View className={styles.dateRow} style={{ marginTop: 16 }}>
            <View className={styles.inputWrap} style={{ flex: 1 }}>
              <Input
                className={styles.input}
                type="number"
                placeholder="或选择日期 YYYY-MM-DD"
                value={date}
                onInput={(e) => setDate(e.detail.value)}
              />
            </View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>选择教室
          </Text>
          <View className={styles.optionGrid3}>
            {(['A', 'B', 'C'] as const).map((opt) => (
              <View
                key={opt}
                className={classnames(
                  styles.optionItem,
                  classroom === opt && styles.active,
                  isConflict && classroom === opt && styles.warning
                )}
                onClick={() => setClassroom(opt)}
              >
                <Text className={styles.optionLabel}>教室</Text>
                <Text className={styles.optionValue}>{CLASSROOM_MAP[opt]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>上课时段
          </Text>
          <View className={styles.timeSlots}>
            {timeSlots.map((slot, idx) => {
              const hasConflictForSlot = checkTimeConflict(classroom, date, slot.start, slot.end);
              const isSelected = startTime === slot.start && endTime === slot.end;
              return (
                <View
                  key={idx}
                  className={classnames(
                    styles.slotItem,
                    isSelected && styles.active
                  )}
                  onClick={() => handleSlotSelect(slot.start, slot.end)}
                >
                  <Text className={classnames(styles.slotTime, isSelected && styles.active)}>
                    {slot.start} - {slot.end}
                  </Text>
                  <Text className={styles.slotLabel}>
                    {slot.label}
                    {hasConflictForSlot && !isSelected && ' ⚠️冲突'}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text className={styles.tip}>
            💡 已选择 {startTime} - {endTime}（
            {Math.round((parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) -
              parseInt(startTime.split(':')[0]) * 60 - parseInt(startTime.split(':')[1])) / 60)}小时）
          </Text>

          {isConflict && conflictInfo && (
            <View className={styles.conflictBox}>
              <Text className={styles.conflictTitle}>⚠️ 时间冲突</Text>
              <Text className={styles.conflictDesc}>
                {CLASSROOM_MAP[conflictInfo.classroom]} 在此时段已有安排：
                {'\n'}{CLASS_TYPE_MAP[conflictInfo.classType]}（{AGE_GROUP_MAP[conflictInfo.ageGroup]}）
                {'\n'}{conflictInfo.startTime} - {conflictInfo.endTime} · {conflictInfo.teacher}
                {'\n'}请更换教室或调整时间段。
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.formCard}>
        <View className={styles.studentHeader}>
          <Text className={styles.label}>👥 选择学生</Text>
          <Text
            className={styles.selectCount}
            onClick={selectAllStudents}
          >
            {selectedStudents.length === availableStudents.length && availableStudents.length > 0
              ? '取消全选'
              : '全选全部'}
          </Text>
        </View>

        {availableStudents.length > 0 ? (
          <View className={styles.studentList}>
            {availableStudents.map((s) => {
              const isWarn = s.remainingLessons > 0 && s.remainingLessons <= WARNING_LESSON_THRESHOLD;
              const isDanger = s.remainingLessons <= 0;
              const selected = selectedStudents.includes(s.id);
              return (
                <View
                  key={s.id}
                  className={classnames(styles.studentItem, selected && styles.selected)}
                  onClick={() => toggleStudent(s.id)}
                >
                  <View className={classnames(styles.checkbox, selected && styles.selected)}>
                    {selected && <Text className={styles.checkIcon}>✓</Text>}
                  </View>
                  <View className={styles.studentMeta}>
                    <Text className={styles.studentName}>{s.name}</Text>
                    <Text className={styles.studentDesc}>{s.parentPhone} · {s.usedLessons}/{s.totalLessons}节</Text>
                  </View>
                  <Text
                    className={classnames(
                      styles.remainBadge,
                      !isWarn && !isDanger && 'normal',
                      isWarn && 'warning',
                      isDanger && 'danger'
                    )}
                  >
                    剩{s.remainingLessons}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ padding: 48, textAlign: 'center' }}>
            <Text style={{ fontSize: 24, color: '#94A3B8' }}>
              当前班级下暂无学生，请先在"学生"页面添加对应班级的学生
            </Text>
          </View>
        )}

        <Text className={styles.tip}>
          已选择 {selectedStudents.length} / {availableStudents.length} 名学生。
          只有被选中的学生会出现在点名表中。
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.btn, 'secondary')}
          onClick={() => Taro.navigateBack()}
        >
          取消
        </Button>
        <Button
          className={classnames(styles.btn, 'primary')}
          onClick={handleSubmit}
        >
          {isConflict ? '时间冲突' : '确认排课'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default AddCoursePage;
