import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/appStore';
import { ClassType, AgeGroup, CLASS_TYPE_MAP, AGE_GROUP_MAP } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const AddStudentPage: React.FC = () => {
  const router = useRouter();
  const editId = router.params.id as string | undefined;
  const existing = useAppStore((s) => (editId ? s.getStudentById(editId) : undefined));
  const addStudent = useAppStore((s) => s.addStudent);
  const updateStudent = useAppStore((s) => s.updateStudent);
  const updateTotalLessons = useAppStore((s) => s.updateTotalLessons);

  const [name, setName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [classType, setClassType] = useState<ClassType>('piano');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-8');
  const [totalLessons, setTotalLessons] = useState(24);
  const [focusField, setFocusField] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setParentPhone(existing.parentPhone);
      setClassType(existing.classType);
      setAgeGroup(existing.ageGroup);
      setTotalLessons(existing.totalLessons);
      Taro.setNavigationBarTitle({ title: '编辑学生信息' });
    }
  }, [existing]);

  const classOptions: ClassType[] = ['piano', 'art', 'dance', 'calligraphy'];
  const ageOptions: AgeGroup[] = ['3-5', '6-8', '9-12', '13+'];

  const adjustLessons = (delta: number) => {
    setTotalLessons((prev) => Math.max(1, Math.min(200, prev + delta)));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入学生姓名', icon: 'none' });
      return;
    }
    if (!parentPhone.trim() || !/^1\d{10}$/.test(parentPhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (totalLessons <= 0) {
      Taro.showToast({ title: '课时数必须大于0', icon: 'none' });
      return;
    }

    if (existing) {
      updateStudent(existing.id, {
        name: name.trim(),
        parentPhone: parentPhone.trim(),
        classType,
        ageGroup
      });
      if (totalLessons !== existing.totalLessons) {
        updateTotalLessons(existing.id, totalLessons);
      }
      Taro.showToast({ title: '修改成功', icon: 'success' });
    } else {
      addStudent({
        name: name.trim(),
        parentPhone: parentPhone.trim(),
        classType,
        ageGroup,
        totalLessons
      });
      Taro.showToast({ title: '添加成功', icon: 'success' });
    }

    setTimeout(() => Taro.navigateBack(), 800);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <View className={styles.formCard}>
        <Text className={styles.cardTitle}>📝 基本信息</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>学生姓名
          </Text>
          <View className={classnames(styles.inputWrap, focusField === 'name' && styles.focused)}>
            <Input
              className={styles.input}
              placeholder="请输入学生姓名"
              value={name}
              onInput={(e) => setName(e.detail.value)}
              onFocus={() => setFocusField('name')}
              onBlur={() => setFocusField(null)}
              maxlength={20}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>家长电话
          </Text>
          <View className={classnames(styles.inputWrap, focusField === 'phone' && styles.focused)}>
            <Input
              className={styles.input}
              type="number"
              placeholder="请输入11位手机号"
              value={parentPhone}
              onInput={(e) => setParentPhone(e.detail.value)}
              onFocus={() => setFocusField('phone')}
              onBlur={() => setFocusField(null)}
              maxlength={11}
            />
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.cardTitle}>🎯 报名信息</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>报名班级
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
        <Text className={styles.cardTitle}>📚 课时设置</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>报课时数
          </Text>
          <View className={styles.numberInput}>
            <View className={styles.numberBtn} onClick={() => adjustLessons(-4)}>-4</View>
            <View className={styles.numberBtn} onClick={() => adjustLessons(-1)}>-</View>
            <View className={styles.numberValue}>{totalLessons}</View>
            <View className={styles.numberBtn} onClick={() => adjustLessons(1)}>+</View>
            <View className={styles.numberBtn} onClick={() => adjustLessons(4)}>+4</View>
          </View>
          <Text className={styles.tip}>
            💡 推荐：短期 12节 / 中期 24节 / 长期 48节。报名后可在学生详情页随时续费加课。
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, 'secondary')} onClick={handleCancel}>
          取消
        </Button>
        <Button className={classnames(styles.btn, 'primary')} onClick={handleSubmit}>
          {existing ? '保存修改' : '确认添加'}
        </Button>
      </View>
    </View>
  );
};

export default AddStudentPage;
