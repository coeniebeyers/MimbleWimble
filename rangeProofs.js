let bn = require('bn.js');
let DRBG = require('hmac-drbg');
let hash = require('hash.js');
let randomInt = require('random-int');
let EC = require('elliptic').ec;
let ec = new EC('secp256k1');
let ring = require('./ECCRingSignatures/ring.js')('a59bb438a857d831f85ead86ff3e2d68b2ea8d9ea8b5fdd4ca7739a9f50be37d');

// Initialization of DRBG
let r = new DRBG({
  hash: hash.sha256,
  entropy: 'sasldfkjhfaleufhalkfjgvnslurhgglkauweyfgkasjdhfkayefgaksjhdfakjyhkaywebfkjasebfkjasdhbflafaksjehfbakljehfbgakjsehfbakjsdhbfakljebvlajwkebfalskjebfalksjdfblaksjdfhbalksjefbalkjj',
  nonce: '' + randomInt(10000000000000000000000000),
  pers: 'kajhbkfuyawegfkjajshbdefkajyhefkauywebbfkjashebfkajeshbfkajehbfak'
});

// Initialization
let G = ec.curve.g;
let toxicWaste = new bn(r.generate(32, 'hex'), 16);
let H = G.mul(toxicWaste);

// Number of bits
let bits = 2

// This is the value that we want to hide. We need to prove that it is positive.
let v = 2;

// This is the secret blinding factor used to hide the value that is committed to
let b = new bn(r.generate(32, 'hex'), 16);

// Create a Pederson commitment, which we want to prove is a commitment to a positive value
let C = G.mul(b).add(H.mul(v));

/* Break the commitment into 64 individual commitments, summing up to C (each indeividual commitment will be a commitment to either 0 or a number that is a power of 2). 
*/

// Get the individual blinding factors that sum up to b
let bi = [];
let total = new bn(0, 16);
for (let i = 0; i < bits; i++) {
  if (i == (bits-1)) {
    bi[i] = b.sub(total);
  } else {
    bi[i] = new bn(r.generate(24, 'hex'), 16); // if these are too large it breaks...
    total = total.add(bi[i]);
  }
}

// sanity check: Sum over the 64 individual blinding factors, which should equal initial b
let check1 = new bn(0, 16);
for (let i = 0; i < bits; i++) {
  check1 = check1.add(bi[i]);
}
console.log();
console.log("Blinding factor:", b);
console.log("Sanity check1: Should equal blinding factor:", check1);
console.log("Equal: ", b.eq(check1));
console.log();

// Get the (unsigned) binary representation v_bin of v 
let v_bin = BNToNBitString(new bn(v, 10), bits);

// Get the 64 individual commitments
let Ci = [];
for (let i = 0; i < bits; i++) {
  Ci[i] = ec.keyFromPublic(G.mul(bi[i]).add(H.mul(getBitEquivalentValue(v_bin, i, bits))));
}

// sanity check: Sum over the 64 individual commitments, which should equal initial C
let check2;
for (let i = 0; i < bits; i++) {
  if (i == 0) {
    check2 = Ci[i].getPublic();
  } else {
    check2 = check2.add(Ci[i].getPublic());
  }
}
console.log();
console.log("Original commitment C:", C);
console.log("Sanity check2: Should equal C:", check2);
console.log("Equal: ", C.eq(check2));
console.log();


/* Generate a ring signature for each individual commitment, using pubsA = [C0, C1, C2, ..., C63] for one of the two public keys, and pubsB = [C0 - 1H, C1 - 2H, C2 - 4H, C3 - 8H, ..., C63 - 9223372036854775808H] for the other.
*/

// Get the binary representation of the largest possible value for v (using unsigned 64 bits)
let base2 = new bn(2, 10);
let exp = new bn(bits, 10);
let v_max = base2.pow(exp).sub(new bn(1, 10));
let v_bin_max = BNToNBitString(v_max, bits);

