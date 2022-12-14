import * as dotenv from "dotenv";
import { fetchListingHtml } from "./fetchListingHtml.js";
import { listingHtmlParser } from "./listingHtmlParser.js";
import { Telegraf } from "telegraf";
import { getRandomInt } from "./getRandomInt.js";
import { getRandomNumberPrice } from "./getRandomNumberPrice.js";

dotenv.config();

const sentNumbers = {};
const loggedNormalOffers = {};

const bot = new Telegraf(process.env.BOT_TOKEN);

let veryGoodOffersCount = 0;
let goodOffersCount = 0;
let normalOffersCount = 0;

let lastParsedListing;

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

    if (priceDifference === 0 && !loggedNormalOffers[record.number]) {
      loggedNormalOffers[record.number] = record;

      normalOffersCount++;

      console.log(
        `[%s] Found a number for the current random number price. Number: ${record.number}. Price: ${record.price} TON. Link: ${record.link}`,
        new Date().toUTCString()
      );
    }

    if (sentNumbers[record.number]) {
      continue;
    }

    if (priceDifference > 1) {
      sentNumbers[record.number] = record;

      veryGoodOffersCount++;

      await bot.telegram.sendMessage(
        process.env.CHAT_ID,
        `⚠️ Found a VERY good offer.\nNumber: ${record.number}\nPrice: ${record.price} TON\nLink: ${record.link}`
      );

      console.log(
        `[%s] Found good offer. Number: ${record.number}. Price: ${record.price} TON. Link: ${record.link}`,
        new Date().toUTCString()
      );

      return;
    } else if (priceDifference > 0) {
      sentNumbers[record.number] = record;

      goodOffersCount++;

      await bot.telegram.sendMessage(
        process.env.CHAT_ID,
        `Found a good offer (+${priceDifference}).\nNumber: ${record.number}\nPrice: ${record.price} TON\nLink: ${record.link}`
      );

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
        `Parsing failed!\nError: ${e.message}`
      );
      console.error(`Parsing failed! Error: ${e.message}`);
    }
    setTimeout(async () => {
      await startParsing();
    }, 1000 + getRandomInt(500));
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
    `Very good offers found: ${veryGoodOffersCount}`,
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

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
