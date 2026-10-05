// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Testnet authority registry. Only public institution metadata and
/// peppered identifier hashes belong here; never private keys or raw PII.
contract TrustRegistry {
    address public immutable rootAuthority;
    struct Issuer {
        string name;
        string category;
        bool active;
    }
    mapping(address => Issuer) private issuers;
    mapping(bytes32 => uint256) public reportCount;
    mapping(bytes32 => mapping(address => bool)) public hasReported;

    // App relayer reports have a separate counter from arbitrary public-wallet reports.
    // Keys commit to opaque report UUIDs; no user ID or raw identifier is exposed.
    mapping(bytes32 => uint256) public relayedReportCount;
    mapping(bytes32 => bytes32) public reportAnchorHash;
    mapping(bytes32 => uint256) public reportAnchorBlock;
    event RelayedScamReported(bytes32 indexed idHash, bytes32 indexed reportKey, uint256 count);
    function anchorReport(bytes32 idHash, bytes32 reportKey) external onlyOwner {
        if (idHash == bytes32(0) || reportKey == bytes32(0)) revert InvalidHash();
        if (reportAnchorHash[reportKey] != bytes32(0)) {
            if (reportAnchorHash[reportKey] != idHash) revert DuplicateReport();
            return; // Retry of the identical commitment is a no-op.
        }
        reportAnchorHash[reportKey] = idHash;
        reportAnchorBlock[reportKey] = block.number;
        ++reportCount[idHash];
        emit RelayedScamReported(idHash, reportKey, ++relayedReportCount[idHash]);
    }

    mapping(bytes32 => uint256) public evidenceTimestamp;
    mapping(bytes32 => uint256) public evidenceBlock;
    error EvidenceAlreadyAnchored();
    event EvidenceAnchored(bytes32 indexed manifestHash, address indexed relayer, uint256 timestamp);

    /// @notice Anchors integrity and time, not truth or legal admissibility.
    function anchorEvidence(bytes32 manifestHash) external onlyOwner {
        if (manifestHash == bytes32(0)) revert InvalidHash();
        if (evidenceTimestamp[manifestHash] != 0) revert EvidenceAlreadyAnchored();
        evidenceTimestamp[manifestHash] = block.timestamp;
        evidenceBlock[manifestHash] = block.number;
        emit EvidenceAnchored(manifestHash, msg.sender, block.timestamp);
    }

    error Unauthorized();
    error InvalidIssuer();
    error InvalidMetadata();
    error IssuerAlreadyActive();
    error IssuerNotActive();
    error InvalidHash();
    error DuplicateReport();

    event IssuerRegistered(address indexed issuer, string name, string category);
    event IssuerRevoked(address indexed issuer);
    event ScamReported(bytes32 indexed idHash, address indexed reporter, uint256 count);

    constructor() {
        rootAuthority = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != rootAuthority) revert Unauthorized();
        _;
    }

    function owner() external view returns (address) {
        return rootAuthority;
    }

    /// @notice Register or explicitly reactivate a revoked issuer.
    function registerIssuer(address issuer, string calldata name, string calldata category) external onlyOwner {
        if (issuer == address(0)) revert InvalidIssuer();
        if (bytes(name).length == 0 || bytes(name).length > 256 ||
            bytes(category).length == 0 || bytes(category).length > 64) revert InvalidMetadata();
        if (issuers[issuer].active) revert IssuerAlreadyActive();
        issuers[issuer] = Issuer(name, category, true);
        emit IssuerRegistered(issuer, name, category);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        if (!issuers[issuer].active) revert IssuerNotActive();
        issuers[issuer].active = false;
        emit IssuerRevoked(issuer);
    }

    function isActive(address issuer) external view returns (bool) {
        return issuers[issuer].active;
    }

    function issuerInfo(address issuer) external view returns (string memory name, string memory category, bool active) {
        Issuer storage info = issuers[issuer];
        return (info.name, info.category, info.active);
    }

    /// @notice One report per sending wallet per hash, not per human identity.
    /// A shared relayer can anchor a given hash only once.
    function reportScam(bytes32 idHash) external {
        if (idHash == bytes32(0)) revert InvalidHash();
        if (hasReported[idHash][msg.sender]) revert DuplicateReport();
        hasReported[idHash][msg.sender] = true;
        uint256 count = ++reportCount[idHash];
        emit ScamReported(idHash, msg.sender, count);
    }
}
