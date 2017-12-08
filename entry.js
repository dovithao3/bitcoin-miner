import sha256 from 'js-sha256';
import anime from 'animejs';
import * as Anime from './anime';
import * as Tutorial from './tutorial';

const MAX_STREAM_TX = 7; // number of transactions in stream panel
const MAX_TX = 8; // maximum number of transaction to include in block
const BLOCK_REWARD = 12.5; // current reward for mining block (in BTC)
const BTC_TO_USD = 14000; // exchange rate

// merkle root of merkle tree
let merkleRoot = '0000000000000000000000000000000000000000000000000000000000000000'; 

document.addEventListener('DOMContentLoaded', () => {
  const transactions = []; // elements are objects

  // start drawing transactions modal
  const drawMerkleButton = document.getElementById('calc-merkle');
  transactionStream(transactions, drawMerkleButton);
  calculatePaymentTx(transactions); // fills first transaction
  drawTxList(transactions);
  const startStreamButton = document.getElementById('start-stream');
  startStreamButton.addEventListener('click', () => 
    transactionStream(transactions, drawMerkleButton));
  
  tutorials();
  populateTutorialText();
  
  // mining page
  const versionEl = document.getElementById('version');
  const pevHashEl = document.getElementById('prevHash');
  const merkleRootEl = document.getElementById('merkleRoot');
  const timeStampEl = document.getElementById('timeStamp');
  const bitsHexEl = document.getElementById('bits');
  const nonceHexEl = document.getElementById('nonce');
  const targetEl = document.getElementById('target');
  const currentHashEl = document.getElementById('currentHash');
  const bestHashEl = document.getElementById('bestHash');
  const bestNonceEl = document.getElementById('bestNonce');

  const version = '00000001';
  $.ajax({url: 'https://blockchain.info/latestblock'})
    .then(console.log);
  const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  // const merkleRoot = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
  // const timeStamp = Math.floor(Date.parse('2009-01-03 18:15:05 GMT')/1000).toString(16);
  const datetime = (new Date(Date.now())).toUTCString();
  const timeStamp = Date.now().toString(16);
  const bits = 486604799; // decimal representation
  const bitsHex = bits.toString(16);
  const target = calculateTarget(bits);

  let nonce = 0, bestNonce, bestHash, miningOn = true; // actual nonce = 2083236893
  
  // start/pause buttons
  const restartMiningButton = document.getElementById('restart-mining');
  const pauseMiningButton = document.getElementById('pause-mining');
  restartMiningButton.addEventListener('click', () => requestAnimationFrame(mine));
  pauseMiningButton.addEventListener('click', () => pauseMining());
  
  // start one iteration
  render();
  hashHeader(false); 

  function mine() {
    if (miningOn) {
      nonce++;
      render();
      hashHeader();  
    }
  }

  function render() {
    versionEl.textContent = version;
    pevHashEl.textContent = prevHash;
    merkleRootEl.textContent = merkleRoot;
    timeStampEl.textContent = `${timeStamp} (${datetime})`;
    bitsHexEl.textContent = bitsHex;
    nonceHexEl.textContent = nonce;
    targetEl.textContent = target;
  }

  function hashHeader(loop = true) {
    const header = nonce.toString(16) + bitsHex + timeStamp + merkleRoot + prevHash + version;
    const headerHash = hash(header);
    currentHashEl.textContent = headerHash;

    if (!bestHash || headerHash < bestHash) {
      bestHash = headerHash;
      bestNonce = nonce;
      bestHashEl.textContent = bestHash;
      bestNonceEl.textContent = bestNonce;
    }

    if (headerHash > target && loop) {
      requestAnimationFrame(mine);
    } else {
      console.log('Block mined!');
    }
  }

  function pauseMining() {
    miningOn = !miningOn;
    if (miningOn) requestAnimationFrame(mine);
  }

});

