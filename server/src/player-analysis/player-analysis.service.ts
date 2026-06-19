import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerAnalysis } from '../entities/player-analysis.entity';
import { PlayerPattern, PatternType } from '../entities/player-pattern.entity';
import { PlayerType } from '../entities/user.entity';
import { Position } from '../entities/hand-player.entity';

@Injectable()
export class PlayerAnalysisService {
  constructor(
    @InjectRepository(PlayerAnalysis)
    private readonly playerAnalysisRepository: Repository<PlayerAnalysis>,
    @InjectRepository(PlayerPattern)
    private readonly playerPatternRepository: Repository<PlayerPattern>,
  ) {}

  async analyzePlayer(playerId: string, userId: string) {
    const analysis = this.playerAnalysisRepository.create({
      playerId,
      userId,
      analyzedHandsCount: 0,
    });

    return this.playerAnalysisRepository.save(analysis);
  }

  async updatePlayerAnalysis(playerId: string, updates: Partial<PlayerAnalysis>) {
    const analysis = await this.playerAnalysisRepository.findOne({
      where: { playerId },
    });

    if (!analysis) {
      return null;
    }

    Object.assign(analysis, updates);
    return this.playerAnalysisRepository.save(analysis);
  }

  async getPlayerAnalysis(playerId: string) {
    return this.playerAnalysisRepository.findOne({
      where: { playerId },
    });
  }

  async inferPlayerType(playerId: string): Promise<PlayerType> {
    const analysis = await this.getPlayerAnalysis(playerId);

    if (!analysis) {
      return PlayerType.UNKNOWN;
    }

    const { preflopOpenFreq, flopCbetFreq, aggressionFactor, tightnessFactor } = analysis;

    if (preflopOpenFreq && flopCbetFreq && aggressionFactor && tightnessFactor) {
      if (preflopOpenFreq < 15 && flopCbetFreq > 60 && aggressionFactor > 2) {
        return PlayerType.TIGHT_AGGRESSIVE;
      } else if (preflopOpenFreq > 25 && flopCbetFreq > 50 && aggressionFactor > 2) {
        return PlayerType.LOOSE_AGGRESSIVE;
      } else if (preflopOpenFreq < 15 && flopCbetFreq < 40) {
        return PlayerType.TIGHT_PASSIVE;
      } else if (preflopOpenFreq > 25 && flopCbetFreq < 40) {
        return PlayerType.LOOSE_PASSIVE;
      }
    }

    return PlayerType.UNKNOWN;
  }

  async addPlayerPattern(
    playerId: string,
    userId: string,
    patternType: PatternType,
    position?: Position,
    boardTexture?: string,
  ) {
    const existingPattern = await this.playerPatternRepository.findOne({
      where: { playerId, patternType, position, boardTexture },
    });

    if (existingPattern) {
      existingPattern.sampleSize += 1;
      return this.playerPatternRepository.save(existingPattern);
    }

    const pattern = this.playerPatternRepository.create({
      playerId: playerId,
      userId: userId,
      patternType: patternType,
      position: position,
      boardTexture: boardTexture,
      sampleSize: 1,
    });

    return this.playerPatternRepository.save(pattern);
  }

  async getPlayerPatterns(playerId: string) {
    return this.playerPatternRepository.find({
      where: { playerId },
    });
  }
}
