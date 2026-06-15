import Taro from '@tarojs/taro';
import {
  Student,
  Course,
  ClassType,
  CLASS_TYPE_MAP,
  AGE_GROUP_MAP,
  CLASSROOM_MAP,
  RechargeRecord
} from '@/types';
import dayjs from 'dayjs';

export interface ExportItem {
  name: string;
  description: string;
  count: number;
  content: string;
  type: 'lessons' | 'attendance' | 'recharge';
}

const addBom = (content: string) => '\uFEFF' + content;

const copyToClipboard = async (content: string, name: string) => {
  try {
    await Taro.setClipboardData({ data: content });
    Taro.showToast({
      title: `已复制「${name}」`,
      icon: 'success',
      duration: 2000
    });
    return true;
  } catch (e) {
    Taro.showToast({ title: '复制失败，请重试', icon: 'none' });
    return false;
  }
};

export const copyMultipleToClipboard = async (items: ExportItem[]) => {
  if (items.length === 0) {
    Taro.showToast({ title: '没有可导出的内容', icon: 'none' });
    return false;
  }
  const joined = items
    .map((item) => {
      const separator = '='.repeat(40);
      return `${separator}\n【${item.name}】\n${separator}\n${item.content}`;
    })
    .join('\n\n');

  const total = items.reduce((sum, i) => sum + i.count, 0);
  try {
    await Taro.setClipboardData({ data: addBom(joined) });
    Taro.showModal({
      title: '批量导出成功',
      content: `已将 ${items.length} 份文件（共 ${total} 条记录）复制到剪贴板，粘贴到 Excel 中使用「数据 - 分列 - 分隔符 - 逗号」即可查看。\n\n提示：建议每一份单独复制到不同的工作表。`,
      showCancel: false,
      confirmText: '好的'
    });
    return true;
  } catch (e) {
    Taro.showToast({ title: '复制失败', icon: 'none' });
    return false;
  }
};

export const exportSingle = async (item: ExportItem) => {
  return copyToClipboard(addBom(item.content), item.name);
};

export const buildRemainingLessonsExport = (
  students: Student[],
  lastRecharges: Record<string, RechargeRecord | undefined>,
  classType?: ClassType
): ExportItem => {
  const list = students
    .filter((s) => !classType || s.classType === classType)
    .sort((a, b) => a.remainingLessons - b.remainingLessons);

  const className = classType ? CLASS_TYPE_MAP[classType] : '全部班级';
  const dateStr = dayjs().format('YYYY-MM-DD');
  const name = `${className}剩余课时清单_${dateStr}`;

  const header = [
    '学生姓名',
    '班级',
    '年龄段',
    '家长电话',
    '总课时',
    '已用课时',
    '剩余课时',
    '课时状态',
    '最近续费时间',
    '最近续费节数',
    '续费操作人'
  ];

  const rows = list.map((s) => {
    const recharge = lastRecharges[s.id];
    const status = s.remainingLessons <= 0
      ? '已用完'
      : s.remainingLessons <= 2
      ? '待续费'
      : '正常';

    return [
      s.name,
      CLASS_TYPE_MAP[s.classType],
      AGE_GROUP_MAP[s.ageGroup],
      s.parentPhone,
      s.totalLessons,
      s.usedLessons,
      s.remainingLessons,
      status,
      recharge ? dayjs(recharge.createdAt).format('YYYY-MM-DD') : '-',
      recharge ? `+${recharge.amount}节` : '-',
      recharge?.operator || '-'
    ].join(',');
  });

  const warnCount = list.filter(
    (s) => s.remainingLessons > 0 && s.remainingLessons <= 2
  ).length;
  const usedUpCount = list.filter((s) => s.remainingLessons <= 0).length;

  const summary = `\n# 统计说明\n# 导出时间：${dayjs().format('YYYY-MM-DD HH:mm')}\n# 学生总数：${list.length}人\n# 待续费(≤2节)：${warnCount}人\n# 已用完(≤0节)：${usedUpCount}人\n`;

  const content = header.join(',') + '\n' + rows.join('\n') + summary;

  return {
    name,
    description: `${list.length}名学生，待续费${warnCount}人，已用完${usedUpCount}人`,
    count: list.length,
    content,
    type: 'lessons' as const
  };
};

