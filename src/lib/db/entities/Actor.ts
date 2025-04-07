import { Column, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Entity } from 'typeorm';
import { Movie } from './Movie';

@Entity()
export class Actor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  birthdate: Date;

  @Column({ nullable: true })
  biography: string;

  @ManyToMany(() => Movie, (movie) => movie.actors)
  movies: Movie[];
}
