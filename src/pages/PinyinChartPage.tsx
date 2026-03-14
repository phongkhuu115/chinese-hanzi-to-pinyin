import { useState, useCallback } from "react";
import { Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";

// ─── Syllable → representative Hanzi ─────────────────────────────────────────
// Speaking pinyin romanization directly causes TTS to spell it out letter by
// letter. Instead we speak a real Hanzi character that has that exact syllable,
// which forces the TTS to produce the correct Mandarin pronunciation.
const SYLLABLE_HANZI: Record<string, string> = {
  a: "啊", o: "哦", e: "鹅", er: "耳", ai: "爱", ei: "诶", ao: "奥", ou: "欧",
  an: "安", en: "恩", ang: "昂", eng: "鹦",
  yi: "一", wu: "五", yu: "鱼",
  ya: "呀", ye: "也", yao: "要", you: "有", yan: "言", yin: "音", yang: "样", ying: "应", yong: "用",
  wa: "哇", wo: "我", wai: "外", wei: "为", wan: "万", wen: "文", wang: "王", weng: "翁",
  yue: "月", yuan: "元", yun: "云",
  ba: "八", pa: "怕", ma: "妈", fa: "发",
  bo: "波", po: "破", mo: "模", fo: "佛",
  bi: "比", pi: "皮", mi: "米",
  bu: "不", pu: "普", mu: "木", fu: "父",
  bai: "白", pai: "排", mai: "买",
  bei: "北", pei: "配", mei: "美", fei: "飞",
  bao: "包", pao: "跑", mao: "猫",
  bou: "剖", pou: "剖", mou: "某", fou: "否",
  ban: "半", pan: "盘", man: "满", fan: "饭",
  ben: "本", pen: "盆", men: "门", fen: "分",
  bang: "帮", pang: "旁", mang: "忙", fang: "方",
  beng: "崩", peng: "朋", meng: "梦", feng: "风",
  bie: "别", pie: "撇", mie: "灭",
  biao: "表", piao: "票", miao: "妙",
  biu: "镖", miu: "谬",
  bian: "边", pian: "片", mian: "面",
  bin: "宾", pin: "品", min: "民",
  bing: "冰", ping: "平", ming: "明",
  da: "大", ta: "他", na: "那", la: "拉",
  de: "的", te: "特", ne: "呢", le: "了",
  di: "地", ti: "题", ni: "你", li: "里",
  du: "度", tu: "图", nu: "努", lu: "路",
  nü: "女", lü: "旅",
  dai: "代", tai: "太", nai: "奶", lai: "来",
  dei: "得", lei: "类",
  dao: "到", tao: "套", nao: "脑", lao: "老",
  dou: "都", tou: "头", nou: "耨", lou: "楼",
  dan: "单", tan: "谈", nan: "南", lan: "蓝",
  den: "扽", nen: "嫩",
  dang: "当", tang: "糖", nang: "囊", lang: "浪",
  deng: "等", teng: "疼", neng: "能", leng: "冷",
  dong: "东", tong: "同", nong: "农", long: "龙",
  die: "蝶", tie: "贴", nie: "捏", lie: "列",
  diao: "调", tiao: "跳", niao: "鸟", liao: "了",
  diu: "丢", liu: "六",
  niu: "牛",
  dian: "点", tian: "天", nian: "年", lian: "连",
  nin: "您", lin: "林",
  ding: "定", ting: "听", ning: "宁", ling: "零",
  niang: "娘", liang: "两",
  liong: "咚",
  duo: "多", tuo: "拖", nuo: "诺", luo: "落",
  dui: "对", tui: "推",
  duan: "段", tuan: "团", nuan: "暖", luan: "乱",
  dun: "顿", tun: "吞", lun: "论",
  nüe: "虐", lüe: "略",
  ga: "嘎", ka: "卡", ha: "哈",
  ge: "个", ke: "可", he: "和",
  gu: "古", ku: "苦", hu: "虎",
  gai: "该", kai: "开", hai: "海",
  gei: "给", kei: "剋", hei: "黑",
  gao: "高", kao: "考", hao: "好",
  gou: "够", kou: "口", hou: "后",
  gan: "干", kan: "看", han: "汉",
  gen: "根", ken: "肯", hen: "很",
  gang: "刚", kang: "康", hang: "航",
  geng: "更", keng: "坑", heng: "横",
  gong: "工", kong: "空", hong: "红",
  gua: "瓜", kua: "夸", hua: "花",
  guo: "国", kuo: "扩", huo: "火",
  guai: "怪", kuai: "快", huai: "坏",
  gui: "贵", kui: "葵", hui: "会",
  guan: "关", kuan: "宽", huan: "欢",
  gun: "滚", kun: "困", hun: "婚",
  guang: "光", kuang: "狂", huang: "黄",
  ji: "机", qi: "七", xi: "西",
  jia: "家", qia: "恰", xia: "下",
  jie: "接", qie: "切", xie: "写",
  jiao: "叫", qiao: "桥", xiao: "小",
  jiu: "九", qiu: "球", xiu: "秀",
  jian: "见", qian: "钱", xian: "先",
  jin: "金", qin: "琴", xin: "心",
  jiang: "江", qiang: "强", xiang: "想",
  jing: "京", qing: "清", xing: "星",
  jiong: "窘", qiong: "穷", xiong: "熊",
  ju: "举", qu: "去", xu: "需",
  jue: "决", que: "却", xue: "学",
  juan: "卷", quan: "全", xuan: "选",
  jun: "军", qun: "群", xun: "训",
  zha: "扎", cha: "茶", sha: "沙",
  zhe: "这", che: "车", she: "蛇",
  zhi: "知", chi: "吃", shi: "是", ri: "日",
  zhu: "主", chu: "出", shu: "书", ru: "入",
  zhai: "摘", chai: "拆", shai: "晒",
  zhei: "这", shei: "谁",
  zhao: "找", chao: "超", shao: "少", rao: "绕",
  zhou: "州", chou: "丑", shou: "手", rou: "肉",
  zhan: "站", chan: "产", shan: "山", ran: "然",
  zhen: "真", chen: "陈", shen: "身", ren: "人",
  zhang: "张", chang: "长", shang: "上", rang: "让",
  zheng: "正", cheng: "成", sheng: "生", reng: "仍",
  zhong: "中", chong: "虫", rong: "荣",
  zhua: "抓", chua: "欻", shua: "刷",
  zhuo: "桌", chuo: "戳", shuo: "说", ruo: "弱",
  zhuai: "拽", chuai: "揣", shuai: "帅",
  zhui: "追", chui: "吹", shui: "水", rui: "锐",
  zhuan: "转", chuan: "船", shuan: "拴", ruan: "软",
  zhun: "准", chun: "春", shun: "顺", run: "润",
  zhuang: "装", chuang: "窗", shuang: "双",
  za: "杂", ca: "擦", sa: "撒",
  ze: "则", ce: "测", se: "色",
  zi: "字", ci: "次", si: "四",
  zu: "组", cu: "粗", su: "速",
  zai: "在", cai: "才", sai: "赛",
  zei: "贼",
  zao: "早", cao: "草", sao: "扫",
  zou: "走", cou: "凑", sou: "搜",
  zan: "赞", can: "参", san: "三",
  zen: "怎", cen: "岑", sen: "森",
  zang: "脏", cang: "仓", sang: "桑",
  zeng: "增", ceng: "层", seng: "僧",
  zong: "总", cong: "从", song: "送",
  zuo: "做", cuo: "错", suo: "所",
  zui: "最", cui: "催", sui: "随",
  zuan: "钻", cuan: "蹿", suan: "算",
  zun: "尊", cun: "村", sun: "孙",
};

/**
 * Get a representative Hanzi for a syllable so TTS pronounces it correctly.
 * Falls back to the pinyin string if no Hanzi is found (rare edge cases).
 */
function syllableToSpeech(syllable: string): string {
  return SYLLABLE_HANZI[syllable] ?? syllable;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

// Finals (columns) — ordered as in standard Mandarin pinyin charts
const FINALS = [
  "-a", "-o", "-e", "-i", "-u", "-ü",
  "-ai", "-ei", "-ao", "-ou",
  "-an", "-en", "-ang", "-eng", "-ong",
  "-er",
  "-ia", "-ie", "-iao", "-iou",
  "-ian", "-in", "-iang", "-ing", "-iong",
  "-ua", "-uo", "-uai", "-uei",
  "-uan", "-uen", "-uang", "-ueng",
  "-üe", "-üan", "-ün",
];

// Initials (rows)
const INITIALS = [
  "Ø", // zero initial
  "b", "p", "m", "f",
  "d", "t", "n", "l",
  "g", "k", "h",
  "j", "q", "x",
  "zh", "ch", "sh", "r",
  "z", "c", "s",
  "y", "w",
];

// The full valid pinyin syllable table.
// Key: `${initial}+${final}` → actual pinyin string (or "" if invalid)
// We derive this from the standard Mandarin phonology rules.
// Spelling rules applied:
//   - iou → iu when preceded by initial
//   - uei → ui when preceded by initial
//   - uen → un when preceded by initial
//   - ü → u after j/q/x/y
//   - zero initial: i→yi, u→wu, ü→yu, ia→ya, ie→ye, etc.

type SyllableMap = Record<string, string>;

function buildSyllableMap(): SyllableMap {
  const map: SyllableMap = {};

  const set = (initial: string, final: string, syllable: string) => {
    map[`${initial}+${final}`] = syllable;
  };

  // ── Zero initial (Ø) ──────────────────────────────────────────────────────
  set("Ø", "-a", "a");
  set("Ø", "-o", "o");
  set("Ø", "-e", "e");
  set("Ø", "-i", "yi");
  set("Ø", "-u", "wu");
  set("Ø", "-ü", "yu");
  set("Ø", "-ai", "ai");
  set("Ø", "-ei", "ei");
  set("Ø", "-ao", "ao");
  set("Ø", "-ou", "ou");
  set("Ø", "-an", "an");
  set("Ø", "-en", "en");
  set("Ø", "-ang", "ang");
  set("Ø", "-eng", "eng");
  set("Ø", "-er", "er");
  set("Ø", "-ia", "ya");
  set("Ø", "-ie", "ye");
  set("Ø", "-iao", "yao");
  set("Ø", "-iou", "you");
  set("Ø", "-ian", "yan");
  set("Ø", "-in", "yin");
  set("Ø", "-iang", "yang");
  set("Ø", "-ing", "ying");
  set("Ø", "-iong", "yong");
  set("Ø", "-ua", "wa");
  set("Ø", "-uo", "wo");
  set("Ø", "-uai", "wai");
  set("Ø", "-uei", "wei");
  set("Ø", "-uan", "wan");
  set("Ø", "-uen", "wen");
  set("Ø", "-uang", "wang");
  set("Ø", "-ueng", "weng");
  set("Ø", "-üe", "yue");
  set("Ø", "-üan", "yuan");
  set("Ø", "-ün", "yun");

  // ── b ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "ba"], ["-o", "bo"], ["-i", "bi"], ["-u", "bu"],
    ["-ai", "bai"], ["-ei", "bei"], ["-ao", "bao"], ["-ou", "bou"],
    ["-an", "ban"], ["-en", "ben"], ["-ang", "bang"], ["-eng", "beng"],
    ["-ie", "bie"], ["-iao", "biao"], ["-ian", "bian"], ["-in", "bin"], ["-ing", "bing"],
  ]) set("b", f, s);

  // ── p ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "pa"], ["-o", "po"], ["-i", "pi"], ["-u", "pu"],
    ["-ai", "pai"], ["-ei", "pei"], ["-ao", "pao"], ["-ou", "pou"],
    ["-an", "pan"], ["-en", "pen"], ["-ang", "pang"], ["-eng", "peng"],
    ["-ie", "pie"], ["-iao", "piao"], ["-ian", "pian"], ["-in", "pin"], ["-ing", "ping"],
  ]) set("p", f, s);

  // ── m ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "ma"], ["-o", "mo"], ["-e", "me"], ["-i", "mi"], ["-u", "mu"],
    ["-ai", "mai"], ["-ei", "mei"], ["-ao", "mao"], ["-ou", "mou"],
    ["-an", "man"], ["-en", "men"], ["-ang", "mang"], ["-eng", "meng"],
    ["-ie", "mie"], ["-iao", "miao"], ["-iou", "miu"], ["-ian", "mian"], ["-in", "min"], ["-ing", "ming"],
  ]) set("m", f, s);

  // ── f ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "fa"], ["-o", "fo"], ["-u", "fu"],
    ["-ei", "fei"], ["-ou", "fou"],
    ["-an", "fan"], ["-en", "fen"], ["-ang", "fang"], ["-eng", "feng"],
  ]) set("f", f, s);

  // ── d ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "da"], ["-e", "de"], ["-i", "di"], ["-u", "du"],
    ["-ai", "dai"], ["-ei", "dei"], ["-ao", "dao"], ["-ou", "dou"],
    ["-an", "dan"], ["-en", "den"], ["-ang", "dang"], ["-eng", "deng"], ["-ong", "dong"],
    ["-ie", "die"], ["-iao", "diao"], ["-iou", "diu"], ["-ian", "dian"], ["-ing", "ding"],
    ["-ua", "dua"], ["-uo", "duo"], ["-uai", "duai"], ["-uei", "dui"], ["-uan", "duan"], ["-uen", "dun"],
  ]) set("d", f, s);

  // ── t ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "ta"], ["-e", "te"], ["-i", "ti"], ["-u", "tu"],
    ["-ai", "tai"], ["-ao", "tao"], ["-ou", "tou"],
    ["-an", "tan"], ["-ang", "tang"], ["-eng", "teng"], ["-ong", "tong"],
    ["-ie", "tie"], ["-iao", "tiao"], ["-ian", "tian"], ["-ing", "ting"],
    ["-uo", "tuo"], ["-uei", "tui"], ["-uan", "tuan"], ["-uen", "tun"],
  ]) set("t", f, s);

  // ── n ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "na"], ["-e", "ne"], ["-i", "ni"], ["-u", "nu"], ["-ü", "nü"],
    ["-ai", "nai"], ["-ei", "nei"], ["-ao", "nao"], ["-ou", "nou"],
    ["-an", "nan"], ["-en", "nen"], ["-ang", "nang"], ["-eng", "neng"], ["-ong", "nong"],
    ["-ie", "nie"], ["-iao", "niao"], ["-iou", "niu"], ["-ian", "nian"], ["-in", "nin"], ["-iang", "niang"], ["-ing", "ning"],
    ["-uo", "nuo"], ["-uan", "nuan"],
    ["-üe", "nüe"],
  ]) set("n", f, s);

  // ── l ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "la"], ["-e", "le"], ["-i", "li"], ["-u", "lu"], ["-ü", "lü"],
    ["-ai", "lai"], ["-ei", "lei"], ["-ao", "lao"], ["-ou", "lou"],
    ["-an", "lan"], ["-ang", "lang"], ["-eng", "leng"], ["-ong", "long"],
    ["-ia", "lia"], ["-ie", "lie"], ["-iao", "liao"], ["-iou", "liu"], ["-ian", "lian"], ["-in", "lin"], ["-iang", "liang"], ["-ing", "ling"],
    ["-uo", "luo"], ["-uan", "luan"], ["-uen", "lun"],
    ["-üe", "lüe"],
  ]) set("l", f, s);

  // ── g ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "ga"], ["-e", "ge"], ["-u", "gu"],
    ["-ai", "gai"], ["-ei", "gei"], ["-ao", "gao"], ["-ou", "gou"],
    ["-an", "gan"], ["-en", "gen"], ["-ang", "gang"], ["-eng", "geng"], ["-ong", "gong"],
    ["-ua", "gua"], ["-uo", "guo"], ["-uai", "guai"], ["-uei", "gui"], ["-uan", "guan"], ["-uen", "gun"], ["-uang", "guang"],
  ]) set("g", f, s);

  // ── k ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "ka"], ["-e", "ke"], ["-u", "ku"],
    ["-ai", "kai"], ["-ei", "kei"], ["-ao", "kao"], ["-ou", "kou"],
    ["-an", "kan"], ["-en", "ken"], ["-ang", "kang"], ["-eng", "keng"], ["-ong", "kong"],
    ["-ua", "kua"], ["-uo", "kuo"], ["-uai", "kuai"], ["-uei", "kui"], ["-uan", "kuan"], ["-uen", "kun"], ["-uang", "kuang"],
  ]) set("k", f, s);

  // ── h ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "ha"], ["-e", "he"], ["-u", "hu"],
    ["-ai", "hai"], ["-ei", "hei"], ["-ao", "hao"], ["-ou", "hou"],
    ["-an", "han"], ["-en", "hen"], ["-ang", "hang"], ["-eng", "heng"], ["-ong", "hong"],
    ["-ua", "hua"], ["-uo", "huo"], ["-uai", "huai"], ["-uei", "hui"], ["-uan", "huan"], ["-uen", "hun"], ["-uang", "huang"],
  ]) set("h", f, s);

  // ── j ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-i", "ji"], ["-ü", "ju"],
    ["-ia", "jia"], ["-ie", "jie"], ["-iao", "jiao"], ["-iou", "jiu"], ["-ian", "jian"], ["-in", "jin"], ["-iang", "jiang"], ["-ing", "jing"], ["-iong", "jiong"],
    ["-üe", "jue"], ["-üan", "juan"], ["-ün", "jun"],
  ]) set("j", f, s);

  // ── q ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-i", "qi"], ["-ü", "qu"],
    ["-ia", "qia"], ["-ie", "qie"], ["-iao", "qiao"], ["-iou", "qiu"], ["-ian", "qian"], ["-in", "qin"], ["-iang", "qiang"], ["-ing", "qing"], ["-iong", "qiong"],
    ["-üe", "que"], ["-üan", "quan"], ["-ün", "qun"],
  ]) set("q", f, s);

  // ── x ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-i", "xi"], ["-ü", "xu"],
    ["-ia", "xia"], ["-ie", "xie"], ["-iao", "xiao"], ["-iou", "xiu"], ["-ian", "xian"], ["-in", "xin"], ["-iang", "xiang"], ["-ing", "xing"], ["-iong", "xiong"],
    ["-üe", "xue"], ["-üan", "xuan"], ["-ün", "xun"],
  ]) set("x", f, s);

  // ── zh ────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "zha"], ["-e", "zhe"], ["-i", "zhi"], ["-u", "zhu"],
    ["-ai", "zhai"], ["-ei", "zhei"], ["-ao", "zhao"], ["-ou", "zhou"],
    ["-an", "zhan"], ["-en", "zhen"], ["-ang", "zhang"], ["-eng", "zheng"], ["-ong", "zhong"],
    ["-ua", "zhua"], ["-uo", "zhuo"], ["-uai", "zhuai"], ["-uei", "zhui"], ["-uan", "zhuan"], ["-uen", "zhun"], ["-uang", "zhuang"],
  ]) set("zh", f, s);

  // ── ch ────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "cha"], ["-e", "che"], ["-i", "chi"], ["-u", "chu"],
    ["-ai", "chai"], ["-ao", "chao"], ["-ou", "chou"],
    ["-an", "chan"], ["-en", "chen"], ["-ang", "chang"], ["-eng", "cheng"], ["-ong", "chong"],
    ["-ua", "chua"], ["-uo", "chuo"], ["-uai", "chuai"], ["-uei", "chui"], ["-uan", "chuan"], ["-uen", "chun"], ["-uang", "chuang"],
  ]) set("ch", f, s);

  // ── sh ────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "sha"], ["-e", "she"], ["-i", "shi"], ["-u", "shu"],
    ["-ai", "shai"], ["-ei", "shei"], ["-ao", "shao"], ["-ou", "shou"],
    ["-an", "shan"], ["-en", "shen"], ["-ang", "shang"], ["-eng", "sheng"],
    ["-ua", "shua"], ["-uo", "shuo"], ["-uai", "shuai"], ["-uei", "shui"], ["-uan", "shuan"], ["-uen", "shun"], ["-uang", "shuang"],
  ]) set("sh", f, s);

  // ── r ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-e", "re"], ["-i", "ri"], ["-u", "ru"],
    ["-ao", "rao"], ["-ou", "rou"],
    ["-an", "ran"], ["-en", "ren"], ["-ang", "rang"], ["-eng", "reng"], ["-ong", "rong"],
    ["-uo", "ruo"], ["-uei", "rui"], ["-uan", "ruan"], ["-uen", "run"],
  ]) set("r", f, s);

  // ── z ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "za"], ["-e", "ze"], ["-i", "zi"], ["-u", "zu"],
    ["-ai", "zai"], ["-ei", "zei"], ["-ao", "zao"], ["-ou", "zou"],
    ["-an", "zan"], ["-en", "zen"], ["-ang", "zang"], ["-eng", "zeng"], ["-ong", "zong"],
    ["-uo", "zuo"], ["-uei", "zui"], ["-uan", "zuan"], ["-uen", "zun"],
  ]) set("z", f, s);

  // ── c ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "ca"], ["-e", "ce"], ["-i", "ci"], ["-u", "cu"],
    ["-ai", "cai"], ["-ao", "cao"], ["-ou", "cou"],
    ["-an", "can"], ["-en", "cen"], ["-ang", "cang"], ["-eng", "ceng"], ["-ong", "cong"],
    ["-uo", "cuo"], ["-uei", "cui"], ["-uan", "cuan"], ["-uen", "cun"],
  ]) set("c", f, s);

  // ── s ─────────────────────────────────────────────────────────────────────
  for (const [f, s] of [
    ["-a", "sa"], ["-e", "se"], ["-i", "si"], ["-u", "su"],
    ["-ai", "sai"], ["-ao", "sao"], ["-ou", "sou"],
    ["-an", "san"], ["-en", "sen"], ["-ang", "sang"], ["-eng", "seng"], ["-ong", "song"],
    ["-uo", "suo"], ["-uei", "sui"], ["-uan", "suan"], ["-uen", "sun"],
  ]) set("s", f, s);

  // ── y (treated as zero-initial for i/ü finals) ────────────────────────────
  for (const [f, s] of [
    ["-a", "ya"], ["-e", "ye"], ["-i", "yi"], ["-ü", "yu"],
    ["-ao", "yao"], ["-ou", "you"],
    ["-an", "yan"], ["-en", "yen"], ["-ang", "yang"], ["-ing", "ying"], ["-ong", "yong"],
    ["-ia", "ya"], ["-ie", "ye"], ["-iao", "yao"], ["-iou", "you"], ["-ian", "yan"], ["-in", "yin"], ["-iang", "yang"], ["-iong", "yong"],
    ["-üe", "yue"], ["-üan", "yuan"], ["-ün", "yun"],
  ]) set("y", f, s);

  // ── w (treated as zero-initial for u finals) ──────────────────────────────
  for (const [f, s] of [
    ["-a", "wa"], ["-o", "wo"], ["-u", "wu"],
    ["-ai", "wai"], ["-ei", "wei"],
    ["-an", "wan"], ["-en", "wen"], ["-ang", "wang"], ["-eng", "weng"],
    ["-ua", "wa"], ["-uo", "wo"], ["-uai", "wai"], ["-uei", "wei"], ["-uan", "wan"], ["-uen", "wen"], ["-uang", "wang"], ["-ueng", "weng"],
  ]) set("w", f, s);

  return map;
}

