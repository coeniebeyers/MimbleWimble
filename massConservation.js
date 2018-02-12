var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
let bn = require('bn.js')

let startTime = new Date().getTime()

var P = ec.genKeyPair();

if(process.argv.length !== 5){
  console.log('Please pass in two input values (i1, i2) and one output value (v)')
  console.log('This program will check that i1 + i2 = v')
  process.exit(0)
}

let arg2 = process.argv[2]
let arg3 = process.argv[3]
let arg4 = process.argv[4]

let i1 = new bn(arg2, 10)
let i2 = new bn(arg3, 10)
let v = new bn(arg4, 10)

let c1 = P.getPublic().mul(i1)
let c2 = P.getPublic().mul(i2)
let c1c2 = c1.add(c2)
let c3 = P.getPublic().mul(v)

let equalX = c1c2.getX().cmp(c3.getX())
let equalY = c1c2.getY().cmp(c3.getY())

if(equalX === 0 && equalY === 0){
  console.log('c1 + c2 = c3')
} else {
  console.log('c1 + c2 =/= c3')
}

let currTime = new Date().getTime()
console.log('Elapsed time:', (currTime-startTime), 'ms')