function tutorials() {
  const tut1 = Tutorial.createBubble(1, 'left', '30px', '-190px', '90px', '145px',
    'Add 7 unconfirmed transactions to your block');
    document.querySelector('.transactions-container').appendChild(tut1);
  const tut2 = Tutorial.createBubble(2, 'right', '600px', '360px', '95px', '222px',
    `These 8 transaction hashes will be used to construct a Merkle Tree in the 
    next step`);
    document.querySelector('.tx-list-container').appendChild(tut2);
  // const tut3 = Tutorial.createBubble(3, 'right', '35px', '200px', '110px', '150px',
  //   'Your reward for successfully mining this block is 12.5 BTC plus transaction fees');
  //   document.querySelector('.tx-list-container').appendChild(tut2);
}

function populateTutorialText() {
  document.getElementById('qm-1-detail').textContent = 
    `Unconfirmed transactions are added to the blockchain by miners. Normally, 
    miners may add as many transactions as they wish as long as the total block
    size does not exceed 1MB. Miners are rewarded with a small transaction fee
    for each transaction they confirm. (1 BTC = 100 million Satoshi)`;

  document.getElementById('qm-2-detail').textContent = 
    `These are real-time unconfirmed transactions that people are currently 
    trying to add to the Bitcoin blockchain. Press "Start Live Transactions"
    if the feed does not automatically start`;

  document.getElementById('qm-3-detail').textContent = 
    `Your reward for successfully mining this block is 12.5 BTC plus transaction 
    fees. Notice that the resulting hash changes when your reward changes`;

  document.getElementById('qm-4-detail').textContent = 
    `A transaction hash is calculated by first concatenating values such as the
    transaction amount, the sender's signature, the recipient's signature, and
    number of recipients. Bitcoin hashes the resulting string twice using the 
    SHA-256 cryptographic hashing function. It is important to note that the
    resulting hashes represent digital signatures of the transaction details,
    since any change to the transaction details results in a completely
    different hash`;
}

function transactionStream(transactions, drawMerkleButton) {
  const btcs = new WebSocket('wss://ws.blockchain.info/inv');
  btcs.onopen = () => btcs.send(JSON.stringify({op: 'unconfirmed_sub'}));

  drawMerkleButton.addEventListener('click', () => drawMerkleTree(btcs, transactions));
  const stopStreamButton = document.getElementById('stop-stream');
  stopStreamButton.addEventListener('click', () => {
    btcs.send(JSON.stringify({op: 'unconfirmed_unsub'}));
  });

  let id = -1;
  btcs.onmessage = onmsg => {
    const tut1 = document.getElementById('tut-1');
    if (tut1) tut1.classList.remove('hidden');
    document.getElementById('qm-1-div').classList.remove('hidden');
    const res = JSON.parse(onmsg.data);

    const txHash = res.x.hash;
    const valueIn = res.x.inputs.reduce((sum, el) => sum + el.prev_out.value, 0);
    const valueOut = res.x.out.reduce((sum, el) => sum + el.value, 0);
    const fee = valueIn - valueOut; // in Satoshi's
    id = (id + 1) % MAX_STREAM_TX;
    
    const newTx = document.createElement('li');
    newTx.setAttribute('id', 'tx-' + id);
    
    let txInnerHtml = `<p>Hash: <a href='https://blockchain.info/tx/${txHash}'
      target='_blank'>${txHash}</a></p>
      <p>Transaction Amount: ${valueOut / 1e8} BTC</p>
      <p>Transaction Fee: ${fee} Satoshi</p>`;
  
    const addTxButton = document.createElement('button');
    addTxButton.textContent = 'Add to Block';
    addTxButton.addEventListener('click', () => addTxToBlock(
      { hash: txHash, fee }, newTx, transactions)
    );

    newTx.innerHTML = txInnerHtml;
    newTx.appendChild(addTxButton);

    const streamEl = document.getElementById('tx-stream');
    const tx = document.getElementById(`tx-${id}`);
    
    if (tx)
      streamEl.replaceChild(newTx, tx);
    else
      streamEl.appendChild(newTx);
  };
}

function addTxToBlock(txObj, txEl, transactions) {
  const tut1 = document.getElementById('tut-1');
  if (tut1) tut1.remove();

  if (transactions.length < MAX_TX) {
    transactions.push(txObj);
    txEl.remove();
    drawTxList(transactions);

    if (transactions.length === MAX_TX) {
      document.getElementById('calc-merkle').classList.remove('hidden');
      document.getElementById('tut-2').classList.remove('hidden');
    }
  }
}

