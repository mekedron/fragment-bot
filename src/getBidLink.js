import fetch from "node-fetch";

export const getBidLink = async (number, price, qr = true) => {
  const response = await fetch(
    `https://fragment.com/api?hash=${process.env.HASH}`,
    {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        cookie: process.env.COOKIE,
        Referer: `https://fragment.com/number/${number}}`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: `type=3&username=${number}&bid=${price}&method=getBidLink`,
      method: "POST",
    }
  );

  const jsonResponse = await response.json();

  return jsonResponse.ok
    ? qr
      ? jsonResponse.qr_link
      : jsonResponse.link
    : false;
};
