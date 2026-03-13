
import Papa from 'papaparse';
import { StudentRawData, StudentProcessedData, SubjectLevel, CurriculumItem, MachineType } from '../types';
import { 
  CURRICULUM_XUEERSI_CSV, 
  CURRICULUM_IFLYTEK_PRIMARY_LOW_CSV,
  CURRICULUM_IFLYTEK_PRIMARY_HIGH_CSV,
  CURRICULUM_IFLYTEK_MIDDLE_CSV,
  CURRICULUM_IFLYTEK_HIGH_CSV,
  CURRICULUM_XES_HIGH_CSV,
} from '../constants';

// --- 1. Grade Normalization & Logic ---

const normalizeGrade = (inputGrade: string): string => {
  if (!inputGrade) return '通用';
  const str = inputGrade.trim();
  
  // High School
  if (str.includes('高一') || str.includes('10年级') || str.match(/High\s*1/i)) return '高一';
  if (str.includes('高二') || str.includes('11年级') || str.match(/High\s*2/i)) return '高二';
  if (str.includes('高三') || str.includes('12年级') || str.match(/High\s*3/i)) return '高三';

  // Middle School
  if (str.includes('初一') || str.includes('七年级') || str.includes('7年级') || str.match(/Grade\s*7/i) || str.match(/Junior\s*1/i)) return '初一';
  if (str.includes('初二') || str.includes('八年级') || str.includes('8年级') || str.match(/Grade\s*8/i) || str.match(/Junior\s*2/i)) return '初二';
  if (str.includes('初三') || str.includes('九年级') || str.includes('9年级') || str.match(/Grade\s*9/i) || str.match(/Junior\s*3/i)) return '初三';

  // Primary School
  if (str.includes('一年级') || str.includes('1年级') || str.includes('小一') || str.match(/Grade\s*1\b/i)) return '一年级';
  if (str.includes('二年级') || str.includes('2年级') || str.includes('小二') || str.match(/Grade\s*2/i)) return '二年级';
  if (str.includes('三年级') || str.includes('3年级') || str.includes('小三') || str.match(/Grade\s*3/i)) return '三年级';
  if (str.includes('四年级') || str.includes('4年级') || str.includes('小四') || str.match(/Grade\s*4/i)) return '四年级';
  if (str.includes('五年级') || str.includes('5年级') || str.includes('小五') || str.match(/Grade\s*5/i)) return '五年级';
  if (str.includes('六年级') || str.includes('6年级') || str.includes('小六') || str.match(/Grade\s*6/i)) return '六年级';

  return '通用'; 
};

// Caching DBs
let cachedXueErSiCurriculum: CurriculumItem[] | null = null;
let cachedXesHigh: CurriculumItem[] | null = null;

// iFlyTek Caches
let cachedIFlyTekPrimaryLow: CurriculumItem[] | null = null;
let cachedIFlyTekPrimaryHigh: CurriculumItem[] | null = null;
let cachedIFlyTekMiddle: CurriculumItem[] | null = null;
let cachedIFlyTekHigh: CurriculumItem[] | null = null;

