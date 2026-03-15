
import { forwardRef } from 'react';
import { StudentProcessedData } from '../types';
import { MonitorSmartphone } from 'lucide-react';

interface ReportTemplateProps {
  data: StudentProcessedData | null;
}

// --- NEW: Personalized Diagnosis Generator (Teacher Sun Persona) ---
const generateDiagnosisText = (data: StudentProcessedData) => {
  if (data.customDiagnosis && data.customDiagnosis.trim().length > 0) {
    return (
      <div className="space-y-6 text-slate-600 text-[15px] leading-[1.8] font-medium whitespace-pre-line">
         {data.customDiagnosis}
      </div>
    );
  }

  const { name, surveyDetails, subjectLevels } = data;

  // 1. Learning State [词库: 积极向上/主动踏实/精气神足]
  const isHighLevel = Object.values(subjectLevels).some(l => l <= 2);
  const isMidLevel = Object.values(subjectLevels).some(l => l <= 3);
  const stateText = isHighLevel ? "积极向上" : (isMidLevel ? "主动踏实" : "精气神足");

  // 2. Specific Praise [具体夸优点]
  const levels = [
    { subject: '数学', level: subjectLevels.math, praise: '数学逻辑思维非常敏捷，表现很突出' },
    { subject: '英语', level: subjectLevels.english, praise: '英语成绩基础非常扎实，表现很突出' },
    { subject: '语文', level: subjectLevels.chinese, praise: '语文文学素养非常深厚，表现很突出' }
  ];
  levels.sort((a, b) => a.level - b.level);
  const bestPraise = levels[0].praise;

  // 3. Habit Highlight [习惯亮点]
  let habitHighlight = "对学习保持着高度的专注力";
  if (surveyDetails.notes?.includes('经常') || surveyDetails.notes?.includes('总是')) {
    habitHighlight = "遇到重难点会主动记笔记";
  } else if (surveyDetails.planning?.includes('经常') || surveyDetails.planning?.includes('总是')) {
    habitHighlight = "每天都会制定清晰的学习计划";
  } else if (surveyDetails.mistakes?.includes('经常') || surveyDetails.mistakes?.includes('总是')) {
    habitHighlight = "能够及时整理并复盘错题";
  }

  // 4. Transition Sentence
  const allGood = Object.values(subjectLevels).every(l => l <= 2);
  const transitionText = allGood 
    ? "即便在整体表现不错的情况下，我们也能发现还有细节可以更完善。" 
    : "为了让孩子的成绩更上一层楼，我们需要关注一些目前的薄弱环节。";

  // 5. Weakest Subject & Reason
  levels.sort((a, b) => b.level - a.level);
  const weakest = levels[0];
  let reasonText = "基础知识点的衔接还不够紧密，需要系统梳理";
  if (weakest.subject === '数学') reasonText = "解题方法不够系统，逻辑思维训练有待加强";
  else if (weakest.subject === '英语') reasonText = "词汇量储备不足，语感培养需要更多时间";
  else if (weakest.subject === '语文') reasonText = "阅读积累不够深厚，表达能力有待打磨";

  // 6. Habit Weakness [习惯弱项]
  let habitWeakness = "学习习惯的连贯性还有提升空间";
  if (surveyDetails.careless?.includes('经常') || surveyDetails.careless?.includes('总是')) {
    habitWeakness = "容易马虎失分，审题不够细致";
  } else if (surveyDetails.mistakes?.includes('不') || surveyDetails.mistakes?.includes('偶尔')) {
    habitWeakness = "错题记录不够系统，容易马虎失分";
  }

  // 7. Execution Weakness [执行力弱项]
  let executionWeakness = "在复杂任务的优先级排序上还需要更多引导";
  if (surveyDetails.planning?.includes('不') || surveyDetails.planning?.includes('偶尔')) {
    executionWeakness = "目前还缺乏明确的计划意识，考试时时间分配不合理";
  }

  return (
    <div className="space-y-6 text-slate-600 text-[15px] leading-[1.8] font-medium">
      <p>
        亲爱的家长，我们已经看到了您填写的问卷，感谢您投入时间配合我们的工作。 从您的字里行间，我能感受到您对孩子教育的这份用心。根据孩子目前的整体反馈来看，他展现出了<strong className="text-purple-600">{stateText}</strong>的学习状态。<strong>{name}同学{bestPraise}。</strong>更难得的是，孩子在<strong className="text-purple-600">{habitHighlight}</strong>方面做得很好，这说明孩子很有潜力，是值得被我们用心陪伴的。之所以能保持目前的进步势头，是因为孩子已经具备了一定的基础，并且对学习有着非常积极的态度。
      </p>
      <p>
        <strong>{transitionText}</strong> 我们注意到，孩子目前的<strong className="text-purple-600">{weakest.subject}相对吃力一些</strong>，这很大程度上是因为<strong className="text-slate-800">{reasonText}</strong>。在学习习惯上，孩子<strong className="text-slate-800">{habitWeakness}</strong>，这导致了很多不必要的损耗。而在执行力方面，孩子<strong className="text-slate-800">{executionWeakness}</strong>。其实这些问题通过科学的方法训练是非常容易改善的，一旦执行力提升上来，孩子的成绩定会有明显的飞跃。
      </p>
      <div className="italic text-slate-500 space-y-6">
        <p>
          学习从来不是一场短跑，而是一段马拉松。
          在北清领学营，我们用十余年陪跑经验打磨出这套学习方法，陪伴过上万名学子走过提分之路。不靠熬夜刷题，不是死记硬背，而是掌握方法、建立节奏、跑出自己的提分曲线。
        </p>
        <p>
          我们相信，当孩子学会掌控时间，目标清晰、步步为营，他就会发现，原来学习也可以不焦虑、不混乱，而是一次次小小的进步，汇成真正的飞跃。
          为了帮孩子解决这些问题，我们北大老师团队会全程为孩子保驾护航。我们会为【{name}】设计一份真正适合他的专属学习方案，在方法、习惯和执行力上同步提升，让孩子在轻松、可持续的节奏中，悄悄变得更优秀。
        </p>
      </div>
    </div>
  );
};