export const buildBatchRemainingLessons = (
  students: Student[],
  lastRecharges: Record<string, RechargeRecord | undefined>
): ExportItem[] => {
  const result: ExportItem[] = [];
  const classTypes: ClassType[] = ['piano', 'art', 'dance', 'calligraphy'];

  result.push(buildRemainingLessonsExport(students, lastRecharges));

  classTypes.forEach((ct) => {
    const count = students.filter((s) => s.classType === ct).length;
    if (count > 0) {
      result.push(buildRemainingLessonsExport(students, lastRecharges, ct));
    }
  });

  return result;
};

export const buildAttendanceExport = (
  course: Course,
  students: Student[],
  allAttendanceRecords?: AttendanceRecord[]
): ExportItem => {
  const records = allAttendanceRecords
    ? allAttendanceRecords.filter((a) => a.courseId === course.id)
    : course.attendance;
  const attendanceMap = new Map(
    records.map((a) => [a.studentId, a])
  );

  const dateStr = dayjs(course.date).format('YYYY-MM-DD');
  const className = CLASS_TYPE_MAP[course.classType];
  const ageName = AGE_GROUP_MAP[course.ageGroup];
  const roomName = CLASSROOM_MAP[course.classroom];

  const name = `${className}${ageName}_${dateStr}_${course.startTime}-${course.endTime}_点名表`;

  const header = [
    '序号',
    '学生姓名',
    '家长电话',
    '课前剩余课时',
    '出勤状态',
    '课后剩余课时',
    '点名时间'
  ];

  const rows = course.studentIds
    .map((sid, idx) => {
      const student = students.find((s) => s.id === sid);
      if (!student) return null;
      const record = attendanceMap.get(sid);
      const status = record
        ? record.status === 'present'
          ? '出勤'
          : record.status === 'absent'
          ? '缺勤'
          : '请假'
        : '未点名';

      const isPresent = record?.status === 'present';
      const beforeRemaining = isPresent ? student.remainingLessons + 1 : student.remainingLessons;
      const afterRemaining = student.remainingLessons;

      return [
        idx + 1,
        student.name,
        student.parentPhone,
        beforeRemaining,
        status,
        afterRemaining,
        record ? dayjs(record.checkedAt).format('HH:mm') : '-'
      ].join(',');
    })
    .filter(Boolean);

  const presentCount = course.studentIds.filter(
    (sid) => attendanceMap.get(sid)?.status === 'present'
  ).length;
  const absentCount = course.studentIds.filter(
    (sid) => attendanceMap.get(sid)?.status === 'absent'
  ).length;
  const leaveCount = course.studentIds.filter(
    (sid) => attendanceMap.get(sid)?.status === 'leave'
  ).length;
  const unchecked = course.studentIds.filter(
    (sid) => !attendanceMap.has(sid)
  ).length;

  const info = [
    `# 课程信息`,
    `# 班级：${className}${ageName}`,
    `# 日期：${dateStr}`,
    `# 时间：${course.startTime} - ${course.endTime}`,
    `# 教室：${roomName}`,
    `# 老师：${course.teacher}`,
    `# 应到：${course.studentIds.length}人`,
    `# 实到：${presentCount}人`,
    `# 缺勤：${absentCount}人`,
    `# 请假：${leaveCount}人`,
    `# 未点名：${unchecked}人`,
    `# 导出时间：${dayjs().format('YYYY-MM-DD HH:mm')}`,
    `# `
  ].join('\n');

  const content = info + '\n' + header.join(',') + '\n' + rows.join('\n');

  return {
    name,
    description: `${course.studentIds.length}人，出勤${presentCount}/缺勤${absentCount}/请假${leaveCount}`,
    count: course.studentIds.length,
    content,
    type: 'attendance' as const
  };
};