function drawTxList(transactions) {
  const txListEl = document.getElementById('tx-list');
  calculatePaymentTx(transactions);
  txListEl.innerHTML = `<li>Transaction Hash: ${transactions[0].hash}
    <br>Your Reward: ${transactions[0].fee} BTC</li>`;
  transactions.slice(1).forEach(tx => {
    const txLi = document.createElement('li');
    txLi.innerHTML = `Transaction Hash: ${tx.hash}
    <br>Transaction Fee: ${tx.fee / 1e8} BTC (${tx.fee} Satoshi)`;
    txListEl.appendChild(txLi);
  });
}

function calculatePaymentTx(transactions) {
  const versionTx = '01000000';
  const countIn = '01';
  const prevoutHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const prevoutN = 'ffffffff';
  const scriptSig = '04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73';
  const scriptSigLength = (scriptSig.length / 2).toString(16);
  const sequence = 'ffffffff';

  const countOut = '01';
  const reward = BLOCK_REWARD * 1e8 + calculateTxFees(transactions); // in Satoshi's
  const value = littleEndian(reward.toString(16).padStart(16, '0')); // 8 bytes
  const spkPrefix = (65).toString(16);
  let scriptPubKey = '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f';
  const spkPostfix = 'ac';
  scriptPubKey = spkPrefix + scriptPubKey + spkPostfix;
  const scriptPubKeyLength = (scriptPubKey.length / 2).toString(16);
  const nLockTime = '00000000';

  const tx = versionTx + countIn + prevoutHash + prevoutN + scriptSigLength +
    scriptSig + sequence + countOut + value + scriptPubKeyLength + 
    scriptPubKey + nLockTime;

  const rewardBTC = reward / 1e8;
  const rewardBtcEl = document.getElementById('reward-btc');
  const rewardUsdEl = document.getElementById('reward-usd');
  rewardBtcEl.textContent = rewardBTC;
  rewardUsdEl.textContent = Math.round(rewardBTC * BTC_TO_USD * 100) / 100;

  const paymentHash = hash(littleEndian(tx));
  if (transactions[0])
    transactions[0] = { hash: paymentHash, fee: rewardBTC };
  else 
    transactions.push({ hash: paymentHash, fee: rewardBTC });
}

function calculateTxFees(transactions) {
  return transactions.slice(1).reduce((sum, el) => {
    if (el) return sum + el.fee;
    else return sum;
  }, 0);
}

