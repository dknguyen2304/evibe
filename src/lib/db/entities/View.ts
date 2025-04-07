// src/lib/db/entities/View.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from './User';
import { Movie } from './Movie';
import { Episode } from './Episode';

@Entity({ name: 'views' })
export class View {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Movie, { nullable: true })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Episode, { nullable: true })
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