const parseCurriculumCSV = (csvContent: string): CurriculumItem[] => {
  const results = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const rawRows = results.data as any[];
  const processedRows: CurriculumItem[] = [];

  let lastSubject = '';
  let lastModule = '';

  rawRows.forEach((row, index) => {
    if (!row['科目'] && !lastSubject) return; 

    let currentSubject = row['科目'] ? row['科目'].trim() : '';
    
    if (currentSubject !== '') {
        currentSubject = currentSubject.replace(/\n/g, ' ').trim();
        lastSubject = currentSubject;
    }

    let timeVal = row['时间'] ? row['时间'].trim() : '';
    let moduleVal = row['模块'] || row['主题'];
    
    if (!moduleVal && !row['模块'] && !row['主题']) {
        moduleVal = '基础';
    }

    if (moduleVal && typeof moduleVal === 'string') {
        moduleVal = moduleVal.trim();
    }

    let fullModuleString = moduleVal;
    if (timeVal && moduleVal && !moduleVal.includes(timeVal)) {
        fullModuleString = `${timeVal} ${moduleVal}`;
    }

    if (fullModuleString && fullModuleString.trim() !== '') {
      lastModule = fullModuleString.trim();
    }

    const diffStr = row['难度'] ? row['难度'].toString().trim() : '';
    let difficulty = 1; 
    if (diffStr.includes('⭐️') || diffStr.includes('⭐')) {
        difficulty = (diffStr.match(/[⭐️⭐]/g) || []).length;
    } else if (diffStr) {
        difficulty = parseInt(diffStr);
    }
    
    let rawGrades = row['适用年级'] || row['年级'] || '通用';
    if (typeof rawGrades === 'string') rawGrades = rawGrades.trim();
    if (rawGrades === '') rawGrades = '通用';
    
    const applicableGrades = rawGrades.split(/[,，、\s和]+/).map((g: string) => g.trim());

    const projectName = row['项目'] || row['课程名'] || '';
    const objective = row['学习目标'] || row['课程简介'] || '';
    
    let finalSubject = lastSubject;
    if (lastSubject.includes('语文')) finalSubject = '语文';
    else if (lastSubject.includes('数学')) finalSubject = '数学';
    else if (lastSubject.includes('英语')) finalSubject = '英语';
    else if (lastSubject.includes('拓展')) finalSubject = '拓展';

    if (lastSubject) {
      processedRows.push({
        subject: finalSubject,
        module: lastModule || '基础',
        project: projectName,
        difficulty: difficulty, 
        objective: objective,
        path: row['路径位置'] || '',
        applicableGrades: applicableGrades,
        originalIndex: index,
        isNew: false
      });
    }
  });

  return processedRows;
};

export const loadAllCurriculumDBs = () => {
    if (!cachedXueErSiCurriculum) cachedXueErSiCurriculum = parseCurriculumCSV(CURRICULUM_XUEERSI_CSV);
    if (!cachedIFlyTekPrimaryLow) cachedIFlyTekPrimaryLow = parseCurriculumCSV(CURRICULUM_IFLYTEK_PRIMARY_LOW_CSV);
    if (!cachedIFlyTekPrimaryHigh) cachedIFlyTekPrimaryHigh = parseCurriculumCSV(CURRICULUM_IFLYTEK_PRIMARY_HIGH_CSV);
    if (!cachedIFlyTekMiddle) cachedIFlyTekMiddle = parseCurriculumCSV(CURRICULUM_IFLYTEK_MIDDLE_CSV);
    if (!cachedIFlyTekHigh) cachedIFlyTekHigh = parseCurriculumCSV(CURRICULUM_IFLYTEK_HIGH_CSV);
    if (!cachedXesHigh) cachedXesHigh = parseCurriculumCSV(CURRICULUM_XES_HIGH_CSV);
};

// --- 2. Subject Level Logic ---

const determineSubjectLevel = (score: number, rankStr: string): SubjectLevel => {
  if (rankStr) {
    if (rankStr.includes('前25%') && !rankStr.includes('50%')) return 1; 
    if (rankStr.includes('25%~50%') || rankStr.includes('25%-50%')) return 2; 
    if (rankStr.includes('50%~75%') || rankStr.includes('50%-75%')) return 3; 
    if (rankStr.includes('后25%')) return 4; 
    if (rankStr.includes('不清楚')) return 3; 
  }

  if (score > 0) {
    if (score >= 90) return 1;
    if (score >= 80) return 2;
    if (score >= 70) return 3;
    return 4;
  }

  return 3; 
};

// --- 3. Matching Algorithm ---

const getModuleKey = (moduleName: string) => {
  if (moduleName.includes('预习')) return '预习';
  if (moduleName.includes('练习')) return '练习';
  if (moduleName.includes('练题')) return '练习'; 
  if (moduleName.includes('复习')) return '复习';
  if (moduleName.includes('拓展')) return '拓展';
  if (moduleName.includes('周末')) return '拓展';
  if (moduleName.includes('看课')) return '预习'; 
  
  return '其他';
};

