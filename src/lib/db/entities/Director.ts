import { Entity } from 'typeorm';

import { Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Movie } from './Movie';

@Entity()
export class Director {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  birthdate: Date;

  @Column({ nullable: true })
  biography: string;

  @OneToMany(() => Movie, (movie) => movie.director)
  movies: Movie[];
}
