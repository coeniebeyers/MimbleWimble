pragma solidity ^0.4.19;

contract EcOperations{
  function ecadd(uint256 ax, uint256 ay, uint256 bx, uint256 by) public payable returns(uint256[2] p) {
    uint256[4] memory input;
    input[0] = ax;
    input[1] = ay;
    input[2] = bx;
    input[3] = by;
    assembly {
      if iszero(call(not(0), 0x06, 0, input, 0x80, p, 0x40)) {
        revert(0, 0)
      }
    }
  } 
  function ecmul(uint256 x, uint256 y, uint256 scalar) public payable returns(uint256[2] p) {
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
