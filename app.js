const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS_RATE = 0.11;
const IO_PER_BNB = 1000;

const IO_CONTRACT =
  "0x6b60465D676d5FF50F615F2EB5F88baFA56a42b3";


// =====================================================
// ELEMENTS
// =====================================================

const bnbAmount = document.getElementById("bnbAmount");
const calculateBtn = document.getElementById("calculateBtn");
const allocationResult = document.getElementById("allocationResult");
const calculatorMessage = document.getElementById("calculatorMessage");

const estimatedIO = document.getElementById("estimatedIO");
const bonusIO = document.getElementById("bonusIO");
const totalIO = document.getElementById("totalIO");

const connectWallet = document.getElementById("connectWallet");
const walletModal = document.getElementById("walletModal");
const closeWallet = document.getElementById("closeWallet");
const modalConnectWallet = document.getElementById("modalConnectWallet");

const themeToggle = document.getElementById("themeToggle");

const ioPriceElement = document.getElementById("ioPrice");
const bnbPriceElement = document.getElementById("bnbPrice");

const transactionList =
  document.getElementById("transactionList");


// =====================================================
// HELPERS
// =====================================================

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function randomHex(length) {
  const chars = "0123456789abcdef";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function randomWallet() {
  return `0x${randomHex(40)}`;
}

function randomHash() {
  return `0x${randomHex(64)}`;
}


// =====================================================
// CALCULATOR
// =====================================================

if (calculateBtn) {

  calculateBtn.addEventListener("click", () => {

    const amount = Number(bnbAmount.value);

    calculatorMessage.textContent = "";
    allocationResult.classList.add("hidden");

    if (!amount || Number.isNaN(amount)) {
      calculatorMessage.textContent =
        "Enter a BNB amount.";
      return;
    }

    if (amount < MIN_BNB) {
      calculatorMessage.textContent =
        `Minimum participation is ${MIN_BNB} BNB.`;
      return;
    }

    if (amount > MAX_BNB) {
      calculatorMessage.textContent =
        `Maximum participation is ${MAX_BNB} BNB.`;
      return;
    }

    const estimated = amount * IO_PER_BNB;
    const bonus = estimated * BONUS_RATE;
    const total = estimated + bonus;

    estimatedIO.textContent =
      `${formatNumber(estimated)} IO`;

    bonusIO.textContent =
      `+${formatNumber(bonus)} IO`;

    totalIO.textContent =
      `${formatNumber(total)} IO`;

    allocationResult.classList.remove("hidden");
  });

}

if (bnbAmount) {

  bnbAmount.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      calculateBtn.click();
    }
  });

}


// =====================================================
// WALLET
// =====================================================

function openWalletModal() {
  if (walletModal) {
    walletModal.classList.remove("hidden");
  }
}

function closeWalletModal() {
  if (walletModal) {
    walletModal.classList.add("hidden");
  }
}

if (connectWallet) {

  connectWallet.addEventListener("click", async () => {

    if (!window.ethereum) {
      openWalletModal();
      return;
    }

    try {

      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts"
        });

      if (accounts.length) {
        connectWallet.textContent =
          shortenAddress(accounts[0]);
      }

    } catch (error) {
      console.error(error);
    }

  });

}

if (modalConnectWallet) {

  modalConnectWallet.addEventListener(
    "click",
    async () => {

      if (!window.ethereum) {
        modalConnectWallet.textContent =
          "Wallet not detected";
        return;
      }

      try {

        const accounts =
          await window.ethereum.request({
            method: "eth_requestAccounts"
          });

        if (accounts.length) {

          connectWallet.textContent =
            shortenAddress(accounts[0]);

          closeWalletModal();
        }

      } catch (error) {
        console.error(error);
      }

    }
  );

}

if (closeWallet) {
  closeWallet.addEventListener(
    "click",
    closeWalletModal
  );
}

if (walletModal) {

  walletModal.addEventListener(
    "click",
    (event) => {

      if (event.target === walletModal) {
        closeWalletModal();
      }

    }
  );

}


// =====================================================
// THEME
// =====================================================

let lightMode = false;

if (themeToggle) {

  themeToggle.addEventListener("click", () => {

    lightMode = !lightMode;

    document.documentElement.classList.toggle(
      "light-mode",
      lightMode
    );

    themeToggle.textContent =
      lightMode ? "☾" : "☼";

  });

}


// =====================================================
// LIVE MARKET PRICE
// =====================================================

async function getPriceFromBinance() {

  const response =
    await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=IOUSDT"
    );

  if (!response.ok) {
    throw new Error("Binance price unavailable");
  }

  const data = await response.json();

  return Number(data.price);
}


async function getPriceFromCoinGecko() {

  const response =
    await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=io-net&vs_currencies=usd"
    );

  if (!response.ok) {
    throw new Error("CoinGecko price unavailable");
  }

  const data = await response.json();

  if (!data["io-net"]?.usd) {
    throw new Error("IO price unavailable");
  }

  return Number(data["io-net"].usd);
}


async function getBNBPrice() {

  const response =
    await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT"
    );

  if (!response.ok) {
    throw new Error("BNB price unavailable");
  }

  const data = await response.json();

  return Number(data.price);
}


