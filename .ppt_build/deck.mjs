import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT_DIR = "C:/Users/LXL/Desktop/便签app/.ppt_build/renders";
const FINAL_PPTX = "C:/Users/LXL/Desktop/便签app/研究生会社区部部长述职答辩.pptx";

const W = 1280;
const H = 720;
const ML = 72;
const CW = W - ML * 2;
const FONT = "Microsoft YaHei";

const COLORS = {
  ink: "#172033",
  body: "#3D4657",
  muted: "#6B7280",
  faint: "#9AA3AF",
  rule: "#DDE2E8",
  panel: "#F4F6F8",
  accent: "#2F6FED",
  accentSoft: "#EAF2FF",
  white: "#FFFFFF",
};

let objectCounter = 0;
function nextName(prefix) {
  objectCounter += 1;
  return `${prefix}-${objectCounter}`;
}

function addTextBox(slide, cfg) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name: cfg.name || nextName("text"),
    position: { left: cfg.left, top: cfg.top, width: cfg.width, height: cfg.height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = cfg.text;
  shape.text.style = {
    typeface: FONT,
    fontSizePt: cfg.fontSize ?? 18,
    bold: cfg.bold ?? false,
    italic: cfg.italic ?? false,
    color: cfg.color ?? COLORS.ink,
    alignment: cfg.align ?? "left",
    verticalAlignment: cfg.valign ?? "top",
    wrap: cfg.wrap ?? "square",
    autoFit: cfg.autoFit ?? "none",
    lineSpacing: cfg.leading ?? 1.28,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return shape;
}

function setStructuredText(shape, paragraphs, style) {
  shape.text.set(paragraphs);
  shape.text.style = {
    typeface: FONT,
    bold: false,
    italic: false,
    color: COLORS.ink,
    alignment: style.align ?? "left",
    verticalAlignment: style.valign ?? "top",
    wrap: style.wrap ?? "square",
    autoFit: style.autoFit ?? "none",
    lineSpacing: style.leading ?? 1.28,
    insets: style.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return shape;
}

function addRect(slide, cfg) {
  return slide.shapes.add({
    geometry: "rect",
    name: cfg.name || nextName("rect"),
    position: {
      left: cfg.left,
      top: cfg.top,
      width: cfg.width,
      height: cfg.height,
    },
    fill: cfg.fill ?? COLORS.rule,
    line: { style: "solid", fill: "none", width: 0 },
  });
}

function addRoundedPanel(slide, cfg) {
  const shape = slide.shapes.add({
    geometry: "roundRect",
    name: cfg.name || nextName("panel"),
    position: {
      left: cfg.left,
      top: cfg.top,
      width: cfg.width,
      height: cfg.height,
    },
    fill: cfg.fill ?? COLORS.panel,
    line: cfg.line ?? { style: "solid", fill: COLORS.rule, width: 1 },
    borderRadius: cfg.radius ?? 8,
  });
  if (cfg.paragraphs) {
    setStructuredText(shape, cfg.paragraphs, cfg.textStyle ?? {});
  }
  return shape;
}

function addFooter(slide, page, total) {
  addTextBox(slide, {
    left: ML,
    top: 684,
    width: 400,
    height: 22,
    text: "研究生会社区部 · 工作述职",
    fontSize: 13,
    color: COLORS.muted,
    leading: 1,
  });
  addTextBox(slide, {
    left: W - ML - 110,
    top: 684,
    width: 110,
    height: 22,
    text: `${page} / ${total}`,
    fontSize: 13,
    color: COLORS.muted,
    align: "right",
    leading: 1,
  });
}

function contentSlide(section, title, page, total) {
  const slide = presentation.slides.add();
  slide.background.fill = COLORS.white;
  addTextBox(slide, {
    left: ML,
    top: 38,
    width: 720,
    height: 28,
    text: section,
    fontSize: 17,
    bold: true,
    color: COLORS.accent,
    leading: 1,
  });
  addTextBox(slide, {
    left: ML,
    top: 70,
    width: CW,
    height: 68,
    text: title,
    fontSize: 35,
    bold: true,
    color: COLORS.ink,
    valign: "bottom",
    leading: 1.05,
  });
  addRect(slide, {
    left: ML,
    top: 150,
    width: CW,
    height: 1.5,
    fill: COLORS.rule,
  });
  addFooter(slide, page, total);
  return slide;
}

function addNotes(slide, notes) {
  slide.speakerNotes.textFrame.setText(notes);
}

function paragraph(runs, meta = {}) {
  const normalized = runs.map((item) => {
    if (typeof item === "string" || typeof item === "number") {
      return { run: String(item), textStyle: {} };
    }
    return item;
  });
  return { runs: normalized, ...meta };
}

function run(text, style = {}) {
  return { run: text, textStyle: style };
}

function notesForSlide(texts) {
  return texts;
}

const presentation = Presentation.create({
  slideSize: { width: W, height: H },
});

const TOTAL = 13;

// Slide 1: Cover
{
  const slide = presentation.slides.add();
  slide.background.fill = COLORS.white;
  addTextBox(slide, {
    left: ML,
    top: 112,
    width: 700,
    height: 30,
    text: "研究生会社区部 · 述职答辩",
    fontSize: 19,
    bold: true,
    color: COLORS.accent,
    leading: 1,
  });
  addRect(slide, {
    left: ML,
    top: 170,
    width: 74,
    height: 7,
    fill: COLORS.accent,
  });
  addTextBox(slide, {
    left: ML,
    top: 218,
    width: 1020,
    height: 176,
    text: "让每一件诉求，\n都有落地回声",
    fontSize: 54,
    bold: true,
    color: COLORS.ink,
    leading: 1.18,
  });
  addTextBox(slide, {
    left: ML,
    top: 414,
    width: 820,
    height: 86,
    text: "问卷、走访、协商、跟进，把同学关心的小事办成看得见的实事。",
    fontSize: 21,
    color: COLORS.body,
    leading: 1.45,
  });
  addRect(slide, {
    left: ML,
    top: 556,
    width: 1136,
    height: 1.5,
    fill: COLORS.rule,
  });
  addTextBox(slide, {
    left: ML,
    top: 600,
    width: 700,
    height: 26,
    text: "汇报人：研究生会社区部部长",
    fontSize: 16,
    color: COLORS.muted,
    leading: 1,
  });
  addTextBox(slide, {
    left: W - ML - 420,
    top: 600,
    width: 420,
    height: 26,
    text: "请各位老师批评指正",
    fontSize: 16,
    color: COLORS.muted,
    align: "right",
    leading: 1,
  });
  addNotes(slide, [
    "开场建议：各位老师好，我是研究生会社区部部长，今天围绕“建机制、听诉求、办实事、强协同、再复盘”汇报这一年的工作。",
    "正式答辩前，请把姓名、学院与答辩时间补充到封面。",
  ]);
}

// Slide 2: Agenda / main line
{
  const slide = contentSlide(
    "01 · 述职主线",
    "这一年，我让“诉求”从入口走向回音",
    2,
    TOTAL,
  );
  const items = [
    ["听诉求", "问卷、走访、日常反馈，先让问题有地方说"],
    ["建流程", "分级分类、专人跟进，让解决过程有迹可循"],
    ["办实事", "食堂、生活服务、公共设施，推动议题真正落地"],
    ["促协同", "在青春舞会等活动中高效补位，做好服务保障"],
  ];
  items.forEach((item, index) => {
    const top = 190 + index * 108;
    const block = addRoundedPanel(slide, {
      left: ML,
      top,
      width: 66,
      height: 66,
      fill: COLORS.accent,
      line: { style: "solid", fill: "none", width: 0 },
      paragraphs: [
        paragraph([run(String(index + 1).padStart(2, "0"), { fontSize: "21pt", bold: true, color: COLORS.white })], {
          alignment: "center",
        }),
      ],
    });
    block.text.style = { typeface: FONT, alignment: "center", verticalAlignment: "middle" };
    addTextBox(slide, {
      left: 170,
      top: top + 2,
      width: 280,
      height: 34,
      text: item[0],
      fontSize: 24,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left: 430,
      top: top + 3,
      width: 778,
      height: 52,
      text: item[1],
      fontSize: 18,
      color: COLORS.body,
      valign: "middle",
      leading: 1.3,
    });
  });
  addTextBox(slide, {
    left: ML,
    top: 628,
    width: 1136,
    height: 36,
    text: "衡量标准只有一条：同学的问题有没有被认真对待、持续跟进、最终回应。",
    fontSize: 18,
    bold: true,
    color: COLORS.accent,
    leading: 1,
  });
  addNotes(slide, [
    "先讲这一年做了什么，让评委看到一条清晰主线：所有工作都围绕“把诉求解决好”展开。",
    "每一类工作都可以对应后面的具体案例，不用在这里展开。",
  ]);
}

// Slide 3: Positioning
{
  const slide = contentSlide(
    "02 · 工作定位",
    "社区部要先听到，再找准，最后办实",
    3,
    TOTAL,
  );
  const leftPanel = addRoundedPanel(slide, {
    left: ML,
    top: 186,
    width: 438,
    height: 460,
    fill: COLORS.panel,
    line: { style: "solid", fill: "none", width: 0 },
  });
  setStructuredText(
    leftPanel,
    [
      paragraph([run("工作定位", { fontSize: "18pt", bold: true, color: COLORS.accent })], { spaceAfter: 18 }),
      paragraph(
        [
          run("不是简单转达，\n而是推动解决", {
            fontSize: "32pt",
            bold: true,
            color: COLORS.ink,
          }),
        ],
        { spaceAfter: 22 },
      ),
      paragraph(
        [
          run("社区部既做同学的耳朵，也做同学与校园各责任单位之间的桥，让每一类诉求都有清晰的处理路径。", {
            fontSize: "18pt",
            color: COLORS.body,
          }),
        ],
        { leading: 1.5 },
      ),
    ],
    { insets: { top: 48, right: 46, bottom: 42, left: 46 } },
  );
  const rightRows = [
    ["入口要够多", "问卷、走访、日常反馈，让诉求有地方说"],
    ["事实要够清", "现场核查、责任梳理，弄清问题在哪、该找谁"],
    ["结果要够实", "与多方反复沟通，把进展和结论及时还给同学"],
  ];
  rightRows.forEach((row, index) => {
    const top = 186 + index * 140;
    addTextBox(slide, {
      left: 560,
      top: top + 2,
      width: 560,
      height: 40,
      text: row[0],
      fontSize: 24,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left: 560,
      top: top + 50,
      width: 620,
      height: 60,
      text: row[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.38,
    });
    if (index < 2) {
      addRect(slide, {
        left: 560,
        top: top + 122,
        width: 620,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  addNotes(slide, [
    "说明部门角色：既不是简单传话，也不是问题中转站，而是把诉求接住、把责任找清、把结果跟回来。",
    "这句话统领后面所有案例。",
  ]);
}

// Slide 4: Full process loop
{
  const slide = contentSlide(
    "03 · 机制建设",
    "一套闭环，让诉求从“收到”走向“办好”",
    4,
    TOTAL,
  );
  const steps = [
    ["收集", "问卷、走访、线上入口"],
    ["分类", "归纳分级、分清责任"],
    ["上报", "对接后勤、物业等单位"],
    ["协商", "现场核查、反复沟通"],
    ["反馈", "结果同步、台账归档"],
  ];
  const gap = 14;
  const stepWidth = (CW - gap * (steps.length - 1)) / steps.length;
  steps.forEach((step, index) => {
    const left = ML + index * (stepWidth + gap);
    addRoundedPanel(slide, {
      left,
      top: 192,
      width: stepWidth,
      height: 344,
      fill: COLORS.panel,
      line: { style: "solid", fill: "none", width: 0 },
      paragraphs: [
        paragraph([run(String(index + 1).padStart(2, "0"), { fontSize: "18pt", bold: true, color: COLORS.accent })], {
          spaceAfter: 16,
        }),
        paragraph([run(step[0], { fontSize: "24pt", bold: true, color: COLORS.ink })], { spaceAfter: 18 }),
        paragraph([run(step[1], { fontSize: "17pt", color: COLORS.body })], { leading: 1.45 }),
      ],
      textStyle: { insets: { top: 30, right: 24, bottom: 24, left: 24 } },
    });
  });
  const banner = addRoundedPanel(slide, {
    left: ML,
    top: 574,
    width: CW,
    height: 62,
    fill: COLORS.accentSoft,
    line: { style: "solid", fill: "none", width: 0 },
  });
  setStructuredText(
    banner,
    [
      paragraph(
        [
          run("全程跟踪回访 · 未解决事项持续列入督办，直到有明确答复", {
            fontSize: "19pt",
            bold: true,
            color: COLORS.accent,
          }),
        ],
        { alignment: "center" },
      ),
    ],
    { valign: "middle", alignment: "center" },
  );
  addNotes(slide, [
    "这张图是全年工作的机制底座，也是我在社区部最希望留下来的成果。",
    "每步都可以补充具体说明：例如“分类”按紧急、普遍、个别三类处理；“反馈”包含线上同步与回访。",
  ]);
}

// Slide 5: Collection channels
{
  const slide = contentSlide(
    "04 · 倾听诉求",
    "问卷发出去了，同学的声音也要收得回来",
    5,
    TOTAL,
  );
  addTextBox(slide, {
    left: ML,
    top: 188,
    width: 560,
    height: 34,
    text: "渠道怎么建",
    fontSize: 19,
    bold: true,
    color: COLORS.accent,
    leading: 1,
  });
  const leftRows = [
    ["问卷调研", "围绕食堂、设施、服务等主题，定期收集师生反馈"],
    ["现场走访", "到宿舍、操场、食堂看真实使用场景，不只听二手信息"],
    ["日常反馈", "整理线上群、邮箱与学生组织转来的诉求"],
  ];
  leftRows.forEach((row, index) => {
    const top = 240 + index * 124;
    addTextBox(slide, {
      left: ML,
      top: top + 2,
      width: 500,
      height: 36,
      text: row[0],
      fontSize: 24,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left: ML,
      top: top + 46,
      width: 560,
      height: 58,
      text: row[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.38,
    });
    if (index < 2) {
      addRect(slide, {
        left: ML,
        top: top + 112,
        width: 560,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  const panel = addRoundedPanel(slide, {
    left: 730,
    top: 188,
    width: 478,
    height: 470,
    fill: COLORS.panel,
    line: { style: "solid", fill: "none", width: 0 },
  });
  setStructuredText(
    panel,
    [
      paragraph([run("信息怎么用", { fontSize: "18pt", bold: true, color: COLORS.accent })], { spaceAfter: 18 }),
      paragraph([run("统一记录，分级处理", { fontSize: "28pt", bold: true, color: COLORS.ink })], { spaceAfter: 26 }),
      paragraph([run("先分层：紧急问题、共性问题、个别诉求分开跟进。", { fontSize: "18pt", color: COLORS.body })], {
        spaceAfter: 14,
        leading: 1.45,
      }),
      paragraph([run("再汇总：把高频话题做成专题，提交责任单位。", { fontSize: "18pt", color: COLORS.body })], {
        spaceAfter: 14,
        leading: 1.45,
      }),
      paragraph([run("后回流：处理结果整理后，通过原渠道反馈给同学。", { fontSize: "18pt", color: COLORS.body })], {
        spaceAfter: 20,
        leading: 1.45,
      }),
      paragraph([run("入口再多，最终都汇成一张清晰的问题清单。", { fontSize: "17pt", bold: true, color: COLORS.accent })], {
        leading: 1.45,
      }),
    ],
    { insets: { top: 46, right: 44, bottom: 40, left: 44 } },
  );
  addNotes(slide, [
    "这里可以加入问卷回收量、覆盖学院或楼栋数、走访次数等真实数据，会更有说服力。",
    "强调所有入口最终统一记录、分级处理，避免信息碎片化。",
  ]);
}

// Slide 6: Canteen food waste investigation
{
  const slide = contentSlide(
    "05 · 重点调研",
    "把剩饭调查做成供需匹配的改进建议",
    6,
    TOTAL,
  );
  const rows = [
    ["现场观察", "选择高峰与尾餐时段，在餐盘回收点了解剩余情况"],
    ["原因梳理", "把高频剩余与窗口供给对照，讨论数量、口味、份量等问题"],
    ["建议反馈", "整理建议与食堂沟通，跟进改进措施并回访同学感受"],
  ];
  rows.forEach((row, index) => {
    const top = 200 + index * 138;
    addTextBox(slide, {
      left: ML,
      top: top + 2,
      width: 280,
      height: 36,
      text: row[0],
      fontSize: 24,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left: 340,
      top: top + 4,
      width: 560,
      height: 88,
      text: row[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.42,
    });
    if (index < 2) {
      addRect(slide, {
        left: ML,
        top: top + 118,
        width: 858,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  const rightPanel = addRoundedPanel(slide, {
    left: 944,
    top: 200,
    width: 264,
    height: 392,
    fill: COLORS.accentSoft,
    line: { style: "solid", fill: "none", width: 0 },
  });
  setStructuredText(
    rightPanel,
    [
      paragraph([run("为什么做", { fontSize: "17pt", bold: true, color: COLORS.accent })], { spaceAfter: 18 }),
      paragraph([run("剩饭不是一组数据，", { fontSize: "20pt", bold: true, color: COLORS.ink })], { spaceAfter: 4 }),
      paragraph([run("背后是备餐和需求没有完全对上。", { fontSize: "20pt", bold: true, color: COLORS.ink })], { spaceAfter: 20 }),
      paragraph([run("调查不是给食堂打分，而是帮供需双方找到更好的对接方式。", { fontSize: "16pt", color: COLORS.body })], {
        leading: 1.5,
      }),
    ],
    { insets: { top: 36, right: 28, bottom: 30, left: 28 } },
  );
  addNotes(slide, [
    "食堂剩饭调查的重点不是一次突击检查，而是连续观察后提出可执行的改进建议。",
    "可以补充：调研覆盖了哪几个食堂/哪些时段、同学反馈的高频菜品种类，以及食堂后续的调整内容。",
  ]);
}

// Slide 7: Service price negotiation
{
  const slide = contentSlide(
    "06 · 重点实事",
    "把价格和权益问题放上桌面，谈出更合理的方案",
    7,
    TOTAL,
  );
  addTextBox(slide, {
    left: ML,
    top: 190,
    width: 560,
    height: 32,
    text: "议题画像",
    fontSize: 19,
    bold: true,
    color: COLORS.accent,
    leading: 1,
  });
  const leftItems = [
    "洗浴、饮用水、能源等生活服务收费",
    "研究生实际使用频次与费用负担",
    "推动降价、优惠或更清晰的计费规则",
  ];
  leftItems.forEach((item, index) => {
    const top = 244 + index * 104;
    addTextBox(slide, {
      left: ML,
      top,
      width: 40,
      height: 40,
      text: String(index + 1),
      fontSize: 19,
      bold: true,
      color: COLORS.accent,
      leading: 1,
    });
    addTextBox(slide, {
      left: 124,
      top: top + 1,
      width: 520,
      height: 54,
      text: item,
      fontSize: 20,
      color: COLORS.body,
      valign: "middle",
      leading: 1.35,
    });
  });
  addRect(slide, {
    left: 652,
    top: 190,
    width: 1.5,
    height: 436,
    fill: COLORS.rule,
  });
  addTextBox(slide, {
    left: 700,
    top: 190,
    width: 500,
    height: 32,
    text: "推进方法",
    fontSize: 19,
    bold: true,
    color: COLORS.accent,
    leading: 1,
  });
  const rightItems = [
    ["先调研", "收集同学反映集中、影响面大的收费问题"],
    ["再沟通", "准备依据和诉求，与运营方、相关部门当面协商"],
    ["后跟进", "确认调整是否落地，把结果反馈给同学"],
  ];
  rightItems.forEach((row, index) => {
    const top = 244 + index * 128;
    addTextBox(slide, {
      left: 700,
      top: top + 2,
      width: 200,
      height: 34,
      text: row[0],
      fontSize: 23,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left: 700,
      top: top + 42,
      width: 500,
      height: 62,
      text: row[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.4,
    });
    if (index < 2) {
      addRect(slide, {
        left: 700,
        top: top + 116,
        width: 500,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  addTextBox(slide, {
    left: 700,
    top: 560,
    width: 500,
    height: 64,
    text: "每一次协商前，先问自己：依据是否清楚、诉求是否具体、结果能否同步给同学。",
    fontSize: 17,
    bold: true,
    color: COLORS.accent,
    leading: 1.45,
  });
  addNotes(slide, [
    "如涉及具体服务商或能源项目（例如校园洗浴/饮用水品牌），请在“议题画像”中补上名称和最终结果。",
    "推荐讲一个完整案例：同学反映什么、我们准备了什么、协商后有什么变化、如何回访。",
  ]);
}

// Slide 8: Facilities
{
  const slide = contentSlide(
    "07 · 重点实事",
    "设施小事也要一跟到底，落到具体点位",
    8,
    TOTAL,
  );
  addTextBox(slide, {
    left: ML,
    top: 190,
    width: 520,
    height: 36,
    text: "操场灯光",
    fontSize: 26,
    bold: true,
    color: COLORS.ink,
    leading: 1,
  });
  const leftItems = [
    ["摸需求", "晚间锻炼时段与亮度不足的真实场景"],
    ["找责任", "向场馆、后勤反馈具体区域和使用需求"],
    ["看结果", "跟进照明调整，向同学同步处理进度"],
  ];
  leftItems.forEach((row, index) => {
    const top = 248 + index * 116;
    addTextBox(slide, {
      left: ML,
      top: top + 2,
      width: 170,
      height: 34,
      text: row[0],
      fontSize: 21,
      bold: true,
      color: COLORS.accent,
      leading: 1,
    });
    addTextBox(slide, {
      left: 236,
      top: top + 3,
      width: 384,
      height: 60,
      text: row[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.38,
    });
    if (index < 2) {
      addRect(slide, {
        left: ML,
        top: top + 94,
        width: 548,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  addRect(slide, {
    left: 652,
    top: 190,
    width: 1.5,
    height: 436,
    fill: COLORS.rule,
  });
  addTextBox(slide, {
    left: 700,
    top: 190,
    width: 500,
    height: 36,
    text: "宿舍楼内衣架更换",
    fontSize: 26,
    bold: true,
    color: COLORS.ink,
    leading: 1,
  });
  const rightItems = [
    ["清情况", "统计相关楼栋、数量与损坏程度"],
    ["报需求", "形成更换清单，提交相关部门"],
    ["盯进度", "跟进更换计划与完成后的使用反馈"],
  ];
  rightItems.forEach((row, index) => {
    const top = 248 + index * 116;
    addTextBox(slide, {
      left: 700,
      top: top + 2,
      width: 170,
      height: 34,
      text: row[0],
      fontSize: 21,
      bold: true,
      color: COLORS.accent,
      leading: 1,
    });
    addTextBox(slide, {
      left: 862,
      top: top + 3,
      width: 346,
      height: 60,
      text: row[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.38,
    });
    if (index < 2) {
      addRect(slide, {
        left: 700,
        top: top + 94,
        width: 508,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  addTextBox(slide, {
    left: ML,
    top: 634,
    width: CW,
    height: 32,
    text: "共同方法：先把事实摸清，再让责任有人、结果可查。",
    fontSize: 18,
    bold: true,
    color: COLORS.accent,
    leading: 1,
  });
  addNotes(slide, [
    "设施问题需要把“很模糊的抱怨”翻译成“具体区域 + 具体数量 + 具体责任单位”。",
    "可以补充操场具体区域、衣架涉及楼栋与更换数量；如已完成，说明完成时间与同学反馈。",
  ]);
}

// Slide 9: Youth dance procurement support
{
  const slide = contentSlide(
    "08 · 活动协同",
    "青春舞会保障：采购也是一次高效团队协同",
    9,
    TOTAL,
  );
  const phases = [
    ["前期清单", "对照活动方案列物资明细、预算与交付节点"],
    ["采购执行", "比价采购、验收留痕、按节点交付"],
    ["现场保障", "按环节配送与协调，随时补位"],
    ["收尾复盘", "清点归还、沉淀流程供后续复用"],
  ];
  addRect(slide, {
    left: ML,
    top: 222,
    width: CW,
    height: 1.5,
    fill: COLORS.rule,
  });
  const colWidth = (CW - 60) / 4;
  phases.forEach((phase, index) => {
    const left = ML + index * (colWidth + 20);
    const dot = addRoundedPanel(slide, {
      left,
      top: 198,
      width: 48,
      height: 48,
      fill: COLORS.accent,
      line: { style: "solid", fill: "none", width: 0 },
      paragraphs: [
        paragraph([run(String(index + 1), { fontSize: "19pt", bold: true, color: COLORS.white })], {
          alignment: "center",
        }),
      ],
    });
    dot.text.style = { typeface: FONT, alignment: "center", verticalAlignment: "middle" };
    addTextBox(slide, {
      left,
      top: 268,
      width: colWidth,
      height: 36,
      text: phase[0],
      fontSize: 23,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left,
      top: 322,
      width: colWidth,
      height: 130,
      text: phase[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.42,
    });
  });
  const bottom = addRoundedPanel(slide, {
    left: ML,
    top: 508,
    width: CW,
    height: 92,
    fill: COLORS.panel,
    line: { style: "solid", fill: "none", width: 0 },
  });
  setStructuredText(
    bottom,
    [
      paragraph([run("物资采购不只是“买”，更是预算、节点、责任和现场应变的全流程管理。", { fontSize: "19pt", bold: true, color: COLORS.ink })], {
        alignment: "center",
      }),
      paragraph([run("在青春舞会中，我负责把需求清单变成按时交付、账目清楚的物资保障。", { fontSize: "16pt", color: COLORS.body })], {
        alignment: "center",
        spaceBefore: 8,
      }),
    ],
    { valign: "middle", alignment: "center" },
  );
  addNotes(slide, [
    "用一到两句话说明岗位职责：需求对接、预算管理、采购比价、现场补位。",
    "如答辩需要数据，可以补充采购品项数、预算执行情况、按时交付率或现场零缺项等结果。",
  ]);
}

// Slide 10: Method summary
{
  const slide = contentSlide(
    "09 · 述职沉淀",
    "从解决一个个问题，到沉淀一套套方法",
    10,
    TOTAL,
  );
  const rows = [
    ["问题台账化", "从“问过、办过”到“有记录、有节点、有结果”"],
    ["调研实证化", "用问卷和现场走访，支撑每一次正式沟通"],
    ["沟通专业化", "准备在前、诉求清晰、跟进负责、结果回音"],
    ["协同流程化", "把活动保障与物资采购沉淀为可复用流程"],
  ];
  rows.forEach((row, index) => {
    const top = 206 + index * 112;
    addTextBox(slide, {
      left: ML,
      top: top + 2,
      width: 250,
      height: 36,
      text: row[0],
      fontSize: 24,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left: 360,
      top: top + 6,
      width: 776,
      height: 44,
      text: row[1],
      fontSize: 19,
      color: COLORS.body,
      leading: 1.3,
    });
    if (index < 3) {
      addRect(slide, {
        left: ML,
        top: top + 92,
        width: CW,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  addTextBox(slide, {
    left: ML,
    top: 662,
    width: 600,
    height: 22,
    text: "",
    fontSize: 13,
    color: COLORS.muted,
    leading: 1,
  });
  addNotes(slide, [
    "总结个人成长：不只做成了几件事，更沉淀了可交给下一届的方法。",
    "结合前几页案例，说明这些方法分别从哪里来、还能用到哪里去。",
  ]);
}

// Slide 11: Reflection
{
  const slide = contentSlide(
    "10 · 反思复盘",
    "坦诚复盘，把成长空间也讲清楚",
    11,
    TOTAL,
  );
  const items = [
    ["跨部门响应节奏仍可更稳", "部分问题依赖外部单位排期，反馈周期需要更明确的约定"],
    ["数据沉淀仍不充分", "问卷、走访和台账应形成更完整的案例库，便于交接与追踪"],
    ["同学参与还可更深入", "下一步不只“代同学发声”，也要让同学共同参与方案讨论"],
  ];
  items.forEach((item, index) => {
    const top = 200 + index * 138;
    addTextBox(slide, {
      left: ML,
      top: top + 2,
      width: 52,
      height: 52,
      text: String(index + 1),
      fontSize: 22,
      bold: true,
      color: COLORS.accent,
      leading: 1,
    });
    addTextBox(slide, {
      left: 150,
      top: top,
      width: 500,
      height: 40,
      text: item[0],
      fontSize: 24,
      bold: true,
      color: COLORS.ink,
      leading: 1,
    });
    addTextBox(slide, {
      left: 680,
      top: top + 4,
      width: 528,
      height: 76,
      text: item[1],
      fontSize: 18,
      color: COLORS.body,
      leading: 1.4,
    });
    if (index < 2) {
      addRect(slide, {
        left: ML,
        top: top + 116,
        width: CW,
        height: 1.2,
        fill: COLORS.rule,
      });
    }
  });
  addNotes(slide, [
    "述职答辩中的反思要真实、具体，同时把改进方向说清楚，避免只讲空话。",
    "可以补充一个印象最深的遗憾案例：当时卡在哪、现在会怎么处理。",
  ]);
}

// Slide 12: Next steps
{
  const slide = contentSlide(
    "11 · 下一步",
    "下一年，让机制更常态、服务更前置",
    12,
    TOTAL,
  );
  const cols = [
    ["固定节奏", "问卷与走访按学期排期，线上入口持续开放"],
    ["清单管理", "每件诉求都有编号、节点、责任人与结果"],
    ["联合督办", "与职能部门定期沟通，形成响应约定"],
    ["团队传承", "让部门成员参与全流程，沉淀可交接经验"],
  ];
  const colWidth = (CW - 3 * 24) / 4;
  cols.forEach((col, index) => {
    const left = ML + index * (colWidth + 24);
    const panel = addRoundedPanel(slide, {
      left,
      top: 206,
      width: colWidth,
      height: 360,
      fill: COLORS.panel,
      line: { style: "solid", fill: "none", width: 0 },
      paragraphs: [
        paragraph([run(String(index + 1).padStart(2, "0"), { fontSize: "18pt", bold: true, color: COLORS.accent })], {
          spaceAfter: 20,
        }),
        paragraph([run(col[0], { fontSize: "24pt", bold: true, color: COLORS.ink })], { spaceAfter: 20 }),
        paragraph([run(col[1], { fontSize: "17pt", color: COLORS.body })], { leading: 1.5 }),
      ],
      textStyle: { insets: { top: 36, right: 26, bottom: 28, left: 26 } },
    });
  });
  const banner = addRoundedPanel(slide, {
    left: ML,
    top: 604,
    width: CW,
    height: 54,
    fill: COLORS.accentSoft,
    line: { style: "solid", fill: "none", width: 0 },
  });
  setStructuredText(
    banner,
    [
      paragraph([run("让同学感到：反映问题不是结束，而是解决的开始。", { fontSize: "19pt", bold: true, color: COLORS.accent })], {
        alignment: "center",
      }),
    ],
    { valign: "middle", alignment: "center" },
  );
  addNotes(slide, [
    "下一步规划要与反思一一对应：哪里没做好，就在这里给出解法。",
    "如已有具体时间计划，可补充问卷周期、例会频率或问题处理时限。",
  ]);
}

// Slide 13: Closing
{
  const slide = presentation.slides.add();
  slide.background.fill = COLORS.white;
  addTextBox(slide, {
    left: W / 2 - 300,
    top: 130,
    width: 600,
    height: 30,
    text: "结语",
    fontSize: 19,
    bold: true,
    color: COLORS.accent,
    align: "center",
    leading: 1,
  });
  addRect(slide, {
    left: W / 2 - 37,
    top: 184,
    width: 74,
    height: 7,
    fill: COLORS.accent,
  });
  addTextBox(slide, {
    left: W / 2 - 470,
    top: 240,
    width: 940,
    height: 150,
    text: "我愿意做同学身边那个\n把诉求盯到底的人",
    fontSize: 50,
    bold: true,
    color: COLORS.ink,
    align: "center",
    leading: 1.24,
  });
  addTextBox(slide, {
    left: W / 2 - 450,
    top: 430,
    width: 900,
    height: 76,
    text: "让倾听成为习惯，让调研成为依据，让协商成为常态，让回音成为承诺。",
    fontSize: 21,
    color: COLORS.body,
    align: "center",
    leading: 1.5,
  });
  addTextBox(slide, {
    left: W / 2 - 240,
    top: 610,
    width: 480,
    height: 30,
    text: "请各位老师批评指正",
    fontSize: 18,
    color: COLORS.muted,
    align: "center",
    leading: 1,
  });
  addNotes(slide, [
    "结尾收束到开场的问题：这一年做的不只是几件事，而是一套让诉求有着落的方法。",
    "最后一句话放慢语速，说完后停顿，再请老师提问。",
  ]);
}

await fs.mkdir(OUT_DIR, { recursive: true });

for (let index = 0; index < presentation.slides.items.length; index += 1) {
  const slide = presentation.slides.items[index];
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(
    path.join(OUT_DIR, `slide-${String(index + 1).padStart(2, "0")}.png`),
    new Uint8Array(await png.arrayBuffer()),
  );
}

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(FINAL_PPTX);
console.log(`Saved ${FINAL_PPTX}`);
