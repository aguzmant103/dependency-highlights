export interface DependentProject {
  id: string;
  name: string;
  owner: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  description: string;
  url: string;
  isActive?: boolean;
  lastCommit?: string;
  package?: string;
}

export const mockDependentProjects: DependentProject[] = [
  {
    id: "react-1",
    name: "react",
    owner: "facebook",
    stars: 200000,
    forks: 40000,
    lastUpdated: "2024-04-30",
    description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
    url: "https://github.com/facebook/react",
    isActive: true,
    lastCommit: "2 days ago",
    package: "react"
  },
  {
    id: "next-1",
    name: "next.js",
    owner: "vercel",
    stars: 120000,
    forks: 25000,
    lastUpdated: "2024-04-29",
    description: "The React Framework for Production",
    url: "https://github.com/vercel/next.js",
    isActive: true,
    lastCommit: "1 day ago",
    package: "next"
  },
  {
    id: "typescript-1",
    name: "typescript",
    owner: "microsoft",
    stars: 95000,
    forks: 12000,
    lastUpdated: "2024-04-28",
    description: "TypeScript is a superset of JavaScript that compiles to clean JavaScript output.",
    url: "https://github.com/microsoft/TypeScript",
    isActive: true,
    lastCommit: "3 days ago",
    package: "typescript"
  }
];

export interface GitHubSearchResponse<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface GitHubSearchCodeItem {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  repository: GitHubRepository;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  owner: GitHubUser;
}

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: string | null;
      payload: string | null;
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
}

export interface GitHubDependencyGraph {
  sbom: {
    packages: Array<{
      name: string;
      version: string;
      type: string;
    }>;
  };
}

export interface GitHubDependentsResponse {
  total_count: number;
  items: Array<{
    node_id: string;
    name: string;
    full_name: string;
    description: string;
    stargazers_count: number;
    forks_count: number;
    html_url: string;
    owner: GitHubUser;
  }>;
}

