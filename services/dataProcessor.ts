
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
    if (rankStr.includes('不清楚')) return 4; // 排名不清楚，按后85%处理，使用基础方案
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
  // Q23: Phone last 4 digits
  const phoneKey = keys.find(k => k.includes('手机号后四位') || k.includes('解锁密码') || k.includes('后四位'));
  const weakPoints = keys.filter(k => k.includes('最想提升') && row[k]).map(k => cleanSurveyString(row[k])).filter(Boolean).join(',');
  
  // 新增：课堂听懂程度
  const classroomComprehensionKey = keys.find(k => k.includes('能听懂') || k.includes('课堂学习效率') || k.includes('听懂多少'));
  // 新增：课内作业完成情况
  const homeworkCompletionKey = keys.find(k => k.includes('课内作业完成情况') || (k.includes('作业') && k.includes('完成情况')));
  // 新增：考试速度
  const examSpeedKey = keys.find(k => k.includes('考试完成的速度') || k.includes('考试速度') || k.includes('做题速度'));
  // 新增：语文想提升的模块（含"语文"且含"提升"）
  const chineseFocusKey = keys.find(k => k.includes('语文') && k.includes('最想提升'));
  // 新增：英语想提升的模块（含"英语"且含"提升"）
  const englishFocusKey = keys.find(k => k.includes('英语') && k.includes('最想提升'));

  // 学习机时长（周一~周五）：含"学习机"且含"周一" 或 含"周一~周五"
  const boardingFlagForWeekday = boardingKey ? !row[boardingKey]?.includes('没有住校') && (row[boardingKey]?.includes('是') || row[boardingKey]?.includes('住校') || row[boardingKey]?.includes('住宿')) : false;
  const weekdayKey = keys.find(k => k.includes('学习机') && (k.includes('周一') || k.includes('周一~周五') || k.includes('周一到周五')));
  // 学习机时长（周六~周日）：含"学习机"且含"周六"
  const weekendKey = keys.find(k => k.includes('学习机') && (k.includes('周六') || k.includes('周六~周日') || k.includes('周六周日')));

  let processedWeekday = '';
  if (!boardingFlagForWeekday && weekdayKey && row[weekdayKey]) {
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
    is_boarding: boardingKey ? (
      !row[boardingKey]?.includes('没有住校') &&
      (row[boardingKey]?.includes('是') || row[boardingKey]?.includes('住校') || row[boardingKey]?.includes('住宿'))
    ) : false,
    submit_time: submitTimeKey ? row[submitTimeKey] : '',
    is_k12_survey: isK12Survey,
    phone: phoneKey ? row[phoneKey]?.toString().trim().slice(-4) : '',
    // 新增问卷字段
    classroom_comprehension: classroomComprehensionKey ? row[classroomComprehensionKey] : '',
    homework_completion: homeworkCompletionKey ? row[homeworkCompletionKey] : '',
    exam_speed: examSpeedKey ? row[examSpeedKey] : '',
    chinese_focus_modules: chineseFocusKey ? row[chineseFocusKey] : '',
    english_focus_modules: englishFocusKey ? row[englishFocusKey] : '',
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

// ============================================================
// === 学而思问卷个性化后处理函数 ===
// ============================================================

/**
 * 判断语文/英语成绩档位
 * 返回 'top'（优等/前15%）| 'middle'（中等）| 'weak'（差生/后50%）
 */
const getSubjectLevel = (rank: string, score: number): 'top' | 'middle' | 'weak' => {
  if (rank) {
    if (rank.includes('前15%') || rank.includes('Top 15') || (rank.includes('前') && rank.includes('15'))) return 'top';
    if (rank.includes('后50%') || rank.includes('后 50') || rank.includes('50%') && rank.includes('后')) return 'weak';
    // 15%~50% 区间
    if (rank.includes('15%') || rank.includes('50%')) return 'middle';
  }
  if (score > 0) {
    if (score >= 90) return 'top';
    if (score >= 70) return 'middle';
    return 'weak';
  }
  return 'middle';
};

/**
 * 学而思周计划问卷个性化调整
 * 规则：只修改 function 名称和 content 文字，不新增/删除条目，不改 time
 */
const applyXueersiSurveyAdjustments = (
  plan: any[],
  extras: {
    classroomComprehension?: string;
    carelessHabit?: string;
    homeworkCompletion?: string;
    examSpeed?: string;
    chineseFocusModules?: string[];
    englishFocusModules?: string[];
    chineseScore?: number;
    chineseRank?: string;
    englishScore?: number;
    englishRank?: string;
  }
): void => {
  const {
    classroomComprehension = '',
    carelessHabit = '',
    chineseFocusModules = [],
    englishFocusModules = [],
    chineseScore = 0,
    chineseRank = '',
    englishScore = 0,
    englishRank = '',
  } = extras;

  // --- 成绩档位判断 ---
  const chineseLevel = getSubjectLevel(chineseRank, chineseScore);
  const englishLevel = getSubjectLevel(englishRank, englishScore);

  // --- 课堂听不懂：在同步课 content 前加说明 ---
  const poorComprehension = classroomComprehension.includes('一半以上听不懂');
  if (poorComprehension) {
    plan.forEach(day => {
      day.items.forEach((item: any) => {
        if (item.function.includes('同步课')) {
          item.content = '【建议课前预习】你反映课堂上有超过一半内容听不懂，用同步课提前预习非常关键。上课前先快速过一遍，对新知识有大致印象后，课堂吸收率会提高很多。\n\n' + item.content;
        }
      });
    });
  }

  // --- 经常马虎：在练习类 content 末尾追加提醒 ---
  const isCareless = carelessHabit.includes('经常马虎');
  if (isCareless) {
    plan.forEach(day => {
      day.items.forEach((item: any) => {
        const fn: string = item.function;
        if (fn.includes('练') && !fn.includes('强制休息') && !fn.includes('批改') && !fn.includes('背单词') && !fn.includes('听写') && !fn.includes('背诵')) {
          item.content = item.content + '\n\n⚠️ 你反映有马虎习惯，做完后一定要回头检查一遍，这是提分最快的方式。';
        }
      });
    });
  }

  // --- 语文模块调整（仅中等/优等生生效）---
  // 过滤出有意义的语文模块选项（排除"其他"）
  const validChineseModules = chineseFocusModules.filter(m =>
    m && !m.includes('其他') && (m.includes('阅读') || m.includes('写作') || m.includes('生字') || m.includes('拼音') || m.includes('基础'))
  );

  // 将问卷选项映射为简短模块名
  const mapChineseModule = (m: string): string => {
    if (m.includes('阅读')) return '阅读理解';
    if (m.includes('写作')) return '写作';
    if (m.includes('生字') || m.includes('拼音') || m.includes('基础')) return '基础知识';
    return m;
  };

  const chineseMappedModules = validChineseModules.map(mapChineseModule);

  if (chineseMappedModules.length > 0 && chineseLevel !== 'weak') {
    // 合并模块名（全部写上，用/分隔）
    const moduleSuffix = chineseMappedModules.join('/');

    // 收集七天内所有语文主课条目（含"语文重难点提分课"或"语文必考专项练"的）
    // 轮流队列：为每个条目分配一个模块（循环）
    const allChineseMainItems: Array<{ item: any; type: 'tifenke' | 'zhuanyanlian' }> = [];

    plan.forEach(day => {
      day.items.forEach((item: any) => {
        const fn: string = item.function;
        if (fn.includes('语文重难点提分课')) {
          allChineseMainItems.push({ item, type: 'tifenke' });
        } else if (fn.includes('语文必考专项练')) {
          allChineseMainItems.push({ item, type: 'zhuanyanlian' });
        }
      });
    });

    // 如果模块数等于1，所有条目都标同一模块
    // 如果模块数 >= 2，轮流标注不同模块（每天一个）
    if (chineseMappedModules.length === 1) {
      // 单个模块：提分课和专项练都标同一个
      allChineseMainItems.forEach(({ item, type }) => {
        if (type === 'tifenke') {
          item.function = `语文重难点提分课——${moduleSuffix}`;
          item.content = `根据你的选择，重点学习【${moduleSuffix}】模块。` + item.content;
        } else {
          item.function = `语文必考专项练——${moduleSuffix}`;
        }
      });
    } else {
      // 多个模块：轮流标注
      allChineseMainItems.forEach(({ item, type }, idx) => {
        const currentModule = chineseMappedModules[idx % chineseMappedModules.length];
        if (type === 'tifenke') {
          item.function = `语文重难点提分课——${currentModule}`;
          item.content = `今天重点学习【${currentModule}】模块。` + item.content;
        } else {
          item.function = `语文必考专项练——${currentModule}`;
        }
      });

      // 本周排不上的模块：在最后一个语文条目末尾加注
      if (allChineseMainItems.length < chineseMappedModules.length) {
        const missingModules = chineseMappedModules.slice(allChineseMainItems.length);
        if (allChineseMainItems.length > 0) {
          const lastItem = allChineseMainItems[allChineseMainItems.length - 1].item;
          lastItem.content += `\n\n📌 本周未安排到的模块：${missingModules.join('、')}，下周可以优先学习这些板块。`;
        }
      }
    }
  } else if (chineseMappedModules.length > 0 && chineseLevel === 'weak') {
    // 差生：语文必考专项练 → 替换回语文校内同步练
    plan.forEach(day => {
      day.items.forEach((item: any) => {
        if (item.function.includes('语文必考专项练')) {
          item.function = '语文校内同步练';
          item.content = '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度';
        }
      });
    });
    // 语文重难点提分课：保留但加模块说明
    const moduleSuffix = chineseMappedModules.join('/');
    plan.forEach(day => {
      day.items.forEach((item: any) => {
        if (item.function.includes('语文重难点提分课')) {
          item.function = `语文重难点提分课——${moduleSuffix}`;
          item.content = `基础薄弱的同学同样可以学习重难点提分课，按照自己最想改善的模块选择对应内容听课就可以。比如想改善阅读，就去听重难点提分课里的阅读板块；想改善写作，就听写作板块。听课比做题更适合现阶段的你，先把知识点弄懂，后续再做练习巩固。`;
        }
      });
    });
  }

  // --- 英语模块调整 ---
  // 四类选项：语法/阅读理解/听力/写作 → 标注提分课和专项练
  // 口语 → 替换/标注 AI口语练的 content
  // 分级阅读 → 替换某个英语主课条目为英语分级阅读

  const validEnglishModules = englishFocusModules.filter(m => m && !m.includes('其他') && !m.includes('启蒙'));

  if (validEnglishModules.length > 0 && englishLevel !== 'weak') {
    // 分类：普通模块 vs 特殊模块
    const specialModules: string[] = []; // 口语、分级阅读
    const normalModules: string[] = [];  // 语法、阅读理解、听力、写作等

    validEnglishModules.forEach(m => {
      if (m.includes('口语')) specialModules.push('口语');
      else if (m.includes('课外阅读') || m.includes('分级阅读')) specialModules.push('分级阅读');
      else normalModules.push(m);
    });

    // 普通模块的名称映射
    const mapEnglishModule = (m: string): string => {
      if (m.includes('语法')) return '语法';
      if (m.includes('阅读理解') || m.includes('阅读')) return '阅读理解';
      if (m.includes('听力')) return '听力';
      if (m.includes('写作')) return '写作';
      if (m.includes('单词') || m.includes('词组')) return '词汇';
      return m;
    };
    const mappedNormalModules = normalModules.map(mapEnglishModule);

    // 收集七天内所有英语主课条目
    // 英语主课 = 含"英语"且不含"天天背单词"/"AI听写"/"全科批改"
    interface EnglishMainItem {
      item: any;
      type: 'tifenke' | 'zhuanyanlian' | 'other';
    }
    const allEnglishMainItems: EnglishMainItem[] = [];

    plan.forEach(day => {
      day.items.forEach((item: any) => {
        const fn: string = item.function;
        if (!fn.includes('英语')) return;
        if (fn.includes('天天背单词') || fn.includes('AI听写') || fn.includes('AI背诵') || fn.includes('全科批改')) return;
        if (fn.includes('英语重难点提分课')) {
          allEnglishMainItems.push({ item, type: 'tifenke' });
        } else if (fn.includes('英语必考专项练')) {
          allEnglishMainItems.push({ item, type: 'zhuanyanlian' });
        } else {
          allEnglishMainItems.push({ item, type: 'other' });
        }
      });
    });

    // 构建替换队列（先处理普通模块，再处理特殊模块）
    // 普通模块：标注到提分课/专项练
    if (mappedNormalModules.length > 0) {
      const moduleSuffix = mappedNormalModules.join('/');
      // 找出提分课条目和专项练条目
      const tifenItems = allEnglishMainItems.filter(i => i.type === 'tifenke');
      const zhuanyanlianItems = allEnglishMainItems.filter(i => i.type === 'zhuanyanlian');

      tifenItems.forEach((ei, idx) => {
        const currentModule = mappedNormalModules.length === 1 ? moduleSuffix : mappedNormalModules[idx % mappedNormalModules.length];
        ei.item.function = `英语重难点提分课——${currentModule}`;
        ei.item.content = `今天重点学习【${currentModule}】模块的提分课内容，按照自己的进度选择对应板块学习。`;
      });
      zhuanyanlianItems.forEach((ei, idx) => {
        const currentModule = mappedNormalModules.length === 1 ? moduleSuffix : mappedNormalModules[idx % mappedNormalModules.length];
        ei.item.function = `英语必考专项练——${currentModule}`;
        ei.item.content = `重点做【${currentModule}】专项练习，分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。`;
      });
    }

    // 特殊模块：口语和分级阅读，轮流替换"other"类型的条目
    const otherItems = allEnglishMainItems.filter(i => i.type === 'other');
    let specialIdx = 0;
    specialModules.forEach(sm => {
      if (specialIdx < otherItems.length) {
        const target = otherItems[specialIdx];
        if (sm === '口语') {
          target.item.function = 'AI口语分级练';
          target.item.content = '这里会有一个AI老师，跟你进行校园内常见对话的练习，AI老师还会不断帮你优化表达，告诉你更地道的说法是什么。练习口语的时候，一定要大声地说出来，"开口说"是最难的一步，只要开口了就赢了90%。';
        } else if (sm === '分级阅读') {
          target.item.function = '英语分级阅读';
          target.item.content = '分级阅读是根据阅读材料的词汇难度、句子长度、文体类型、文字排版、篇章结构和主题等要素的不同，给不同阅读能力水平者提供有科学性和针对性的读物。';
        }
        specialIdx++;
      } else {
        // 排不上：在最后一个英语主课条目末尾加注
        if (allEnglishMainItems.length > 0) {
          const lastItem = allEnglishMainItems[allEnglishMainItems.length - 1].item;
          const smLabel = sm === '口语' ? 'AI口语分级练' : '英语分级阅读';
          lastItem.content += `\n\n📌 本周未安排到【${smLabel}】，也可以选择${smLabel}来练习，下周可以优先安排。`;
        }
      }
    });

    // 本周普通模块排不上的：加注
    if (mappedNormalModules.length > 0) {
      const tifenCount = allEnglishMainItems.filter(i => i.type === 'tifenke').length;
      const zhuanCount = allEnglishMainItems.filter(i => i.type === 'zhuanyanlian').length;
      const covered = Math.max(tifenCount, zhuanCount);
      if (covered > 0 && mappedNormalModules.length > covered) {
        const missing = mappedNormalModules.slice(covered);
        const lastEnglishItem = allEnglishMainItems[allEnglishMainItems.length - 1];
        if (lastEnglishItem) {
          lastEnglishItem.item.content += `\n\n📌 本周未安排到的模块：${missing.join('、')}，下周可以优先安排。`;
        }
      }
    }
  } else if (validEnglishModules.length > 0 && englishLevel === 'weak') {
    // 英语差生：课表里的重难点提分课/必考专项练 → 替换回同步课/同步练
    plan.forEach(day => {
      day.items.forEach((item: any) => {
        if (item.function.includes('英语重难点提分课')) {
          item.function = '英语校内同步课';
          item.content = '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象';
        } else if (item.function.includes('英语必考专项练')) {
          item.function = '英语校内同步练';
          item.content = '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度';
        }
      });
    });
  }

  // --- 连续性检查：AI精准学/错题练 连续3天同科出现则打断 ---
  const subjectsToCheck = ['数学', '语文', '英语'];
  const functionsToCheck = ['AI精准学', '错题练'];

  subjectsToCheck.forEach(subject => {
    functionsToCheck.forEach(fnKeyword => {
      // 记录七天内出现该类条目的天索引
      const matchDayIndices: number[] = [];
      plan.forEach((day, dayIdx) => {
        const hasMatch = day.items.some((item: any) =>
          item.function.includes(subject) && item.function.includes(fnKeyword) && !item.function.includes('强制休息')
        );
        if (hasMatch) matchDayIndices.push(dayIdx);
      });

      // 检查是否存在连续3天及以上
      for (let i = 0; i + 2 < matchDayIndices.length; i++) {
        if (
          matchDayIndices[i + 1] === matchDayIndices[i] + 1 &&
          matchDayIndices[i + 2] === matchDayIndices[i] + 2
        ) {
          // 第三天（matchDayIndices[i+2]）的该条目替换
          const targetDay = plan[matchDayIndices[i + 2]];
          targetDay.items.forEach((item: any) => {
            if (item.function.includes(subject) && item.function.includes(fnKeyword)) {
              // 根据成绩决定替换成什么
              const level = subject === '语文' ? chineseLevel : (subject === '英语' ? englishLevel : 'middle');
              if (level === 'top') {
                if (subject === '数学') {
                  item.function = '数学必考专项练';
                  item.content = '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习';
                } else if (subject === '语文') {
                  item.function = '语文必考专项练';
                  item.content = '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学';
                } else {
                  item.function = '英语必考专项练';
                  item.content = '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排';
                }
              } else {
                if (subject === '数学') {
                  item.function = '数学校内同步练';
                  item.content = '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度';
                } else if (subject === '语文') {
                  item.function = '语文校内同步练';
                  item.content = '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度';
                } else {
                  item.function = '英语校内同步练';
                  item.content = '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度';
                }
              }
            }
          });
        }
      }
    });
  });
};

const generateWeeklyPlan = (
  grade: string,
  ranks: { math: string, chinese: string, english: string },
  weekdayDuration: string,
  weekendDuration: string,
  machineType: MachineType = 'xueersi',
  isBoarding: boolean = false,
  surveyExtras?: {
    classroomComprehension?: string;
    carelessHabit?: string;
    homeworkCompletion?: string;
    examSpeed?: string;
    chineseFocusModules?: string[];
    englishFocusModules?: string[];
    chineseScore?: number;
    chineseRank?: string;
    englishScore?: number;
    englishRank?: string;
  }
): any[] => {
  const isPrimary = grade.includes('年级') && !grade.includes('初') && !grade.includes('高');
  const isHighSchool = ['高一', '高二', '高三'].includes(normalizeGrade(grade));
  const isMathTop15 = ranks.math.includes('15%') && (ranks.math.includes('前') || ranks.math.includes('Top'));
  const isChineseTop15 = ranks.chinese.includes('15%') && (ranks.chinese.includes('前') || ranks.chinese.includes('Top'));
  const isEnglishTop15 = ranks.english.includes('15%') && (ranks.english.includes('前') || ranks.english.includes('Top'));
  
  const isMiddleSchool = ['初一', '初二', '初三'].includes(normalizeGrade(grade));
  // 住校生没有工作日时长，用周末时长驱动模板选择（最终 return 时 filter 只保留周末）
  const durationForTemplate = (isBoarding && !weekdayDuration.trim()) ? weekendDuration : weekdayDuration;

  const is30Min = durationForTemplate.includes('30') || durationForTemplate.includes('半');
  const is2Hour = durationForTemplate.includes('2') || durationForTemplate.includes('两');
  const is1_5Hour = durationForTemplate.includes('1.5') || durationForTemplate.includes('一个半') || durationForTemplate.includes('1个半') || (durationForTemplate.includes('1') && durationForTemplate.includes('半'));
  const is1Hour = !is30Min && !is2Hour && !is1_5Hour &&
                  (durationForTemplate.includes('1') || durationForTemplate.includes('一小时') || durationForTemplate.includes('1小时'));

  const isWeekend30Min = weekendDuration.includes('30') || weekendDuration.includes('半小时');
  const isWeekend1Hour = !isWeekend30Min && (
    (weekendDuration.includes('1') && !weekendDuration.includes('1.5') && !weekendDuration.includes('一个半') && !weekendDuration.includes('1个半')) ||
    weekendDuration.includes('一小时') || weekendDuration.includes('一个小时')
  );
  const isWeekend2Hour = weekendDuration.includes('2') || weekendDuration.includes('两');
  const isWeekend3Hour = weekendDuration.includes('3') || weekendDuration.includes('三');

  // 放行：小学、初中、高中（任意时长）
  if (!isPrimary && !isMiddleSchool && !isHighSchool) return [];

  const plan: any[] = [];

  // ============================================================
  // === 科大讯飞（iFlyTek）课表分支 ===
  // ============================================================
  if (machineType === 'iflytek') {
    const W_VOCAB_CONTENT = '用学习机里的天天背单词软件-校内同步单词要全背、同时复习过去2天里学的单词和词组。';
    const W_MATH_AI_CONTENT = '用《同步精准学》紧跟课内进度学习，课后立即查漏补缺，并认真完成推送的校内同步课程与练习。在单元考、期中考、期末考前用《备考精准学》，检查一个阶段的学习是否有薄弱项，针对薄弱项精准突击，用于考前冲刺。';
    const W_REST_CONTENT = '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。';
    const W_MATH_CALC_CONTENT = '重点训练口算、听算能力，提升数学思维';
    const W_MATH_SPECIAL_CONTENT = '通过重难点突破、典型题训练与解题思路讲解，帮助学生快速锁定考点，掌握高效解题技巧。课程以"讲练结合"为核心，让学生在系统训练中不断夯实基础、提升思维。';
    const W_MATH_ERR_CONTENT = '利用学习机里的错题集功能，巩固温习过去的错题。48小时内复习错题的效率是1周后再复习的10倍！要及时复习！';
    const W_MATH_APP_CONTENT = '归纳每学期的应用题重难点，根据难度进行分类，帮助学生精准训练应用题重难点。';
    const W_THINK_CONTENT = '通过互动闯关逐一攻破小学数学知识点，趣味性强，题目少而精';
    const W_THINK_VIDEO_CONTENT = '先看视频课学习基本方法，再通过互动闯关逐一攻破小学数学知识点，趣味性强，题目少而精';
    const W_ENG_SYNC_CONTENT = '在学校正式开始上课之前，可以利用学习机的同步课程提前浏览一遍课程的知识点。其重点在于：1. 对将要学习的内容形成大致印象；2. 提升课堂学习的效率';
    const W_ENG_SPECIAL_CONTENT = '按语法、完形、阅读、听力等考试常见题型分类，精准提炼了英语学习中所有重难点';
    const W_ENG_GRADE_CONTENT = '分级阅读是根据阅读材料的词汇难度、句子长度、文体类型、文字排版、篇章结构和主题等要素的不同，给不同阅读能力水平者提供有科学性和针对性的读物。采用分级阅读的模式不但可以让少年儿童的阅读变得科学有效，而且更容易激发他们的阅读兴趣。';
    const W_ENG_EXAM_CONTENT = '这里都是全国的全真模拟试题，可以选择本市、本省、全国的真题题库。';
    const W_ENG_ORAL_CONTENT = 'AI虚拟语伴聊天，音标学习、情景对话';
    const W_CHN_WORD_CONTENT = '和课本同步的字词学习，包括认字、写字、听写、拓展等功能。';
    const W_CHN_SYNC_CONTENT = '上完课就做练习，把学过的题目再做一遍不容易忘。如果学得快，就试试难一点的题，慢慢让自己更厉害。';
    const W_CHN_SYNC_COURSE_CONTENT = '在学校正式开始上课之前，可以利用学习机的同步课程提前浏览一遍课程的知识点。其重点在于：1. 对将要学习的内容形成大致印象；2. 提升课堂学习的效率';
    const W_CHN_SPECIAL_CONTENT = '整个单元学完后，进行的专项练。';
    const W_CHN_ESSAY_CONTENT = '和课本同步的作文辅导，包含同步作文、专题作文和作文批改功能。';
    const W_CHN_EXAM_CONTENT = '这里都是全国的全真模拟试题，可以选择本市、本省、全国的真题题库。';
    const W_CHN_ERR_CONTENT = '利用学习机里的错题集功能，巩固温习过去的错题。48小时内复习错题的效率是1周后再复习的10倍！要及时复习！';
    const W_MATH_SYNC_PREPARE_CONTENT = '上完课就做练习，把学过的题目再做一遍不容易忘。如果学得快，就试试难一点的题，慢慢让自己更厉害。';
    const W_MATH_AI_EXAM_CONTENT = '用《备考精准学》，检查一个阶段的学习是否有薄弱项，针对薄弱项精准突击，用于考前冲刺。';
    const W_MATH_EXAM_CONTENT = '这里都是全国的全真模拟试题，可以选择本市、本省、全国的真题题库。';

    // -------------------------------------------------------
    // 平日 30分钟
    // -------------------------------------------------------
    if (is30Min) {
      if (isPrimary) {
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '5分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '10分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '语文同步练', content: W_CHN_SYNC_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '5分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '10分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '英语分级阅读-牛津阅读树', content: W_ENG_GRADE_CONTENT, time: '20分钟' },
        ]});
      } else {
        // 初中/高中 30分钟
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '5分钟' },
          { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '5分钟' },
          { function: '语文同步练', content: W_CHN_SYNC_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '5分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
          { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '10分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '5分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        ]});
      }
    }

    // -------------------------------------------------------
    // 平日 1小时
    // -------------------------------------------------------
    else if (is1Hour) {
      if (isPrimary) {
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
          { function: '思维拓展课', content: '【选做】' + W_THINK_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '15分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '语文同步练', content: W_CHN_SYNC_CONTENT, time: '20分钟' },
          { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '30分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '10分钟' },
          { function: '思维拓展课', content: W_THINK_VIDEO_CONTENT, time: '20分钟' },
          { function: '数学应用题AI课', content: W_MATH_APP_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '15分钟' },
          { function: '英语分级阅读-牛津阅读树', content: W_ENG_GRADE_CONTENT, time: '20分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        ]});
      } else {
        // 初中/高中 1小时
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
          { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '30分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文同步练习题', content: W_CHN_SYNC_CONTENT, time: '25分钟' },
          { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
          { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '15分钟' },
          { function: '数学校内同步练', content: W_MATH_SYNC_PREPARE_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '30分钟' },
        ]});
      }
    }

    // -------------------------------------------------------
    // 平日 1.5小时
    // -------------------------------------------------------
    else if (is1_5Hour) {
      if (isPrimary) {
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
          { function: '思维拓展课', content: W_THINK_CONTENT, time: '30分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '25分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
          { function: '英语分级阅读-牛津阅读树', content: W_ENG_GRADE_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '语文同步练', content: W_CHN_SYNC_CONTENT, time: '20分钟' },
          { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '30分钟' },
          { function: '语文作文辅导', content: W_CHN_ESSAY_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '15分钟' },
          { function: '思维拓展课', content: W_THINK_VIDEO_CONTENT, time: '25分钟' },
          { function: '数学应用题AI课', content: W_MATH_APP_CONTENT, time: '30分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学AI精准学备考模式', content: W_MATH_AI_EXAM_CONTENT, time: '20分钟' },
          { function: '英语分级阅读-牛津阅读树', content: W_ENG_GRADE_CONTENT, time: '25分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        ]});
      } else {
        // 初中/高中 1.5小时
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '30分钟' },
          { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '30分钟' },
          { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '25分钟' },
          { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '30分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文同步练习题', content: W_CHN_SYNC_CONTENT, time: '25分钟' },
          { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '25分钟' },
          { function: '语文精品密卷', content: W_CHN_EXAM_CONTENT, time: '30分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '30分钟' },
          { function: '数学校内同步练', content: W_MATH_SYNC_PREPARE_CONTENT, time: '25分钟' },
          { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '25分钟' },
          { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '30分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        ]});
      }
    }

    // -------------------------------------------------------
    // 平日 2小时
    // -------------------------------------------------------
    else if (is2Hour) {
      if (isPrimary) {
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
          { function: '思维拓展课', content: '【选做】' + W_THINK_CONTENT, time: '20分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '10分钟' },
          { function: '思维拓展课', content: W_THINK_VIDEO_CONTENT, time: '20分钟' },
          { function: '数学应用题AI课', content: W_MATH_APP_CONTENT, time: '20分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '语文同步练', content: W_CHN_SYNC_CONTENT, time: '20分钟' },
          { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '20分钟' },
          { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '15分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '英语分级阅读-牛津阅读树', content: W_ENG_GRADE_CONTENT, time: '20分钟' },
          { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '10分钟' },
          { function: '思维拓展课', content: W_THINK_VIDEO_CONTENT, time: '20分钟' },
          { function: '数学应用题AI课', content: W_MATH_APP_CONTENT, time: '20分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '语文专项练', content: W_CHN_SPECIAL_CONTENT, time: '20分钟' },
          { function: '语文作文辅导', content: W_CHN_ESSAY_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
          { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
          { function: '数学AI精准学备考模式', content: W_MATH_AI_EXAM_CONTENT, time: '30分钟' },
          { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '20分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语分级阅读-牛津阅读树', content: W_ENG_GRADE_CONTENT, time: '20分钟' },
        ]});
      } else {
        // 初中/高中 2小时
        plan.push({ day: '周一', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
          { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '25分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周二', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
          { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '25分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '语文同步练习题', content: W_CHN_SYNC_CONTENT, time: '25分钟' },
          { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '20分钟' },
        ]});
        plan.push({ day: '周三', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
          { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '15分钟' },
          { function: '数学校内同步练', content: W_MATH_SYNC_PREPARE_CONTENT, time: '20分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周四', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
          { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '25分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '语文同步练习题', content: W_CHN_SYNC_CONTENT, time: '20分钟' },
          { function: '语文精品密卷', content: W_CHN_EXAM_CONTENT, time: '25分钟' },
        ]});
        plan.push({ day: '周五', items: [
          { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '15分钟' },
          { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
          { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '15分钟' },
          { function: '数学校内同步练', content: W_MATH_SYNC_PREPARE_CONTENT, time: '20分钟' },
          { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
          { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
          { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '25分钟' },
        ]});
      }
    }

    // -------------------------------------------------------
    // 周末课表（讯飞）
    // -------------------------------------------------------

    // 周末 30分钟·小学
    if (isWeekend30Min && isPrimary) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '20分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '语文同步练', content: W_CHN_SYNC_CONTENT, time: '20分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '10分钟' },
      ]});
    }

    // 周末 30分钟·初中/高中
    if (isWeekend30Min && (isMiddleSchool || isHighSchool)) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '20分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '5分钟' },
        { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
      ]});
    }

    // 周末 1小时·小学
    if (isWeekend1Hour && isPrimary) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '20分钟' },
        { function: '思维拓展课', content: '【选做】' + W_THINK_CONTENT, time: '20分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '10分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '25分钟' },
      ]});
    }

    // 周末 1小时·初中/高中
    if (isWeekend1Hour && (isMiddleSchool || isHighSchool)) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
        { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '15分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '10分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
        { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '30分钟' },
      ]});
    }

    // 周末 2小时·小学
    if (isWeekend2Hour && isPrimary) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '20分钟' },
        { function: '思维拓展课', content: '【选做】' + W_THINK_CONTENT, time: '20分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '10分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '20分钟' },
        { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '20分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
        { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '10分钟' },
        { function: '思维拓展课', content: W_THINK_VIDEO_CONTENT, time: '20分钟' },
        { function: '数学应用题AI课', content: W_MATH_APP_CONTENT, time: '20分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '语文专项练', content: W_CHN_SPECIAL_CONTENT, time: '20分钟' },
        { function: '语文作文辅导', content: W_CHN_ESSAY_CONTENT, time: '20分钟' },
      ]});
    }

    if (isWeekend2Hour && (isMiddleSchool || isHighSchool)) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
        { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '15分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '10分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '20分钟' },
        { function: '英语听说-专项学习', content: W_ENG_ORAL_CONTENT, time: '30分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '15分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '15分钟' },
        { function: '数学校内同步练', content: W_MATH_SYNC_PREPARE_CONTENT, time: '20分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '语文精品密卷', content: W_CHN_EXAM_CONTENT, time: '40分钟' },
        { function: '语文错题练', content: W_CHN_ERR_CONTENT, time: '10分钟' },
      ]});
    }

    if (isWeekend3Hour && isPrimary) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
        { function: '思维拓展课', content: '【选做】' + W_THINK_CONTENT, time: '25分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '10分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '语文同步练', content: W_CHN_SYNC_CONTENT, time: '25分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '25分钟' },
        { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '30分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '语文字词学习', content: W_CHN_WORD_CONTENT, time: '10分钟' },
        { function: '数学计算能力与巧算', content: W_MATH_CALC_CONTENT, time: '15分钟' },
        { function: '思维拓展课', content: W_THINK_VIDEO_CONTENT, time: '25分钟' },
        { function: '数学应用题AI课', content: W_MATH_APP_CONTENT, time: '20分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '25分钟' },
        { function: '语文作文辅导', content: W_CHN_ESSAY_CONTENT, time: '10分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '英语分级阅读-牛津阅读树', content: W_ENG_GRADE_CONTENT, time: '25分钟' },
        { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '20分钟' },
      ]});
    }

    // 周末 3小时·初中/高中（结构：单词10+数学60+休息10+语文45+休息10+英语45=180）
    if (isWeekend3Hour && (isMiddleSchool || isHighSchool)) {
      plan.push({ day: '周六', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '25分钟' },
        { function: '数学专项练', content: W_MATH_SPECIAL_CONTENT, time: '20分钟' },
        { function: '数学错题练', content: W_MATH_ERR_CONTENT, time: '15分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '语文教材同步课', content: W_CHN_SYNC_COURSE_CONTENT, time: '25分钟' },
        { function: '语文同步练习题', content: W_CHN_SYNC_CONTENT, time: '20分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '英语教材同步课', content: W_ENG_SYNC_CONTENT, time: '25分钟' },
        { function: '英语精品密卷', content: W_ENG_EXAM_CONTENT, time: '20分钟' },
      ]});
      plan.push({ day: '周日', items: [
        { function: '英语天天记单词', content: W_VOCAB_CONTENT, time: '10分钟' },
        { function: '数学AI精准学', content: W_MATH_AI_CONTENT, time: '20分钟' },
        { function: '数学校内同步练', content: W_MATH_SYNC_PREPARE_CONTENT, time: '20分钟' },
        { function: '数学精品密卷', content: W_MATH_EXAM_CONTENT, time: '20分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '语文精品密卷', content: W_CHN_EXAM_CONTENT, time: '25分钟' },
        { function: '语文错题练', content: W_CHN_ERR_CONTENT, time: '20分钟' },
        { function: '强制休息', content: W_REST_CONTENT, time: '10分钟' },
        { function: '英语听说-专项学习', content: W_ENG_ORAL_CONTENT, time: '25分钟' },
        { function: '英语突破专项练', content: W_ENG_SPECIAL_CONTENT, time: '20分钟' },
      ]});
    }

    return isBoarding ? plan.filter((d: any) => d.day === '周六' || d.day === '周日') : plan;
  }
  // ============================================================
  // === 学而思课表分支（原有逻辑，保持不变）===
  // ============================================================

  // --- 高中生 30 MINUTE TEMPLATE ---
  if (is30Min && isHighSchool) {
    plan.push({
      day: '周一',
      items: [
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高', time: '15分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
    plan.push({
      day: '周二',
      items: [
        { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
    plan.push({
      day: '周三',
      items: [
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
    plan.push({
      day: '周四',
      items: [
        { function: '数学校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
    plan.push({
      day: '周五',
      items: [
        { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
  }

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
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '15分钟' }
      ]
    });
    plan.push({
      day: '周五',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '5分钟' },
        { function: '英语错题练', content: '"订正本周错题"', time: '10分钟' }
      ]
    });
  } 
  // --- 2 HOUR TEMPLATE (High School, Grade 10-12) ---
  // 结构：数学55分钟（2项）+ 强制休息10分钟 + 语文/英语50分钟 + 批改5分钟 = 120分钟
  else if (is2Hour && isHighSchool) {
    // 周一（数学+英语）
    plan.push({
      day: '周一',
      items: [
        { function: '数学校内同步课', content: '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
        { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周二（数学+语文）
    plan.push({
      day: '周二',
      items: [
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '35分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周三（数学+英语）
    plan.push({
      day: '周三',
      items: [
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
        { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周四（数学+语文）
    plan.push({
      day: '周四',
      items: [
        { function: '数学王牌拔尖课', content: '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习', time: '25分钟' },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '35分钟' },
        { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周五（数学+英语）
    plan.push({
      day: '周五',
      items: [
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '30分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '30分钟' },
        { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
  }
  // --- 2 HOUR TEMPLATE (Middle School, Grade 7-9) ---
  // 结构：前20分钟语言积累 + 5分钟全科批改 + 45分钟数学 + 10分钟强制休息 + 40分钟语文/英语 = 120分钟
  else if (is2Hour && isMiddleSchool) {
    // 周一（数学+英语）
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
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        {
          function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
          content: isEnglishTop15 ? '选择你目前认为做薄弱的一个内容来学习' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
          time: '25分钟'
        },
        {
          function: isEnglishTop15 ? '英语必考专项练' : '英语校内同步练',
          content: isEnglishTop15 ? '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度',
          time: '15分钟'
        }
      ]
    });

    // 周二（数学+语文）
    plan.push({
      day: '周二',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        ...(isChineseTop15 ? [
          { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '15分钟' },
          { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' }
        ] : [
          { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
          { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
        ])
      ]
    });

    // 周三（数学+英语）
    plan.push({
      day: '周三',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        ...(isMathTop15 ? [
          { function: '数学重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '20分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '15分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' }
        ] : [
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' }
        ]),
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        {
          function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
          content: isEnglishTop15 ? '选择你目前认为最薄弱的一个内容来学习' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
          time: isEnglishTop15 ? '30分钟' : '25分钟'
        },
        ...(isEnglishTop15 ? [
          { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' }
        ] : [
          { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
        ])
      ]
    });

    // 周四（数学+语文）
    plan.push({
      day: '周四',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        {
          function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课',
          content: isMathTop15 ? '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习' : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
          time: '25分钟'
        },
        {
          function: isMathTop15 ? '数学AI专属练' : '数学校内同步练',
          content: isMathTop15 ? 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度',
          time: '20分钟'
        },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        ...(isChineseTop15 ? [
          { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' },
          { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '15分钟' }
        ] : [
          { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
          { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
        ])
      ]
    });

    // 周五（数学+英语）
    plan.push({
      day: '周五',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '15分钟' },
        ...(isMathTop15 ? [
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '15分钟' },
          { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '15分钟' }
        ] : [
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '15分钟' }
        ]),
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        ...(isEnglishTop15 ? [
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排', time: '20分钟' },
          { function: 'AI口语分级练', content: '用 AI 大模型生成的口语陪练教练，带你一起聊一聊常用的热门话题，不断提升口语表达。', time: '10分钟' },
          { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' }
        ] : [
          { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
          { function: 'AI口语分级练', content: '用 AI 大模型生成的口语陪练教练，带你一起聊一聊常用的热门话题，不断提升口语表达。', time: '10分钟' },
          { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '10分钟' }
        ])
      ]
    });
  }
  // --- 2 HOUR TEMPLATE (Primary School, Grade 1-6) ---
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
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
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
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
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
        ...(isMathTop15 ? [
          { function: '数学重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '20分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' }
        ] : [
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' }
        ]),
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        {
          function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
          content: isEnglishTop15 ? '选择你目前认为最薄弱的一个内容来学习' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
          time: '30分钟'
        }
      ]
    });
    plan.push({
      day: '周四',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        {
          function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课',
          content: isMathTop15 ? '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习' : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
          time: '35分钟'
        },
        { function: 'AI口算', content: '口算训练，保持对数字和运算的敏感', time: '10分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        ...(isChineseTop15 ? [
          { function: '语文重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '25分钟' },
          { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '15分钟' }
        ] : [
          { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
          { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
        ])
      ]
    });
    plan.push({
      day: '周五',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '30分钟' },
        {
          function: isMathTop15 ? '数学必考专项练' : '数学AI专属练',
          content: isMathTop15 ? '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习' : 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目',
          time: '15分钟'
        },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        {
          function: isEnglishTop15 ? '英语必考专项练' : '英语错题练',
          content: isEnglishTop15 ? '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。' : '"订正本周错题"和"攻克本周薄弱项"',
          time: '20分钟'
        },
        { function: 'AI口语练', content: '任选一个对话内容，尽情聊天，一定要大声说出来，不要害羞', time: '10分钟' }
      ]
    });
  }
  // --- 1.5 HOUR TEMPLATE (High School, Grade 10-12) ---
  // 结构：数学55分钟（2项）+ 强制休息10分钟 + 语文/英语20分钟 + 批改5分钟 = 90分钟
  else if (is1_5Hour && isHighSchool) {
    // 周一（数学+英语）
    plan.push({
      day: '周一',
      items: [
        { function: '数学校内同步课', content: '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '20分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周二（数学+语文）
    plan.push({
      day: '周二',
      items: [
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周三（数学+英语）
    plan.push({
      day: '周三',
      items: [
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '25分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '20分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周四（数学+语文）
    plan.push({
      day: '周四',
      items: [
        { function: '数学王牌拔尖课', content: '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习', time: '30分钟' },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '25分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '20分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周五（数学+英语）
    plan.push({
      day: '周五',
      items: [
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
        { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
        { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' },
        { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '15分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
  }
  // --- 1.5 HOUR TEMPLATE (Middle School, Grade 7-9) W-5 ---
  // 结构：前20分钟语言积累 + 5分钟全科批改 + 65分钟核心科目实战（2~3项，无AI口算）
  else if (is1_5Hour && isMiddleSchool) {
    // 周一（数学日）：背单词10分钟 + 语文AI听写10分钟 + 批改5分钟 + 数学实战65分钟
    plan.push({
      day: '周一',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        {
          function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课',
          content: isMathTop15
            ? '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习'
            : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
          time: '25分钟'
        },
        {
          function: isMathTop15 ? '数学AI专属练' : '数学校内同步练',
          content: isMathTop15
            ? 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目'
            : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度',
          time: '20分钟'
        },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' }
      ]
    });

    // 周二（英语日）：背单词10分钟 + 英语AI听写10分钟 + 批改5分钟 + 英语实战65分钟
    plan.push({
      day: '周二',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        {
          function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
          content: isEnglishTop15
            ? '选择你目前认为做薄弱的一个内容来学习'
            : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
          time: '25分钟'
        },
        {
          function: '英语校内同步练',
          content: isEnglishTop15
            ? '选择同步练难度中或高的，可以根据自己的体验选择稍有挑战的难度'
            : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度',
          time: '25分钟'
        },
        { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '15分钟' }
      ]
    });

    // 周三（语文日）：语文AI听写10分钟 + 背单词10分钟 + 批改5分钟 + 语文实战65分钟
    plan.push({
      day: '周三',
      items: [
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        ...(isChineseTop15 ? [
          { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '20分钟' },
          { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' },
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' }
        ] : [
          { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
          { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' },
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '15分钟' }
        ])
      ]
    });

    // 周四（数学日）：背单词10分钟 + 语文AI听写10分钟 + 批改5分钟 + 数学实战65分钟
    plan.push({
      day: '周四',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '25分钟' },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' }
      ]
    });

    // 周五（英语日）：背单词10分钟 + 英语AI听写10分钟 + 批改5分钟 + 英语实战65分钟
    plan.push({
      day: '周五',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '35分钟' },
        { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。', time: '20分钟' },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '10分钟' }
      ]
    });
  }
  // --- 1 HOUR TEMPLATE (High School, Grade 10-12) ---
  else if (is1Hour && isHighSchool) {
    // 周一：数学
    plan.push({
      day: '周一',
      items: [
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高', time: '15分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' },
        { function: '数学校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '30分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周二：英语
    plan.push({
      day: '周二',
      items: [
        { function: '英语校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
        { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周三：语文
    plan.push({
      day: '周三',
      items: [
        { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '25分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周四：数学
    plan.push({
      day: '周四',
      items: [
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '40分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '15分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });

    // 周五：英语
    plan.push({
      day: '周五',
      items: [
        { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '25分钟' },
        { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '30分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
      ]
    });
  }
  // --- 1 HOUR TEMPLATE (Middle School, Grade 7-9) ---
  else if (is1Hour && isMiddleSchool) {
    // 周一：数学
    plan.push({
      day: '周一',
      items: [
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        {
          function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课',
          content: isMathTop15
            ? '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习'
            : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
          time: '25分钟'
        },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' },
        { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '10分钟' }
      ]
    });

    // 周二：英语
    plan.push({
      day: '周二',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        {
          function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
          content: isEnglishTop15
            ? '选择你目前认为做薄弱的一个内容来学习'
            : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
          time: '30分钟'
        },
        { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' }
      ]
    });

    // 周三：语文
    plan.push({
      day: '周三',
      items: [
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        ...(isChineseTop15 ? [
          { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '20分钟' },
          { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' }
        ] : [
          { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
          { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' }
        ])
      ]
    });

    // 周四：数学
    plan.push({
      day: '周四',
      items: [
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '30分钟' },
        { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '15分钟' },
        { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '10分钟' }
      ]
    });

    // 周五：英语
    plan.push({
      day: '周五',
      items: [
        { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
        { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' },
        { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' },
        { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '10分钟' }
      ]
    });
  }
  // --- 1.5 HOUR TEMPLATE (Grade 1-6) ---
  // 结构：前20分钟语言积累 + 5分钟全科批改 + 65分钟核心科目实战（2~3项）
  // 周四积累段：背单词10分钟 + AI口算10分钟（小学专属，初中/高中无此功能）
  else if (is1_5Hour && isPrimary) {
    // 周一（数学日）：背单词10分钟 + 语文AI听写10分钟 + 批改5分钟 + 数学实战65分钟
    const monItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      { 
        function: isMathTop15 ? '数学重难点提分课' : '数学校内同步课', 
        content: isMathTop15 ? '选择你目前认为做薄弱的一个内容来学习' : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象', 
        time: '25分钟' 
      },
      { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '20分钟' },
      { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '20分钟' }
    ];
    plan.push({ day: '周一', items: monItems });

    // 周二（英语日）：背单词10分钟 + 英语AI听写10分钟 + 批改5分钟 + 英语实战65分钟
    const tueItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      { 
        function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课', 
        content: isEnglishTop15 ? '选择你目前认为做薄弱的一个内容来学习' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', 
        time: '30分钟' 
      },
      { 
        function: '英语校内同步练', 
        content: isEnglishTop15 ? '选择同步练难度中或高的，可以根据自己的体验选择稍有挑战的难度' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', 
        time: '25分钟' 
      },
      { function: 'AI口语练', content: '任选一个对话内容，尽情聊天，一定要大声说出来，不要害羞', time: '10分钟' }
    ];
    plan.push({ day: '周二', items: tueItems });

    // 周三（语文日）：语文AI听写10分钟 + 背单词10分钟 + 批改5分钟 + 语文实战65分钟
    const wedItems = [
      { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      ...(isChineseTop15 ? [
        { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '25分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '40分钟' }
      ] : [
        { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '15分钟' }
      ])
    ];
    plan.push({ day: '周三', items: wedItems });

    // 周四（数学日）：背单词10分钟 + AI口算10分钟（小学专属）+ 批改5分钟 + 数学实战65分钟
    const thuItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: 'AI口算', content: '口算训练，保持对数字和运算的敏感。小学专属功能，每天10分钟坚持练习', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      {
        function: isMathTop15 ? '数学王牌拔尖课' : '数学重难点提分课',
        content: isMathTop15 ? '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习' : '选择你目前认为做薄弱的一个内容来学习',
        time: '30分钟'
      },
      { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '20分钟' },
      { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高（听视频课、做练习）', time: '15分钟' }
    ];
    plan.push({ day: '周四', items: thuItems });

    // 周五（英语日）：背单词10分钟 + 英语AI听写10分钟 + 批改5分钟 + 英语实战65分钟
    const friItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '35分钟' },
      { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
      { function: 'AI口语练', content: '任选一个对话内容，尽情聊天，一定要大声说出来，不要害羞', time: '10分钟' }
    ];
    plan.push({ day: '周五', items: friItems });
  }
  // --- 1 HOUR TEMPLATE (Grade 1-6) ---
  // 结构：积累10分钟 + 批改5分钟 + 核心45分钟，合计60分钟
  else if (is1Hour && isPrimary) {
    // 周一（数学日）：背单词10 + 批改5 + 数学课25 + 数学AI专属练20 = 60分钟
    const monItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      {
        function: isMathTop15 ? '数学重难点提分课' : '数学校内同步课',
        content: isMathTop15 ? '选择你目前认为做薄弱的一个内容来学习' : '在本周上课前快速听一遍将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
        time: '25分钟'
      },
      { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '20分钟' }
    ];
    plan.push({ day: '周一', items: monItems });

    // 周二（英语日）：背单词10 + 批改5 + 英语课30 + 英语同步练15 = 60分钟
    const tueItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      {
        function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
        content: isEnglishTop15 ? '选择你目前认为做薄弱的一个内容来学习' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
        time: '30分钟'
      },
      {
        function: '英语校内同步练',
        content: isEnglishTop15 ? '选择同步练难度中或高的，可以根据自己的体验选择稍有挑战的难度' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度',
        time: '15分钟'
      }
    ];
    plan.push({ day: '周二', items: tueItems });

    // 周三（语文日）：听写10 + 批改5 + 语文核心45 = 60分钟
    // 普通：语文同步课25 + 语文同步练20 = 45；Top15：专项练20 + 提分课25 = 45
    const wedItems = [
      { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      ...(isChineseTop15 ? [
        { function: '语文必考专项练', content: '是针对不同的考点来设计练习，并不是按照课本章节来进行的。适合基础较好，明确知道自己哪里有薄弱项的同学', time: '20分钟' },
        { function: '语文重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' }
      ] : [
        { function: '语文校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '25分钟' },
        { function: '语文校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' }
      ])
    ];
    plan.push({ day: '周三', items: wedItems });

    // 周四（数学日）：
    // 普通：背单词10 + AI口算10 + 批改5 + 数学提分课25 + 数学AI专属练10 = 60
    // Top15：背单词10 + 听写10 + 批改5 + 数学王牌课25 + 数学AI专属练10 = 60
    const thuItems = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      ...(isMathTop15 ? [
        { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学王牌拔尖课', content: '如果课内的内容都能听懂，平时成绩90分以上，可直接用王牌拔尖课来练习', time: '25分钟' }
      ] : [
        { function: 'AI口算', content: '口算训练，保持对数字和运算的敏感', time: '10分钟' },
        { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
        { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' }
      ]),
      { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '10分钟' }
    ];
    plan.push({ day: '周四', items: thuItems });

    // 周五（英语日）：背单词10 + 英语AI听写10 + 批改5 + 英语提分课25 + 英语错题练10 = 60分钟
    const friItems2 = [
      { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
      { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
      { function: '（全科）全科批改/智慧眼', content: '把日常作业拍照上传到学习机', time: '5分钟' },
      { function: '英语重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '25分钟' },
      { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' }
    ];
    plan.push({ day: '周五', items: friItems2 });
  }

  // --- WEEKEND TEMPLATE ---
  // 住校生平日不在家，weekdayDuration 为空，plan 此时为空，但仍需生成周末课表
  if (plan.length > 0 || (isBoarding && !weekdayDuration.trim())) {

    // --- 高中 2小时周末 ---
    if (isWeekend2Hour && isHighSchool) {
      // 周六：数学 + 英语
      plan.push({
        day: '周六',
        items: [
          { function: '数学重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '35分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '25分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '25分钟' },
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '25分钟' }
        ]
      });
      // 周日：数学 + 语文
      plan.push({
        day: '周日',
        items: [
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '30分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '语文重难点提分课', content: '根据学生自己的进度选择来学，阅读专项、基础知识、作文这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '30分钟' },
          { function: '语文必考专项练', content: '包括基础知识和阅读专项，学生可以根据自己的情况选择薄弱项来练习巩固', time: '30分钟' }
        ]
      });
    }

    // --- 初中 2小时周末 ---
    if (isWeekend2Hour && isMiddleSchool) {
      // 周六：语言积累 + 数学、英语
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '35分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '20分钟' },
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' }
        ]
      });
      // 周日：语言积累 + 数学、语文
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '语文趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' }
        ]
      });
    }

    // --- 小学 2小时周末 ---
    if (isWeekend2Hour && isPrimary) {
      // 周六：语言积累 + 数学、英语
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '35分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '20分钟' },
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' }
        ]
      });
      // 周日：语言积累 + 数学、语文
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '语文趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' }
        ]
      });
    }

    // --- 高中 1小时周末 ---
    if (isWeekend1Hour && isHighSchool) {
      // 周六：数学
      plan.push({
        day: '周六',
        items: [
          { function: '数学重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '30分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '30分钟' }
        ]
      });
      // 周日：英语
      plan.push({
        day: '周日',
        items: [
          { function: '英语重难点提分课', content: '选择你目前认为最薄弱的一个内容来学习', time: '30分钟' },
          { function: '英语必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '30分钟' }
        ]
      });
    }

    // --- 初中 1小时周末 ---
    if (isWeekend1Hour && isMiddleSchool) {
      // 周六：语言积累 + 数学
      plan.push({
        day: '周六',
        items: [
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '15分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '30分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' }
        ]
      });
      // 周日：语言积累 + 深度阅读
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '5分钟' },
          { function: '英语AI精准学（标准模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '25分钟' }
        ]
      });
    }

    // --- 小学 1小时周末 ---
    if (isWeekend1Hour && isPrimary) {
      // 周六：语言积累 + 数学
      plan.push({
        day: '周六',
        items: [
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '15分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '30分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '15分钟' }
        ]
      });
      // 周日：语言积累 + 深度阅读
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '5分钟' },
          { function: '英语AI精准学（标准模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '25分钟' }
        ]
      });
    }

    // --- 小学 30分钟周末 ---
    if (isWeekend30Min && isPrimary) {
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高', time: '15分钟' },
          { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
        ]
      });
      plan.push({
        day: '周日',
        items: [
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '5分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学AI专属练', content: 'AI学习机会根据日常对你的了解，每天给你出10道它认为你最需要加强的题目', time: '10分钟' },
          { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
        ]
      });
    }

    // --- 初中 30分钟周末 ---
    if (isWeekend30Min && isMiddleSchool) {
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高', time: '15分钟' },
          { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
        ]
      });
      plan.push({
        day: '周日',
        items: [
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '英语校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '15分钟' },
          { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
        ]
      });
    }

    // --- 高中 30分钟周末 ---
    if (isWeekend30Min && isHighSchool) {
      plan.push({
        day: '周六',
        items: [
          { function: '数学AI精准学（标准模式）', content: '检测最新学的知识点，对知识弱项进行针对性的提高', time: '15分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' },
          { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
        ]
      });
      plan.push({
        day: '周日',
        items: [
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。', time: '25分钟' },
          { function: '（全科）全科批改/智慧眼', content: '把所有日常作业拍照上传到学习机', time: '5分钟' }
        ]
      });
    }

    // --- 小学 3小时 后85% ---
    if (isWeekend3Hour && isPrimary && !isMathTop15 && !isChineseTop15 && !isEnglishTop15) {
      // 周六：语言积累 + 数学、英语
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          { function: '英语校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
          { function: '英语趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '英语AI精准学（标准模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
      // 周日：语言积累 + 数学（同步）、语文（同步）
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学校内同步课', content: '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
          { function: '数学校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          { function: '语文校内同步课', content: '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
          { function: '语文趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
    }

    // --- 初中 3小时 后85% ---
    if (isWeekend3Hour && isMiddleSchool && !isMathTop15 && !isChineseTop15 && !isEnglishTop15) {
      // 周六：语言积累 + 数学、英语
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          { function: '英语校内同步课', content: '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
          { function: '英语趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '英语AI精准学（标准模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
      // 周日：语言积累 + 数学（同步）、语文（同步）
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学校内同步课', content: '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
          { function: '数学校内同步练', content: '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度', time: '20分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          { function: '语文校内同步课', content: '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象', time: '30分钟' },
          { function: '语文趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
    }

    // --- 小学 3小时 含前15%（按科目判断） ---
    if (isWeekend3Hour && isPrimary && (isMathTop15 || isChineseTop15 || isEnglishTop15)) {
      // 周六：语言积累 + 数学、英语（英语按 isEnglishTop15 判断）
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          {
            function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
            content: isEnglishTop15 ? '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
            time: '30分钟'
          },
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' },
          { function: '英语AI精准学（标准模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
      // 周日：语言积累 + 数学（按 isMathTop15）、语文（按 isChineseTop15）
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          {
            function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课',
            content: isMathTop15 ? '适合基础扎实，日常考试成绩保持在90分以上的学生' : '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
            time: '30分钟'
          },
          {
            function: isMathTop15 ? '数学王牌教辅练（《53天天练》等）' : '数学校内同步练',
            content: isMathTop15 ? '不一定是选择《53》，学生如果有平时在练习其他教辅书也可以' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度',
            time: '20分钟'
          },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          {
            function: isChineseTop15 ? '语文重难点提分课' : '语文校内同步课',
            content: isChineseTop15 ? '根据学生自己的进度选择来学，阅读专项、基础知识、作文这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学' : '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
            time: '30分钟'
          },
          { function: '语文趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
    }

    // --- 初中 3小时 含前15%（按科目判断） ---
    if (isWeekend3Hour && isMiddleSchool && (isMathTop15 || isChineseTop15 || isEnglishTop15)) {
      // 周六：语言积累 + 数学、英语（英语按 isEnglishTop15 判断）
      plan.push({
        day: '周六',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          {
            function: isEnglishTop15 ? '英语重难点提分课' : '英语校内同步课',
            content: isEnglishTop15 ? '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学' : '在上课前快速听一遍所学内容，可适当倍速，重点是对新知识形成大致印象',
            time: '30分钟'
          },
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' },
          { function: '英语AI精准学（标准模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
      // 周日：语言积累 + 数学（按 isMathTop15）、语文（按 isChineseTop15）
      plan.push({
        day: '周日',
        items: [
          { function: '天天背单词', content: '坚持10分钟背单词', time: '10分钟' },
          { function: '英语AI听写', content: '每天新背的单词和课内要求背诵的单词必须用听写反复练习', time: '10分钟' },
          { function: '语文AI听写或AI背诵', content: '如果最近学的课文有要求背诵，优先进行AI背诵。如果都背诵完了，就听写最近学的课文对应的字词', time: '10分钟' },
          {
            function: isMathTop15 ? '数学王牌拔尖课' : '数学校内同步课',
            content: isMathTop15 ? '适合基础扎实，日常考试成绩保持在90分以上的学生' : '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
            time: '30分钟'
          },
          {
            function: isMathTop15 ? '数学王牌教辅练（《53天天练》等）' : '数学校内同步练',
            content: isMathTop15 ? '不一定是选择《53》，学生如果有平时在练习其他教辅书也可以' : '同步练难度分为低、中、高，可以根据自己的体验选择稍有挑战的难度',
            time: '20分钟'
          },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 15 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '15分钟' },
          {
            function: isChineseTop15 ? '语文重难点提分课' : '语文校内同步课',
            content: isChineseTop15 ? '根据学生自己的进度选择来学，阅读专项、基础知识、作文这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学' : '提前听一遍下周将要学习的内容，可适当倍速，重点是对新知识形成大致印象',
            time: '30分钟'
          },
          { function: '语文趣味分级练', content: '学完一整个单元后练这个。学而思自研4级分层闯关，阶梯晋级', time: '20分钟' },
          { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
    }

    // --- 高中 3小时（不分成绩） ---
    if (isWeekend3Hour && isHighSchool) {
      // 周六：数学 + 英语 + 语文
      plan.push({
        day: '周六',
        items: [
          { function: '数学重难点提分课', content: '选择你目前认为做薄弱的一个内容来学习', time: '30分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '20分钟' },
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '英语重难点提分课', content: '根据学生自己的进度选择来学，自然拼读、语法精讲、分级阅读这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '25分钟' },
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '语文重难点提分课', content: '根据学生自己的进度选择来学，阅读专项、基础知识、作文这几项内容都是很重要，需要掌握的。学生可以自行安排每周穿插来学', time: '25分钟' },
          { function: '语文必考专项练', content: '包括基础知识和阅读专项，学生可以根据自己的情况选择薄弱项来练习巩固', time: '20分钟' }
        ]
      });
      // 周日：数学（AI精准学+错题+必考专项）+ 英语（必考专项+错题+AI精准学）+ 语文（必考专项+错题+AI精准学）
      plan.push({
        day: '周日',
        items: [
          { function: '数学AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '25分钟' },
          { function: '数学错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '20分钟' },
          { function: '数学必考专项练', content: '按照教学大纲拆分考点，专项突破提升，不是按照课本单元顺序来分。适合有一定基础的，知道自己薄弱项的学生有针对性的做练习', time: '25分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '英语必考专项练', content: '分成"日常知识积累"和"学期必考专项"，结合了不同年级学生应该掌握的知识点来安排。英语科目比较特别，全国各地区各教材版本进度差距较大，大家学习时不用受限于年级，按照自己进度来选就可以。觉得简单了可以选择更高年级的内容来学习。', time: '20分钟' },
          { function: '英语错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' },
          { function: '英语AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' },
          { function: '强制休息', content: '必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行"后台下载"，固化刚才学到的逻辑。', time: '10分钟' },
          { function: '语文必考专项练', content: '包括基础知识和阅读专项，学生可以根据自己的情况选择薄弱项来练习巩固', time: '20分钟' },
          { function: '语文错题练', content: '"订正本周错题"和"攻克本周薄弱项"', time: '10分钟' },
          { function: '语文AI精准学（备考模式）', content: '检测本单元所有知识点的掌握情况，是考试前的自我摸底。掌握不扎实的考点需要自己安排时间进行专项练习。', time: '15分钟' }
        ]
      });
    }

  }

  // 学而思方案：应用问卷个性化后处理
  if (surveyExtras) {
    applyXueersiSurveyAdjustments(plan, surveyExtras);
  }

  return isBoarding ? plan.filter((d: any) => d.day === '周六' || d.day === '周日') : plan;
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
              standardizedRow.weekend_duration,
              machineType,
              !!standardizedRow.is_boarding,
              // 新增：问卷个性化参数
              {
                classroomComprehension: standardizedRow.classroom_comprehension || '',
                carelessHabit: standardizedRow.careless_habit || '',
                homeworkCompletion: standardizedRow.homework_completion || '',
                examSpeed: standardizedRow.exam_speed || '',
                chineseFocusModules: standardizedRow.chinese_focus_modules
                  ? standardizedRow.chinese_focus_modules.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
                  : [],
                englishFocusModules: standardizedRow.english_focus_modules
                  ? standardizedRow.english_focus_modules.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
                  : [],
                chineseScore: mapScoreToNumber(standardizedRow.chinese_score),
                chineseRank: standardizedRow.chinese_rank || '',
                englishScore: mapScoreToNumber(standardizedRow.english_score),
                englishRank: standardizedRow.english_rank || '',
              }
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
                isBoarding: !!standardizedRow.is_boarding,
                // 新增问卷字段
                classroomComprehension: standardizedRow.classroom_comprehension || '',
                homeworkCompletion: standardizedRow.homework_completion || '',
                examSpeed: standardizedRow.exam_speed || '',
                chineseFocusModules: standardizedRow.chinese_focus_modules
                  ? standardizedRow.chinese_focus_modules.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
                  : [],
                englishFocusModules: standardizedRow.english_focus_modules
                  ? standardizedRow.english_focus_modules.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
                  : [],
              },
              phone: standardizedRow.phone || ''
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

