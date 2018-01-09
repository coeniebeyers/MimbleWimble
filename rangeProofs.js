let fs = require('fs');
let bn = require('bn.js');
let DRBG = require('hmac-drbg');
let hash = require('hash.js');
let randomInt = require('random-int');
let EC = require('elliptic').ec;
let ec = new EC('secp256k1');
let ring = require('./ECCRingSignatures/ring.js')();

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
let bits = 64;

let startTime = new Date().getTime();

// This is the value that we want to hide. We need to prove that it is positive.
let v = 234523456;

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
//let check1 = new bn(0, 16);
//for (let i = 0; i < bits; i++) {
//  check1 = check1.add(bi[i]);
//}
//console.log();
//console.log("Blinding factor:", b);
//console.log("Sanity check1: Should equal blinding factor:", check1);
//console.log("Equal: ", b.eq(check1));
//console.log();

// Get the (unsigned) binary representation v_bin of v 
let v_bin = BNToNBitString(new bn(v, 10), bits);

// Get the 64 individual commitments
let Ci = [];
for (let i = 0; i < bits; i++) {
  Ci[i] = ec.keyFromPublic(G.mul(bi[i]).add(H.mul(getBitEquivalentValue(v_bin, i, bits))));
}

// sanity check: Sum over the 64 individual commitments, which should equal initial C
//let check2;
//for (let i = 0; i < bits; i++) {
//  if (i == 0) {
//    check2 = Ci[i].getPublic();
//  } else {
//    check2 = check2.add(Ci[i].getPublic());
//  }
//}
//console.log();
//console.log("Original commitment C:", C);
//console.log("Sanity check2: Should equal C:", check2);
//console.log("Equal: ", C.eq(check2));
//console.log();


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
  
// Get inverse of (unsigned) binary representation Nv_bin of v. We know the private keys of the elements in pubsA where Nv_bin=1, and in pubsB where v_bin=1.
let Nv_bin = BNToNBitString((new bn(v, 10)).notn(bits), bits);

// Generate ring signatures
let msg = "veritaserum";
let sigs = [];
let keyPairs = [];
for (let i = 0; i < bits; i++) {
  if (getBitAtPosition(v_bin, i, bits).eq(new bn(1, 10))) {
    keyPairs[i] = [
      pubsA[i],
      ec.keyFromPrivate(bi[i])
    ];
    sigs[i] = ring.Sign(keyPairs[i], msg, 1);
  //} else if (getBitAtPosition(Nv_bin, i, bits).eq(new bn(1, 10))) {
  } else {
    keyPairs[i] = [
      ec.keyFromPrivate(bi[i]),
      pubsB[i]
    ];
    sigs[i] = ring.Sign(keyPairs[i], msg, 0);
  }
}

let endTimeProof = new Date().getTime();

// Verify the ring signatures
let ringSigValid = true;
for (let i = 0; i < bits; i++) {
  ringSigValid = ringSigValid && ring.Verify(keyPairs[i], msg, sigs[i]);
}

// Check that the individual commitments sum to the total commitment.
// If this is false, the sender probably tried to commit to a negative v,
// and implies that the ring signature (if valid) is for a different v than they
// intended.
let check2;
for (let i = 0; i < bits; i++) {
  if (i == 0) {
    check2 = Ci[i].getPublic();
  } else {
    check2 = check2.add(Ci[i].getPublic());
  }
}
let commitmentValid = C.eq(check2);

// Final proof outcome
let totResult = ringSigValid && commitmentValid;
console.log("Committed to a positive value:", totResult);

let endTimeVer = new Date().getTime();
console.log("Proof generation time:", endTimeProof - startTime, "ms");
console.log("Proof verification time:", endTimeVer - endTimeProof, "ms");

// Write proof to file
let pubKeys = keyPairs.map(function(pairs) {
    let pubs = [
      pairs[0].getPublic(),
      pairs[1].getPublic()
    ];
    return pubs;
  });
let sigKeys = sigs.map(function(sig) {
    let keys = [
      sig[0].getPublic(),
      sig[1].getPublic()
    ];
    return keys;
  });

let proof = {
  publicKeys: pubKeys,
  msg: msg,
  sigs: sigKeys
}
fs.writeFileSync('./proof.json', JSON.stringify(proof, null, 2), 'utf-8');



/* *******************************************************************************************

HELPER FUNCTIONS

**********************************************************************************************/

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
