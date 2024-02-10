import fs from "fs";
// import process from 'process'

const nastyWords = {
  "越......越......": "越",
  "Y 分之 X": "分之",
};

let entries = [];

for (const levelDir of fs.readdirSync("data")) {
  for (const page of fs.readdirSync(`data/${levelDir}`)) {
    const path = `data/${levelDir}/${page}`;
    const txt = fs.readFileSync(path, { encoding: "utf8" });
    const json = JSON.parse(txt);
    for (const entry of json.data.list) {
      const { word, pinyin_tone, pinyin_num, translation, levels } = entry;
      const hskLevel = levels.find((l) => l.type_name === "HSK");
      if (!hskLevel.level_id) throw new Error(`Can't read hsk level`);

      const fixedWord = word in nastyWords ? nastyWords[word] : word.trim();

      entries.push({
        word: fixedWord,
        pinyinNum: pinyin_num,
        pinyinTone: pinyin_tone,
        translation: translation.trim(),
        hsk: hskLevel.level_id.toString(),
      });
    }
  }
}

function sortEntries(entries) {
  // TODO choose a locale?
  entries.sort((a, b) => a.word.localeCompare(b.word));
  entries.sort((a, b) => a.hsk - b.hsk);
}

sortEntries(entries);

{
  // Check data
  const isTrimmed = (txt) => txt === txt.trim();

  let seen = new Map();
  for (const entry of entries) {
    for (const [k, v] of Object.entries(entry)) {
      if (!isTrimmed(v)) throw new Error(`${k} not trimmed in ${entry.word}`);
    }

    if (!/^\p{Script=Hani}+$/u.exec(entry.word))
      throw new Error(`Word contains non-characters '${entry.word}'`);

    const existing = seen.get(entry.word);
    if (existing !== undefined) {
      process.stderr.write(`Duplicate ${entry.word}\n`);
      existing.translation += `; ${entry.translation}`;
    } else {
      seen.set(entry.word, entry);
    }
  }

  entries = Array.from(seen.values());
  sortEntries(entries);
}

process.stdout.write(`Level\tWord\tPinyin1\tPinyin2\tTranslation\n`);
for (const entry of entries) {
  const { word, pinyinNum, pinyinTone, translation, hsk } = entry;
  const cells = [hsk, word, pinyinTone, pinyinNum, translation];
  process.stdout.write(`${cells.join("\t")}\n`);
}
