// src/lib/db/entities/Movie.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Category } from './Category';
import { Actor } from './Actor';
import { Comment } from './Comment';
import { Rating } from './Rating';
import { Country } from './Country';
import { Theme } from './Theme';

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
  type: string; // 'movie' or 'series'

  @Column({ nullable: true })
  totalEpisodes: number;

  @Column({ default: 0 })
  viewCount: number;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'movie_categories',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @ManyToMany(() => Actor)
  @JoinTable({
    name: 'movie_actors',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'actor_id', referencedColumnName: 'id' },
  })
  actors: Actor[];

  @ManyToOne(() => Country, { nullable: true })
  country: Country;

  @ManyToMany(() => Theme)
  @JoinTable({
    name: 'movie_themes',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'theme_id', referencedColumnName: 'id' },
  })
  themes: Theme[];

  @OneToMany(() => Comment, (comment) => comment.movie)
  comments: Comment[];

  @OneToMany(() => Rating, (rating) => rating.movie)
  ratings: Rating[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
