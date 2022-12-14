import * as dotenv from "dotenv";
import { fetchListingHtml } from "./fetchListingHtml.js";
import { listingHtmlParser } from "./listingHtmlParser.js";
import { Telegraf } from "telegraf";
import { getRandomInt } from "./getRandomInt.js";
import { getRandomNumberPrice } from "./getRandomNumberPrice.js";
import { getBidLink } from "./getBidLink.js";

dotenv.config();

const sentNumbers = {};

const bot = new Telegraf(process.env.BOT_TOKEN);

let profitableOfferCount = 0;
let goodOffersCount = 0;
let normalOffersCount = 0;

let lastParsedListing;

let desiredProfit = 7;

const parse = async () => {
  let response;

  try {
    response = await fetchListingHtml();
  } catch (e) {
    await bot.telegram.sendMessage(
      process.env.CHAT_ID,
      `Cannot fetch listing html. Error: ${e.message.toString()}`
    );
    console.error(
      `[%s] Cannot fetch listing html. Error: ${e.message.toString()}`,
      new Date().toUTCString()
    );
    return;
  }

  const parsedListing = listingHtmlParser(response);

  lastParsedListing = parsedListing;

  for (let i = 0; i < parsedListing.length; i++) {
    const record = parsedListing[i];

    const priceDifference = getRandomNumberPrice() - record.price;

    if (sentNumbers[record.number]) {
      continue;
    }

    if (priceDifference >= desiredProfit + 1) {
      sentNumbers[record.number] = record;

      profitableOfferCount++;

      const lines = [
        `⚠️⚠️⚠️ Found a !!!VERY!!! PROFITABLE offer (+${priceDifference}).`,
        `Number: ${record.number}`,
        `Price: ${record.price} TON`,
        `Link: ${record.link}`,
      ];

      const clearNumber = record.number.replace(/(\s|\+)/, "");

      const bidLink = await getBidLink(clearNumber, record.price);

      if (bidLink) {
        lines.push(`Buy link: ${bidLink}`);
      }

      await bot.telegram.sendMessage(process.env.CHAT_ID, lines.join("\n"));

      console.log(
        `[%s] Found PROFITABLE offer. Number: ${record.number}. Price: ${record.price} TON. Link: ${record.link}`,
        new Date().toUTCString()
      );

      return;
    } else if (priceDifference >= desiredProfit) {
      sentNumbers[record.number] = record;

      goodOffersCount++;

      const lines = [
        `Found a good offer (+${priceDifference}).`,
        `Number: ${record.number}`,
        `Price: ${record.price} TON`,
        `Link: ${record.link}`,
      ];

      const clearNumber = record.number.replace(/(\s|\+)/, "");

      const bidLink = await getBidLink(clearNumber, record.price);

      if (bidLink) {
        lines.push(`Buy link: ${bidLink}`);
      }

      await bot.telegram.sendMessage(process.env.CHAT_ID, lines.join("\n"));

      console.log(
        `[%s] Found good offer. Number: ${record.number}. Price: ${record.price} TON. Link: ${record.link}`,
        new Date().toUTCString()
      );
    }
  }
};

const boot = async () => {
  console.log(
    `[%s] Bot is running! Current random number price: ${getRandomNumberPrice()} TON`,
    new Date().toUTCString()
  );
  await bot.telegram.sendMessage(
    process.env.CHAT_ID,
    `⚠️ Bot is running! Current random number price: ${getRandomNumberPrice()} TON`
  );

  const startParsing = async () => {
    try {
      await parse();
    } catch (error) {
      await bot.telegram.sendMessage(
        process.env.CHAT_ID,
        `Parsing failed!\nError: ${error.message}`
      );
      console.error(`Parsing failed! Error: ${error.message}`);
    }
    setTimeout(async () => {
      await startParsing();
    }, 500 + getRandomInt(250));
  };

  await startParsing();
};

boot();

bot.command("stats", async (ctx) => {
  if (!lastParsedListing) {
    await ctx.reply(`Data is not yet fetched.`);
    return;
  }

  const messageLines = [
    `Current random number price: ${getRandomNumberPrice()} TON`,
    "",
    `Current profitable difference amount: ${desiredProfit} TON`,
    "",
    `Very good offers found: ${profitableOfferCount}`,
    `Good offers found: ${goodOffersCount}`,
    `Normal offers found: ${normalOffersCount}`,
    "",
    "Numbers count per price:",
  ];

  const numbersCountPerPrice = lastParsedListing.reduce((result, item) => {
    if (result[item.price] === undefined) {
      result[item.price] = 0;
    }

    result[item.price]++;

    return result;
  }, {});

  const prices = Object.keys(numbersCountPerPrice);

  prices.forEach((price, index) => {
    const count = numbersCountPerPrice[price];

    if (index === prices.length - 1) {
      messageLines.push(`For ${price} TON: ${count}+`);
    } else {
      messageLines.push(`For ${price} TON: ${count}`);
    }
  });

  await ctx.reply(messageLines.join("\n"));
});

bot.command("profit", async (ctx) => {
  const newProfit = ctx.message.text.split(" ")?.[1] || false;

  if (newProfit) {
    desiredProfit = parseInt(newProfit);
    ctx.reply("Profitable difference has been updated!");
  } else {
    ctx.reply(`Current profitable difference amount: ${desiredProfit}`);
  }
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
