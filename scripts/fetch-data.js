import fs from "fs";

export {};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const baseUrl = `https://api.hskmock.com/mock/word/searchWords`;

const pageSize = 100;

function fetchPage(level, page) {
  const body = {
    level_ids: [level],
    initial: "",
    keyword: "",
    page_num: page,
    page_size: pageSize,
  };

  return fetch(baseUrl, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    referrer: "https://www.chinesetest.cn/",
    body: JSON.stringify(body),
    method: "POST",
    mode: "cors",
  });
}

for (const level of [1, 2, 3, 4, 5, 6]) {
  fs.mkdirSync(`data/${level}`, { recursive: true });

  let page = 1;

  while (true) {
    console.log(`Fetching level ${level} page ${page}`);
    const res = await fetchPage(level, page);
    if (res.status !== 200) throw new Error(res.statusText);
    const json = await res.json();
    if (json.errmsg !== "Success" || !json.data.total_count)
      throw new Error("unexpected payload");

    fs.writeFileSync(
      `data/${level}/${page}.json`,
      JSON.stringify(json, undefined, 2),
    );

    if (page * pageSize >= json.data.total_count) break;

    page += 1;
    await sleep(1000);
  }
}
