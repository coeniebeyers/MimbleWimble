var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
let bn = require('bn.js')

var P = ec.genKeyPair();

let i1 = new bn('10', 10)
let i2 = new bn('12', 10)
let v = new bn('22', 10)

let c1 = P.getPublic().mul(i1)
let c2 = P.getPublic().mul(i2)
let c1c2 = c1.add(c2)
let c3 = P.getPublic().mul(v)

let equalX = c1c2.getX().cmp(c3.getX())
let equalY = c1c2.getX().cmp(c3.getX())

if(equalX === 0 && equalY === 0){
  console.log('c1 + c2 = c3')
} else {
  console.log('c1 + c2 =/= c3')
}
