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

let arg2 = process.argv[2]
let arg3 = process.argv[3]
let arg4 = process.argv[4]

// These blinding factors (r1,r2) are not how this should work in production!!
let r1 = new bn(Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(), 10)
let r2 = new bn(Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(), 10)
let r3 = r1.add(r2)
let i1 = new bn(arg2, 10)
let i2 = new bn(arg3, 10)
let v = new bn(arg4, 10)

let i1P = P.getPublic().mul(i1)
let i2P = P.getPublic().mul(i2)
let r1Q = Q.getPublic().mul(r1)
let r2Q = Q.getPublic().mul(r2)
let vP = P.getPublic().mul(v)
let r3Q = Q.getPublic().mul(r3)

let c1 = (i1P).add(r1Q)
let c2 = (i2P).add(r2Q)
let c3 = (vP).add(r3Q)

let c1c2 = c1.add(c2)
let equalX = c1c2.getX().cmp(c3.getX())
let equalY = c1c2.getX().cmp(c3.getX())

if(equalX === 0 && equalY === 0){
  console.log('c1 + c2 = c3')
} else {
  console.log('c1 + c2 =/= c3')
}

let currTime = new Date().getTime()
console.log('Elapsed time:', (currTime-startTime), 'ms')
