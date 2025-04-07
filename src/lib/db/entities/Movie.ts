import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Director } from './Director';
import { Actor } from './Actor';
import { Genre } from './Genre';

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  releaseYear: number;

  @Column('float')
  rating: number;

  @Column()
  runningTime: number;

  @Column()
  studioName: string;

  @Column()
  imageUrl: string;

  @Column()
  websiteUrl: string;

  @ManyToOne(() => Director)
  director: Director;

  @ManyToMany(() => Actor)
  @JoinTable({
    name: 'movie_actor',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'actor_id', referencedColumnName: 'id' },
  })
  actors: Actor[];

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'movie_genre',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];
}
