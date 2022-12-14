import * as cheerio from "cheerio";

export const listingHtmlParser = (responseHtml) => {
  const $ = cheerio.load(responseHtml);

  return $(".tm-row-selectable")
    .map(function () {
      const $row = $(this);

      const $numberCell = $row.find("td:first-child");
      const number = $numberCell.find(".table-cell-value").text();
      const link = process.env.BASE_URL + $numberCell.find("a").attr("href");

      const $priceCell = $row.find("td:nth-child(2)");
      const price = parseInt($priceCell.find(".table-cell-value").text());

      return {
        number,
        link,
        price,
      };
    })
    .toArray();
};
