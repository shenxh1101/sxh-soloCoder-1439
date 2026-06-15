import { Student, Course, CLASS_TYPE_MAP, AGE_GROUP_MAP, CLASSROOM_MAP, AttendanceRecord } from '@/types';
import Taro from '@tarojs/taro';

export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

  try {
    Taro.setClipboardData({
      data: csvContent,
      success: () => {
        Taro.showToast({
          title: '数据已复制到剪贴板',
          icon: 'success',
          duration: 2000
        });
      }
    });
    return { success: true, content: csvContent };
  } catch (error) {
    console.error('[Export] Failed:', error);
    Taro.showToast({
      title: '导出失败',
      icon: 'error'
    });
    return { success: false, content: '' };
  }
};

export const exportAttendanceSheet = (
  course: Course,
  students: Student[],
  records: AttendanceRecord[]
) => {
  const headers = ['序号', '学生姓名', '班级', '年龄段', '家长电话', '考勤状态', '剩余课时'];
  const rows = course.studentIds.map((sid, idx) => {
    const student = students.find((s) => s.id === sid);
    const record = records.find((r) => r.studentId === sid);
    const statusMap = { present: '出勤', absent: '缺勤', leave: '请假' };
    return [
      idx + 1,
      student?.name || '-',
      CLASS_TYPE_MAP[student?.classType || 'piano'],
      AGE_GROUP_MAP[student?.ageGroup || '6-8'],
      student?.parentPhone || '-',
      record ? statusMap[record.status] : '未点名',
      student?.remainingLessons ?? 0
    ];
  });

  const filename = `${CLASS_TYPE_MAP[course.classType]}_${course.date}_${course.startTime}点名表.csv`;
  Taro.showModal({
    title: '导出点名表',
    content: `课程：${CLASS_TYPE_MAP[course.classType]} ${course.date} ${course.startTime}-${course.endTime}\n教室：${CLASSROOM_MAP[course.classroom]} 老师：${course.teacher}\n共${rows.length}名学生\n\nCSV数据已复制到剪贴板，可直接粘贴到Excel或表格软件中使用。`,
    showCancel: false,
    confirmText: '知道了'
  });
  return exportToCSV(filename, headers, rows);
};

export const exportRemainingLessonsList = (students: Student[]) => {
  const headers = ['序号', '学生姓名', '班级', '年龄段', '家长电话', '总课时', '已用课时', '剩余课时', '状态'];
  const rows = students
    .sort((a, b) => a.remainingLessons - b.remainingLessons)
    .map((s, idx) => [
      idx + 1,
      s.name,
      CLASS_TYPE_MAP[s.classType],
      AGE_GROUP_MAP[s.ageGroup],
      s.parentPhone,
      s.totalLessons,
      s.usedLessons,
      s.remainingLessons,
      s.remainingLessons <= 0 ? '已用完' : s.remainingLessons <= 2 ? '待续费' : '正常'
    ]);

  const warningCount = students.filter((s) => s.remainingLessons > 0 && s.remainingLessons <= 2).length;
  const exhaustedCount = students.filter((s) => s.remainingLessons <= 0).length;

  Taro.showModal({
    title: '导出剩余课时清单',
    content: `共${students.length}名学生\n正常：${students.length - warningCount - exhaustedCount}\n待续费：${warningCount}\n已用完：${exhaustedCount}\n\nCSV数据已复制到剪贴板，可直接粘贴到Excel或表格软件中使用。`,
    showCancel: false,
    confirmText: '知道了'
  });
  return exportToCSV('剩余课时清单.csv', headers, rows);
};
