import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}
