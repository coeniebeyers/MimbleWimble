let EC = require('elliptic').ec
let ec = new EC('secp256k1')
let bn = require('bn.js')

let startTime = new Date().getTime()

let P = ec.genKeyPair()
let Q = ec.genKeyPair()

if(process.argv.length !== 5){
  console.log('Please pass in two input values (i1, i2) and one output value (v)')
  console.log('This program will check that i1 + i2 = v')
  process.exit(0)
}

// Private
let arg2 = process.argv[2]
let arg3 = process.argv[3]
let arg4 = process.argv[4]

// These blinding factors (b1,b2) are not how this should work in production?!
let b1 = ec.genKeyPair().getPrivate()
let b2 = ec.genKeyPair().getPrivate()
let b3 = b1.add(b2)
let v1 = new bn(arg2, 10)
let v2 = new bn(arg3, 10)
let v3 = new bn(arg4, 10)

let v1P = P.getPublic().mul(v1)
let v2P = P.getPublic().mul(v2)
let v3P = P.getPublic().mul(v3)

let b1Q = Q.getPublic().mul(b1)
let b2Q = Q.getPublic().mul(b2)
let b3Q = Q.getPublic().mul(b3)

// Public
let c1 = (v1P).add(b1Q)
let c2 = (v2P).add(b2Q)
let c3 = (v3P).add(b3Q)

// Verification using only public information
let c1c2 = c1.add(c2)
let equalX = c1c2.getX().cmp(c3.getX())
let equalY = c1c2.getY().cmp(c3.getY())

if(equalX === 0 && equalY === 0){
  console.log('c1 + c2 = c3')
} else {
  console.log('c1 + c2 =/= c3')
}

let currTime = new Date().getTime()
console.log('Elapsed time:', (currTime-startTime), 'ms')
