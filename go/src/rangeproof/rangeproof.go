package rangeproof

import (
  "fmt"
  //"github.com/ethereum/go-ethereum/crypto/sha3"
  //"github.com/ethereum/go-ethereum/crypto/bn256"
  //"golang.org/x/crypto/bn256"
  //"github.com/cloudflare/bn256"
  "github.com/rynobey/bn256"
  "math/big"
  //"crypto/rand"
  "sync"
)

func GenCommitments(b,
  v *big.Int,
  bitWeights []*big.Int,
  bitKeys []*bn256.G1,
  G,
  H *bn256.G1) ([]*big.Int,
  []*big.Int,
  []*bn256.G1,
  []*bn256.G1,
  *bn256.G1) {

  //Get binary representation of the value
  valueBits := fmt.Sprintf("%b", v)
  //Allocate memory
  bArr := make([]*big.Int, 64)
  vArr := make([]*big.Int, 64)
  CArr := make([]*bn256.G1, 64)
  CpArr := make([]*bn256.G1, 64)
  bTot := new(big.Int).SetInt64(0)
  //For each bit in the 64-bit binary representation of v
  for i := 0; i < 64; i++ {
    if (i == 63) {
      //Calculate the 64th blinding factor
      bTot = bTot.Mod(bTot, bn256.Order)
      bArr[i] = new(big.Int).Sub(new(big.Int).Add(b, bn256.Order), bTot)
    } else {
      //Create 63 of the 64 blinding factors randomly
      bArr[i] = CryptoRandBigInt(bn256.Order)
    }
    bTot = bTot.Add(bTot, bArr[i])
    //Get the weighted bit values for v
    bit := "0"
    if len(valueBits) > i {
      bit = string(valueBits[len(valueBits)-i-1])
    }
    vArr[i], _ = new(big.Int).SetString(bit, 10)
    vArr[i].Mul(vArr[i], bitWeights[i])
    //Generate the individual commitments
    if vArr[i].Cmp(new(big.Int).SetInt64(0)) == 0 {
      CArr[i] = new(bn256.G1).ScalarMult(G, bArr[i])
      CpArr[i] = new(bn256.G1).Add(CArr[i], bitKeys[i])
    } else {
      vH := new(bn256.G1).ScalarMult(H, vArr[i])
      bG := new(bn256.G1).ScalarMult(G, bArr[i])
      CArr[i] = vH.Add(vH, bG)
      CpArr[i] = new(bn256.G1).Set(bG)
    }
  }
  //Generate the total commitment to v
  bbGG := new(bn256.G1).ScalarMult(G, b)
  vvHH := new(bn256.G1).ScalarMult(H, v)
  C := bbGG.Add(bbGG, vvHH)
  return bArr, vArr, CArr, CpArr, C
}

func GenRingSignatures(m string,
  bArr,
  vArr []*big.Int,
  CArr,
  CpArr []*bn256.G1,
  G,
  H *bn256.G1) ([]*big.Int,
  [][]*big.Int) {

  //Allocate memory
  eArr := make([]*big.Int, 64)
  eArrArr := make([][]*big.Int, 64)
  sArrArr := make([][]*big.Int, 64)
  pubKeyArr := make([]*bn256.G1, 2)
  //For each bit
  for i := 0; i < 64; i++ {
    //Get the pub keys: CArr are the ones adding up to C
    //CpArr are the corresponding individual commitments for zero bit values
    pubKeyArr[0] = CArr[i]
    pubKeyArr[1] = CpArr[i]
    //Generate the ring signatures
    if vArr[i].Cmp(new(big.Int).SetInt64(0)) == 0 {
      eArrArr[i], sArrArr[i] = SignAOS(pubKeyArr, bArr[i], 0, m)
    } else {
      eArrArr[i], sArrArr[i] = SignAOS(pubKeyArr, bArr[i], 1, m)
    }
    eArr[i] = eArrArr[i][1]
  }
  return eArr, sArrArr
}

func GenRangeProof(m string,
  b,
  v *big.Int,
  bitWeights []*big.Int,
  bitKeys []*bn256.G1,
  G,
  H *bn256.G1) ([]*big.Int,
  [][]*big.Int,
  []*bn256.G1,
  *bn256.G1) {

  bArr, vArr, CArr, CpArr, C := GenCommitments(b, v, bitWeights, bitKeys, G, H)
  eArr, sArrArr := GenRingSignatures(m, bArr, vArr, CArr, CpArr, G, H)
  return eArr, sArrArr, CArr, C
}

/*Verification will be done on-chain. This is only here
  for testing/benchmarking purposes.
*/
func VerifyRangeProof(m string,
  eArr []*big.Int,
  sArrArr [][]*big.Int,
  bitKeys,
  CArr []*bn256.G1,
  C,
  G,
  H *bn256.G1) (bool) {

  isValid := true
  //Allocate memory
  CpArr := make([]*bn256.G1, 64)
  CTot := new(bn256.G1).Set(CArr[0])
  //Check1: The sum of all CArr should equal C
  for i := 1; i < 64; i++ {
    CTot = new(bn256.G1).Add(CTot, CArr[i])
  }
  if (CTot.String() == C.String()) {
    var wg sync.WaitGroup
    wg.Add(64)
    //Check2: All ring signatures need to be valid
    for i := 0; i < 64; i++ {
      go func(i int) {
        defer wg.Done()
        CpArr[i] = new(bn256.G1).Add(CArr[i], bitKeys[i])
        pubKeyArr := []*bn256.G1{CArr[i], CpArr[i]}
        isValid = isValid && VerifyAOS(pubKeyArr, eArr[i], sArrArr[i], m)
      }(i)
    }
    wg.Wait()
  } else {
    isValid = false
  }
  return isValid
}