export const mockData = {
  searchCode: (query: string): GitHubSearchResponse<GitHubSearchCodeItem> => {
    console.log('[MOCK] searchCode called with query:', query);
    // Always match any query that includes 'filename:package.json'
    if (query.includes('filename:package.json')) {
      const packages = [
        { name: 'semaphore-protocol', path: 'package.json' },
        { name: 'semaphore-docss', path: 'apps/docs/package.json' },
        { name: 'semaphore-contracts', path: 'packages/contracts/package.json' },
        { name: '@semaphore-protocol/cli-template-monorepo-ethers', path: 'packages/cli-template-monorepo-ethers/package.json' },
        { name: '@semaphore-protocol/hardhat', path: 'packages/hardhat/package.json' },
        { name: 'semaphore-website', path: 'apps/website/package.json' },
        { name: '@semaphore-protocol/identity', path: 'packages/identity/package.json' },
        { name: '@semaphore-protocol/cli-template-monorepo-subgraph', path: 'packages/cli-template-monorepo-subgraph/package.json' },
        { name: 'monorepo-ethers-contracts', path: 'packages/cli-template-monorepo-ethers/apps/contracts/package.json' },
        { name: 'monorepo-subgraph-web-app', path: 'packages/cli-template-monorepo-subgraph/apps/web-app/package.json' },
        { name: 'semaphore-subgraph', path: 'apps/subgraph/package.json' },
        { name: '@semaphore-protocol/contracts', path: 'packages/contracts/contracts/package.json' },
        { name: '@semaphore-protocol/cli-template-contracts-foundry', path: 'packages/cli-template-contracts-foundry/package.json' },
        { name: '@semaphore-protocol/circuits', path: 'packages/circuits/package.json' },
        { name: '@semaphore-protocol/group', path: 'packages/group/package.json' },
        { name: 'monorepo-ethers-web-app', path: 'packages/cli-template-monorepo-ethers/apps/web-app/package.json' },
        { name: '@semaphore-protocol/data', path: 'packages/data/package.json' },
        { name: '@semaphore-protocol/cli', path: 'packages/cli/package.json' },
        { name: 'monorepo-subgraph-contracts', path: 'packages/cli-template-monorepo-subgraph/apps/contracts/package.json' },
        { name: '@semaphore-protocol/proof', path: 'packages/proof/package.json' },
        { name: '@semaphore-protocol/cli-template-contracts-hardhat', path: 'packages/cli-template-contracts-hardhat/package.json' },
        { name: '@semaphore-protocol/utils', path: 'packages/utils/package.json' },
        { name: '@semaphore-protocol/core', path: 'packages/core/package.json' },
      ];
      packages.forEach(pkg => console.log(`✅ Found package: ${pkg.name}`));
      return {
        total_count: packages.length,
        incomplete_results: false,
        items: packages.map((pkg, i) => ({
          name: 'package.json',
          path: pkg.path,
          sha: `mock-sha-${i}`,
          url: `https://api.github.com/repos/owner/repo/contents/${pkg.path}`,
          git_url: `https://api.github.com/repos/owner/repo/git/blobs/mock-sha-${i}`,
          html_url: `https://github.com/owner/repo/blob/main/${pkg.path}`,
          repository: {
            id: 123 + i,
            node_id: `mock-node-id-${i}`,
            name: pkg.name,
            full_name: `owner/${pkg.name}`,
            description: 'A mock repository',
            html_url: `https://github.com/owner/${pkg.name}`,
            stargazers_count: 100,
            forks_count: 50,
            owner: {
              login: 'owner',
              id: 456,
              node_id: 'mock-owner-node-id',
              avatar_url: 'https://github.com/owner.png',
              html_url: 'https://github.com/owner'
            }
          }
        }))
      };
    }

    // Handle search for dependents of @semaphore-protocol/proof
    if (query.includes('"@semaphore-protocol/proof": filename:package.json')) {
      const dependents = [
        { name: 'anonkarma', description: 'zk Identity Provider', isActive: false, lastCommit: '2024-03-27' },
        { name: 'auto-contracts-hardhat', description: 'Contracts-hardhat template created via Semaphore-cli for Auto', isActive: false, lastCommit: '2024-01-05' },
        { name: 'backend', description: '', isActive: false, lastCommit: '2022-10-09' },
        { name: 'bandada', description: 'A system for managing privacy-preserving groups.', isActive: true, lastCommit: '2025-04-04' },
        { name: 'BlockVote-Monorepo', description: '', isActive: false, lastCommit: '2023-06-19' },
        { name: 'circuitbreaker', description: '', isActive: false, lastCommit: '2024-03-09' },
        { name: 'CompetitionProtocol', description: '', isActive: false, lastCommit: '2023-12-15' },
        { name: 'crypto-wallet-platform', description: '', isActive: false, lastCommit: '2024-09-29' },
        { name: 'dev-hackathon', description: '', isActive: true, lastCommit: '2024-11-21' },
        { name: 'did-election', description: '', isActive: true, lastCommit: '2024-12-06' },
        { name: 'dononymous', description: '', isActive: false, lastCommit: '2023-09-24' },
        { name: 'eth-sf-backend', description: 'Backend service', isActive: false, lastCommit: '2022-11-06' },
        { name: 'ETHGlobal-Paris2023', description: 'Composable chatrooms super-charged according to your needs: anonymity, DAO membership-based access, certified announcement channels with multisig support...', isActive: false, lastCommit: '2023-07-24' },
        { name: 'extensions', description: 'Semaphore tools and extensions.', isActive: true, lastCommit: '2025-02-25' },
        { name: 'EzKPoll', description: '', isActive: false, lastCommit: '2023-12-13' },
        { name: 'Frontend', description: '', isActive: true, lastCommit: '2025-03-22' },
        { name: 'frontendv3', description: 'Coinpassport ZK built with Next.js', isActive: false, lastCommit: '2023-12-21' },
        { name: 'fund-wave', description: '', isActive: true, lastCommit: '2025-04-25' },
        { name: 'G-Coin', description: 'Get 100 G-Coin airdropped on proving you own a gmail id. Verification happens on chain.', isActive: false, lastCommit: '2023-09-30' },
        { name: 'hush-hush-hyoka', description: 'HushHushHyoka', isActive: false, lastCommit: '2024-02-16' },
        { name: 'iden-sight', description: '', isActive: false, lastCommit: '2023-03-05' },
        { name: 'interep.js', description: 'A monorepo of InterRep JavaScript libraries.', isActive: false, lastCommit: '2023-03-03' },
        { name: 'key-passport', description: '', isActive: false, lastCommit: '2023-08-21' },
        { name: 'Kurate', description: '', isActive: false, lastCommit: '2023-05-11' },
        { name: 'LenkedIn', description: '', isActive: false, lastCommit: '2022-09-25' },
        { name: 'magic-world', description: 'zkshuffle game demos', isActive: false, lastCommit: '2023-07-25' },
        { name: 'MagicWorld', description: '', isActive: false, lastCommit: '2023-07-25' },
        { name: 'menshen', description: '', isActive: false, lastCommit: '2022-10-09' },
        { name: 'microdemocracies', description: '', isActive: true, lastCommit: '2025-04-24' },
        { name: 'MIT-ZKIAP-2023', description: 'My MIT IAP 2023 Modern Zero Knowledge Cryptography excercise answer', isActive: false, lastCommit: '2023-05-13' },
        { name: 'myco', description: 'Simple multisig using Semaphore v4 and ERC-4337', isActive: true, lastCommit: '2024-11-11' },
        { name: 'next-semaphore', description: '', isActive: false, lastCommit: '2024-03-16' },
        { name: 'obscurus', description: 'Anonymous K/M signature scheme for Safe Wallet, built using Semaphore and Zodiac.', isActive: true, lastCommit: '2025-01-23' },
        { name: 'om', description: '', isActive: false, lastCommit: '2022-07-27' },
        { name: 'op-anon-voting-monorepo', description: '', isActive: false, lastCommit: '2024-08-29' },
        { name: 'OpinionXpress-demo', description: '', isActive: false, lastCommit: '2024-04-21' },
        { name: 'pairwise-rf4', description: 'Pairwise for Optimism RetroPGF4', isActive: false, lastCommit: '2024-10-06' },
        { name: 'peer-review-rewards', description: 'Tokenization of reviewer incentives to encourage participation of academic researchers as reviewers.', isActive: false, lastCommit: '2024-07-12' },
        { name: 'personus', description: '', isActive: false, lastCommit: '2022-11-27' },
        { name: 'Polygon-ZKVote', description: '', isActive: false, lastCommit: '2022-08-21' },
        { name: 'POMP-EthBogota', description: '', isActive: false, lastCommit: '2022-10-09' },
        { name: 'private-safe-ui', description: 'frontend for private gnosis module', isActive: false, lastCommit: '2023-01-02' },
        { name: 'reclaim-solidity-sdk', description: '', isActive: true, lastCommit: '2025-01-21' },
        { name: 'semaphore', description: 'A zero-knowledge protocol for anonymous interactions.', isActive: true, lastCommit: '2025-04-02' },
        { name: 'Semaphore', description: 'A repository for learning and experimenting with the Semaphore protocol and its privacy-preserving applications.', isActive: true, lastCommit: '2024-11-08' },
        { name: 'semaphore-court-app', description: 'Pure JS/TS app for Privacy & Scaling Solutions', isActive: false, lastCommit: '2024-06-19' },
        { name: 'semaphore-demo-frontend', description: 'Frontend of the Semaphore demo', isActive: false, lastCommit: '2022-07-30' },
        { name: 'semaphore-ex', description: '', isActive: false, lastCommit: '2022-08-30' },
        { name: 'semaphore-example', description: '', isActive: false, lastCommit: '2023-07-14' },
        { name: 'semaphore-example', description: 'ZK anonymous signalling on Ethereum', isActive: false, lastCommit: '2023-12-10' },
        { name: 'semaphore-msa-modules', description: 'Semaphore Modular Smart Account Modules', isActive: true, lastCommit: '2025-04-02' },
        { name: 'semaphore-wallet', description: 'Account Abstraction + ZK: Experiment on building 4337 smart contract wallet controlled by Semaphore Group', isActive: false, lastCommit: '2023-10-03' },
        { name: 'semaphore-zk-foundry-lab', description: '', isActive: false, lastCommit: '2022-11-09' },
        { name: 'semaphoreplayground', description: 'Experiments with PSE applications', isActive: false, lastCommit: '2023-08-23' },
        { name: 'Sharknado_Semaphore', description: '', isActive: false, lastCommit: '2023-10-08' },
        { name: 'SHIELDSPACE-ETHRome', description: '', isActive: false, lastCommit: '2024-10-06' },
        { name: 'simulator', description: 'Web simulator of the Worldcoin app to test the World ID protocol on the staging network.', isActive: true, lastCommit: '2025-04-09' },
        { name: 'SismoC', description: 'Zero-knowledge attester on-chain using Sismo and Semaphore\'s protocol.', isActive: false, lastCommit: '2023-03-19' },
        { name: 'sm-boilerplate', description: '', isActive: false, lastCommit: '2023-08-23' },
        { name: 'smart-contract-linea', description: '', isActive: false, lastCommit: '2023-10-05' },
        { name: 'SolidVote', description: '', isActive: false, lastCommit: '2023-02-19' },
        { name: 'storyform', description: '', isActive: false, lastCommit: '2022-10-12' },
        { name: 'sugesto', description: 'Sugesto is an internal application to allow PSE members to send anonymous feedback on team events and activities.', isActive: false, lastCommit: '2023-04-26' },
        { name: 'taz-apps', description: 'Simple DApp to allow Devcon attendees to review events anonymously.', isActive: false, lastCommit: '2022-11-08' },
        { name: 'test-semaphore', description: '', isActive: false, lastCommit: '2023-07-22' },
        { name: 'TrueFantasySports', description: 'The app is for playing fantasy sports. The project aims to create a trustless fantasy sports platform where users don\'t have to submit their fantasy team to win contests.', isActive: false, lastCommit: '2022-11-06' },
        { name: 'tw-did', description: '', isActive: true, lastCommit: '2024-12-06' },
        { name: 'v241031e', description: '', isActive: false, lastCommit: '2024-10-31' },
        { name: 'youid-app', description: '', isActive: false, lastCommit: '2023-08-15' },
        { name: 'zk_soc', description: '', isActive: true, lastCommit: '2025-03-15' },
        { name: 'zk-app', description: '', isActive: false, lastCommit: '2024-03-14' },
        { name: 'ZK-Conditioner', description: 'One dimentional zk voting dapp.', isActive: false, lastCommit: '2022-12-31' },
        { name: 'zk-gov-acution-verifier', description: 'Proof of concept done during the PSE 2024 Hackathon', isActive: false, lastCommit: '2024-08-11' },
        { name: 'zk-proof-of-humanity', description: 'ZK Proof of Humanity (zkPoH) allows humans, registered in Proof of Humanity, to prove their humanity without doxing.', isActive: false, lastCommit: '2023-05-10' },
        { name: 'zk-proof-of-humanity-vote', description: 'zk proof of humanity vote example application', isActive: false, lastCommit: '2023-05-10' },
        { name: 'Zk-Voting-', description: '', isActive: false, lastCommit: '2022-10-16' },
        { name: 'zkdemocracy', description: 'A ready-to-use anonymous voting system based on Semaphore zero-knowledge group management library', isActive: false, lastCommit: '2024-09-20' },
        { name: 'zKhorus', description: '', isActive: false, lastCommit: '2024-03-20' },
        { name: 'zkPrescription', description: 'International privacy-first medical prescriptions web application', isActive: false, lastCommit: '2024-02-18' },
        { name: 'zkShuffle', description: '', isActive: false, lastCommit: '2023-06-13' },
        { name: 'zktp', description: '', isActive: false, lastCommit: '2022-07-19' },
        { name: 'zkvote', description: 'Anonymous voting using Semaphore + Polygon ID', isActive: false, lastCommit: '2023-02-16' },
        { name: 'zkvote-contract', description: '', isActive: false, lastCommit: '2023-03-02' },
        { name: 'zkvote-monorepo', description: '', isActive: false, lastCommit: '2023-03-21' },
        { name: 'zkWallet-contracts', description: 'Contains all the smart contracts used in the zkWallet dApp.', isActive: false, lastCommit: '2022-06-28' },
        { name: 'zuAstro', description: 'Hack Zuzalu Istanbul project', isActive: false, lastCommit: '2023-11-11' },
        { name: 'zupass', description: 'Zuzalu Passport', isActive: true, lastCommit: '2025-04-14' }
      ];

      return {
        total_count: dependents.length,
        incomplete_results: false,
        items: dependents.map((dep, i) => ({
          name: 'package.json',
          path: 'package.json',
          sha: `mock-sha-${i}`,
          url: `https://api.github.com/repos/owner/${dep.name}/contents/package.json`,
          git_url: `https://api.github.com/repos/owner/${dep.name}/git/blobs/mock-sha-${i}`,
          html_url: `https://github.com/owner/${dep.name}/blob/main/package.json`,
          repository: {
            id: 123 + i,
            node_id: `mock-node-id-${i}`,
            name: dep.name,
            full_name: `owner/${dep.name}`,
            description: dep.description,
            html_url: `https://github.com/owner/${dep.name}`,
            stargazers_count: 0,
            forks_count: 0,
            owner: {
              login: 'owner',
              id: 456,
              node_id: 'mock-owner-node-id',
              avatar_url: 'https://github.com/owner.png',
              html_url: 'https://github.com/owner'
            }
          }
        }))
      };
    }

    return {
      total_count: 0,
      incomplete_results: false,
      items: []
    };
  },

  getRepository: (owner: string, repo: string): GitHubRepository => ({
    id: 123,
    node_id: 'mock-node-id-1',
    name: repo,
    full_name: `${owner}/${repo}`,
    description: 'A mock repository',
    html_url: `https://github.com/${owner}/${repo}`,
    stargazers_count: 100,
    forks_count: 50,
    owner: {
      login: owner,
      id: 456,
      node_id: 'mock-owner-node-id',
      avatar_url: `https://github.com/${owner}.png`,
      html_url: `https://github.com/${owner}`
    }
  }),

  getContent: (owner: string, repo: string, path: string): GitHubContent => {
    console.log('🔍 Mock getContent called with:', { owner, repo, path });
    if (path.endsWith('package.json')) {
      console.log('✅ Found package.json at path:', path);
      return {
        name: 'package.json',
        path: path,
        sha: 'mock-sha-1',
        size: 1024,
        url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        html_url: `https://github.com/${owner}/${repo}/blob/main/${path}`,
        git_url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/mock-sha-1`,
        download_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`,
        type: 'file',
        content: Buffer.from(JSON.stringify({
          name: repo,
          version: '1.0.0',
          dependencies: {
            '@semaphore-protocol/contracts': '^1.0.0',
            '@semaphore-protocol/identity': '^1.0.0',
            '@semaphore-protocol/proof': '^1.0.0',
            '@semaphore-protocol/semaphore': '^1.0.0'
          }
        })).toString('base64'),
        encoding: 'base64'
      };
    }
    console.log('❌ Path not supported:', path);
    throw new Error(`Mock content not implemented for path: ${path}`);
  },

  getCommits: (owner: string, repo: string): GitHubCommit[] => [{
    sha: 'mock-commit-sha',
    node_id: 'mock-commit-node-id',
    commit: {
      author: {
        name: owner,
        email: `${owner}@example.com`,
        date: new Date().toISOString()
      },
      committer: {
        name: owner,
        email: `${owner}@example.com`,
        date: new Date().toISOString()
      },
      message: `Update ${repo}`,
      tree: {
        sha: 'mock-tree-sha',
        url: `https://api.github.com/repos/${owner}/${repo}/git/trees/mock-tree-sha`
      },
      url: `https://api.github.com/repos/${owner}/${repo}/git/commits/mock-commit-sha`,
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null
      }
    },
    url: `https://api.github.com/repos/${owner}/${repo}/commits/mock-commit-sha`,
    html_url: `https://github.com/${owner}/${repo}/commit/mock-commit-sha`,
    comments_url: `https://api.github.com/repos/${owner}/${repo}/commits/mock-commit-sha/comments`
  }],

  getDependencyGraph: (): GitHubDependencyGraph => ({
    sbom: {
      packages: [
        { name: '@semaphore-protocol/contracts', version: '1.0.0', type: 'npm' },
        { name: '@semaphore-protocol/identity', version: '1.0.0', type: 'npm' },
        { name: '@semaphore-protocol/proof', version: '1.0.0', type: 'npm' },
        { name: '@semaphore-protocol/semaphore', version: '1.0.0', type: 'npm' }
      ]
    }
  }),

  getDependents: (): GitHubDependentsResponse => {
    // Reuse the existing mock data for dependents
    const dependents = [
      { name: 'anonkarma', description: 'zk Identity Provider', isActive: false, lastCommit: '2024-03-27' },
      { name: 'bandada', description: 'A system for managing privacy-preserving groups.', isActive: true, lastCommit: '2025-04-04' },
      { name: 'extensions', description: 'Semaphore tools and extensions.', isActive: true, lastCommit: '2025-02-25' },
      { name: 'semaphore', description: 'A zero-knowledge protocol for anonymous interactions.', isActive: true, lastCommit: '2025-04-02' },
      { name: 'zupass', description: 'Zuzalu Passport', isActive: true, lastCommit: '2025-04-14' }
    ];

    return {
      total_count: dependents.length,
      items: dependents.map((dep, i) => ({
        node_id: `mock-node-id-${i}`,
        name: dep.name,
        full_name: `owner/${dep.name}`,
        description: dep.description,
        stargazers_count: 100,
        forks_count: 50,
        html_url: `https://github.com/owner/${dep.name}`,
        owner: {
          login: 'owner',
          id: 456,
          node_id: 'mock-owner-node-id',
          avatar_url: 'https://github.com/owner.png',
          html_url: 'https://github.com/owner'
        }
      }))
    };
  }
}; 