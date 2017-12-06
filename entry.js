import sha256 from 'js-sha256';
import anime from 'animejs';

const MAX_STREAM_TX = 10; // number of transactions in stream panel
const MAX_TX = 8; // maximum number of transaction to include in block
const BLOCK_REWARD = 12.5; // current reward for mining block (in BTC)

document.addEventListener('DOMContentLoaded', () => {
  const startMiningButton = document.getElementById('start-mining');
  const pauseMiningButton = document.getElementById('pause-mining');
  const startStreamButton = document.getElementById('start-stream');
  
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
  const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const merkleRoot = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
  const timeStamp = Math.floor(Date.parse('2009-01-03 18:15:05 GMT')/1000).toString(16);
  const bits = 486604799; // decimal representation
  const bitsHex = bits.toString(16);
  const target = calculateTarget(bits);

  let nonce = 0, bestNonce, bestHash, miningOn = true; // actual nonce = 2083236893
  const transactions = Array(MAX_TX - 1); // elements are HTML elements with data fields

  const a = Date.now();
  
  startStreamButton.addEventListener('click', () => transactionStream(transactions));
  startMiningButton.addEventListener('click', () => requestAnimationFrame(loop));
  pauseMiningButton.addEventListener('click', () => pauseMining());

  function loop() {
    anime({
      targets: versionEl,
      translateX: 250,
      duration: 1000,
      loop: 3,
    });

    if (miningOn) {
      nonce++;
      render();
      hashHeader();  
    }
  }

  function render() {
    versionEl.textContent = 'Version: ' + version;
    pevHashEl.textContent = 'Previous Hash: ' + prevHash;
    merkleRootEl.textContent = 'Merkle Root: ' + merkleRoot;
    timeStampEl.textContent = 'Time Stamp: ' + timeStamp;
    bitsHexEl.textContent = 'Bits (Difficulty): ' + bitsHex;
    nonceHexEl.textContent = 'Nonce: ' + nonce;
    targetEl.textContent = 'Target: ' + target;
    drawMerkleTree(transactions);
  }

  function hashHeader() {
    const header = nonce.toString(16) + bitsHex + timeStamp + merkleRoot + prevHash + version;
    const headerHash = hash(header);
    currentHashEl.textContent = 'Current Hash: ' + headerHash;

    if (!bestHash || headerHash < bestHash) {
      bestHash = headerHash;
      bestNonce = nonce;
      bestHashEl.textContent = 'Current Block Hash: ' + bestHash;
      bestNonceEl.textContent = 'Best Nonce: ' + bestNonce;
    }

    if (headerHash > target) {
      // setTimeout(() => requestAnimationFrame(loop), 100);
      requestAnimationFrame(loop);
    } else {
      console.log((Date.now() - a) / 1000);
    }
  }

  function pauseMining() {
    miningOn = !miningOn;
    if (miningOn) requestAnimationFrame(loop);
  }

});

function transactionStream(transactions) {
  let btcs = new WebSocket('wss://ws.blockchain.info/inv');
  btcs.onopen = () => btcs.send(JSON.stringify({op: 'unconfirmed_sub'}));

  const stopStreamButton = document.getElementById('stop-stream');
  stopStreamButton.addEventListener('click', () => {
    btcs.send(JSON.stringify({op: 'unconfirmed_unsub'}));
  });

  let id = -1;
  btcs.onmessage = onmsg => {
    const res = JSON.parse(onmsg.data);

    const txHash = res.x.hash;
    const valueIn = res.x.inputs.reduce((sum, el) => sum + el.prev_out.value, 0);
    const valueOut = res.x.out.reduce((sum, el) => sum + el.value, 0);
    const fee = valueIn - valueOut;
    id = (id + 1) % MAX_STREAM_TX;
    
    const newTx = document.createElement('li');
    newTx.setAttribute('id', 'tx-' + id);
    newTx.dataset.hash = txHash;
    newTx.dataset.valueIn = valueIn;
    newTx.dataset.fee = fee;
    // newTx.addEventListener('click', () => addTxToBlock(newTx, transactions));

    let txInnerHtml = `Hash: <a href='https://blockchain.info/tx/${txHash}' target='_blank'>
      ${txHash}</a>
      <br>Value In: ${valueIn}
      <br>Value Out: ${valueOut}
      <br>Fee: ${fee}`;

    newTx.innerHTML = txInnerHtml;

    const streamEl = document.getElementById('tx-stream');
    const tx = document.getElementById(`tx-${id}`);
    
    if (tx)
      streamEl.replaceChild(newTx, tx);
    else
      streamEl.appendChild(newTx);
  };
}

function addTxToBlock(txEl, transactions) {
  transactions[txEl.dataset.id] = txEl;
}

function drawMerkleTree(transactions) {
  const merkleTreeEl = document.getElementById('merkle-tree');
  merkleTreeEl.textContent = 'Payment Transaction Hash: ' 
    + calculatePaymentTx(transactions);
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
  const reward = BLOCK_REWARD * 1e8 + calculateTxFees(transactions); // convert to Satoshi's
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

  return hash(tx);
}

function calculateTxFees(transactions) {
  return transactions.reduce((sum, el) => {
    if (el) return sum + el.dataset.fee;
    else return sum;
  }, 0);
}

function hash(hexString) {
  return littleEndian(sha256(hex2arr(sha256(hex2arr(hexString)))));
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