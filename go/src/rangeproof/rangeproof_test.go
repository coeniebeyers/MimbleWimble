package rangeproof

import (
  //"github.com/ethereum/go-ethereum/crypto/bn256"
  //"golang.org/x/crypto/bn256"
  //"github.com/cloudflare/bn256"
  "github.com/rynobey/bn256"
  "math/big"
  "testing"
)

func BenchmarkRangeProofVerification(bench *testing.B) {
  //Create generator points
  G := new(bn256.G1).ScalarBaseMult(new(big.Int).SetInt64(1))
  H, _ := GenRandomKeyPair()

  /*Generate the pub keys corresponding to every bit of the 
    value (to be used in every verification)
  */
  bitKeys := make([]*bn256.G1, 64)
  bitWeights := make([]*big.Int, 64)
  for i := 0; i < 64; i++ {
    bitWeights[i] = new(big.Int).Exp(new(big.Int).SetInt64(2),
      new(big.Int).SetInt64(int64(i)), bn256.Order)
    bitKeys[i] = new(bn256.G1).ScalarMult(H, bitWeights[i])
    bitKeys[i].Neg(bitKeys[i])
  }

  //Generate the secret data
  m := "veritaserum"
  b := CryptoRandBigInt(bn256.Order)
  v := new(big.Int).SetInt64(345234588576)
  //v := new(big.Int).Sub(bn256.Order, new(big.Int).SetInt64(12342435234))

  //Generate the range proof
  eArr, sArrArr, CArr, C := GenRangeProof(m, b, v, bitWeights, bitKeys, G, H)

  //Reset the benchamrking timer
  bench.ResetTimer()

  //Verify the range proof N times (for performance testing)
  for i := 0; i < bench.N; i++ {
    VerifyRangeProof(m, eArr, sArrArr, bitKeys, CArr, C, G, H)
  }
}
