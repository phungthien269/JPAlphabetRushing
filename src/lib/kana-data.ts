import type { LearningItem, ScriptType, VariantType } from "../types";

type RowDefinition = {
  group: string;
  subgroup: VariantType;
  entries: Array<[character: string, romaji: string]>;
};

const basicHiragana: RowDefinition[] = [
  { group: "a", subgroup: "basic", entries: [["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"]] },
  { group: "ka", subgroup: "basic", entries: [["か", "ka"], ["き", "ki"], ["く", "ku"], ["け", "ke"], ["こ", "ko"]] },
  { group: "sa", subgroup: "basic", entries: [["さ", "sa"], ["し", "shi"], ["す", "su"], ["せ", "se"], ["そ", "so"]] },
  { group: "ta", subgroup: "basic", entries: [["た", "ta"], ["ち", "chi"], ["つ", "tsu"], ["て", "te"], ["と", "to"]] },
  { group: "na", subgroup: "basic", entries: [["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"]] },
  { group: "ha", subgroup: "basic", entries: [["は", "ha"], ["ひ", "hi"], ["ふ", "fu"], ["へ", "he"], ["ほ", "ho"]] },
  { group: "ma", subgroup: "basic", entries: [["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"]] },
  { group: "ya", subgroup: "basic", entries: [["や", "ya"], ["ゆ", "yu"], ["よ", "yo"]] },
  { group: "ra", subgroup: "basic", entries: [["ら", "ra"], ["り", "ri"], ["る", "ru"], ["れ", "re"], ["ろ", "ro"]] },
  { group: "wa", subgroup: "basic", entries: [["わ", "wa"], ["を", "wo"], ["ん", "n"]] },
];

