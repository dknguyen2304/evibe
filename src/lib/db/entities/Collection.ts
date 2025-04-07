import { Entity } from 'typeorm';

import { Column, PrimaryGeneratedColumn } from 'typeorm';

import { ManyToOne } from 'typeorm';

import { ManyToMany } from 'typeorm';

import { JoinTable } from 'typeorm';
import { Movie } from './Movie';
import { User } from './User';

@Entity()
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.collections)
  user: User;

  @ManyToMany(() => Movie)
  @JoinTable({
    name: 'collection_movie',
    joinColumn: { name: 'collection_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'movie_id', referencedColumnName: 'id' },
  })
  movies: Movie[];
}
