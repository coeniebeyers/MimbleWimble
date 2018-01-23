pragma solidity ^0.4.19;

contract EcMul{
 function ecmul(uint256 x, uint256 y, uint256 scalar) public payable returns(uint256[2] p) {
    // With a public key (x, y), this computes p = scalar * (x, y).
    uint256[3] memory input;
    input[0] = x;
    input[1] = y;
    input[2] = scalar;
    assembly {
      // call ecmul precompile
      if iszero(call(not(0), 0x07, 0, input, 0x60, p, 0x40)) {
        revert(0, 0)
      }
    }
  } 
}
