import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { HandsModule } from './hands/hands.module';
import { PlayersModule } from './players/players.module';
import { ActionsModule } from './actions/actions.module';
import { AnalysisModule } from './analysis/analysis.module';
import { PlayerAnalysisModule } from './player-analysis/player-analysis.module';
import { StrategyModule } from './strategy/strategy.module';
import { User } from './entities/user.entity';
import { Hand } from './entities/hand.entity';
import { Player } from './entities/player.entity';
import { HandPlayer } from './entities/hand-player.entity';
import { Action } from './entities/action.entity';
import { ActionAnalysis } from './entities/action-analysis.entity';
import { PlayerAnalysis } from './entities/player-analysis.entity';
import { PlayerPattern } from './entities/player-pattern.entity';
import { StrategyAdjustment } from './entities/strategy-adjustment.entity';
import { StrategyEvaluation } from './entities/strategy-evaluation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [
        User,
        Hand,
        Player,
        HandPlayer,
        Action,
        ActionAnalysis,
        PlayerAnalysis,
        PlayerPattern,
        StrategyAdjustment,
        StrategyEvaluation,
      ],
    }),
    AuthModule,
    HandsModule,
    PlayersModule,
    ActionsModule,
    AnalysisModule,
    PlayerAnalysisModule,
    StrategyModule,
  ],
})
export class AppModule {}
