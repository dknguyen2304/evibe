import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ValidateMovie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  releaseYear: number;

  @Column()
  suggestedBy: number;

  @Column()
  status: string; // 'pending', 'approved', 'rejected'
}
