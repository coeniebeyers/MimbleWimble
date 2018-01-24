package util

import (
  "fmt"
  "github.com/ethereum/go-ethereum/crypto/sha3"
  //"github.com/ethereum/go-ethereum/crypto/bn256"
  "golang.org/x/crypto/bn256"
  "math/big"
  "crypto/rand"
  "sync"
)

func SignAOS(allPublicks []*bn256.G1, mySecretk *big.Int, myPublickIdx int, m string) ([]*big.Int, []*big.Int) {
  numKeys := len(allPublicks)
  k := CryptoRandBigInt()
  var idx int
  var ei *big.Int
  e := make([]*big.Int, numKeys)
  s := make([]*big.Int, numKeys)
  for i := 0; i < numKeys; i++ {
    idx = (i + myPublickIdx) % numKeys
    if idx == myPublickIdx {
      kG := new(bn256.G1).ScalarBaseMult(k)
      e[idx] = Chameleon(m, kG)
    } else {
      ei = e[(idx+numKeys-1) % numKeys]
      s[idx] = CryptoRandBigInt()
      e[idx] = ChameleonP(m, ei, s[idx], allPublicks[idx])
    }
  }
  idx = myPublickIdx
  s[idx] = AddModBigInt(k, MulModBigInt(mySecretk, e[(idx+numKeys-1) % numKeys], bn256.Order), bn256.Order)
  return e, s
}

func VerifyAOS(allPublicks []*bn256.G1, e0 *big.Int, sArr []*big.Int, m string) bool {
  numKeys := len(allPublicks)
  es := e0
  for i := 0; i < numKeys; i++ {
    es = ChameleonP(m, es, sArr[i], allPublicks[i])
  }
  return (es.Cmp(e0) == 0)
}

func VerifyAOSParr(allPublicks []*bn256.G1, eArr []*big.Int, sArr []*big.Int, m string) bool {
  numKeys := len(allPublicks)
  e0 := eArr[(numKeys-1)]
  es := e0
  var sGArr = make([]*bn256.G1, numKeys)
  var ePArr = make([]*bn256.G1, numKeys)

  var wg sync.WaitGroup
  wg.Add(numKeys)

  for j := 0; j < numKeys; j++ {
    go func(j int) {
      defer wg.Done()
      sGArr[j] = new(bn256.G1).ScalarBaseMult(sArr[j])
      ePArr[j] = new(bn256.G1).ScalarMult(allPublicks[j], eArr[(j+numKeys-1)%numKeys])
      es = ChameleonPParr(m, sGArr[j], ePArr[j])
    }(j)
  }
  wg.Wait()

  return (es.Cmp(e0) == 0)
}

func SubModBigInt(a *big.Int, b *big.Int, n *big.Int) *big.Int {
  temp := new(big.Int).Sub(a, b)
  return temp.Mod(temp, n)
}

func AddModBigInt(a *big.Int, b *big.Int, n *big.Int) *big.Int {
  temp := new(big.Int).Add(a, b)
  return temp.Mod(temp, n)
}

func MulModBigInt(a *big.Int, b *big.Int, n *big.Int) *big.Int {
  temp := new(big.Int).Mul(a, b)
  return temp.Mod(temp, n)
}

func GenRandomKeyPair() (*bn256.G1, *big.Int) {
  sk := CryptoRandBigInt()
  pk := new(bn256.G1).ScalarBaseMult(sk)
  return pk, sk
}

func CryptoRandBigInt() *big.Int {
  i, _ := rand.Int(rand.Reader, bn256.Order)
  return i
}

func ChameleonP(m string, e *big.Int, s *big.Int, P *bn256.G1) *big.Int {
  sG := new(bn256.G1).ScalarBaseMult(s)
  eP := new(bn256.G1).ScalarMult(P, e)
  kG := sG.Add(sG, eP.Neg(eP))
  c := fmt.Sprintf("%s%s", m, kG)
  h := keccak256(c)
  return h
}

func ChameleonPParr(m string, sG *bn256.G1, eP *bn256.G1) *big.Int {
  kG := sG.Add(sG, eP.Neg(eP))
  c := fmt.Sprintf("%s%s", m, kG)
  h := keccak256(c)
  return h
}

func Chameleon(m string, kG *bn256.G1) *big.Int {
  c := fmt.Sprintf("%s%s", m, kG)
  h := keccak256(c)
  return h
}

func keccak256(s string) *big.Int {
  h := sha3.NewKeccak256()
  h.Reset()
  h.Write([]byte(s))
  out, _ := new(big.Int).SetString(fmt.Sprintf("%x", h.Sum(nil)), 16)
  return out
}
