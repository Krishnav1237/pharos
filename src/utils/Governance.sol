// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Governance
 * @dev Handles proposal creation, voting, and execution for Pharos Exchange
 */
contract Governance is AccessControl, ReentrancyGuard {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    struct Proposal {
        uint256 id;
        string description;
        address proposer;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
    }

    uint256 public proposalCount;
    uint256 public votingDuration = 3 days;
    uint256 public executionDelay = 1 days;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

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
    event ProposalCanceled(uint256 indexed proposalId);
    event VotingDurationUpdated(uint256 newDuration);
    event ExecutionDelayUpdated(uint256 newDelay);

    constructor(address initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(PROPOSER_ROLE, initialOwner);
        _grantRole(EXECUTOR_ROLE, initialOwner);
    }

    /**
     * @dev Create a new proposal
     * @param description Description of the proposal
     */
    function createProposal(string calldata description)
    external
    onlyRole(PROPOSER_ROLE)
    returns (uint256)
    {
        require(bytes(description).length > 0, "Governance: Description required");

        uint256 proposalId = proposalCount++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingDuration;

        proposals[proposalId] = Proposal({
            id: proposalId,
            description: description,
            proposer: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            startTime: startTime,
            endTime: endTime,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalId, msg.sender, description, startTime, endTime);
        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support True to vote for, false to vote against
     */
    function castVote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Governance: Voting not started");
        require(block.timestamp <= proposal.endTime, "Governance: Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Governance: Already voted");
        require(!proposal.canceled, "Governance: Proposal canceled");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    /**
     * @dev Execute a proposal after the voting period and delay
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime + executionDelay, "Governance: Execution delay not met");
        require(!proposal.executed, "Governance: Already executed");
        require(!proposal.canceled, "Governance: Proposal canceled");
        require(proposal.votesFor > proposal.votesAgainst, "Governance: Proposal not approved");

        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal
     * @param proposalId ID of the proposal
     */
    function cancelProposal(uint256 proposalId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Governance: Already executed");

        proposal.canceled = true;

        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Update the voting duration
     * @param newDuration New voting duration in seconds
     */
    function updateVotingDuration(uint256 newDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDuration > 0, "Governance: Invalid duration");
        votingDuration = newDuration;
        emit VotingDurationUpdated(newDuration);
    }

    /**
     * @dev Update the execution delay
     * @param newDelay New execution delay in seconds
     */
    function updateExecutionDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDelay > 0, "Governance: Invalid delay");
        executionDelay = newDelay;
        emit ExecutionDelayUpdated(newDelay);
    }
}