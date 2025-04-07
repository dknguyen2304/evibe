import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { Category } from './Category';
import { Actor } from './Actor';
import { Country } from './Country';
import { Theme } from './Theme';
import { Director } from './Director';

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  releaseYear: number;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  imdbRating: number;

  @Column({ nullable: true })
  posterUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  trailerUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 'movie' })
  type: string;

  @Column({ nullable: true })
  totalEpisodes: number;

  @Column({ default: 0 })
  viewCount: number;

  @ManyToMany(() => Category)
  @JoinTable({ name: 'movie_categories' })
  categories: Category[];

  @ManyToMany(() => Actor)
  @JoinTable({ name: 'movie_actors' })
  actors: Actor[];

  @ManyToOne(() => Country, { nullable: true })
  country: Country;

  @ManyToMany(() => Theme)
  @JoinTable({ name: 'movie_themes' })
  themes: Theme[];

  @ManyToOne(() => Director, { nullable: true })
  director: Director;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
