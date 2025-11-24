import { SHA256HashChain, ChainIntegrityResult } from './hash-chain';
import crypto from 'crypto';

export interface IntegrityCheckpoint {
  timestamp: number;
  chainLength: number;
  merkleRoot: string;
  signature: string;
}

export class IntegrityValidator {
  private checkpoints: IntegrityCheckpoint[] = [];
  private readonly checkpointInterval = 100;

  validateChain(chain: SHA256HashChain): ChainIntegrityResult {
    const result = chain.verifyChainIntegrity();

    if (!result.valid) {
      console.error('Chain integrity check failed:', result.issues);
    }

    const forks = chain.detectForks();
    if (forks.length > 0) {
      result.issues.push(`Chain forks detected at indices: ${forks.join(', ')}`);
      result.valid = false;
    }

    return result;
  }

  createCheckpoint(chain: SHA256HashChain, merkleRoot: string): IntegrityCheckpoint {
    const checkpoint: IntegrityCheckpoint = {
      timestamp: Date.now(),
      chainLength: chain.getChainLength(),
      merkleRoot,
      signature: '',
    };

    const data = `${checkpoint.timestamp}:${checkpoint.chainLength}:${merkleRoot}`;
    checkpoint.signature = crypto.createHash('sha256').update(data).digest('hex');

    if (this.checkpoints.length % this.checkpointInterval === 0) {
      this.checkpoints.push(checkpoint);
    }

    return checkpoint;
  }

  verifyCheckpoint(checkpoint: IntegrityCheckpoint): boolean {
    const data = `${checkpoint.timestamp}:${checkpoint.chainLength}:${checkpoint.merkleRoot}`;
    const expectedSignature = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
    return checkpoint.signature === expectedSignature;
  }

  getCheckpoints(): IntegrityCheckpoint[] {
    return this.checkpoints;
  }
}
