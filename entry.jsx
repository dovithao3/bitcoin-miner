import sha256 from 'js-sha256';

function hex2arr(hstr) {
  // Converts a hex string to array of bytes
  const arr = [];
  for (let i = 0; i < hstr.length; i += 2)
    arr.push(parseInt(hstr.substr(i, 2), 16));
    return arr;
}

function littleEndian(hexStr) {
  hexStr = hexStr.replace(/^(.(..)*)$/, "0$1"); // add a leading zero if needed
  const arr = hexStr.match(/../g);              // split number in groups of two
  arr.reverse();                                // reverse the groups
  return arr.join("");                          // join the groups back together
}

document.addEventListener('DOMContentLoaded', () => {
  window.littleEndian = littleEndian;
  const version = '00000001';
  const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const merkleRoot = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
  const timeStamp = Math.floor(Date.parse('2009-01-03 18:15:05 GMT')/1000).toString(16);
  const bits = (486604799).toString(16);
  const nonce = (2083236893).toString(16);
  const header = nonce + bits + timeStamp + merkleRoot + prevHash + version;

  const versionTx = '01000000';
  const countIn = '01';
  const prevoutHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const prevoutN = 'ffffffff';
  const scriptSig = '04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73';
  const scriptSigLength = (scriptSig.length / 2).toString(16);
  const sequence = 'ffffffff';

  const countOut = '01';
  const btc = 50;
  // convert to Satoshi's and ensure 8 bytes
  const value = littleEndian((btc * 1e8).toString(16).padStart(16, '0'));
  const spkPrefix = (65).toString(16);
  let scriptPubKey = '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f';
  const spkPostfix = 'ac';
  scriptPubKey = spkPrefix + scriptPubKey + spkPostfix;
  const scriptPubKeyLength = (scriptPubKey.length / 2).toString(16);
  const nLockTime = '00000000';

  const tx = versionTx + countIn + prevoutHash + prevoutN + scriptSigLength +
    scriptSig + sequence + countOut + value + scriptPubKeyLength + 
    scriptPubKey + nLockTime;

  console.log(littleEndian(sha256(hex2arr(sha256(hex2arr(littleEndian(header)))))));
  console.log(littleEndian(sha256(hex2arr(sha256(hex2arr(tx))))));

});