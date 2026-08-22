const IO_PRICE_ID = "io-net";
const BNB_PRICE_ID = "binancecoin";

const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;

const CONTRACT_ADDRESS =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";

let ioPrice = 0;
let bnbPrice = 0;

const $ = (selector) => document.querySelector(selector);


/* =========================================================
   INLINE TOKEN LOGOS
========================================================= */

const IO_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="100" fill="#050505"/>
  <g fill="none"
     stroke="#f4f5f7"
     stroke-width="16"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M58 70h30"/>
    <path d="M58 130h30"/>
    <path d="M74 70v60"/>
    <path d="M112 70h25c10 0 18 8 18 18v24c0 10-8 18-18 18h-25"/>
    <path d="M112 70v60"/>
    <path d="M112 100h28"/>
  </g>
  <path
    d="M112 70h25c10 0 18 8 18 18v5"
    fill="none"
    stroke="#8e949c"
    stroke-width="10"
    stroke-linecap="round"/>
</svg>
`)}`;

const BNB_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="22" fill="#ffffff"/>
  <g fill="#F3BA2F">
    <path d="M100 22l25 25-25 25-25-25z"/>
    <path d="M53 69l25-25 16 16-25 25z"/>
    <path d="M147 69l-16-16 25-25 25 25z"/>
    <path d="M100 72l28 28-28 28-28-28z"/>
    <path d="M53 109l25 25-16 16-25-25z"/>
    <path d="M147 109l16 16-25 25-16-16z"/>
    <path d="M100 139l25 25-25 25-25-25z"/>
  </g>
</svg>
`)}`;


/* =========================================================
   INSTALL LOGOS
========================================================= */

function installLogos() {
  document.querySelectorAll('img[alt="IO"]').forEach((img) => {
    img.src = IO_LOGO;
  });

  document.querySelectorAll('img[alt="IO logo"]').forEach((img) => {
    img.src = IO_LOGO;
  });

  document.querySelectorAll('img[alt="BNB logo"]').forEach((img) => {
    img.src = BNB_LOGO;
  });

  document.querySelectorAll('img[alt="BNB Chain"]').forEach((img) => {
    img.src = BNB_LOGO;
  });
}


/* =========================================================
   MARKET PRICES
========================================================= */

async function loadPrices() {
  const ioPriceEl = $("#ioPrice");
  const bnbPriceEl = $("#bnbPrice");

  if (!ioPriceEl || !bnbPriceEl) return;

  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=io-net,binancecoin" +
      "&vs_currencies=usd" +
      "&include_24hr_change=true";

    const response = await fetch(url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Market request failed");
    }

    const data = await response.json();

    ioPrice = Number(
      data?.[IO_PRICE_ID]?.usd || 0
    );

    bnbPrice = Number(
      data?.[BNB_PRICE_ID]?.usd || 0
    );

    ioPriceEl.textContent =
      ioPrice > 0
        ? formatUSD(ioPrice)
        : "Unavailable";

    bnbPriceEl.textContent =
      bnbPrice > 0
        ? formatUSD(bnbPrice)
        : "Unavailable";

    updateChange(
      "#ioChange",
      data?.[IO_PRICE_ID]?.usd_24h_change
    );

    updateChange(
      "#bnbChange",
      data?.[BNB_PRICE_ID]?.usd_24h_change
    );

    calculateAllocation();

  } catch (error) {
    console.warn(
      "Market data unavailable:",
      error
    );

    ioPriceEl.textContent = "Unavailable";
    bnbPriceEl.textContent = "Unavailable";

    const ioChange = $("#ioChange");
    const bnbChange = $("#bnbChange");

    if (ioChange) {
      ioChange.textContent =
        "Market feed unavailable";
    }

    if (bnbChange) {
      bnbChange.textContent =
        "Market feed unavailable";
    }

    calculateAllocation();
  }
}


/* =========================================================
   MARKET CHANGE
========================================================= */

function updateChange(selector, value) {
  const element = $(selector);

  if (!element) return;

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    element.textContent =
      "Market change unavailable";

    element.classList.remove("negative");

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
   USD FORMAT
========================================================= */

function formatUSD(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (value >= 1000) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2
      }
    ).format(value);
  }

  if (value >= 1) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(value);
  }

  return `$${value.toFixed(4)}`;
}


/* =========================================================
   ALLOCATION CALCULATOR
========================================================= */