// Generate the two lists of public keys, pubsA and pubsB
let pubsA = Ci;
let pubsB = [];
for (let i = 0; i < bits; i++) {
  let B = ec.keyFromPublic(H.mul(getBitEquivalentValue(v_bin_max, i, bits)));
  pubsB[i] = subtractBFromA(pubsA[i], B);
}
console.log(pubsA)
console.log(pubsB)
  
// Get inverse of (unsigned) binary representation Nv_bin of v. We know the private keys of the elements in pubsA where Nv_bin=1, and in pubsB where v_bin=1.
let Nv_bin = BNToNBitString((new bn(v, 10)).notn(bits), bits);

// Generate ring signatures
let msg = "veritaserum";

// wtf...
let keyPairs = [
  ec.keyFromPrivate(bi[0]),
  pubsA[0]
];

let pubKey = keyPairs[1].getPublic();
let sharedPrivKey = new bn('a59bb438a857d831f85ead86ff3e2d68b2ea8d9ea8b5fdd4ca7739a9f50be37d', 16);
//let sharedPrivKey = new bn(r.generate(32, 'hex'), 16);
let sharedKeyPair = ec.keyFromPrivate(sharedPrivKey);
let newSharedPrivKey = sharedKeyPair.getPrivate();
let val = ec.keyFromPublic(pubKey.mul(sharedPrivKey));
let valError = val.getPublic().add(val.getPublic());

//let x = ec.keyFromPrivate(new bn(r.generate(32, 'hex'), 16));
let x = ec.keyFromPrivate(new bn('0e68c8f68ec6a780bacc80c136135353693e2b97ba5aa20c3f85ecba3e948270', 16));
let xx = ec.keyFromPublic(x.getPublic());
console.log("CALLING f WITH PARAMS:");
console.log("PARAM1 = ", xx);
console.log("PARAM2 = ", keyPairs[1].getPublic());
console.log("PARAM3 = ", sharedKeyPair.getPrivate());
ring.F(xx, keyPairs[1].getPublic(), sharedKeyPair.getPrivate());

sig = ring.Sign(keyPairs, msg, 0);

//let sigs = [];
//for (let i = 0; i < bits; i++) {
//  if (getBitAtPosition(v_bin, i, bits).eq(new bn(1, 10))) {
//    let keyPairs = [
//      ec.keyFromPrivate(bi[i]),
//      pubsB[i]
//    ];
//    console.log(keyPairs[0].getPublic())
//    sigs[i] = ring.Sign(keyPairs, msg, 0);
//  } else if (getBitAtPosition(Nv_bin, i, bits).eq(new bn(1, 10))) {
//    let keyPairs = [
//      ec.keyFromPrivate(bi[i]),
//      pubsA[i]
//    ];
//    console.log(keyPairs[0].getPublic())
//    sigs[i] = ring.Sign(keyPairs, msg, 0);
//  }
//}
//
//// Verify the rign signatures
//let results = [];
//for (let i = 0; i < bits; i++) {
//  let pubKeys = [
//    pubsA[i],
//    pubsB[i]
//  ];
//  results[i] = ring.Verify(pubKeys, msg, sigs[i]);
//}
//console.log(results);

// Takes as input a keyPair (privKey may be null)
function negate(pos) {
  return ec.keyFromPublic(pos.getPublic().mul(new bn(-1, 10)));
}

// Takes as input two key pairs
function subtractBFromA(a, b) {
  b = negate(b);
  return addBToA(a, b);
}

// Takes as input two key pairs
function addBToA(a, b) {
  return ec.keyFromPublic(a.getPublic().add(b.getPublic()));
}

function BNToNBitString(bigNum, N) {
  let str = bigNum.toString(2, N);
  return str; 
}

// MSB position = N-1, LSB position = 0
function getBitAtPosition(bitString, pos, N) {
  return (new bn(bitString.charAt(N-1-pos), 10));
}

// MSB position = N-1, LSB position = 0
function getBitEquivalentValue(bitString, pos, N) {
  let bit = getBitAtPosition(bitString, pos, N);
  let base2 = new bn(2, 10);
  let exp = new bn(pos, 10);
  let value = bit.mul(base2.pow(exp));
  return value;
}