const generateRecommendations = (
  subjectLevels: { math: SubjectLevel, chinese: SubjectLevel, english: SubjectLevel }, 
  weakPoints: string[], 
  curriculum: CurriculumItem[],
  studentGrade: string,
  machineType: MachineType
): CurriculumItem[] => {
  
  const normalizedGrade = normalizeGrade(studentGrade);
  const isHighSchool = ['高一', '高二', '高三'].includes(normalizedGrade);
  const isXueErSiHighSchool = machineType === 'xueersi' && isHighSchool;

  const getQuotasForLevel = () => {
    return { '预习': 20, '练习': 20, '复习': 20, '拓展': 20, '其他': 20 };
  };

  const getMaxDifficulty = (level: SubjectLevel) => {
    if (isHighSchool) return 10;
    if (level === 1 || level === 2) return 3; 
    if (level === 3) return 2; 
    return 1; 
  };

  const subjects = ['语文', '数学', '英语'];
  const subjectKeys = { '语文': 'chinese', '数学': 'math', '英语': 'english' } as const;

  let finalRecommendations: CurriculumItem[] = [];

  subjects.forEach(subject => {
    const sKey = subjectKeys[subject as keyof typeof subjectKeys];
    const level = subjectLevels[sKey];
    
    const quotas = getQuotasForLevel();
    const maxDiff = getMaxDifficulty(level);
    
    let candidates = curriculum.filter(item => {
      if (item.subject !== subject) return false;
      if (item.difficulty > maxDiff) return false;
      
      if (isXueErSiHighSchool) {
         return item.applicableGrades.some(g => g === '高中' || g === '通用' || g.includes('高中'));
      }

      const isGradeMatch = item.applicableGrades.includes('通用') || item.applicableGrades.includes(normalizedGrade);
      if (!isGradeMatch) return false;
      return true;
    });

    candidates = candidates.map(item => ({
      ...item,
      isWeakPointMatch: weakPoints.some(wp => 
        item.project.includes(wp) || item.module.includes(wp)
      )
    }));

    const moduleGroups: Record<string, CurriculumItem[]> = {
      '预习': [], '练习': [], '复习': [], '拓展': [], '其他': []
    };

    candidates.forEach(item => {
      const key = getModuleKey(item.module);
      if (moduleGroups[key]) moduleGroups[key].push(item);
    });

    let subjectItems: CurriculumItem[] = [];

    Object.keys(moduleGroups).forEach(modKey => {
      let items = moduleGroups[modKey];
      
      items.sort((a, b) => {
        if (a.isWeakPointMatch && !b.isWeakPointMatch) return -1;
        if (!a.isWeakPointMatch && b.isWeakPointMatch) return 1;
        return a.originalIndex - b.originalIndex;
      });

      const limit = quotas[modKey as keyof typeof quotas] || 99;
      const selectedItems = items.slice(0, limit);
      selectedItems.sort((a, b) => a.originalIndex - b.originalIndex);
      subjectItems = [...subjectItems, ...selectedItems];
    });

    if (machineType === 'xueersi') {
        const entryItem: CurriculumItem = {
            subject: subject,
            module: '录入', 
            project: '校内作业录入',
            difficulty: 1,
            objective: '使用全科批改或智慧眼功能，拍照录入每日校内作业与试卷。系统将自动记录学情并生成个性化错题本，精准定位薄弱点，考前高效复习，免去手抄错题之苦。【必做】【5分钟】',
            path: '全科批改 / 智慧眼',
            applicableGrades: ['通用'],
            originalIndex: -1000,
            isNew: true
        };
        subjectItems.unshift(entryItem);

        if (subject === '数学') {
            const aiPracticeItem: CurriculumItem = {
                subject: '数学',
                module: '练习', 
                project: 'AI 专属练',
                difficulty: 1,
                objective: '这是学习机根据你每天使用的数据，帮你推荐的你最需要提升的 10 道题。每天只需练习 10 道题，就可以非常好地进行巩固和训练。【必做】【15分钟】',
                path: '王牌练习-AI 专属练-数学',
                applicableGrades: ['通用'],
                originalIndex: -900,
                isNew: true
            };
            subjectItems.splice(1, 0, aiPracticeItem);
        }

        if (subject === '语文') {
            const aiEssayItem: CurriculumItem = {
                subject: '语文',
                module: '周末拓展', 
                project: 'AI 作文体系学',
                difficulty: 1,
                objective: '使用的功能是AI 作文引导和 AI 作文批改，能够用 AI 算法一步步启发、引导你拓展写作思路，并优化、润色你的写作内容。【必做】【25分钟】',
                path: '语文-专项提升-作文体系学',
                applicableGrades: ['通用'],
                originalIndex: -2000,
                isNew: true
            };
            subjectItems.push(aiEssayItem);
        }

        if (subject === '英语') {
             const aiOralItem: CurriculumItem = {
                subject: '英语',
                module: '周末拓展', 
                project: 'AI 口语分级练',
                difficulty: 1,
                objective: '用 AI 大模型生成的口语陪练教练，带你一起聊一聊中小学常用的一些热门话题，不断提升你的口语表达，教你用更地道的语言。【必做】【20分钟】',
                path: 'AI 老师-AI 专属一对一-AI 口语分级练',
                applicableGrades: ['通用'],
                originalIndex: -2000,
                isNew: true
            };
            subjectItems.push(aiOralItem);
        }
    }

    finalRecommendations = [...finalRecommendations, ...subjectItems];
  });

  return finalRecommendations;
};

