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