
export interface StudentRawData {
  student_name: string;
  grade: string;
  math_score: string;
  chinese_score: string;
  english_score: string;
  // Ranking fields
  math_rank?: string;
  chinese_rank?: string;
  english_rank?: string;
  
  weak_points: string;
  weekday_duration: string; // Q17
  weekend_duration: string; // Q18
  // Qualitative fields for diagnosis
  careless_habit?: string; // Q15 马虎
  note_habit?: string;     // Q12 笔记
  plan_habit?: string;     // Q16 计划
  mistake_habit?: string;  // Q11 错题
  
  // New: Machine Brand
  machine_brand?: string;
  
  // New: Submission Time from CSV
  submit_time?: string;

  // New: Phone last 4 digits (Q23) for PDF password
  phone?: string;

  // --- STRICT SURVEY TYPE FLAGS ---
  // If true, this row came from the K12 survey (asked for scores)
  is_k12_survey?: boolean;
  is_boarding?: boolean;

  // --- 新增问卷字段 ---
  // 课堂听懂程度（"课堂内能听懂多少"）
  classroom_comprehension?: string;
  // 课内作业完成情况
  homework_completion?: string;
  // 考试完成速度
  exam_speed?: string;
  // 语文想提升的模块（多选，逗号分隔）
  chinese_focus_modules?: string;
  // 英语想提升的模块（多选，逗号分隔）
  english_focus_modules?: string;
}

// 1 = Top (Top 5%), 5 = Bottom
export type SubjectLevel = 1 | 2 | 3 | 4 | 5;

export type MachineType = 'xueersi' | 'iflytek' | 'bubugao';

export interface CurriculumItem {
  subject: string;
  module: string;
  project: string;
  difficulty: number;
  objective: string;
  path: string;
  applicableGrades: string[]; 
  isWeakPointMatch?: boolean; 
  originalIndex: number;
  isNew?: boolean;
}

export interface DailyPlanItem {
  function: string;
  content: string;
  time: string;
}

export interface DailyPlan {
  day: string;
  items: DailyPlanItem[];
}

export interface StudentProcessedData {
  id: string;
  name: string;
  grade: string; // Current grade from CSV
  uploadTimestamp: number;
  csvIndex: number; // Original row index from CSV
  submitTime: number; // Parsed submission time for sorting
  
  // New: Track which machine/curriculum is used
  machineType: MachineType;

  // Numerical scores for logic/level calculation
  rawScores: {
    math: number;
    chinese: number;
    english: number;
  };
  // Text representation for display (e.g. "90分~100分")
  originalScores: {
    math: string;
    chinese: string;
    english: string;
  };

  ranks: {
    math: string;
    chinese: string;
    english: string;
  };
  subjectLevels: {
    math: SubjectLevel;
    chinese: SubjectLevel;
    english: SubjectLevel;
  };
  weakPoints: string[];
  
  // The core output
  recommendations: CurriculumItem[];
  
  // Qualitative data
  surveyDetails: {
    careless: string;
    notes: string;
    planning: string;
    mistakes: string;
    weekdayDuration: string;
    weekendDuration: string;
    isBoarding: boolean;
    // 新增问卷字段
    classroomComprehension: string;
    homeworkCompletion: string;
    examSpeed: string;
    chineseFocusModules: string[];
    englishFocusModules: string[];
  };
  
  weeklyPlan: DailyPlan[];
  
  // Manual override for diagnosis text
  customDiagnosis?: string;

  // Phone last 4 digits for PDF encryption password
  phone?: string;
}

export interface ProcessingStatus {
  total: number;
  current: number;
  isProcessing: boolean;
  isComplete: boolean;
  logs: string[];
}