const PageFooter = ({ pageNum }: { pageNum: number }) => (
  <div className="absolute bottom-4 left-0 right-0 text-center text-slate-400 text-xs">
    第 {pageNum} 页
  </div>
);

const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(({ data }, ref) => {
  if (!data) return null;

  const isBoarding = data.surveyDetails.isBoarding;

  const pagesToRender: Array<{ type: string; dayIndex?: number }> = isBoarding
    ? [
        { type: 'cover' },
        { type: 'timed-training' },
        { type: 'boarding-intro' },
        ...data.weeklyPlan.map((_, index) => ({ type: 'daily-plan', dayIndex: index })),
      ]
    : [
        { type: 'cover' },
        { type: 'timed-training' },
        ...data.weeklyPlan.map((_, index) => ({ type: 'daily-plan', dayIndex: index })),
        { type: 'schedule-logic' }
      ];

  const getDurationText = (day: string) => {
    const isWeekend = day === '周六' || day === '周日';
    const durationStr = isWeekend
      ? (data.surveyDetails.weekendDuration || '')
      : (data.surveyDetails.weekdayDuration || '');
    if (!durationStr) return '';
    if (!isWeekend) {
      if (durationStr.includes('0.5') || durationStr.includes('30') || durationStr.includes('半')) return '（30分钟）';
      if (durationStr.includes('1.5') || durationStr.includes('一个半') || durationStr.includes('1个半') || (durationStr.includes('1') && durationStr.includes('半'))) return '（1.5小时）';
      if (durationStr.includes('2') || durationStr.includes('两')) return '（2小时）';
      if (durationStr.includes('1') || durationStr.includes('一小时')) return '（1小时）';
    } else {
      if (durationStr.includes('3') || durationStr.includes('三')) return '（3小时）';
      if (durationStr.includes('2') || durationStr.includes('两')) return '（2小时）';
      if (durationStr.includes('1') || durationStr.includes('一小时')) return '（1小时）';
    }
    return '';
  };

  const renderScheduleLogicPage = (pageNum: number) => {
    const weekdayDuration = data.surveyDetails.weekdayDuration || "";
    const weekendDuration = data.surveyDetails.weekendDuration || "";

    let weekdayContent = null;
    if (weekdayDuration.includes('0.5') || weekdayDuration.includes('30')) {
      weekdayContent = (
        <div className="space-y-4">
          <p className="text-purple-900 font-bold text-lg">孩子现在周一到周五，每天都有0.5小时用来学习，这个时间不算多，但也足够完成课堂知识的巩固和查缺补漏。</p>
          <p className="text-slate-600 text-[14px] leading-relaxed text-justify">
            不要小看这 30 分钟。学习的差距不在于谁熬夜更久，而在于谁更懂得利用大脑的规律。这 30 分钟里，我们有语言的‘高频积累’，有数据的‘错题管理’，更有针对性的‘学科攻坚’。只要你能坚持下去，这种‘小步快跑’产生的复利，将远超你的想象。
          </p>
        </div>
      );
    } else if (weekdayDuration.includes('1.5')) {
      weekdayContent = (
        <div className="space-y-4">
          <p className="text-purple-900 font-bold text-lg">孩子现在周一到周五，每天都有1.5小时用来学习，这个时间安排说明孩子是非常自律，有决心提升成绩的。老师也很有信心帮助孩子提升成绩。</p>
          <div className="text-slate-600 text-[14px] leading-relaxed text-justify space-y-2">
            <p>一个半小时是非常黄金的时间段，它允许我们在保证语言频率的同时，完成一次高质量的逻辑训练。</p>
            <p><strong>前 20 分钟：双语高频刺激。</strong> 10 分钟英语单词，10 分钟语文古诗或素材。语言学习讲究“少食多餐”，这 20 分钟是为了利用大脑的初始兴奋期，完成最枯燥但最重要的记忆任务。</p>
            <p><strong>后 60 分钟：核心科目实战。</strong> 这一小时我们要留给最吃力的科目（通常是数学）。数学能力的提升全在“练题”里，必须保证一个小时不动窝，深挖逻辑，把错题抠烂、抠透。</p>
          </div>
        </div>
      );
    } else if (weekdayDuration.includes('2')) {
      weekdayContent = (
        <div className="space-y-4">
          <p className="text-purple-900 font-bold text-lg">孩子现在周一到周五，每天都有2小时用来学习，这个时间安排说明孩子是非常自律，这份专注力就已超过绝大部分同龄人。跟着老师的学习计划来学，一定会取得明显提升的！</p>
          <div className="text-slate-600 text-[14px] leading-relaxed text-justify space-y-2">
            <p>当学习时间达到两小时，我们必须引入“交叉学习法”来对抗大脑疲劳。如果两小时只学一科，孩子后期一定会“磨洋工”，效率极低。</p>
            <p><strong>第一阶段（20 分钟）：基础语言包。</strong> 固定完成语、英的背诵和默写。就像每天要吃饭一样，这属于学科的“基础营养”，不能断。</p>
            <p><strong>第二阶段（50 分钟）：强逻辑攻坚数学。</strong> 利用精力最旺盛的时段去啃数学硬骨头。练题时要限定时间，模拟考试的感觉，提升反应速度。</p>
            <p><strong>第三阶段（10 分钟）：强制脑休整。</strong> 必须离开书桌，喝水、远眺。这 10 分钟不是浪费，而是让大脑进行“后台下载”，固化刚才学到的逻辑。</p>
            <p><strong>第四阶段（40 分钟）：学科切换（语/英大阅读）。</strong> 最后这段时间，大脑的逻辑区域已经疲劳，这时切换到语文阅读或英语长难句，换一个大脑区域来工作。这种“科目切换”能让孩子重新获得兴奋感，确保两小时的学习每一分钟都是高产出的。</p>
          </div>
        </div>
      );
    } else {
      weekdayContent = (
        <div className="space-y-4">
          <p className="text-purple-900 font-bold text-lg">孩子现在周一到周五，每天都有一小时用来学习，这个时间足够我们用学习机完成语数英三科的巩固拔高了。</p>
          <div className="text-slate-600 text-[14px] leading-relaxed text-justify space-y-2">
            <p>在有一小时的情况下，我们绝不能“撒胡椒面”，哪科都学一点的结果就是哪科都记不住。</p>
            <p><strong>前 10~20分钟：固定语言积累（语/英交替）。</strong> 我们要明白，语言类学科属于“技能型知识”。科学证明，每天背 10 分钟单词的效果，远好于一周集中背一小时。大脑对语言的记忆靠的是“见面的次数”。这 15 分钟是给大脑“热身”，通过朗读和背诵，把语感和记忆唤醒。</p>
            <p><strong>后 40~50 分钟：单科深度攻坚。</strong> 剩下的时间建议只安排一门课（如数学）。数学需要连续的逻辑推理，如果时间切得太碎，孩子刚进入思考状态就要切换，会导致“启动成本”过高，根本学不进去。每天攻克一个知识点、做透几道题，这种“专注力沉淀”才是提分的关键。</p>
          </div>
        </div>
      );
    }

    let weekendContent = null;
    if (weekendDuration.includes('1')) {
      weekendContent = (
        <div className="space-y-4">
          <p className="text-purple-900 font-bold text-lg">孩子现在周末每天有 1 小时用来学习。虽然周末诱惑很多，但孩子依然能抽出固定时间查漏补缺，这种"不让问题过周末”的态度是非常值得肯定的！跟着老师的计划进行专项突破，进步会非常快。</p>
          <div className="text-slate-600 text-[14px] leading-relaxed text-justify space-y-2">
            <p>在只有一小时的情况下，我们追求的是“稳住地基，精准突破”。此时大脑最忌讳频繁换科，因为每一次切换都会损耗宝贵的专注力。</p>
            <p><strong>第一阶段（15 分钟）：语言复盘包。</strong> 固定完成本周语、英重点词汇的复习。语言学习靠的是“天天见”，周末的这 15 分钟是保证记忆不滑坡的保底分。</p>
            <p><strong>第二阶段（45 分钟）：专项深度攻坚。</strong> 针对本周最难的一个数学考点，利用“分级练”进行闯关。这 45 分钟要“一钻到底”，把一个知识点彻底吃透，只有深度思考才能带来真正的提分。</p>
          </div>
        </div>
      );
    } else if (weekendDuration.includes('3')) {
      weekendContent = (
        <div className="space-y-4">
          <p className="text-purple-900 font-bold text-lg">孩子现在周末每天有 3 小时用来学习。这已经是非常高标准的自我要求了！这种“打深井”式的学习劲头，说明孩子对未来有着清晰的目标和强大的执行力，老师一定要为你点个赞！</p>
          <div className="text-slate-600 text-[14px] leading-relaxed text-justify space-y-2">
            <p>三小时的学习是一场马拉松，必须讲究“精力管理”。我们要把最难的任务放在专注力峰值期，并利用“换口味”的原理维持大脑的兴奋感。</p>
            <p><strong>第一阶段（30 分钟）：综合语言积累。</strong> 包含单词、古诗词及优秀的阅读素材输入。这是学科的“基础营养”，每天 30 分钟能积攒出巨大的文学底蕴。</p>
            <p><strong>第二阶段（70 分钟）：理科专项突破。</strong> 集中精力完成数学或科学的高难度“分级练”挑战。大块时间最适合钻研复杂逻辑，要养成限时训练的习惯，模拟考场感。</p>
            <p><strong>第三阶段（15 分钟）：强制大休息。</strong> 离开书桌，可以简单拉伸或吃个水果。长时段学习后，必须通过彻底的放松来给大脑“充电”。</p>
            <p><strong>第四阶段（65 分钟）：文科综合进阶。</strong> 切换到英语大阅读或语文逻辑拆解。由于大脑负责逻辑的区域已疲劳，此时换到语言处理区域工作，能让你重新获得新鲜感，保持高产出。</p>
            <p><strong>第五阶段（15 分钟）：黄金复盘总结。</strong> 利用“一张白纸法”默写今天最核心的公式或知识点。只有能输出的内容才是真的学到了，这一步是实现成绩跨越的关键。</p>
          </div>
        </div>
      );
    } else {
      weekendContent = (
        <div className="space-y-4">
          <p className="text-purple-900 font-bold text-lg">孩子现在周末每天有 2 小时用来学习。这说明孩子不仅非常有上进心，而且具备了长时段专注的潜力，这份毅力已经是学霸的标配了！配合老师的科学排班，这两小时将成为你弯道超车的黄金期。</p>
          <div className="text-slate-600 text-[14px] leading-relaxed text-justify space-y-2">
            <p>当学习时长达到两小时，我们必须利用“交叉学习法”来对抗疲劳。通过科目切换，让大脑的不同区域轮流“休整”，保证全程高效。</p>
            <p><strong>第一阶段（20 分钟）：双语高频刺激。</strong> 完成语、英的背诵或美文朗读。这 20 分钟是给大脑“热身”，利用最开始的兴奋劲儿完成基础积累。</p>
            <p><strong>第二阶段（50 分钟）：重难点“分级练”。</strong> 此时电量最满，最适合啃数学硬骨头。建议针对薄弱项进行梯度练习，通过不断挑战更高难度的题目来提升逻辑思维。</p>
            <p><strong>第三阶段（10 分钟）：强制脑休整。</strong> 必须离开书桌。这 10 分钟是让大脑“清内存”并把刚才学到的逻辑存入长期记忆，防止后半段效率下跌。</p>
            <p><strong>第四阶段（40 分钟）：AI 精准学检测。</strong> 利用学习机的 AI 检测功能对本单元进行全面扫描。针对找出的“红点”漏洞进行定向修补，确保本周知识点闭环，不留死角。</p>
          </div>
        </div>
      );
    }

    return (
      <div key={`page-${pageNum}`} className="report-page w-[794px] h-[1123px] bg-white relative shadow-2xl mx-auto mb-10 flex flex-col overflow-hidden font-sans">
        <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white p-8 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-0 flex items-center gap-3">
              <span className="bg-white text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg text-xl">📊</span>
              学习方案具体安排
            </h2>
          </div>
        </div>
        <div className="flex-1 p-8 bg-slate-50 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-2xl border border-purple-100 shadow-lg flex-1 flex flex-col">
            <h3 className="text-purple-900 font-black text-xl mb-4 flex items-center gap-2 border-b border-purple-50 pb-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              周一到周五的时间安排逻辑
            </h3>
            <div className="flex-1 flex flex-col justify-center">
              {weekdayContent}
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-purple-100 shadow-lg flex-1 flex flex-col">
            <h3 className="text-purple-900 font-black text-xl mb-4 flex items-center gap-2 border-b border-purple-50 pb-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              周六周日的时间安排逻辑
            </h3>
            <div className="flex-1 flex flex-col justify-center">
              {weekendContent}
            </div>
          </div>
        </div>
        <PageFooter pageNum={pageNum} />
      </div>
    );
  };

  const renderBoardingIntroPage = (pageNum: number) => {
    const weekendDuration = data.surveyDetails.weekendDuration || "";

    let weekendContent = null;
    if (weekendDuration.includes('1')) {
      weekendContent = (
        <div className="space-y-3">
          <p className="text-purple-900 font-bold text-[15px]">孩子现在周末每天有 1 小时用来学习。虽然周末诱惑很多，但孩子依然能抽出固定时间查漏补缺，这种"不让问题过周末"的态度是非常值得肯定的！跟着老师的计划进行专项突破，进步会非常快。</p>
          <div className="text-slate-600 text-[13px] leading-relaxed text-justify space-y-1.5">
            <p>在只有一小时的情况下，我们追求的是"稳住地基，精准突破"。此时大脑最忌讳频繁换科，因为每一次切换都会损耗宝贵的专注力。</p>
            <p><strong>第一阶段（15 分钟）：语言复盘包。</strong> 固定完成本周语、英重点词汇的复习。语言学习靠的是"天天见"，周末的这 15 分钟是保证记忆不滑坡的保底分。</p>
            <p><strong>第二阶段（45 分钟）：专项深度攻坚。</strong> 针对本周最难的一个数学考点，利用"分级练"进行闯关。这 45 分钟要"一钻到底"，把一个知识点彻底吃透，只有深度思考才能带来真正的提分。</p>
          </div>
        </div>
      );
    } else if (weekendDuration.includes('3')) {
      weekendContent = (
        <div className="space-y-3">
          <p className="text-purple-900 font-bold text-[15px]">孩子现在周末每天有 3 小时用来学习。这已经是非常高标准的自我要求了！这种"打深井"式的学习劲头，说明孩子对未来有着清晰的目标和强大的执行力，老师一定要为你点个赞！</p>
          <div className="text-slate-600 text-[13px] leading-relaxed text-justify space-y-1.5">
            <p>三小时的学习是一场马拉松，必须讲究"精力管理"。我们要把最难的任务放在专注力峰值期，并利用"换口味"的原理维持大脑的兴奋感。</p>
            <p><strong>第一阶段（30 分钟）：综合语言积累。</strong> 包含单词、古诗词及优秀的阅读素材输入。这是学科的"基础营养"，每天 30 分钟能积攒出巨大的文学底蕴。</p>
            <p><strong>第二阶段（70 分钟）：理科专项突破。</strong> 集中精力完成数学或科学的高难度"分级练"挑战。大块时间最适合钻研复杂逻辑，要养成限时训练的习惯，模拟考场感。</p>
            <p><strong>第三阶段（15 分钟）：强制大休息。</strong> 离开书桌，可以简单拉伸或吃个水果。长时段学习后，必须通过彻底的放松来给大脑"充电"。</p>
            <p><strong>第四阶段（65 分钟）：文科综合进阶。</strong> 切换到英语大阅读或语文逻辑拆解，让大脑换区工作，保持高产出。</p>
            <p><strong>第五阶段（15 分钟）：黄金复盘总结。</strong> 利用"一张白纸法"默写今天最核心的公式或知识点。只有能输出的内容才是真的学到了，这一步是实现成绩跨越的关键。</p>
          </div>
        </div>
      );
    } else {
      weekendContent = (
        <div className="space-y-3">
          <p className="text-purple-900 font-bold text-[15px]">孩子现在周末每天有 2 小时用来学习。这说明孩子不仅非常有上进心，而且具备了长时段专注的潜力，这份毅力已经是学霸的标配了！配合老师的科学排班，这两小时将成为你弯道超车的黄金期。</p>
          <div className="text-slate-600 text-[13px] leading-relaxed text-justify space-y-1.5">
            <p>当学习时长达到两小时，我们必须利用"交叉学习法"来对抗疲劳。通过科目切换，让大脑的不同区域轮流"休整"，保证全程高效。</p>
            <p><strong>第一阶段（20 分钟）：双语高频刺激。</strong> 完成语、英的背诵或美文朗读。这 20 分钟是给大脑"热身"，利用最开始的兴奋劲儿完成基础积累。</p>
            <p><strong>第二阶段（50 分钟）：重难点"分级练"。</strong> 此时电量最满，最适合啃数学硬骨头。建议针对薄弱项进行梯度练习，通过不断挑战更高难度的题目来提升逻辑思维。</p>
            <p><strong>第三阶段（10 分钟）：强制脑休整。</strong> 必须离开书桌。这 10 分钟是让大脑"清内存"并把刚才学到的逻辑存入长期记忆，防止后半段效率下跌。</p>
            <p><strong>第四阶段（40 分钟）：AI 精准学检测。</strong> 利用学习机的 AI 检测功能对本单元进行全面扫描，针对"红点"漏洞进行定向修补，确保本周知识点闭环，不留死角。</p>
          </div>
        </div>
      );
    }

    return (
      <div key={`page-${pageNum}`} className="report-page w-[794px] h-[1123px] bg-white relative shadow-2xl mx-auto mb-10 flex flex-col overflow-hidden font-sans">
        <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white p-8 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-0 flex items-center gap-3">
              <span className="bg-white text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg text-xl">📅</span>
              周末专属学习方案说明
            </h2>
          </div>
        </div>
        <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-4 overflow-hidden">
          {/* 引言区块 */}
          <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-lg flex-shrink-0">
            <h3 className="text-purple-900 font-black text-[16px] mb-3 flex items-center gap-2 border-b border-purple-50 pb-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              致住校生家长
            </h3>
            <div className="space-y-3 text-slate-600 text-[13px] leading-relaxed text-justify">
              <p>通过前期的沟通，老师已经了解到咱们的情况：孩子平时周一到周五住校，只有周六周日才能用学习机。大家千万别担心时间不够！老师带过很多住校生，大家都是利用周末这两天来"打翻身仗"的。其实学习不在于堆时间，而在于找对重点。只要咱们利用好这两天，效率完全可以盖过整周的盲目刷题，咱们有信心把这两天用出<strong className="text-purple-700">"双倍"的效果</strong>来！</p>
              <div>
                <p className="text-purple-900 font-bold mb-1.5">为什么AI能让你事半功倍？</p>
                <p>咱们周末用学习机，核心就干一件事：<strong>查缺补漏</strong>。现在的AI技术非常厉害，它就像一个全天候陪着你的私教。不管你是用它拍照批改作业，还是在上面做练习、听课，AI算法都会默默记录你的每一个小细节。</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-purple-800 font-bold text-[12px] mb-1">它比你更懂你</p>
                  <p className="text-slate-600 text-[11px] leading-snug">精准识别哪些知识点你已经吃透，哪些还是模糊的，帮你把"擅长"和"薄弱"分清楚。</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-purple-800 font-bold text-[12px] mb-1">只练不会的</p>
                  <p className="text-slate-600 text-[11px] leading-snug">不需要大海捞针去刷题，AI会针对你的薄弱项直接推送训练，哪里不会点哪里。</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-purple-800 font-bold text-[12px] mb-1">备考有底气</p>
                  <p className="text-slate-600 text-[11px] leading-snug">配合学习机自带的备考测试，帮你在回学校前做一次完美的"模拟战"。</p>
                </div>
              </div>
              <p className="text-purple-800 font-bold text-[13px]">只要跟着老师这套科学方法走，哪怕一周只有这两天，你的进步也是肉眼可见的。咱们一起加油！</p>
            </div>
          </div>

          {/* 周末安排逻辑区块 */}
          <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-lg flex-1 flex flex-col overflow-hidden">
            <h3 className="text-purple-900 font-black text-[16px] mb-3 flex items-center gap-2 border-b border-purple-50 pb-2 flex-shrink-0">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              周六周日的时间安排逻辑
            </h3>
            <div className="flex-1 flex flex-col justify-center overflow-auto">
              {weekendContent}
            </div>
          </div>
        </div>
        <PageFooter pageNum={pageNum} />
      </div>
    );
  };

  return (
    <div ref={ref} className="bg-gray-100 p-8">
      {pagesToRender.map((page, globalIndex) => {
        const pageNum = globalIndex + 1;

        // --- RENDER COVER ---
        if (page.type === 'cover') {
            return (
                <div key={`page-${pageNum}`} className="report-page w-[794px] h-[1123px] bg-white relative shadow-2xl mx-auto mb-10 flex flex-col overflow-hidden font-sans">
                   {/* Header Section - Purple Theme */}
                   <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white h-[220px] relative px-12 py-8 flex flex-col justify-between shrink-0 overflow-hidden">
                      {/* Abstract Shapes */}
                      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

                      <div className="relative z-10">
                        <div className="flex items-center gap-3 text-purple-100 mb-2">
                          <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2 backdrop-blur-sm border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                            2026 Spring Edition
                          </span>
                        </div>
                        <h1 className="text-[22px] font-extrabold tracking-tight mb-1 leading-tight font-serif">
                          🌱 {data.name} 的专属《北清领学营》春季方案 🚀
                        </h1>
                      </div>

                      <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-2">
                         <div>
                           <div className="text-purple-100/60 text-[10px] uppercase tracking-wider mb-0.5">Student Name</div>
                           <div className="flex items-center gap-4 pb-0.5">
                              <div className="text-xl font-bold leading-none font-serif">{data.name}</div>
                              <div className="flex items-center gap-2 pt-0.5 opacity-90">
                                <MonitorSmartphone size={14} className="text-purple-200" />
                                <span className="text-xs font-medium text-white tracking-wide">
                                  {data.machineType === 'iflytek' ? '科大讯飞' : data.machineType === 'bubugao' ? '步步高' : '学而思'} · {data.grade}
                                </span>
                              </div>
                           </div>
                         </div>
                         <div className="flex flex-col items-end gap-0.5">
                            <div className="text-purple-100/60 text-[10px] uppercase tracking-wider">Generated Date</div>
                            <div className="font-mono text-xs text-purple-100">{new Date().toLocaleDateString()}</div>
                         </div>
                      </div>
                   </div>

                   {/* Cover Body: Diagnosis */}
                   <div className="flex-1 px-10 py-8 flex flex-col justify-start relative bg-gradient-to-b from-white to-purple-50/30 overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      
                      <div className="relative z-10 space-y-6 h-full flex flex-col">
                         {/* Welcome Message */}
                         <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border-2 border-purple-100 shadow-md shrink-0">
                            <div className="space-y-2">
                                <p className="text-purple-900/90 text-base leading-relaxed text-justify font-bold">
                                   今年，我们的学习机迎来了<strong className="text-purple-800 bg-purple-200/50 px-2 py-0.5 rounded mx-1 text-lg">重大版本更新</strong>，融入了更多前沿的 AI 智能辅导功能。老师们已经将这些“黑科技”深度融合到了这份专属学习方案中。
                                </p>
                                <p className="text-purple-900/90 text-base leading-relaxed text-justify font-bold">
                                   无论是精准的<strong>AI错题诊断</strong>，还是个性化的<strong>智能推题</strong>，都将在这份方案中为您呈现。请带上这份方案，充分利用 2026 年的新功能，跟我们一起高效学习，在春天里拔节生长！
                                </p>
                            </div>
                         </div>

                         {/* Diagnosis Text */}
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-purple-100/20 relative flex-1 overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                            <div className="text-base overflow-y-auto pr-2 custom-scrollbar">
                                {generateDiagnosisText(data)}
                            </div>
                         </div>
                      </div>
                   </div>

                   <PageFooter pageNum={pageNum} />
                </div>
            );
        }

        // --- RENDER BOARDING INTRO PAGE ---
        if (page.type === 'boarding-intro') {
            return renderBoardingIntroPage(pageNum);
        }

        // --- RENDER SCHEDULE LOGIC PAGE ---
        if (page.type === 'schedule-logic') {
            return renderScheduleLogicPage(pageNum);
        }

        // --- RENDER TIMED TRAINING PAGE ---
        if (page.type === 'timed-training') {
            const steps = [
                {
                    title: '第一步：先列清单',
                    desc: '回家先把所有作业列出来。先整理思路：今天有什么作业？语文要写什么？数学几页？英语有没有听写？一项项写在本子上，知道今天要完成哪些任务。',
                    icon: '📋'
                },
                {
                    title: '第二步：预估时间',
                    desc: '引导孩子估算每项作业大概要多久。比如他可以写：“数学大概40分钟，英语30分钟，语文20分钟。”这一步特别关键，它能慢慢建立孩子的时间感，让他意识到——每一项任务，是可以被安排、被管理的。',
                    icon: '⏱️'
                },
                {
                    title: '第三步：排出任务',
                    desc: '任务排出顺序，做成一份“今晚的时间表”。例如：“7:00—7:40 数学，7:40—8:10 英语，8:10—8:30 语文。”有了时间安排，孩子不是漫无目的地写，而是像“开小会”一样，一项一项有节奏地完成。',
                    icon: '📅'
                },
                {
                    title: '第四步：执行计划',
                    desc: '开始执行计划。我们特别强调：遇到不会的题，先跳过。很多孩子写作业容易卡在一道难题上，一磨就是十几分钟，后面的作业就被拖垮了。我们希望孩子像考试一样处理作业——时间优先、整体完成、难题留后，这样效率才能真正提高。',
                    icon: '🚀'
                },
                {
                    title: '第五步：反思用时',
                    desc: '每完成一项，记录实际用时并反思差距。比如原计划数学40分钟，结果用了55分钟——为什么？是题太难，还是中途走神了？这种小小的反思，其实是在训练孩子“计划—执行—复盘”的能力。',
                    icon: '🔄'
                }
            ];

            return (
                <div key={`page-${pageNum}`} className="report-page w-[794px] h-[1123px] bg-white relative shadow-2xl mx-auto mb-10 flex flex-col overflow-hidden font-sans">
                    {/* Header - Purple Theme */}
                    <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 text-white p-8 shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                                <span className="bg-white text-purple-600 w-9 h-9 rounded-lg flex items-center justify-center shadow-lg text-xl">🎯</span>
                                北清领学营·限时训练法
                            </h2>
                            <p className="text-purple-50 text-sm leading-relaxed font-medium opacity-90">
                                限时训练法，是由孙老师亲自设计、并在十多年教学和升学指导中不断打磨出来的。说得夸张点，这就是我们北清领学营“压箱底”的秘密武器。
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 bg-slate-50 flex flex-col gap-4 overflow-hidden">
                        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm shrink-0">
                            <p className="text-slate-700 text-[13px] leading-relaxed font-medium">
                                我们发现，很多孩子平时写作业挺认真，可一到考试就出问题——做不完、跳题慌、节奏乱。出现这些问题，不是能力不够，是他从来没在时间压力下“练过”完成任务。
                                <br />
                                所以我们设计了<strong className="text-purple-600">“限时训练法”</strong>——把日常的学习任务，转化成孩子自己管理时间、安排节奏的一次次训练。它不仅能让孩子在考试时稳住节奏，更重要的是，帮孩子养成“我自己能规划任务、能执行计划”的学习习惯。
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 shrink-0">
                            {steps.map((step, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start relative overflow-hidden group hover:border-purple-300 transition-colors">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0 shadow-inner">
                                        {step.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-purple-900 font-bold text-[15px] mb-0.5 flex items-center gap-2">
                                            {step.title}
                                            <span className="text-purple-200 text-[10px] font-mono">STEP 0{idx + 1}</span>
                                        </h4>
                                        <p className="text-slate-600 text-[12px] leading-relaxed font-medium text-justify">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-purple-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden shrink-0">
                            <div className="absolute bottom-0 right-0 opacity-10 text-4xl font-black -rotate-12 translate-y-2 translate-x-2 uppercase">Control</div>
                            <p className="text-[13px] font-bold leading-relaxed relative z-10">
                                限时训练法的本质，其实不是“赶”，而是“掌控”。让孩子从“被时间推着走”，变成“自己掌握节奏”。只要练成这个能力，无论是平时学习，还是面对考试，都会轻松很多。
                            </p>
                        </div>
                    </div>

                    <PageFooter pageNum={pageNum} />
                </div>
            );
        }

        // --- RENDER DAILY PLAN PAGE ---
        if (page.type === 'daily-plan' && page.dayIndex !== undefined) {
            const dayPlan = data.weeklyPlan[page.dayIndex];
            if (!dayPlan) return null;

            return (
                <div key={`page-${pageNum}`} className="report-page w-[794px] h-[1123px] bg-[#4a8ad4] p-3 mx-auto mb-10 flex flex-col font-sans shadow-2xl">
                   <div className="relative bg-[#fdfdfd] rounded-md flex-1 flex overflow-hidden">
                        {/* Left sidebar with holes */}
                        <div className="w-12 bg-[#fdfdfd] flex flex-col items-center pt-8 space-y-8 flex-shrink-0 border-r border-dashed border-gray-300 relative z-10">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-inner ring-1 ring-gray-400/50"></div>
                            ))}
                        </div>
                        
                        <div className="flex-1 bg-grid-paper p-8 relative flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex flex-col items-center justify-center mb-6">
                                <div className="relative mb-2">
                                    <div className="absolute -bottom-2 left-0 right-0 h-3 bg-orange-300/50 -rotate-1 rounded-full transform scale-x-110"></div>
                                    <h1 className="text-4xl font-black text-[#4a8ad4] tracking-widest relative z-10 font-sans">
                                        {dayPlan.day}学习方案{getDurationText(dayPlan.day)}
                                    </h1>
                                </div>
                                <div className="flex items-baseline gap-2 mt-1 border-b-2 border-gray-300 px-6 pb-1">
                                    <span className="text-xl font-bold text-gray-600">北清领学营·限时训练法</span>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="border-2 border-[#5b9bd5] rounded-xl overflow-hidden bg-white shadow-lg mb-6">
                                <table className="w-full text-sm border-collapse table-fixed">
                                    <thead>
                                        <tr className="bg-[#5b9bd5] text-white">
                                            <th className="py-2.5 px-4 text-center font-bold text-base w-[45%] border-r border-white/30 leading-tight">学习内容</th>
                                            <th className="py-2.5 px-2 text-center font-bold text-base w-[15%] border-r border-white/30 leading-tight">用时</th>
                                            <th className="py-2.5 px-2 text-center font-bold text-base w-[20%] border-r border-white/30 leading-tight">实际完成时间</th>
                                            <th className="py-2.5 px-2 text-center font-bold text-base w-[20%] leading-tight">完成情况</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dayPlan.items.map((item: { function: string; content: string; time: string }, itemIndex: number) => (
                                            <tr key={itemIndex} className="border-b border-[#5b9bd5]/20 hover:bg-blue-50/30 transition-colors min-h-[44px]">
                                                <td className="py-2.5 px-6 text-gray-800 font-bold border-r border-[#5b9bd5]/20 relative align-middle text-sm leading-snug">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#5b9bd5] rounded-full"></span>
                                                    {item.function}
                                                </td>
                                                <td className="py-2.5 px-2 text-center text-gray-700 font-bold border-r border-[#5b9bd5]/20 align-middle text-sm leading-snug">
                                                    {item.time}
                                                </td>
                                                <td className="py-2.5 px-2 border-r border-[#5b9bd5]/20"></td>
                                                <td className="py-2.5 px-2"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Descriptions */}
                            <div className="flex-1 bg-white/50 rounded-xl p-4 border border-dashed border-[#5b9bd5]/40 overflow-hidden">
                                <h3 className="text-[#4a8ad4] font-black text-lg mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-[#4a8ad4] rounded-full"></span>
                                    项目执行说明
                                </h3>
                                <div className="columns-2 gap-x-8 space-y-3">
                                    {dayPlan.items.map((item: { function: string; content: string; time: string }, itemIndex: number) => (
                                        <div key={itemIndex} className="break-inside-avoid flex flex-col gap-0.5 mb-3">
                                            <div className="text-[#4a8ad4] font-bold text-[13px] flex items-center gap-2 leading-tight">
                                                <span className="shrink-0 text-[10px] px-1 py-0 bg-blue-100 rounded text-blue-600 font-mono leading-none">{itemIndex + 1}</span>
                                                <span className="break-words">{item.function}</span>
                                            </div>
                                            <p className="text-gray-600 text-[11px] leading-relaxed pl-6 font-medium text-justify">
                                                {item.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-6 text-center">
                                <p className="text-gray-400 text-xs italic">温馨提示：请严格遵守限时训练法，在规定时间内高效完成任务哦！加油！✨</p>
                            </div>
                        </div>
                   </div>
                   <PageFooter pageNum={pageNum} />
                </div>
            );
        }

        return null;
      })}
    </div>
  );
});

export default ReportTemplate;
