package util

import (
  "fmt"
  "github.com/ethereum/go-ethereum/crypto/sha3"
  "github.com/ethereum/go-ethereum/crypto/bn256"
  //"golang.org/x/crypto/bn256"
  "math/big"
  "crypto/rand"
  //"sync"
)

func GenCommitments(sqrtb, sqrtv, kb, kv *big.Int, G, H *bn256.G1) (*bn256.G1, *bn256.G1, *bn256.G1) {
  b := SquareModBigInt(sqrtb, bn256.Order)
  v := SquareModBigInt(sqrtv, bn256.Order)
  fmt.Printf("Commited to value: v = %s\n", v)
  bG := new(bn256.G1).ScalarMult(G, b)
  vH := new(bn256.G1).ScalarMult(H, v)
  C := bG.Add(bG, vH)
  kbsqrtbG := new(bn256.G1).ScalarMult(G, MulModBigInt(kb, sqrtb, bn256.Order))
  kvsqrtvH := new(bn256.G1).ScalarMult(H, MulModBigInt(kv, sqrtv, bn256.Order))
  Cp := kbsqrtbG.Add(kbsqrtbG, kvsqrtvH)
  kbsqrG := new(bn256.G1).ScalarMult(G, SquareModBigInt(kb, bn256.Order))
  kvsqrH := new(bn256.G1).ScalarMult(H, SquareModBigInt(kv, bn256.Order))
  K := kbsqrG.Add(kbsqrG, kvsqrH)
  return K, Cp, C
}

func GenSignature(m string, sqrtb, sqrtv, kb, kv *big.Int, G, H *bn256.G1) (*big.Int, *big.Int, *big.Int, *bn256.G1, *bn256.G1, *bn256.G1) {
  K, Cp, C := GenCommitments(sqrtb, sqrtv, kb, kv, G, H)
  e := Chameleon(m, K.String())
  sb := AddModBigInt(kb, MulModBigInt(e, sqrtb, bn256.Order), bn256.Order)
  sv := AddModBigInt(kv, MulModBigInt(e, sqrtv, bn256.Order), bn256.Order)
  return sb, sv, e, K, Cp, C
}

func VerifySignature(m string, sb, sv, e *big.Int, K, Cp, C, G, H *bn256.G1) bool {
  sbsqrG := new(bn256.G1).ScalarMult(G, SquareModBigInt(sb, bn256.Order))
  svsqrH := new(bn256.G1).ScalarMult(H, SquareModBigInt(sv, bn256.Order))
  deCp := new(bn256.G1).ScalarMult(Cp, MulModBigInt(e, new(big.Int).SetInt64(2), bn256.Order))
  esqrC := new(bn256.G1).ScalarMult(C, SquareModBigInt(e, bn256.Order))
  m2 := sbsqrG.Add(sbsqrG, svsqrH)
  m2 = m2.Add(m2, deCp.Neg(deCp))
  m2 = m2.Add(m2, esqrC.Neg(esqrC))
  et := Chameleon(m, m2.String())
  return (e.Cmp(et) == 0)
}

func SquareModBigInt(a *big.Int, n *big.Int) *big.Int {
  temp := new(big.Int).Exp(a, new(big.Int).SetInt64(2), n)
  return temp
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

func Chameleon(m1 string, m2 string) *big.Int {
  output := keccak256(fmt.Sprintf("%s%s", m1, m2))
  return output
}

func keccak256(s string) *big.Int {
  h := sha3.NewKeccak256()
  h.Reset()
  h.Write([]byte(s))
  out, _ := new(big.Int).SetString(fmt.Sprintf("%x", h.Sum(nil)), 16)
  return out
}