const SYLLABLE_MAP = buildSyllableMap();

function getSyllable(initial: string, final: string): string {
  return SYLLABLE_MAP[`${initial}+${final}`] ?? "";
}

// ─── Tone selector ────────────────────────────────────────────────────────────
const TONE_MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

// Apply tone mark to a syllable string
function applyTone(syllable: string, tone: number): string {
  if (tone === 0) return syllable; // neutral / no tone
  // Find the vowel to mark (priority: a > e > ou > last vowel)
  const vowelOrder = ["a", "e", "ou", "o", "i", "u", "ü"];
  for (const v of vowelOrder) {
    if (syllable.includes(v)) {
      const marks = TONE_MARKS[v];
      if (marks) return syllable.replace(v, marks[tone - 1]);
    }
  }
  return syllable;
}

// ─── Component ────────────────────────────────────────────────────────────────

// Visible finals for columns (compact display — skip rarely-shown ones)
const DISPLAY_FINALS = [
  "-a", "-o", "-e", "-er",
  "-ai", "-ei", "-ao", "-ou",
  "-an", "-en", "-ang", "-eng", "-ong",
  "-i", "-ia", "-ie", "-iao", "-iou",
  "-ian", "-in", "-iang", "-ing", "-iong",
  "-u", "-ua", "-uo", "-uai", "-uei",
  "-uan", "-uen", "-uang",
  "-ü", "-üe", "-üan", "-ün",
];

