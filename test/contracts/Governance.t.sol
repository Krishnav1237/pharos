// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../src/utils/Governance.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GovernanceTest is Test {
    Governance public governance;
    MockToken public govToken;

    address public admin = address(1);
    address public proposer = address(2);
    address public voter1 = address(3);
    address public voter2 = address(4);
    address public voter3 = address(5);
    address public nonHolder = address(6);

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    function setUp() public {
        // Deploy governance token
        govToken = new MockToken("Governance Token", "GOV");

        // Distribute tokens to voters
        govToken.mint(proposer, 100 * 1e18);
        govToken.mint(voter1, 200 * 1e18);
        govToken.mint(voter2, 150 * 1e18);
        govToken.mint(voter3, 50 * 1e18);

        // Deploy Governance contract
        vm.prank(admin);
        governance = new Governance(admin);

        // Add proposer and voters as members
        vm.startPrank(admin);
        governance.grantRole(governance.PROPOSER_ROLE(), proposer);
        governance.grantRole(governance.PROPOSER_ROLE(), voter1); // voter1 can also propose
        vm.stopPrank();
    }

    function testInitialState() public view {
        assertEq(governance.hasRole(governance.DEFAULT_ADMIN_ROLE(), admin), true);
        assertEq(governance.hasRole(governance.PROPOSER_ROLE(), proposer), true);
        assertEq(governance.hasRole(governance.PROPOSER_ROLE(), voter1), true);
        assertEq(governance.proposalCount(), 0);
        assertEq(governance.votingDuration(), 3 days);
        assertEq(governance.executionDelay(), 1 days);
    }

    function testCreateProposal() public {
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        assertEq(proposalId, 0);
        assertEq(governance.proposalCount(), 1);

        (
            uint256 id,
            string memory desc,
            address creator,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 startTime,
            uint256 endTime,
            bool executed,
            bool canceled
        ) = governance.proposals(proposalId);

        assertEq(id, proposalId);
        assertEq(desc, description);
        assertEq(creator, proposer);
        assertEq(endTime, startTime + governance.votingDuration());
        assertEq(executed, false);
        assertEq(votesFor, 0);
        assertEq(votesAgainst, 0);
        assertEq(canceled, false);
    }

    function test_RevertWhen_CreateProposalWithoutRole() public {
        string memory description = "Proposal #1: Do something important";

        vm.prank(nonHolder);
        vm.expectRevert();
        governance.createProposal(description);
    }

    function testCastVote() public {
        // Create proposal
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        // Cast votes
        vm.prank(voter1);
        governance.castVote(proposalId, true); // For

        vm.prank(voter2);
        governance.castVote(proposalId, false); // Against

        (
            ,
            ,
            ,
            uint256 votesFor,
            uint256 votesAgainst,
            ,
            ,
            ,

        ) = governance.proposals(proposalId);

        assertEq(votesFor, 1);
        assertEq(votesAgainst, 1);

        assertEq(governance.hasVoted(proposalId, voter1), true);
        assertEq(governance.hasVoted(proposalId, voter2), true);
        assertEq(governance.hasVoted(proposalId, voter3), false);
    }

    function test_RevertWhen_VoteAfterDeadline() public {
        // Create proposal
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        // Advance time past the voting period
        vm.warp(block.timestamp + governance.votingDuration() + 1);

        // Attempt to vote
        vm.prank(voter1);
        vm.expectRevert();
        governance.castVote(proposalId, true);
    }

    function testExecuteSuccessfulProposal() public {
        // Create proposal
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        // Cast votes to approve
        vm.prank(voter1);
        governance.castVote(proposalId, true); // For

        vm.prank(voter2);
        governance.castVote(proposalId, true); // For

        // End voting period and wait for execution delay
        vm.warp(block.timestamp + governance.votingDuration() + governance.executionDelay() + 1);

        // Execute the proposal
        vm.prank(admin);
        governance.executeProposal(proposalId);

        // Check proposal state
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            bool executed,

        ) = governance.proposals(proposalId);

        assertTrue(executed);
    }

    function test_RevertWhen_ExecuteBeforeDelay() public {
        // Create proposal
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        // Cast votes to approve
        vm.prank(voter1);
        governance.castVote(proposalId, true);

        vm.prank(voter2);
        governance.castVote(proposalId, true);

        // End voting period but don't wait for execution delay
        vm.warp(block.timestamp + governance.votingDuration() + 1);

        // Try to execute without waiting for delay
        vm.prank(admin);
        vm.expectRevert();
        governance.executeProposal(proposalId);
    }

    function test_RevertWhen_ExecuteFailedProposal() public {
        // Create proposal
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        // Cast against votes
        vm.prank(voter1);
        governance.castVote(proposalId, false);

        vm.prank(voter2);
        governance.castVote(proposalId, false);

        // End voting period and wait for execution delay
        vm.warp(block.timestamp + governance.votingDuration() + governance.executionDelay() + 1);

        // Try to execute rejected proposal
        vm.prank(admin);
        vm.expectRevert();
        governance.executeProposal(proposalId);
    }

    function testCancelProposal() public {
        // Create proposal
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        // Cancel the proposal
        vm.prank(admin);
        governance.cancelProposal(proposalId);

        // Check if proposal was canceled
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            bool canceled
        ) = governance.proposals(proposalId);

        assertTrue(canceled);
    }

    function test_RevertWhen_CancelProposalNonAdmin() public {
        // Create proposal
        string memory description = "Proposal #1: Do something important";

        vm.prank(proposer);
        uint256 proposalId = governance.createProposal(description);

        // Try to cancel by non-admin
        vm.prank(proposer);
        vm.expectRevert();
        governance.cancelProposal(proposalId);
    }

    function testUpdateVotingDuration() public {
        uint256 newVotingDuration = 5 days;

        vm.prank(admin);
        governance.updateVotingDuration(newVotingDuration);

        assertEq(governance.votingDuration(), newVotingDuration);
    }

    function test_RevertWhen_UpdateVotingDurationNonAdmin() public {
        vm.prank(proposer);
        vm.expectRevert();
        governance.updateVotingDuration(100);
    }

    function testUpdateExecutionDelay() public {
        uint256 newExecutionDelay = 2 days;

        vm.prank(admin);
        governance.updateExecutionDelay(newExecutionDelay);

        assertEq(governance.executionDelay(), newExecutionDelay);
    }

    function testMultipleProposals() public {
        // Create first proposal
        string memory description1 = "Proposal #1";

        // Create second proposal
        string memory description2 = "Proposal #2";

        vm.startPrank(proposer);
        uint256 proposalId1 = governance.createProposal(description1);
        uint256 proposalId2 = governance.createProposal(description2);
        vm.stopPrank();

        assertEq(proposalId1, 0);
        assertEq(proposalId2, 1);
        assertEq(governance.proposalCount(), 2);

        // Vote on first proposal
        vm.prank(voter1);
        governance.castVote(proposalId1, true);

        // Vote on second proposal
        vm.prank(voter2);
        governance.castVote(proposalId2, false);

        // Check vote counts
        (
            ,
            ,
            ,
            uint256 votesFor1,
            uint256 votesAgainst1,
            ,
            ,
            ,

        ) = governance.proposals(proposalId1);

        (
            ,
            ,
            ,
            uint256 votesFor2,
            uint256 votesAgainst2,
            ,
            ,
            ,

        ) = governance.proposals(proposalId2);

        assertEq(votesFor1, 1);
        assertEq(votesAgainst1, 0);
        assertEq(votesFor2, 0);
        assertEq(votesAgainst2, 1);
    }
}

// Helper contracts
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}