const drawMerkleTree = (btcs, transactions) => {
  btcs.send(JSON.stringify({op: 'unconfirmed_unsub'})); // close web socket

  // get and reset each row's ul element
  const row1 = document.getElementById('merkle-row-1');
  row1.innerHTML = '';
  const row2 = document.getElementById('merkle-row-2');
  row2.innerHTML = '';
  const row3 = document.getElementById('merkle-row-3');
  row3.innerHTML = '';
  const row4 = document.getElementById('merkle-row-4');
  row4.innerHTML = '';

  const row2Hashes = [], row3Hashes = [], row4Hash = [];
  let merkleRootEl;
  

  // draw row 1
  
  // if odd number of hashes, last hash is repeated (unless only transaction)
  if (transactions.length % 2 > 0 && transactions.length > 1)
    transactions.push(transactions[transactions.length - 1]);
  var widthNum = 800 / transactions.length;
  var width = widthNum + 'px'; // width of each li element

  for (let i = 0; i < transactions.length; i++) {
    const txLi = document.createElement('li');
    txLi.textContent = transactions[i].hash;
    row1.appendChild(txLi);
    txLi.style.width = width;

    // calculate row 2 hashes
    if (transactions.length === 1) {
      merkleRootEl = txLi;
      merkleRoot = transactions[0].hash;
    } else if (i % 2 === 0) {
      row2Hashes.push(hash(transactions[i].hash + transactions[i + 1].hash));
      Anime.createTreeLines(widthNum, i, transactions.length, 1);
    }
  }
 
  // draw row 2
    if (row2Hashes.length > 0) {
      if (row2Hashes.length % 2 > 0 && row2Hashes.length > 1)
        row2Hashes.push(row2Hashes[row2Hashes.length - 1]);

      for (let i = 0; i < row2Hashes.length; i++) {
        const txLi = document.createElement('li');
        txLi.textContent = row2Hashes[i];
        row2.appendChild(txLi);
        txLi.style.width = width;

        // calculate row 3 hashes
        if (row2Hashes.length === 1) {
          merkleRootEl = txLi;
          merkleRoot = row2Hashes[0];
        } else if (i % 2 === 0) {
          row3Hashes.push(hash(row2Hashes[i] + row2Hashes[i + 1]));
          Anime.createTreeLines(widthNum, i, row2Hashes.length, 2);
        }
      }
    }

  // draw row 3
  if (row3Hashes.length > 0) {
    if (row3Hashes.length % 2 > 0 && row3Hashes.length > 1)
      row3Hashes.push(row3Hashes[row3Hashes.length - 1]);

    for (let i = 0; i < row3Hashes.length; i++) {
      const txLi = document.createElement('li');
      txLi.textContent = row3Hashes[i];
      row3.appendChild(txLi);
      txLi.style.width = width;

      // calculate row 4 hash
      if (row3Hashes.length === 1) {
        merkleRootEl = txLi;
        merkleRoot = row3Hashes[0];
      } else if (i % 2 === 0) {
        row4Hash.push(hash(row3Hashes[i] + row3Hashes[i + 1]));
        Anime.createTreeLines(widthNum, i, row3Hashes.length, 3);
      }
    }
  }

  // draw row 4
  if (row4Hash.length > 0) {
    const txLi = document.createElement('li');
    txLi.textContent = row4Hash[0];
    row4.appendChild(txLi);
    txLi.style.width = width;
    merkleRootEl = txLi;
    merkleRoot = row4Hash[0];
  }

  // remove transactions modal and reveal merkle modal
  const txModelEl = document.querySelector('.transactions-page');
  const merkleModalEl = document.getElementById('merkle-modal');
  txModelEl.classList.add('hidden');
  merkleModalEl.classList.remove('hidden');

  const startMiningButton = document.getElementById('start-mining');
  startMiningButton.addEventListener('click', () => hideMerkleModal(merkleModalEl));

  Anime.drawTreeLines();
};

const hideMerkleModal = merkleModelEl => {
  merkleModelEl.classList.add('hidden');
  document.querySelector('.mining-container').classList.remove('hidden');
  document.querySelector('.main-content').classList.remove('hidden');
};

function hash(hexString) {
  return littleEndian(sha256(hex2arr(sha256(hex2arr(littleEndian(hexString))))));
}

const hex2arr = hstr => {
  // Converts a hex string to array of bytes
  const arr = [];
  for (let i = 0; i < hstr.length; i += 2)
    arr.push(parseInt(hstr.substr(i, 2), 16));
  return arr;
};

const littleEndian = hexStr => {
  hexStr = hexStr.replace(/^(.(..)*)$/, "0$1"); // add a leading zero if needed
  const arr = hexStr.match(/../g);              // split number in groups of two
  arr.reverse();                                // reverse the groups
  return arr.join("");                          // join the groups back together
};

const littleEndian2 = hexStr => {
  const arr = hexStr.split('').reverse(); // reverse string
  for (let i = 0; i < arr.length; i += 2)
    [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
  return arr.join('');
};

const calculateTarget = bits => {
  const bitsHex = bits.toString(16);
  return bitsHex.slice(2).padEnd(parseInt(bitsHex.substr(0,2), 16) * 2, '0').padStart(64, '0');
};

const calculateZeros = bits => {
  let bitsHex = bits.toString(16);
  let numZeros = 64 - parseInt(bitsHex.substr(0,2), 16) * 2;
  bitsHex = bitsHex.slice(2);
  while (bitsHex[0] === '0') {
    numZeros++;
    bitsHex = bitsHex.slice(1);
  }
  return numZeros;
};

const concatHeader = (version, prevHash, merkleRoot, timeStamp, bitsHex, nonce) => {
  const nonceHex = nonce.toString(16);
  return nonceHex + bitsHex + timeStamp + merkleRoot + prevHash + version;
};