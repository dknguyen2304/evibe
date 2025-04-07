import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { Movie } from './Movie';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  rating: number;

  @Column()
  comment: string;

  @Column()
  createdAt: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Movie)
  movie: Movie;
}