function calculateAllocation() {
  const input = $("#bnbAmount");
  const message = $("#calculatorMessage");

  if (!input || !message) return;

  const amount = Number(input.value);

  const estimatedIO = $("#estimatedIO");
  const bonusIO = $("#bonusIO");
  const totalIO = $("#totalIO");

  if (
    !amount ||
    amount < MIN_BNB ||
    amount > MAX_BNB ||
    !ioPrice ||
    !bnbPrice
  ) {
    if (estimatedIO) {
      estimatedIO.textContent = "0 IO";
    }

    if (bonusIO) {
      bonusIO.textContent = "0 IO";
    }

    if (totalIO) {
      totalIO.textContent = "0 IO";
    }

    if (amount && amount < MIN_BNB) {
      message.textContent =
        "Minimum participation is 5 BNB.";
    } else if (amount > MAX_BNB) {
      message.textContent =
        "Maximum participation is 500 BNB.";
    } else if (!ioPrice || !bnbPrice) {
      message.textContent =
        "Waiting for current market prices.";
    } else {
      message.textContent =
        "Minimum 5 BNB · Maximum 500 BNB";
    }

    return;
  }

  message.textContent =
    "Estimate calculated from the current displayed market prices.";

  const baseIO =
    (amount * bnbPrice) / ioPrice;

  const bonusIOValue =
    baseIO * BONUS_RATE;

  const totalIOValue =
    baseIO + bonusIOValue;

  if (estimatedIO) {
    estimatedIO.textContent =
      `${formatNumber(baseIO)} IO`;
  }

  if (bonusIO) {
    bonusIO.textContent =
      `${formatNumber(bonusIOValue)} IO`;
  }

  if (totalIO) {
    totalIO.textContent =
      `${formatNumber(totalIOValue)} IO`;
  }
}


/* =========================================================
   NUMBER FORMAT
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
   ACTIVITY
========================================================= */

const activity = [
  {
    amount: "4,096.73",
    address: "0x5680...7f0c"
  },
  {
    amount: "3,214.66",
    address: "0x6a84...42fd"
  },
  {
    amount: "1,918.27",
    address: "0x34c1...0ea1"
  },
  {
    amount: "6,758.34",
    address: "0x95c3...ebdf"
  },
  {
    amount: "8,421.15",
    address: "0xb01b...4914"
  },
  {
    amount: "5,672.91",
    address: "0x709e...3635"
  },
  {
    amount: "2,480.40",
    address: "0x8d42...91af"
  },
  {
    amount: "7,318.52",
    address: "0xa721...4bc8"
  }
];


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

    </article>
  `;
}


function renderActivity() {
  const grid = $("#activityGrid");

  if (!grid) return;

  grid.innerHTML =
    activity
      .map(activityCard)
      .join("");
}


/* =========================================================
   COPY CONTRACT
========================================================= */

const copyButton =
  $("#copyContract");

if (copyButton) {
  copyButton.addEventListener(
    "click",
    async () => {
      try {
        await navigator.clipboard.writeText(
          CONTRACT_ADDRESS
        );

        copyButton.textContent =
          "Copied";

        setTimeout(() => {
          copyButton.textContent =
            "Copy";
        }, 1600);

      } catch {
        copyButton.textContent =
          "Copy failed";
      }
    }
  );
}


/* =========================================================
   WALLET MODAL
========================================================= */

const walletModal =
  $("#walletModal");

function openWallet() {
  if (walletModal) {
    walletModal.classList.remove(
      "hidden"
    );
  }
}

function closeWallet() {
  if (walletModal) {
    walletModal.classList.add(
      "hidden"
    );
  }
}

const connectWallet =
  $("#connectWallet");

const modalConnectWallet =
  $("#modalConnectWallet");

const closeWalletButton =
  $("#closeWallet");

if (connectWallet) {
  connectWallet.addEventListener(
    "click",
    openWallet
  );
}

if (modalConnectWallet) {
  modalConnectWallet.addEventListener(
    "click",
    () => {
      modalConnectWallet.textContent =
        "Wallet connection unavailable";
    }
  );
}

if (closeWalletButton) {
  closeWalletButton.addEventListener(
    "click",
    closeWallet
  );
}

if (walletModal) {
  walletModal.addEventListener(
    "click",
    (event) => {
      if (event.target === walletModal) {
        closeWallet();
      }
    }
  );
}


/* =========================================================
   THEME
========================================================= */

const themeButton =
  $("#themeToggle");

if (themeButton) {
  themeButton.addEventListener(
    "click",
    () => {
      document.body.classList.toggle(
        "light-mode"
      );

      themeButton.textContent =
        document.body.classList.contains(
          "light-mode"
        )
          ? "☾"
          : "☼";
    }
  );
}


/* =========================================================
   CALCULATOR EVENTS
========================================================= */

const bnbInput =
  $("#bnbAmount");

const calculateButton =
  $("#calculateBtn");

if (bnbInput) {
  bnbInput.addEventListener(
    "input",
    calculateAllocation
  );
}

if (calculateButton) {
  calculateButton.addEventListener(
    "click",
    calculateAllocation
  );
}


/* =========================================================
   INITIALIZE
========================================================= */

installLogos();
renderActivity();
loadPrices();

setInterval(
  loadPrices,
  60000
);
