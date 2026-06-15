import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { CLASS_TYPE_MAP, AGE_GROUP_MAP, WARNING_LESSON_THRESHOLD } from '@/types';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import styles from './index.module.scss';

const avatarColors = ['#6366F1', '#EC4899', '#F97316', '#78350F', '#10B981', '#06B6D4'];

const StudentDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id as string;
  const student = useAppStore((s) => s.getStudentById(id));
  const courses = useAppStore((s) => s.courses);
  const attendanceRecords = useAppStore((s) => s.attendanceRecords);
  const updateStudent = useAppStore((s) => s.updateStudent);
  const deleteStudent = useAppStore((s) => s.deleteStudent);

  const [renewAmount, setRenewAmount] = useState('');

  const history = useMemo(() => {
    if (!student) return [];
    return attendanceRecords
      .filter((a) => a.studentId === student.id && a.status === 'present')
      .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
      .slice(0, 10)
      .map((rec) => {
        const course = courses.find((c) => c.id === rec.courseId);
        return {
          id: rec.id,
          title: course ? `${CLASS_TYPE_MAP[course.classType]} (${course.startTime})` : '课程',
          date: new Date(rec.checkedAt).toLocaleDateString(),
          classroom: course ? course.classroom : '-'
        };
      });
  }, [student, attendanceRecords, courses]);

  if (!student) {
    return (
      <View className={styles.page}>
        <EmptyState icon="❓" title="学生不存在" description="该学生可能已被删除" />
      </View>
    );
  }

  const colorIdx = student.name.charCodeAt(0) % avatarColors.length;
  const isWarn = student.remainingLessons > 0 && student.remainingLessons <= WARNING_LESSON_THRESHOLD;
  const isDanger = student.remainingLessons <= 0;
  const usagePercent = (student.usedLessons / student.totalLessons) * 100;

  const handleCall = () => {
    Taro.makePhoneCall({
      phoneNumber: student.parentPhone
    }).catch((err) => console.error('[Call] Failed:', err));
  };

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/addStudent/index?id=${student.id}` });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除学生"${student.name}"吗？该操作不可恢复。`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          deleteStudent(student.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 800);
        }
      }
    });
  };

  const handleRenew = () => {
    const amount = parseInt(renewAmount);
    if (!amount || amount <= 0) {
      Taro.showToast({ title: '请输入有效课时数', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认续费',
      content: `确定为"${student.name}"续费 ${amount} 节课吗？`,
      success: (res) => {
        if (res.confirm) {
          updateStudent(student.id, {
            totalLessons: student.totalLessons + amount,
            remainingLessons: student.remainingLessons + amount
          });
          setRenewAmount('');
          Taro.showToast({ title: '续费成功', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.avatar} style={{ background: avatarColors[colorIdx] }}>
          {student.name.charAt(0)}
        </View>
        <Text className={styles.name}>{student.name}</Text>
        <View className={styles.subInfo}>
          <Text className={styles.subTag}>{CLASS_TYPE_MAP[student.classType]}</Text>
          <Text className={styles.subTag}>{AGE_GROUP_MAP[student.ageGroup]}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.lessonBox}>
          <View className={styles.lessonHeader}>
            <View className={styles.lessonMain}>
              <Text className={styles.lessonNum}>{student.remainingLessons}</Text>
              <Text className={styles.lessonUnit}>节剩余</Text>
            </View>
            <Text
              className={classnames(
                styles.lessonTag,
                !isWarn && !isDanger && 'normal',
                isWarn && 'warning',
                isDanger && 'danger'
              )}
            >
              {isDanger ? '已用完' : isWarn ? '待续费' : '正常'}
            </Text>
          </View>
          <View className={styles.lessonStats}>
            <View className={styles.lessonStatItem}>
              <Text className={styles.lessonStatNum}>{student.totalLessons}</Text>
              <Text className={styles.lessonStatLabel}>总课时</Text>
            </View>
            <View className={styles.lessonStatItem}>
              <Text className={styles.lessonStatNum}>{student.usedLessons}</Text>
              <Text className={styles.lessonStatLabel}>已消耗</Text>
            </View>
          </View>
          <View className={styles.progressWrap}>
            <View className={styles.progressBar}>
              <View
                className={classnames(
                  styles.progressFill,
                  isWarn && 'warning',
                  isDanger && 'danger'
                )}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </View>
            <View className={styles.progressInfo}>
              <Text>已使用 {usagePercent.toFixed(0)}%</Text>
              <Text>{student.usedLessons} / {student.totalLessons} 节</Text>
            </View>
          </View>

          <View className={styles.renewInput}>
            <View className={styles.renewField}>
              <Text className={styles.renewLabel}>续课时数</Text>
              <Input
                className={styles.renewValueInput}
                type="number"
                placeholder="输入课时数"
                value={renewAmount}
                onInput={(e) => setRenewAmount(e.detail.value)}
              />
            </View>
            <Button className={styles.renewBtn} onClick={handleRenew}>续费</Button>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>📞 联系信息</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>家长电话</Text>
            <Text className={styles.infoValue} onClick={handleCall}>
              <Text className={styles.callLink}>{student.parentPhone}</Text>
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>报名班级</Text>
            <Text className={styles.infoValue}>{CLASS_TYPE_MAP[student.classType]}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>年龄段</Text>
            <Text className={styles.infoValue}>{AGE_GROUP_MAP[student.ageGroup]}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>报名时间</Text>
            <Text className={styles.infoValue}>
              {new Date(student.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>📚 最近上课记录</Text>
          {history.length > 0 ? (
            history.map((h) => (
              <View key={h.id} className={styles.historyItem}>
                <View className={styles.historyLeft}>
                  <View
                    className={styles.historyIcon}
                    style={{ background: '#D1FAE5' }}
                  >
                    ✅
                  </View>
                  <View className={styles.historyInfo}>
                    <Text className={styles.historyTitle}>{h.title}</Text>
                    <Text className={styles.historyDate}>{h.date} · 教室{h.classroom}</Text>
                  </View>
                </View>
                <Text className={classnames(styles.historyValue, 'minus')}>-1节</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#94A3B8', fontSize: '24rpx', padding: '24rpx 0' }}>
              暂无上课记录
            </Text>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, 'secondary')} onClick={handleDelete}>
          删除
        </Button>
        <Button className={classnames(styles.btn, 'primary')} onClick={handleEdit}>
          编辑信息
        </Button>
      </View>
    </View>
  );
};

export default StudentDetailPage;