const TONE_OPTIONS = [
  { value: 0, label: "·" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
];

export function PinyinChartPage() {
  const [tone, setTone] = useState(2);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  const handleClick = useCallback(
    (syllable: string) => {
      const withTone = applyTone(syllable, tone);
      // Speak the representative Hanzi so TTS produces correct Mandarin sound
      // instead of reading the romanized pinyin letter by letter.
      const hanzi = syllableToSpeech(syllable);
      speak(hanzi);
      setLastPlayed(withTone);
    },
    [tone]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pinyin Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Click any cell to hear its pronunciation
        </p>
      </div>

      {/* Tone selector + last played */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Tone:</span>
          <div className="flex gap-1">
            {TONE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTone(value)}
                className={cn(
                  "size-8 rounded-full text-sm font-medium border transition-colors",
                  tone === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {lastPlayed && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Volume2 className="size-3.5" />
            <span>
              Playing:{" "}
              <span className="font-semibold text-foreground">{lastPlayed}</span>
            </span>
          </div>
        )}
      </div>

      {/* Chart — horizontally scrollable, scrollbar on top */}
      {/* Flip outer container so the scrollbar appears at the top,
          then flip inner content back so it renders normally. */}
      <div
        className="overflow-x-auto rounded-lg border border-border"
        style={{ transform: "rotateX(180deg)" }}
      >
        <table
          className="border-collapse text-xs min-w-max"
          style={{ transform: "rotateX(180deg)" }}
        >
          <thead>
            <tr>
              {/* Corner cell */}
              <th className="sticky left-0 z-20 bg-muted px-3 py-2 text-left font-semibold border-b border-r border-border min-w-10">
                声母↓ / 韵母→
              </th>
              {DISPLAY_FINALS.map((f) => (
                <th
                  key={f}
                  className="bg-muted px-2 py-2 text-center font-semibold border-b border-r border-border min-w-12 whitespace-nowrap"
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INITIALS.map((initial, rowIdx) => (
              <tr
                key={initial}
                className={rowIdx % 2 === 0 ? "bg-background" : "bg-muted"}
              >
                {/* Initial label */}
                <td className="sticky bg-inherit left-0 z-10 px-3 py-1.5 font-semibold border-r border-border whitespace-nowrap">
                  {initial === "Ø" ? (
                    <span className="text-muted-foreground">Ø-</span>
                  ) : (
                    <span>{initial}-</span>
                  )}
                </td>

                {/* Syllable cells */}
                {DISPLAY_FINALS.map((final) => {
                  const syllable = getSyllable(initial, final);
                  return (
                    <td
                      key={final}
                      className="border-r border-b border-border/50 p-0"
                    >
                      {syllable ? (
                        <button
                          onClick={() => handleClick(syllable)}
                          title={`${applyTone(syllable, tone)} (tone ${tone || "neutral"})`}
                          className={cn(
                            "w-full h-full px-2 py-1.5 text-center font-medium transition-colors rounded-sm",
                            "hover:bg-primary hover:text-primary-foreground",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            lastPlayed === applyTone(syllable, tone)
                              ? "bg-primary/15 text-primary"
                              : "text-foreground"
                          )}
                        >
                          {syllable}
                        </button>
                      ) : (
                        <span className="block w-full h-full px-2 py-1.5 text-center text-muted-foreground/30 select-none">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs px-1.5 py-0">声母</Badge>
          <span>Initials (rows)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs px-1.5 py-0">韵母</Badge>
          <span>Finals (columns)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40 font-medium">—</span>
          <span>Invalid combination</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Ø-</span>
          <span>Zero initial (standalone finals)</span>
        </div>
      </div>
    </div>
  );
}