async function loadMarketPrices() {

  if (ioPriceElement) {
    ioPriceElement.textContent = "Loading...";
  }

  if (bnbPriceElement) {
    bnbPriceElement.textContent = "Loading...";
  }

  try {

    let ioPrice;

    try {
      ioPrice =
        await getPriceFromBinance();
    } catch {
      ioPrice =
        await getPriceFromCoinGecko();
    }

    const bnbPrice =
      await getBNBPrice();

    if (ioPriceElement) {

      ioPriceElement.textContent =
        `$${ioPrice.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
          }
        )}`;

    }

    if (bnbPriceElement) {

      bnbPriceElement.textContent =
        `$${bnbPrice.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        )}`;

    }

  } catch (error) {

    console.error(
      "Market price error:",
      error
    );

    if (ioPriceElement) {
      ioPriceElement.textContent = "Unavailable";
    }

    if (bnbPriceElement) {
      bnbPriceElement.textContent = "Unavailable";
    }

  }

}

loadMarketPrices();

setInterval(
  loadMarketPrices,
  60000
);


// =====================================================
// ABOUT / BUYBACK INFORMATION
// =====================================================

function addInformationSection() {

  if (document.getElementById("ioInformation")) {
    return;
  }

  const section =
    document.createElement("section");

  section.id = "ioInformation";
  section.className = "information-section";

  section.innerHTML = `

    <div class="information-grid">

      <article class="information-card">

        <span class="information-label">
          ABOUT IO
        </span>

        <h2>
          What is IO?
        </h2>

        <p>
          IO is the native token of io.net's decentralized
          GPU computing network. The network brings together
          distributed GPU resources for AI and machine-learning
          workloads.
        </p>

        <p>
          The IO token is used within the ecosystem for
          computing payments, provider staking and governance.
        </p>

        <a
          href="https://io.net/"
          target="_blank"
          rel="noopener noreferrer"
          class="information-link"
        >
          Learn about io.net ↗
        </a>

      </article>


      <article class="information-card">

        <span class="information-label">
          BUYBACK
        </span>

        <h2>
          Why a buyback?
        </h2>

        <p>
          A buyback is a market mechanism in which allocated
          funds are used to purchase tokens. The structure,
          timing and treatment of purchased tokens depend on
          the rules of the particular program.
        </p>

        <p>
          A well-designed program can provide a transparent
          framework for communicating participation, allocation
          and market activity to its community.
        </p>

      </article>


      <article class="information-card wide">

        <span class="information-label">
          IO ECOSYSTEM
        </span>

        <h2>
          Built around decentralized compute.
        </h2>

        <p>
          io.net is focused on making GPU computing more
          accessible for AI teams by aggregating distributed
          computing resources into an on-demand network.
        </p>

        <div class="information-points">

          <div>
            <strong>01</strong>
            <span>Distributed GPU infrastructure</span>
          </div>

          <div>
            <strong>02</strong>
            <span>AI and machine-learning workloads</span>
          </div>

          <div>
            <strong>03</strong>
            <span>IO token utility</span>
          </div>

        </div>

      </article>

    </div>

  `;

  const footer =
    document.querySelector("footer");

  if (footer) {
    footer.parentNode.insertBefore(
      section,
      footer
    );
  } else {
    document.body.appendChild(section);
  }

}

addInformationSection();


// =====================================================
// ACTIVITY FEED
// =====================================================

const simulatedActivity = [

  {
    amount: "2,486.40",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "7,315.82",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "1,948.27",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "5,672.91",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "3,214.66",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "8,421.15",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "4,096.73",
    wallet: randomWallet(),
    hash: randomHash()
  },

  {
    amount: "6,758.34",
    wallet: randomWallet(),
    hash: randomHash()
  }

];

let activityIndex = 0;


function createActivityCard(data) {

  const item =
    document.createElement("div");

  item.className =
    "activityItem activity-enter";

  item.innerHTML = `

    <span class="activity-arrow">
      ↗
    </span>

    <div class="activity-content">

      <b>
        ${data.amount} IO
      </b>

      <small>
        ${shortenAddress(data.wallet)}
      </small>

      <small class="activity-hash">
        ${shortenAddress(data.hash)}
      </small>

    </div>

  `;

  return item;
}


function addActivity() {

  if (!transactionList) {
    return;
  }

  const data =
    simulatedActivity[
      activityIndex %
      simulatedActivity.length
    ];

  activityIndex++;

  const card =
    createActivityCard(data);

  transactionList.prepend(card);

  setTimeout(() => {
    card.classList.add(
      "activity-visible"
    );
  }, 100);


  const cards =
    transactionList.querySelectorAll(
      ".activityItem"
    );

  if (cards.length > 6) {

    const oldest =
      cards[cards.length - 1];

    oldest.classList.add(
      "activity-fade"
    );

    setTimeout(() => {

      if (oldest.parentNode) {
        oldest.parentNode.removeChild(
          oldest
        );
      }

    }, 3500);

  }

}


if (transactionList) {

  transactionList.innerHTML = "";

  setTimeout(addActivity, 700);
  setTimeout(addActivity, 2200);
  setTimeout(addActivity, 3700);
  setTimeout(addActivity, 5200);

  setInterval(
    addActivity,
    5200
  );

}


// =====================================================
// WALLET ACCOUNT CHANGES
// =====================================================

if (window.ethereum) {

  window.ethereum.on(
    "accountsChanged",
    (accounts) => {

      if (
        !accounts ||
        accounts.length === 0
      ) {

        if (connectWallet) {
          connectWallet.textContent =
            "Connect Wallet";
        }

      } else {

        if (connectWallet) {
          connectWallet.textContent =
            shortenAddress(
              accounts[0]
            );
        }

      }

    }
  );

}
