import { Entity, PrimaryGeneratedColumn } from 'typeorm';

import { ManyToMany } from 'typeorm';
import { Column } from 'typeorm';
import { Movie } from './Movie';

@Entity()
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Movie, (movie) => movie.genres)
  movies: Movie[];
}
