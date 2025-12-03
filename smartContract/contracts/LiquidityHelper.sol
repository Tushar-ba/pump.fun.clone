// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Pair.sol";

/**
 * @title LiquidityHelper
 * @dev Helper contract to interact with DEX for adding liquidity
 */
contract LiquidityHelper is Ownable {
    using SafeERC20 for IERC20;

    IUniswapV2Router02 public router;
    IUniswapV2Factory public factory;

    event LiquidityAdded(
        address indexed token,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 liquidity,
        address indexed provider
    );

    event LiquidityAddedTokenPair(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity,
        address indexed provider
    );

    event PairCreated(
        address indexed tokenA,
        address indexed tokenB,
        address pair
    );

    /**
     * @dev Constructor
     * @param routerAddress_ Address of the DEX router (Uniswap V2 compatible)
     */
    constructor(address routerAddress_) Ownable(msg.sender) {
        require(routerAddress_ != address(0), "Invalid router address");
        router = IUniswapV2Router02(routerAddress_);
        factory = IUniswapV2Factory(router.factory());
    }

    /**
     * @dev Get or create a pair for token and ETH
     * @param token Address of the token
     * @return pair Address of the pair
     */
    function getOrCreatePairETH(address token) external returns (address pair) {
        address weth = router.WETH();
        pair = factory.getPair(token, weth);
        
        if (pair == address(0)) {
            pair = factory.createPair(token, weth);
            emit PairCreated(token, weth, pair);
        }
        
        return pair;
    }

    /**
     * @dev Get or create a pair for two tokens
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @return pair Address of the pair
     */
    function getOrCreatePair(address tokenA, address tokenB) external returns (address pair) {
        pair = factory.getPair(tokenA, tokenB);
        
        if (pair == address(0)) {
            pair = factory.createPair(tokenA, tokenB);
            emit PairCreated(tokenA, tokenB, pair);
        }
        
        return pair;
    }

    /**
     * @dev Check if a pair exists for token and ETH
     * @param token Address of the token
     * @return exists Whether the pair exists
     * @return pair Address of the pair (zero address if doesn't exist)
     */
    function pairExistsETH(address token) external view returns (bool exists, address pair) {
        address weth = router.WETH();
        pair = factory.getPair(token, weth);
        exists = pair != address(0);
    }

    /**
     * @dev Check if a pair exists for two tokens
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @return exists Whether the pair exists
     * @return pair Address of the pair (zero address if doesn't exist)
     */
    function pairExists(address tokenA, address tokenB) external view returns (bool exists, address pair) {
        pair = factory.getPair(tokenA, tokenB);
        exists = pair != address(0);
    }

    /**
     * @dev Get reserves of a token-ETH pair
     * @param token Address of the token
     * @return tokenReserve Token reserve
     * @return ethReserve ETH reserve
     */
    function getReservesETH(address token) external view returns (uint256 tokenReserve, uint256 ethReserve) {
        address weth = router.WETH();
        address pair = factory.getPair(token, weth);
        
        if (pair == address(0)) {
            return (0, 0);
        }
        
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(pair).getReserves();
        
        // Determine which reserve is which
        address token0 = IUniswapV2Pair(pair).token0();
        if (token0 == token) {
            tokenReserve = reserve0;
            ethReserve = reserve1;
        } else {
            tokenReserve = reserve1;
            ethReserve = reserve0;
        }
    }

    /**
     * @dev Get reserves of a token pair
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @return reserveA Reserve of token A
     * @return reserveB Reserve of token B
     */
    function getReserves(address tokenA, address tokenB) external view returns (uint256 reserveA, uint256 reserveB) {
        address pair = factory.getPair(tokenA, tokenB);
        
        if (pair == address(0)) {
            return (0, 0);
        }
        
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(pair).getReserves();
        
        // Determine which reserve is which
        address token0 = IUniswapV2Pair(pair).token0();
        if (token0 == tokenA) {
            reserveA = reserve0;
            reserveB = reserve1;
        } else {
            reserveA = reserve1;
            reserveB = reserve0;
        }
    }

    /**
     * @dev Calculate optimal amount B given amount A and reserves
     * @param amountA Amount of token A
     * @param reserveA Reserve of token A
     * @param reserveB Reserve of token B
     * @return amountB Optimal amount of token B
     */
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB) {
        require(amountA > 0, "Insufficient amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        amountB = (amountA * reserveB) / reserveA;
    }

    /**
     * @dev Add liquidity for token-ETH pair
     * @param token Address of the token
     * @param tokenAmount Amount of tokens to add
     * @param tokenAmountMin Minimum token amount (slippage protection)
     * @param ethAmountMin Minimum ETH amount (slippage protection)
     * @param to Address to receive LP tokens
     * @param deadline Transaction deadline
     */
    function addLiquidityETH(
        address token,
        uint256 tokenAmount,
        uint256 tokenAmountMin,
        uint256 ethAmountMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        // Transfer tokens from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Approve router to spend tokens
        IERC20(token).approve(address(router), tokenAmount);
        
        // Add liquidity
        (amountToken, amountETH, liquidity) = router.addLiquidityETH{value: msg.value}(
            token,
            tokenAmount,
            tokenAmountMin,
            ethAmountMin,
            to,
            deadline
        );
        
        // Refund excess tokens
        uint256 remainingTokens = tokenAmount - amountToken;
        if (remainingTokens > 0) {
            IERC20(token).safeTransfer(msg.sender, remainingTokens);
        }
        
        // Refund excess ETH
        uint256 remainingETH = msg.value - amountETH;
        if (remainingETH > 0) {
            (bool success,) = msg.sender.call{value: remainingETH}("");
            require(success, "ETH refund failed");
        }
        
        emit LiquidityAdded(token, amountToken, amountETH, liquidity, msg.sender);
    }

    /**
     * @dev Add liquidity for token-token pair
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @param amountADesired Desired amount of token A
     * @param amountBDesired Desired amount of token B
     * @param amountAMin Minimum amount of token A
     * @param amountBMin Minimum amount of token B
     * @param to Address to receive LP tokens
     * @param deadline Transaction deadline
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // Transfer tokens from sender
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBDesired);
        
        // Approve router to spend tokens
        IERC20(tokenA).approve(address(router), amountADesired);
        IERC20(tokenB).approve(address(router), amountBDesired);
        
        // Add liquidity
        (amountA, amountB, liquidity) = router.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            to,
            deadline
        );
        
        // Refund excess tokens
        uint256 remainingA = amountADesired - amountA;
        uint256 remainingB = amountBDesired - amountB;
        
        if (remainingA > 0) {
            IERC20(tokenA).safeTransfer(msg.sender, remainingA);
        }
        if (remainingB > 0) {
            IERC20(tokenB).safeTransfer(msg.sender, remainingB);
        }
        
        emit LiquidityAddedTokenPair(tokenA, tokenB, amountA, amountB, liquidity, msg.sender);
    }

    /**
     * @dev Update router address
     * @param newRouter Address of new router
     */
    function setRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router address");
        router = IUniswapV2Router02(newRouter);
        factory = IUniswapV2Factory(router.factory());
    }

    /**
     * @dev Rescue stuck tokens
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Rescue stuck ETH
     */
    function rescueETH() external onlyOwner {
        (bool success,) = owner().call{value: address(this).balance}("");
        require(success, "ETH rescue failed");
    }

    receive() external payable {}
}
