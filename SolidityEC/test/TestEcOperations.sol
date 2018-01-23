pragma solidity ^0.4.19;
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/EcOperations.sol";

contract TestEcOperations{
  function testEcMul() public {
    EcOperations ec = new EcOperations();
    uint256 original_x = 1;
    uint256 original_y = 2;
    uint256 scalar = 2;
    uint256[2] memory actual = ec.ecmul(original_x, original_y, scalar);
    uint256[2] memory expected;
    expected[0] = 1368015179489954701390400359078579693043519447331113978918064868415326638035; //x
    expected[1] = 9918110051302171585080402603319702774565515993150576347155970296011118125764; //y
    Assert.equal(expected[0], actual[0], "The point p.x should be multiplied by the scalar");
    Assert.equal(expected[1], actual[1], "The point p.y should be multiplied by the scalar");
  }
}