const dakutenHiragana: RowDefinition[] = [
  { group: "ga", subgroup: "dakuten", entries: [["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"]] },
  { group: "za", subgroup: "dakuten", entries: [["ざ", "za"], ["じ", "ji"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"]] },
  { group: "da", subgroup: "dakuten", entries: [["だ", "da"], ["ぢ", "ji"], ["づ", "zu"], ["で", "de"], ["ど", "do"]] },
  { group: "ba", subgroup: "dakuten", entries: [["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"]] },
  { group: "pa", subgroup: "handakuten", entries: [["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"]] },
];

const youonHiragana: RowDefinition[] = [
  { group: "kya", subgroup: "youon", entries: [["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"]] },
  { group: "sha", subgroup: "youon", entries: [["しゃ", "sha"], ["しゅ", "shu"], ["しょ", "sho"]] },
  { group: "cha", subgroup: "youon", entries: [["ちゃ", "cha"], ["ちゅ", "chu"], ["ちょ", "cho"]] },
  { group: "nya", subgroup: "youon", entries: [["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"]] },
  { group: "hya", subgroup: "youon", entries: [["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"]] },
  { group: "mya", subgroup: "youon", entries: [["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"]] },
  { group: "rya", subgroup: "youon", entries: [["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"]] },
  { group: "gya", subgroup: "youon", entries: [["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"]] },
  { group: "ja", subgroup: "youon", entries: [["じゃ", "ja"], ["じゅ", "ju"], ["じょ", "jo"]] },
  { group: "bya", subgroup: "youon", entries: [["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"]] },
  { group: "pya", subgroup: "youon", entries: [["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"]] },
];

const supportHiragana: RowDefinition[] = [
  { group: "sokuon", subgroup: "sokuon", entries: [["っ", "small tsu"]] },
  { group: "long_vowel", subgroup: "long_vowel", entries: [["おう", "ou"], ["えい", "ei"]] },
];

const basicKatakana: RowDefinition[] = [
  { group: "a", subgroup: "basic", entries: [["ア", "a"], ["イ", "i"], ["ウ", "u"], ["エ", "e"], ["オ", "o"]] },
  { group: "ka", subgroup: "basic", entries: [["カ", "ka"], ["キ", "ki"], ["ク", "ku"], ["ケ", "ke"], ["コ", "ko"]] },
  { group: "sa", subgroup: "basic", entries: [["サ", "sa"], ["シ", "shi"], ["ス", "su"], ["セ", "se"], ["ソ", "so"]] },
  { group: "ta", subgroup: "basic", entries: [["タ", "ta"], ["チ", "chi"], ["ツ", "tsu"], ["テ", "te"], ["ト", "to"]] },
  { group: "na", subgroup: "basic", entries: [["ナ", "na"], ["ニ", "ni"], ["ヌ", "nu"], ["ネ", "ne"], ["ノ", "no"]] },
  { group: "ha", subgroup: "basic", entries: [["ハ", "ha"], ["ヒ", "hi"], ["フ", "fu"], ["ヘ", "he"], ["ホ", "ho"]] },
  { group: "ma", subgroup: "basic", entries: [["マ", "ma"], ["ミ", "mi"], ["ム", "mu"], ["メ", "me"], ["モ", "mo"]] },
  { group: "ya", subgroup: "basic", entries: [["ヤ", "ya"], ["ユ", "yu"], ["ヨ", "yo"]] },
  { group: "ra", subgroup: "basic", entries: [["ラ", "ra"], ["リ", "ri"], ["ル", "ru"], ["レ", "re"], ["ロ", "ro"]] },
  { group: "wa", subgroup: "basic", entries: [["ワ", "wa"], ["ヲ", "wo"], ["ン", "n"]] },
];

const dakutenKatakana: RowDefinition[] = [
  { group: "ga", subgroup: "dakuten", entries: [["ガ", "ga"], ["ギ", "gi"], ["グ", "gu"], ["ゲ", "ge"], ["ゴ", "go"]] },
  { group: "za", subgroup: "dakuten", entries: [["ザ", "za"], ["ジ", "ji"], ["ズ", "zu"], ["ゼ", "ze"], ["ゾ", "zo"]] },
  { group: "da", subgroup: "dakuten", entries: [["ダ", "da"], ["ヂ", "ji"], ["ヅ", "zu"], ["デ", "de"], ["ド", "do"]] },
  { group: "ba", subgroup: "dakuten", entries: [["バ", "ba"], ["ビ", "bi"], ["ブ", "bu"], ["ベ", "be"], ["ボ", "bo"]] },
  { group: "pa", subgroup: "handakuten", entries: [["パ", "pa"], ["ピ", "pi"], ["プ", "pu"], ["ペ", "pe"], ["ポ", "po"]] },
];

const combinedKatakana: RowDefinition[] = [
  { group: "kya", subgroup: "youon", entries: [["キャ", "kya"], ["キュ", "kyu"], ["キョ", "kyo"]] },
  { group: "sha", subgroup: "youon", entries: [["シャ", "sha"], ["シュ", "shu"], ["ショ", "sho"]] },
  { group: "cha", subgroup: "youon", entries: [["チャ", "cha"], ["チュ", "chu"], ["チョ", "cho"]] },
  { group: "nya", subgroup: "youon", entries: [["ニャ", "nya"], ["ニュ", "nyu"], ["ニョ", "nyo"]] },
  { group: "hya", subgroup: "youon", entries: [["ヒャ", "hya"], ["ヒュ", "hyu"], ["ヒョ", "hyo"]] },
  { group: "mya", subgroup: "youon", entries: [["ミャ", "mya"], ["ミュ", "myu"], ["ミョ", "myo"]] },
  { group: "rya", subgroup: "youon", entries: [["リャ", "rya"], ["リュ", "ryu"], ["リョ", "ryo"]] },
  { group: "gya", subgroup: "youon", entries: [["ギャ", "gya"], ["ギュ", "gyu"], ["ギョ", "gyo"]] },
  { group: "ja", subgroup: "youon", entries: [["ジャ", "ja"], ["ジュ", "ju"], ["ジョ", "jo"]] },
  { group: "bya", subgroup: "youon", entries: [["ビャ", "bya"], ["ビュ", "byu"], ["ビョ", "byo"]] },
  { group: "pya", subgroup: "youon", entries: [["ピャ", "pya"], ["ピュ", "pyu"], ["ピョ", "pyo"]] },
  { group: "loanword-fa", subgroup: "loanword", entries: [["ファ", "fa"], ["フィ", "fi"], ["フェ", "fe"], ["フォ", "fo"]] },
  { group: "loanword-v", subgroup: "loanword", entries: [["ヴィ", "vi"], ["ヴェ", "ve"], ["ヴォ", "vo"]] },
  { group: "loanword-w", subgroup: "loanword", entries: [["ウィ", "wi"], ["ウェ", "we"], ["ウォ", "wo"]] },
  { group: "loanword-ts", subgroup: "loanword", entries: [["ツァ", "tsa"], ["ツィ", "tsi"], ["ツェ", "tse"], ["ツォ", "tso"]] },
  { group: "loanword-t", subgroup: "loanword", entries: [["ティ", "ti"], ["ディ", "di"], ["トゥ", "tu"], ["ドゥ", "du"]] },
  { group: "loanword-j", subgroup: "loanword", entries: [["ジェ", "je"], ["チェ", "che"], ["シェ", "she"]] },
  { group: "long_vowel", subgroup: "long_vowel", entries: [["ー", "long vowel mark"]] },
];

function makeMeaning(romaji: string) {
  if (romaji === "small tsu") {
    return {
      meaningEn: "small tsu",
      meaningVi: "tsu nhỏ",
      noteEn: "Marks a doubled consonant in the next sound.",
      noteVi: "Báo hiệu âm phụ âm kép ở âm tiết tiếp theo.",
      vowelGroup: "special",
    };
  }
  if (romaji === "long vowel mark") {
    return {
      meaningEn: "long vowel mark",
      meaningVi: "dấu kéo dài âm",
      noteEn: "Used mainly in Katakana loanwords to stretch a vowel.",
      noteVi: "Dùng chủ yếu trong Katakana để kéo dài nguyên âm của từ mượn.",
      vowelGroup: "special",
    };
  }
  return {
    meaningEn: romaji,
    meaningVi: romaji,
    noteEn: `Pronounced as "${romaji}".`,
    noteVi: `Phát âm là "${romaji}".`,
    vowelGroup: romaji.match(/[aeiou]$/)?.[0] ?? "special",
  };
}

function buildItems(scriptType: ScriptType, rows: RowDefinition[], offset: number) {
  const items: LearningItem[] = [];
  let index = offset;
  for (const row of rows) {
    for (const [character, romaji] of row.entries) {
      const meta = makeMeaning(romaji);
      items.push({
        id: `${scriptType}_${row.group}_${romaji.replaceAll(/[^a-z0-9]+/gi, "_")}`.toLowerCase(),
        scriptType,
        character,
        romaji,
        meaningEn: meta.meaningEn,
        meaningVi: meta.meaningVi,
        noteEn: meta.noteEn,
        noteVi: meta.noteVi,
        lessonGroup: row.group,
        subgroup: row.subgroup,
        vowelGroup: meta.vowelGroup,
        sortOrder: index,
        isEnabled: true,
      });
      index += 1;
    }
  }
  return items;
}

export const learningItems: LearningItem[] = [
  ...buildItems("hiragana", basicHiragana, 0),
  ...buildItems("hiragana", dakutenHiragana, 100),
  ...buildItems("hiragana", youonHiragana, 200),
  ...buildItems("hiragana", supportHiragana, 300),
  ...buildItems("katakana", basicKatakana, 400),
  ...buildItems("katakana", dakutenKatakana, 500),
  ...buildItems("katakana", combinedKatakana, 600),
];

export const selectionCategories: VariantType[] = [
  "basic",
  "dakuten",
  "handakuten",
  "youon",
  "sokuon",
  "long_vowel",
  "loanword",
];

export function getItemsByScript(scriptType: ScriptType) {
  return learningItems.filter((item) => item.scriptType === scriptType);
}

export function getItemMap() {
  return Object.fromEntries(learningItems.map((item) => [item.id, item]));
}
