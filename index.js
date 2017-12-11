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

/*
let Ex = A.getPublic().getX()
//let E = {x: Ex.toString('hex'), y: (A.getPublic().getY()).toString('hex')}
let E = {x: (A.getPublic().getX()).toString('hex'), y: (A.getPublic().getY()).toString('hex')}

console.log('E:', E)
let key = ec.keyFromPublic(E, 'hex')
console.log('key:', key)
console.log('A:', A)

let msgHash = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
let sig = key.sign(msgHash)
let derSig = sig.toDER()

console.log(key.verify(msgHash, derSig))
*/

/*
var AB = A.getPublic().mul(B.getPrivate())
var BC = B.getPublic().mul(C.getPrivate())
var CA = C.getPublic().mul(A.getPrivate())

var ABC = AB.mul(C.getPrivate())
var BCA = BC.mul(A.getPrivate())
var CAB = CA.mul(B.getPrivate())

console.log(ABC.getX().toString(16))
console.log(BCA.getX().toString(16))
console.log(CAB.getX().toString(16))
*/
