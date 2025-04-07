import { Entity, PrimaryGeneratedColumn } from 'typeorm';

import { Column } from 'typeorm';

@Entity()
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