export const getAllCurriculumItems = (machineType: MachineType, grade: string): CurriculumItem[] => {
  loadAllCurriculumDBs();

  const normalizedGrade = normalizeGrade(grade);
  const isHighSchool = ['高一', '高二', '高三'].includes(normalizedGrade);
  
  if (machineType === 'iflytek') {
      if (['一年级', '二年级', '三年级'].includes(normalizedGrade)) return cachedIFlyTekPrimaryLow || [];
      if (['四年级', '五年级', '六年级'].includes(normalizedGrade)) return cachedIFlyTekPrimaryHigh || [];
      if (['初一', '初二', '初三'].includes(normalizedGrade)) return cachedIFlyTekMiddle || [];
      if (['高一', '高二', '高三'].includes(normalizedGrade)) return cachedIFlyTekHigh || [];
      return cachedIFlyTekMiddle || [];
  }

  if (isHighSchool) {
      if (machineType === 'xueersi') {
          return cachedXesHigh || [];
      }
      return cachedXueErSiCurriculum || [];
  }

  return cachedXueErSiCurriculum || [];
};

const mapScoreToNumber = (val: string): number => {
  if (!val) return 0;
  if (val.includes('不清楚') || val.includes('没学') || val.includes('未开')) {
      return 75; 
  }
  const directNum = parseFloat(val);
  if (!isNaN(directNum) && val.match(/^\d+(\.\d+)?$/)) {
      return directNum;
  }
  if (val.includes('90分~100分') || val.includes('90-100')) return 95;
  if (val.includes('80分~89分') || val.includes('80-89')) return 85;
  if (val.includes('70分~79分') || val.includes('70-79')) return 75;
  if (val.includes('60分~69分') || val.includes('60-69')) return 65;
  if (val.includes('60分以下')) return 55;
  return directNum || 75; 
};

const parseSubmissionTime = (timeStr: string | undefined): number => {
  if (!timeStr) return 0;
  let cleanStr = timeStr.trim();
  let ts = Date.parse(cleanStr);
  if (!isNaN(ts)) return ts;
  let standardStr = cleanStr
      .replace(/年/g, '/')
      .replace(/月/g, '/')
      .replace(/日/g, ' ')
      .replace(/时/g, ':')
      .replace(/分/g, '')
      .replace(/秒/g, '');
  ts = Date.parse(standardStr);
  if (!isNaN(ts)) return ts;
  if (cleanStr.includes('.')) {
    let dotStr = cleanStr.replace(/\./g, '/');
    ts = Date.parse(dotStr);
    if (!isNaN(ts)) return ts;
  }
  return 0;
};

