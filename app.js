/* =========================================================
   IO NETWORK — COMPLETE APP.JS
========================================================= */

const IO_PRICE_SYMBOL = "IOUSDT";
const BNB_PRICE_SYMBOL = "BNBUSDT";

const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;

const CONTRACT_ADDRESS =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";

let ioPrice = 0;
let bnbPrice = 0;

const $ = (selector) =>
  document.querySelector(selector);


/* =========================================================
   BINANCE MARKET DATA
========================================================= */

async function getBinanceTicker(symbol) {

  const urls = [
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${symbol}`
  ];

  for (const url of urls) {

    try {

      const response = await fetch(
        url,
        { cache: "no-store" }
      );

      if (!response.ok) {
        continue;
      }

      return await response.json();

    } catch {
      continue;
    }
  }

  throw new Error("Binance market data unavailable");
}


/* =========================================================
   FORMAT USD
========================================================= */

function formatUSD(value) {

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits:
        value < 1 ? 4 : 2,
      maximumFractionDigits:
        value < 1 ? 4 : 2
    }
  ).format(value);
}


/* =========================================================
   FORMAT NUMBERS
========================================================= */

function formatNumber(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2
    }
  ).format(value);

}


/* =========================================================
   MARKET CHANGE
========================================================= */

function updateChange(selector, value) {

  const element = $(selector);

  if (!element) return;

  if (!Number.isFinite(value)) {

    element.textContent =
      "Market change unavailable";

    return;
  }

  const sign =
    value >= 0 ? "+" : "";

  element.textContent =
    `${sign}${value.toFixed(2)}% 24h`;

  element.classList.toggle(
    "negative",
    value < 0
  );
}


/* =========================================================
   LOAD PRICES
========================================================= */

async function loadPrices() {

  const ioPriceEl =
    $("#ioPrice");

  const bnbPriceEl =
    $("#bnbPrice");

  try {

    const [
      io,
      bnb
    ] = await Promise.all([

      getBinanceTicker(
        IO_PRICE_SYMBOL
      ),

      getBinanceTicker(
        BNB_PRICE_SYMBOL
      )

    ]);

    ioPrice =
      Number(io.lastPrice);

    bnbPrice =
      Number(bnb.lastPrice);


    if (ioPriceEl) {

      ioPriceEl.textContent =
        formatUSD(ioPrice);

    }


    if (bnbPriceEl) {

      bnbPriceEl.textContent =
        formatUSD(bnbPrice);

    }


    updateChange(
      "#ioChange",
      Number(io.priceChangePercent)
    );

    updateChange(
      "#bnbChange",
      Number(bnb.priceChangePercent)
    );


    calculateAllocation();

  } catch (error) {

    console.warn(
      "Market price error:",
      error
    );

    if (ioPriceEl) {
      ioPriceEl.textContent =
        "Unavailable";
    }

    if (bnbPriceEl) {
      bnbPriceEl.textContent =
        "Unavailable";
    }

  }
}


/* =========================================================
   ALLOCATION CALCULATOR
========================================================= */

function calculateAllocation() {

  const input =
    $("#bnbAmount");

  const message =
    $("#calculatorMessage");

  if (!input || !message) {
    return;
  }

  const amount =
    Number(input.value);


  if (!amount) {

    $("#estimatedIO").textContent =
      "0 IO";

    $("#bonusIO").textContent =
      "0 IO";

    $("#totalIO").textContent =
      "0 IO";

    message.textContent =
      "Minimum 5 BNB · Maximum 500 BNB";

    return;
  }


  if (amount < MIN_BNB) {

    $("#estimatedIO").textContent =
      "0 IO";

    $("#bonusIO").textContent =
      "0 IO";

    $("#totalIO").textContent =
      "0 IO";

    message.textContent =
      "Minimum participation is 5 BNB.";

    return;
  }


  if (amount > MAX_BNB) {

    $("#estimatedIO").textContent =
      "0 IO";

    $("#bonusIO").textContent =
      "0 IO";

    $("#totalIO").textContent =
      "0 IO";

    message.textContent =
      "Maximum participation is 500 BNB.";

    return;
  }


  if (
    !ioPrice ||
    !bnbPrice
  ) {

    message.textContent =
      "Waiting for current market prices.";

    return;
  }


  const baseIO =
    (amount * bnbPrice) /
    ioPrice;

  const bonusIO =
    baseIO * BONUS_RATE;

  const totalIO =
    baseIO + bonusIO;


  $("#estimatedIO").textContent =
    `${formatNumber(baseIO)} IO`;

  $("#bonusIO").textContent =
    `${formatNumber(bonusIO)} IO`;

  $("#totalIO").textContent =
    `${formatNumber(totalIO)} IO`;


  message.textContent =
    "Estimate calculated from current displayed market prices.";

}


/* =========================================================
   SIMULATED ACTIVITY
   Same compact style as the ATOM activity section.
========================================================= */

const activity = [

  {
    amount: "2,100",
    address: "0xa73c...91b4"
  },

  {
    amount: "580",
    address: "0x31f7...e204"
  },

  {
    amount: "1,250",
    address: "0x8c42...a91d"
  },

  {
    amount: "3,420",
    address: "0x6b91...42fa"
  },

  {
    amount: "890",
    address: "0x51d8...c720"
  },

  {
    amount: "4,680",
    address: "0x92ab...18ef"
  },

  {
    amount: "1,760",
    address: "0x47ce...b381"
  },

  {
    amount: "2,940",
    address: "0xd521...7aa6"
  }

];


/* =========================================================
   ACTIVITY CARD
========================================================= */

function activityCard(item) {

  return `

    <article class="activity-row">

      <div class="activity-icon">
        ↗
      </div>

      <div class="activity-main">

        <strong>
          ${item.amount} IO
        </strong>

        <span>
          ${item.address}
        </span>

      </div>

      <div class="activity-status">

        <strong>
          SIMULATED
        </strong>

        <small>
          Activity
        </small>

      </div>

    </article>

  `;
}


/* =========================================================
   RENDER ACTIVITY
========================================================= */

function renderActivity() {

  const grid =
    $("#activityGrid");

  if (!grid) return;


  /*
    Show only three rows at a time,
    matching the compact ATOM layout.
  */

  let currentIndex = 0;


  function draw() {

    const visible = [];

    for (
      let i = 0;
      i < 3;
      i++
    ) {

      visible.push(
        activity[
          (currentIndex + i) %
          activity.length
        ]
      );

    }


    grid.innerHTML =
      visible
        .map(activityCard)
        .join("");


    const rows =
      grid.querySelectorAll(
        ".activity-row"
      );


    /*
      Smooth entrance.
    */

    rows.forEach(
      (row, index) => {

        row.style.opacity = "0";
        row.style.transform =
          "translateY(-18px)";

        row.style.transition =
          "opacity 1s ease, transform 1s ease";

        setTimeout(
          () => {

            row.style.opacity = "1";
            row.style.transform =
              "translateY(0)";

          },
          index * 120
        );

      }
    );

  }


  draw();


  /*
    Slowly replace the activity list.
  */

  setInterval(
    () => {

      const rows =
        grid.querySelectorAll(
          ".activity-row"
        );


      rows.forEach(
        (row, index) => {

          setTimeout(
            () => {

              row.style.opacity = "0";
              row.style.transform =
                "translateY(18px)";

            },
            index * 100
          );

        }
      );


      setTimeout(
        () => {

          currentIndex =
            (currentIndex + 1) %
            activity.length;

          draw();

        },
        2400
      );

    },
    6000
  );

}


/* =========================================================
   COPY CONTRACT
========================================================= */

function setupCopy() {

  const button =
    $("#copyContract");

  if (!button) return;


  button.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(
          CONTRACT_ADDRESS
        );

        button.textContent =
          "Copied";

        setTimeout(
          () => {

            button.textContent =
              "Copy";

          },
          1600
        );

      } catch {

        button.textContent =
          "Copy failed";

      }

    }
  );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

  const button =
    $("#themeToggle");

  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light-mode"
      );

      document.body.classList.toggle(
        "light"
      );


      const isLight =
        document.body.classList.contains(
          "light"
        ) ||
        document.body.classList.contains(
          "light-mode"
        );


      button.textContent =
        isLight
          ? "☾"
          : "☼";

    }
  );

}


/* =========================================================
   WALLET MODAL
========================================================= */

function setupWallet() {

  const modal =
    $("#walletModal");

  const open =
    $("#connectWallet");

  const close =
    $("#closeWallet");

  const modalButton =
    $("#modalConnectWallet");


  open?.addEventListener(
    "click",
    () => {

      modal?.classList.remove(
        "hidden"
      );

    }
  );


  close?.addEventListener(
    "click",
    () => {

      modal?.classList.add(
        "hidden"
      );

    }
  );


  modal?.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        modal.classList.add(
          "hidden"
        );

      }

    }
  );


  modalButton?.addEventListener(
    "click",
    () => {

      modalButton.textContent =
        "Wallet connection unavailable";

    }
  );

}


/* =========================================================
   CALCULATOR EVENTS
========================================================= */

function setupCalculator() {

  const input =
    $("#bnbAmount");

  const button =
    $("#calculateBtn");


  input?.addEventListener(
    "input",
    calculateAllocation
  );


  button?.addEventListener(
    "click",
    calculateAllocation
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

  setupCopy();

  setupTheme();

  setupWallet();

  setupCalculator();

  renderActivity();

  loadPrices();


  /*
    Refresh Binance prices every minute.
  */

  setInterval(
    loadPrices,
    60000
  );

}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();

}
