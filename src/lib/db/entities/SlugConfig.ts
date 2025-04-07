import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SlugConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entityType: string; // 'movie', 'actor', 'director', etc.

  @Column()
  pattern: string; // Mẫu để tạo slug, ví dụ: '{title}-{releaseYear}'

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options: {
    lowercase?: boolean;
    strict?: boolean;
    separator?: string;
    maxLength?: number;
    removeStopWords?: boolean;
    stopWords?: string[];
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