const cleanSurveyString = (str: string): string => {
  if (!str) return '';
  let cleaned = str.replace(/^[A-Z0-9][\.\、]?\s*/i, '');
  cleaned = cleaned.split(/[（(]/)[0];
  return cleaned.trim();
};

const processSurveyRow = (row: any): StudentRawData => {
  const keys = Object.keys(row);
  const nameKey = keys.find(k => k.includes('请输入孩子的姓名') || k.includes('孩子的名字') || k.includes('学生姓名') || k.includes('名字'));
  const gradeKey = keys.find(k => k.includes('您的孩子现在是几年级') || k.includes('孩子的年级') || k.includes('年级'));
  const chineseScoreKey = keys.find(k => k.includes('在校语文成绩') || (k.includes('语文') && k.includes('成绩')));
  const mathScoreKey = keys.find(k => k.includes('在校数学成绩') || (k.includes('数学') && k.includes('成绩')));
  const englishScoreKey = keys.find(k => k.includes('在校英语成绩') || (k.includes('英语') && k.includes('成绩')));
  const isK12Survey = !!chineseScoreKey; 
  const chineseRankKey = keys.find(k => k.includes('语文') && k.includes('排名'));
  const mathRankKey = keys.find(k => k.includes('数学') && k.includes('排名'));
  const englishRankKey = keys.find(k => k.includes('英语') && k.includes('排名'));
  const carelessKey = keys.find(k => k.includes('马虎') || k.includes('粗心'));
  const notesKey = keys.find(k => k.includes('笔记'));
  const planKey = keys.find(k => k.includes('计划'));
  const mistakeKey = keys.find(k => k.includes('错题'));
  const machineKey = keys.find(k => k.includes('您的学习机品牌') || k.includes('学习机品牌') || k.includes('品牌') || k.includes('设备'));
  const boardingKey = keys.find(k => k.includes('住校') || k.includes('住宿') || k.includes('寄宿'));
  const submitTimeKey = keys.find(k => k.includes('答题结束时间') || k.includes('结束答题时间') || k.includes('提交时间') || k.includes('结束时间') || k.includes('答题时间') || k.includes('填写日期') || k.includes('日期'));
  const weakPoints = keys.filter(k => k.includes('最想提升') && row[k]).map(k => cleanSurveyString(row[k])).filter(Boolean).join(',');
  
  // Q17: Weekday duration
  const weekdayKey = keys.find(k => k.includes('17') || (k.includes('周一到周五') && k.includes('时间')));
  // Q18: Weekend duration
  const weekendKey = keys.find(k => k.includes('18') || (k.includes('周六周日') && k.includes('时间')));

  let processedWeekday = '';
  if (weekdayKey && row[weekdayKey]) {
      processedWeekday = row[weekdayKey].replace(/^[A-Z0-9○o]\.?[\s\、]?\s*/, '').trim();
  }
  let processedWeekend = '';
  if (weekendKey && row[weekendKey]) {
      processedWeekend = row[weekendKey].replace(/^[A-Z0-9○o]\.?[\s\、]?\s*/, '').trim();
  }

  return {
    student_name: nameKey ? row[nameKey] : '未命名',
    grade: gradeKey ? cleanSurveyString(row[gradeKey]) : '未知年级',
    math_score: mathScoreKey ? cleanSurveyString(row[mathScoreKey]) : '',
    chinese_score: chineseScoreKey ? cleanSurveyString(row[chineseScoreKey]) : '',
    english_score: englishScoreKey ? cleanSurveyString(row[englishScoreKey]) : '',
    math_rank: mathRankKey ? row[mathRankKey] : '',
    chinese_rank: chineseRankKey ? row[chineseRankKey] : '',
    english_rank: englishRankKey ? row[englishRankKey] : '',
    weak_points: weakPoints,
    weekday_duration: processedWeekday,
    weekend_duration: processedWeekend,
    careless_habit: carelessKey ? row[carelessKey] : '',
    note_habit: notesKey ? row[notesKey] : '',
    plan_habit: planKey ? row[planKey] : '',
    mistake_habit: mistakeKey ? row[mistakeKey] : '',
    machine_brand: machineKey ? row[machineKey] : '',
    is_boarding: boardingKey ? (row[boardingKey].includes('是') || row[boardingKey].includes('住校') || row[boardingKey].includes('住宿')) : false,
    submit_time: submitTimeKey ? row[submitTimeKey] : '',
    is_k12_survey: isK12Survey
  };
};

const detectMachineType = (brandStr: string | undefined): MachineType => {
  if (!brandStr) return 'xueersi'; 
  const str = brandStr.toLowerCase();
  if (str.includes('讯飞') || str.includes('iflytek') || str.includes('科大')) return 'iflytek';
  if (str.includes('步步高') || str.includes('bubugao')) return 'bubugao';
  return 'xueersi';
};

// --- 4. Weekly Plan Templates ---

const generateWeeklyPlan = (
  grade: string,
  ranks: { math: string, chinese: string, english: string },
  weekdayDuration: string,
  weekendDuration: string
): any[] => {
  const isPrimary = grade.includes('年级') && !grade.includes('初') && !grade.includes('高');
  const isMathTop15 = ranks.math.includes('15%') && (ranks.math.includes('前') || ranks.math.includes('Top'));
  const isChineseTop15 = ranks.chinese.includes('15%') && (ranks.chinese.includes('前') || ranks.chinese.includes('Top'));
  const isEnglishTop15 = ranks.english.includes('15%') && (ranks.english.includes('前') || ranks.english.includes('Top'));
  
  const is30Min = weekdayDuration.includes('30') || weekdayDuration.includes('半');
  const is2Hour = weekdayDuration.includes('2') || weekdayDuration.includes('两');
  
  const isWeekend2Hour = weekendDuration.includes('2') || weekendDuration.includes('两');
  const isWeekend3Hour = weekendDuration.includes('3') || weekendDuration.includes('三');

  if (!isPrimary && !is30Min) return []; // 30min applies to all up to Junior 3

  const plan: any[] = [];

  // --- 30 MINUTE TEMPLATE (Grade 1-9) ---
  if (is30Min) {
    plan.push({
      day: '周一',
      items: [
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '10分钟' },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高', time: '15分钟' }
      ]
    });
    plan.push({
      day: '周二',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
      ]
    });
    plan.push({
      day: '周三',
      items: [
        { function: '语文AI听写或背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
      ]
    });
    plan.push({
      day: '周四',
      items: [
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '10分钟' },
        { function: '数学错题练', content: '“订正本周错题”和“攻克本周薄弱项”', time: '15分钟' }
      ]
    });
    plan.push({
      day: '周五',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '5分钟' },
        { function: '英语错题练', content: '“订正本周错题”', time: '10分钟' }
      ]
    });
  } 
  // --- 2 HOUR TEMPLATE ---
  else if (is2Hour) {
    plan.push({
      day: '周一',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { 
          function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课', 
          content: isMathTop15 ? '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习' : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象', 
          time: '25分钟' 
        },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。', time: '10分钟' },
        { 
          function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课', 
          content: isEnglishTop15 ? '英语重难点提分课' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', 
          time: '25分钟' 
        },
        { 
          function: isEnglishTop15 ? '英语必考专项练' : '英语校内同步练', 
          content: isEnglishTop15 ? '英语必考专项练' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', 
          time: '15分钟' 
        }
      ]
    });
    plan.push({
      day: '周二',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。', time: '10分钟' },
        ...(isChineseTop15 ? [
          { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '15分钟' },
          { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' }
        ] : [
          { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
          { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
        ])
      ]
    });
    plan.push({
      day: '周三',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: 'AI口算', content: '口算训练，保持对数字和运算的敏感', time: '10分钟' },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' }
      ]
    });
    plan.push({
      day: '周四',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '35分钟' },
        { function: 'AI口算', content: '口算训练，保持对数字和运算的敏感', time: '10分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
      ]
    });
    plan.push({
      day: '周五',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学错题练', content: '“订正本周错题”和“攻克本周薄弱项”', time: '30分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '英语错题练', content: '“订正本周错题”和“攻克本周薄弱项”', time: '20分钟' },
        { function: 'AI口语练', content: '任选一个对话内容，尽情聊天，一定要大声说出来，不要害羞', time: '10分钟' }
      ]
    });
  }
  // --- 1 HOUR TEMPLATE (Grade 1-6) ---
  else {
    // Monday
    const monItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      { 
        function: isMathTop15 ? '数学重难点提分课' : '数学校内同步课', 
        content: isMathTop15 ? '选择你目前认为做薄弱的一个内容来学习' : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象', 
        time: '30分钟' 
      },
      { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
      { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' }
    ];
    plan.push({ day: '周一', items: monItems });

    // Tuesday
    const tueItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      { 
        function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课', 
        content: isEnglishTop15 ? '选择你目前认为做薄弱的一个内容来学习' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', 
        time: '35分钟' 
      },
      { 
        function: '英语校内同步练', 
        content: isEnglishTop15 ? '选择同步练难度中或高的，可以根据自己的体验选择稍有挑战的难度' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', 
        time: '20分钟' 
      },
      { function: 'AI口语练', content: '任选一个对话内容，尽情聊天，一定要大声说出来，不要害羞', time: '10分钟' }
    ];
    plan.push({ day: '周二', items: tueItems });

    // Wednesday
    const wedItems = [
      { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '15分钟' },
      { function: '天天背单词', content: '坚持5分钟背单词', time: '5分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      ...(isChineseTop15 ? [
        { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '25分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '40分钟' }
      ] : [
        { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '20分钟' }
      ])
    ];
    plan.push({ day: '周三', items: wedItems });

    // Thursday
    const thuItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      ...(isMathTop15 ? [
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学王牌拔尖课', content: '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习', time: '30分钟' }
      ] : [
        { function: 'AI口算', content: '口算训练，保持对数字和运算的敏感', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' }
      ]),
      { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
      { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' }
    ];
    plan.push({ day: '周四', items: thuItems });

    // Friday
    const friItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '35分钟' },
      { function: '英语错题练', content: '“订正本周错题”和“攻克本周薄弱项”', time: '20分钟' },
      { function: 'AI口语练', content: '任选一个对话内容，尽情聊天，一定要大声说出来，不要害羞', time: '10分钟' }
    ];
    plan.push({ day: '周五', items: friItems });
  }

  // --- WEEKEND TEMPLATE ---
  if (plan.length > 0) {
    // --- 3 HOUR WEEKEND (Primary Only) ---
    if (isWeekend3Hour && isPrimary) {
      // Saturday: Language Accumulation + Math, English
      const sat3h = [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
        { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
        { function: '强制休息', content: '离开书桌，喝水、远眺，固化逻辑', time: '15分钟' },
        { function: '英语校内同步课', content: '提前听一遍下周将要学习的内容，重点形成印象', time: '30分钟' },
        { function: '英语趣味分级练', content: '学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
        { function: '英语AI精准学（备考模式）', content: '检测本单元知识点掌握情况，考试前自我摸底', time: '15分钟' }
      ];
      plan.push({ day: '周六', items: sat3h });

      // Sunday: Language Accumulation + Math, Chinese
      const sun3h = [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '优先AI背诵（课文），若背完则听写对应字词', time: '10分钟' },
        { 
          function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课', 
          content: isMathTop15 ? '适合基础扎实，日常考试成绩保持在90分以上的学生' : '提前听一遍下周将要学习的内容，重点形成印象', 
          time: '30分钟' 
        },
        { 
          function: isMathTop15 ? '数学王牌教辅练' : '数学校内同步练', 
          content: isMathTop15 ? '不一定是选择《53》，学生如果有平时在练习其他教辅书也可以' : '同步练难度分为低、中、高，选择稍有挑战的难度', 
          time: '20分钟' 
        },
        { function: '数学错题练', content: '“订正本周错题”和“攻克本周薄弱项”', time: '20分钟' },
        { function: '强制休息', content: '离开书桌，喝水、远眺，固化逻辑', time: '15分钟' },
        { 
          function: isChineseTop15 ? '语文重难点提分课' : '语文校内同步课', 
          content: isChineseTop15 ? '根据学生自己的进度选择来学，阅读专项、基础知识、作文这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学' : '提前听一遍下周将要学习的内容，重点形成印象', 
          time: '30分钟' 
        },
        { function: '语文趣味分级练', content: '学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
        { function: '语文AI精准学（备考模式）', content: '检测本单元知识点掌握情况，考试前自我摸底', time: '15分钟' }
      ];
      plan.push({ day: '周日', items: sun3h });
    }
    // --- 2 HOUR WEEKEND (Grade 1-9) ---
    else if (isWeekend2Hour) {
      // Saturday: Math focused
      const sat2h = [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '35分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
        { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' }
      ];
      plan.push({ day: '周六', items: sat2h });

      // Sunday: Liberal Arts focused
      const sun2h = [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '35分钟' },
        { function: '英语必考专项练', content: '分成“日常知识积累”和“学期必考专项”，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '语文趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
        { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
      ];
      plan.push({ day: '周日', items: sun2h });
    }
    // --- DEFAULT WEEKEND (1 Hour or fallback) ---
    else {
      // Saturday: Math
      const satItems = [
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '15分钟' },
        { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '30分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' }
      ];
      plan.push({ day: '周六', items: satItems });

      // Sunday: Reading
      const sunItems = [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '5分钟' },
        { function: '英语AI精准学（标准模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
        { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '25分钟' }
      ];
      plan.push({ day: '周日', items: sunItems });
    }
  }

  return plan;
};

export const parseAndProcessCSV = (file: File): Promise<StudentProcessedData[]> => {
  loadAllCurriculumDBs();
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy', 
      complete: (results) => {
        try {
          const rawData = results.data as any[];
          if (rawData.length === 0) { resolve([]); return; }
          const firstRow = rawData[0];
          const keys = Object.keys(firstRow);
          const surveyNameKey = keys.find(k => k.includes('请输入孩子的姓名') || k.includes('孩子的名字') || k.includes('学生姓名') || k.includes('名字'));
          const simpleNameKey = 'student_name'; 
          const isSurveyFormat = !!surveyNameKey;
          const nameKey = isSurveyFormat ? surveyNameKey : simpleNameKey;
          const validData = rawData.filter(row => {
            if (nameKey && Object.prototype.hasOwnProperty.call(row, nameKey)) {
               const val = row[nameKey];
               return val && typeof val === 'string' && val.trim().length > 0;
            }
            return Object.values(row).some(v => v && typeof v === 'string' && v.trim().length > 0);
          });

          const processed: StudentProcessedData[] = validData.map((row, index) => {
            let standardizedRow: StudentRawData;
            if (isSurveyFormat) {
              standardizedRow = processSurveyRow(row);
            } else {
              standardizedRow = row as StudentRawData;
              if (!standardizedRow.weekday_duration) standardizedRow.weekday_duration = '';
              if (!standardizedRow.weekend_duration) standardizedRow.weekend_duration = '';
            }

            const machineType = detectMachineType(standardizedRow.machine_brand);
            const rawGradeStr = standardizedRow.grade || '未知年级';
            const normalizedGrade = normalizeGrade(rawGradeStr);
            const isHighSchool = ['高一', '高二', '高三'].includes(normalizedGrade);

            let activeCurriculum;
            if (machineType === 'iflytek') {
                if (['一年级', '二年级', '三年级'].includes(normalizedGrade)) activeCurriculum = cachedIFlyTekPrimaryLow || [];
                else if (['四年级', '五年级', '六年级'].includes(normalizedGrade)) activeCurriculum = cachedIFlyTekPrimaryHigh || [];
                else if (['初一', '初二', '初三'].includes(normalizedGrade)) activeCurriculum = cachedIFlyTekMiddle || [];
                else if (['高一', '高二', '高三'].includes(normalizedGrade)) activeCurriculum = cachedIFlyTekHigh || [];
                else activeCurriculum = cachedIFlyTekMiddle || [];
            } else {
                if (isHighSchool) {
                   activeCurriculum = cachedXesHigh || [];
                } else {
                   activeCurriculum = cachedXueErSiCurriculum || [];
                }
            }

            const mathScore = mapScoreToNumber(standardizedRow.math_score);
            const chineseScore = mapScoreToNumber(standardizedRow.chinese_score);
            const englishScore = mapScoreToNumber(standardizedRow.english_score);
            const submitTime = parseSubmissionTime(standardizedRow.submit_time);
            const weakPoints = standardizedRow.weak_points ? standardizedRow.weak_points.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [];
            const subjectLevels = {
              math: determineSubjectLevel(mathScore, standardizedRow.math_rank || ''),
              chinese: determineSubjectLevel(chineseScore, standardizedRow.chinese_rank || ''),
              english: determineSubjectLevel(englishScore, standardizedRow.english_rank || '')
            };
            
            const studentRecommendations = generateRecommendations(
              subjectLevels, 
              weakPoints, 
              activeCurriculum || [], 
              rawGradeStr,
              machineType
            );

            const weeklyPlan = generateWeeklyPlan(
              normalizedGrade,
              {
                math: standardizedRow.math_rank || '',
                chinese: standardizedRow.chinese_rank || '',
                english: standardizedRow.english_rank || ''
              },
              standardizedRow.weekday_duration,
              standardizedRow.weekend_duration
            );

            return {
              id: `student-${index}-${Date.now()}`,
              name: standardizedRow.student_name || '未命名',
              grade: normalizedGrade, 
              uploadTimestamp: Date.now(),
              csvIndex: index,
              submitTime: submitTime, 
              machineType: machineType,
              rawScores: { math: mathScore, chinese: chineseScore, english: englishScore },
              originalScores: {
                 math: standardizedRow.math_score || '',
                 chinese: standardizedRow.chinese_score || '',
                 english: standardizedRow.english_score || ''
              },
              ranks: {
                math: standardizedRow.math_rank || '',
                chinese: standardizedRow.chinese_rank || '',
                english: standardizedRow.english_rank || ''
              },
              subjectLevels: subjectLevels,
              weakPoints: weakPoints,
              recommendations: studentRecommendations,
              weeklyPlan: weeklyPlan,
              surveyDetails: {
                careless: standardizedRow.careless_habit || '',
                notes: standardizedRow.note_habit || '',
                planning: standardizedRow.plan_habit || '',
                mistakes: standardizedRow.mistake_habit || '',
                weekdayDuration: standardizedRow.weekday_duration,
                weekendDuration: standardizedRow.weekend_duration,
                isBoarding: !!standardizedRow.is_boarding
              }
            };
          });
          resolve(processed);
        } catch (e) {
          reject(e);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

