import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class AnalyzeHandDto {
  @IsString()
  @IsNotEmpty()
  tournamentStage: string;

  @IsString()
  @IsNotEmpty()
  blindLevel: string;

  @IsNumber()
  @IsNotEmpty()
  heroStack: number;

  @IsNumber()
  @IsNotEmpty()
  villainStack: number;

  @IsString()
  @IsNotEmpty()
  heroPosition: string;

  @IsString()
  @IsNotEmpty()
  villainPosition: string;

  @IsString()
  @IsNotEmpty()
  heroHand: string;

  @IsString()
  @IsOptional()
  villainHand?: string;

  @IsString()
  @IsOptional()
  opponentInfo?: string;

  @IsString()
  @IsNotEmpty()
  preflopActions: string;

  @IsString()
  @IsNotEmpty()
  flopBoard: string;

  @IsString()
  @IsNotEmpty()
  flopActions: string;

  @IsString()
  @IsOptional()
  turnBoard?: string;

  @IsString()
  @IsOptional()
  turnActions?: string;

  @IsString()
  @IsOptional()
  riverBoard?: string;

  @IsString()
  @IsOptional()
  riverActions?: string;

  @IsString()
  @IsOptional()
  question?: string;
}