export const buildBatchAttendanceByDate = (
  date: string,
  courses: Course[],
  students: Student[],
  allAttendanceRecords?: AttendanceRecord[]
): ExportItem[] => {
  const dayCourses = courses.filter((c) => c.date === date);
  if (dayCourses.length === 0) return [];

  const result: ExportItem[] = [];

  const getAttendanceForCourse = (courseId: string) => {
    if (allAttendanceRecords) {
      return allAttendanceRecords.filter((a) => a.courseId === courseId);
    }
    const course = courses.find((c) => c.id === courseId);
    return course?.attendance || [];
  };

  const summaryName = `${dayjs(date).format('YYYY年M月D日')}全课程点名汇总`;
  const summaryHeader = [
    '课程',
    '时间',
    '教室',
    '老师',
    '应到人数',
    '实到人数',
    '缺勤',
    '请假',
    '未点名'
  ];
  const summaryRows = dayCourses.map((c) => {
    const records = getAttendanceForCourse(c.id);
    const attendanceMap = new Map(records.map((a) => [a.studentId, a]));
    const present = c.studentIds.filter((sid) => attendanceMap.get(sid)?.status === 'present').length;
    const absent = c.studentIds.filter((sid) => attendanceMap.get(sid)?.status === 'absent').length;
    const leave = c.studentIds.filter((sid) => attendanceMap.get(sid)?.status === 'leave').length;
    const unchecked = c.studentIds.filter((sid) => !attendanceMap.has(sid)).length;
    return [
      `${CLASS_TYPE_MAP[c.classType]}${AGE_GROUP_MAP[c.ageGroup]}`,
      `${c.startTime}-${c.endTime}`,
      CLASSROOM_MAP[c.classroom],
      c.teacher,
      c.studentIds.length,
      present,
      absent,
      leave,
      unchecked
    ].join(',');
  });
  const summaryContent =
    summaryHeader.join(',') +
    '\n' +
    summaryRows.join('\n') +
    `\n# 共${dayCourses.length}节课，${dayCourses.reduce((s, c) => s + c.studentIds.length, 0)}人次`;

  result.push({
    name: summaryName,
    description: `${dayCourses.length}节课汇总概览`,
    count: dayCourses.length,
    content: summaryContent,
    type: 'attendance'
  });

  dayCourses
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .forEach((c) => {
      result.push(buildAttendanceExport(c, students, allAttendanceRecords));
    });

  return result;
};

export const buildRechargeExport = (
  students: Student[],
  recharges: RechargeRecord[],
  classType?: ClassType
): ExportItem => {
  const filteredStudents = classType
    ? students.filter((s) => s.classType === classType)
    : students;

  const studentIds = new Set(filteredStudents.map((s) => s.id));
  const records = recharges
    .filter((r) => studentIds.has(r.studentId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const className = classType ? CLASS_TYPE_MAP[classType] : '全部';
  const name = `${className}续费记录_${dayjs().format('YYYY-MM-DD')}`;

  const header = [
    '续费日期',
    '学生姓名',
    '班级',
    '续费节数',
    '续费前总课时',
    '续费后总课时',
    '续费前剩余',
    '续费后剩余',
    '操作人',
    '备注'
  ];

  const rows = records.map((r) => {
    const student = students.find((s) => s.id === r.studentId);
    return [
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
      student?.name || '-',
      student ? CLASS_TYPE_MAP[student.classType] : '-',
      `+${r.amount}`,
      r.beforeTotal,
      r.afterTotal,
      r.beforeRemaining,
      r.afterRemaining,
      r.operator || '-',
      r.remark || ''
    ].join(',');
  });

  const totalAmount = records.reduce((s, r) => s + r.amount, 0);
  const content =
    header.join(',') +
    '\n' +
    rows.join('\n') +
    `\n# 共${records.length}条记录，续费总节数：${totalAmount}节`;

  return {
    name,
    description: `${records.length}条续费记录，共${totalAmount}节`,
    count: records.length,
    content,
    type: 'recharge' as const
  };
};

export const exportRemainingLessonsList = (
  students: Student[],
  classType?: ClassType
) => {
  const item = buildRemainingLessonsExport(students, {}, classType);
  copyToClipboard(addBom(item.content), item.name);
};

export const exportAttendanceSheet = (
  course: Course,
  students: Student[],
  allAttendanceRecords?: AttendanceRecord[]
) => {
  const item = buildAttendanceExport(course, students, allAttendanceRecords);
  copyToClipboard(addBom(item.content), item.name);
};
