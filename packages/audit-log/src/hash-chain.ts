import crypto from 'crypto';

export interface HashChainEntry {
  index: number;
  timestamp: number;
  data: string;
  hash: string;
  previousHash: string;
  merkleRoot?: string;
}

export interface ChainIntegrityResult {
  valid: boolean;
  issues: string[];
  validatedUpTo: number;
}

export class SHA256HashChain {
  private chain: HashChainEntry[] = [];
  private merkleTree: Map<string, string[]> = new Map();

  addEntry(data: string): HashChainEntry {
    const index = this.chain.length;
    const timestamp = Date.now();
    const previousHash = index === 0 ? '0' : this.chain[index - 1].hash;

    const entry: HashChainEntry = {
      index,
      timestamp,
      data,
      hash: this.computeHash(index, timestamp, data, previousHash),
      previousHash,
    };

    this.chain.push(entry);
    this.updateMerkleTree(entry);
    return entry;
  }

  private computeHash(
    index: number,
    timestamp: number,
    data: string,
    previousHash: string
  ): string {
    const content = `${index}:${timestamp}:${data}:${previousHash}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private updateMerkleTree(entry: HashChainEntry): void {
    const level0 = entry.hash;
    const nodes: string[] = [level0];

    let currentLevel = [level0];
    let levelIndex = 0;

    while (currentLevel.length > 1 || levelIndex === 0) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        const combined = crypto
          .createHash('sha256')
          .update(left + right)
          .digest('hex');
        nextLevel.push(combined);
        nodes.push(combined);
      }

      if (nextLevel.length === 1) {
        entry.merkleRoot = nextLevel[0];
        this.merkleTree.set(entry.hash, nodes);
        break;
      }

      currentLevel = nextLevel;
      levelIndex++;
    }
  }

  verifyChainIntegrity(): ChainIntegrityResult {
    const issues: string[] = [];
    let validatedUpTo = 0;

    for (let i = 0; i < this.chain.length; i++) {
      const entry = this.chain[i];
      const expectedHash = this.computeHash(
        entry.index,
        entry.timestamp,
        entry.data,
        entry.previousHash
      );

      if (expectedHash !== entry.hash) {
        issues.push(`Entry ${i}: Hash mismatch`);
        break;
      }

      if (i > 0 && this.chain[i - 1].hash !== entry.previousHash) {
        issues.push(`Entry ${i}: Chain link broken`);
        break;
      }

      validatedUpTo = i;
    }

    return {
      valid: issues.length === 0,
      issues,
      validatedUpTo,
    };
  }

  detectForks(): number[] {
    const forks: number[] = [];

    for (let i = 1; i < this.chain.length; i++) {
      if (this.chain[i].previousHash !== this.chain[i - 1].hash) {
        forks.push(i);
      }
    }

    return forks;
  }

  getEntry(index: number): HashChainEntry | undefined {
    return this.chain[index];
  }

  getChainLength(): number {
    return this.chain.length;
  }

  exportChain(): string {
    return JSON.stringify(this.chain, null, 2);
  }

  importChain(data: string): void {
    this.chain = JSON.parse(data);
    this.chain.forEach(entry => this.updateMerkleTree(entry));
  }
}
